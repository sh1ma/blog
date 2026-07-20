---
title: "Cloudflare Containersを使ってGitHub Self-hosted runnersを立ててみた"
publishedAt: "2026-07-20"
description: "Cloudflare Containers 上に GitHub Actions のエフェメラル self-hosted runner を webhook 駆動で立てて、実測とともに GitHub-hosted runner との料金比較をしてみた。"
tags: ["Cloudflare", "Cloudflare Containers", "GitHub Actions"]
---

本当は昨日CADモデリング + 3Dプリンタ操作をClaude Codeでやる記事を出す予定だったんですが、モデリング部分が記事として出せるクオリティに至らなかったのでもう少し研究してから出そうと思います・・・！[^1]

というわけで今回も繋ぎの[Cloudflare Containers](https://developers.cloudflare.com/containers/)ネタです。

今回はCloudflare Containersの上で[GitHub ActionsのSelf-Hosted Runner](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners) を動かしてみたので、やり方紹介と料金ざっくり比較記事です。

前半はGitHub ActionsのSelf-Hosted Runner解説なので知ってるよって人はスキップしてOK。

## TL;DR

- Cloudflare Containersを使ってGitHub ActionsのSelf-Hosted Runnerを立てた
- 大抵の場面でSelf-Hosted Runner on Cloudflare Containersに料金・スペックの優位性はないことがわかった。
- とはいえCloudflare Containersは使用したリソース分のみ課金なので、すでにWorkersのPaid Plan（現在\$5/月）を契約していて、かつ短時間・小リソースのジョブを大量に回すなら一考の余地はあるかも。

## GitHub ActionsのSelf-Hosted Runnerって？

ActionsをGitHubのサーバで実行するのではなく、自分で用意したマシンで実行する仕組みです。  
ここでは詳細を割愛しますが、以下を見ると理解できると思います。

https://docs.github.com/en/actions/concepts/runners/self-hosted-runners

Self-Hosted Runnerを立ち上げること作業は特に難しくありません。  
とはいえPersistent runnerとEphemeral runnerで微妙に立ち上げ方や運用方法が異なります。

### Persistent runnerとEphemeral runnerとは

簡単に言うとPersitent runnerは常駐式のRunnerで、常駐コンテナが必要です。  
それに対してEphemeral runnerはGithub Actionsのジョブが開始されるたびに起動するRunnerです。こちらはリクエスト処理時にのみコンテナが立ち上がります。

https://github.blog/changelog/2021-09-20-github-actions-ephemeral-self-hosted-runners-new-webhooks-for-auto-scaling/

https://docs.github.com/en/actions/reference/runners/self-hosted-runners#ephemeral-runners-for-autoscaling

せっかくなら動かした結果「CloudflareでSelf-Hosted Runner動かす方が安い！」という結論になれば面白いと思ったのですが、以前[k3sをCloudflare Containersで動かした](https://blog.sh1ma.dev/articles/20260705_k3s_on_cloudflare_workers)際に常駐が必要なコンテナは、Container自体が消費するメモリ使用量が原因で、基本的には他のプラットフォームに対して優位に立てる料金ではないという結論が出ています。[^2]

つまり今回Cloudflare ContainersがGitHub Hosted Runnerに勝つ可能性があるとしたら、常駐の必要がなく、ジョブ発火時のみ動作するEphemeral runnerになります。

## スペック比較: Github Hosted Runner VS Cloudflare Containers Runner

- GitHub は使用の有無にかかわらず 2 コア 8GB の固定単価
- Cloudflare ContainersのCPUは実使用量課金。

| 実行環境 | vCPU | メモリ | ディスク | 備考 |
|---|---|---|---|---|
| GitHub `ubuntu-latest` (private) | 2 | 8 GB | 14 GB SSD | \$0.006/分・分単位切り上げ |
| GitHub `ubuntu-latest` (public) | 4 | 16 GB | 14 GB SSD | **無料・無制限** |
| CF lite | 1/16 | 256 MiB | 2 GB | 動作確認済み（遅い） |
| CF basic | 1/4 | 1 GiB | 4 GB | 動作確認済み・推奨最小構成 |
| CF standard-1 | 1/2 | 4 GiB | 8 GB | |
| CF standard-2 | 1 | 6 GiB | 12 GB | |
| CF standard-3 | 2 | 8 GiB | 16 GB | private `ubuntu-latest` とスペック同等 |
| CF standard-4 | 4 | 12 GiB | 20 GB | public 用 (4コア/16GB) にはメモリで届かない |

https://docs.github.com/en/actions/reference/runners/github-hosted-runners#standard-github-hosted-runners-for-public-repositories

https://docs.github.com/en/billing/reference/actions-runner-pricing

https://developers.cloudflare.com/containers/pricing/

https://developers.cloudflare.com/workers/platform/pricing/#containers


## 実装

### Worker

Worker は `workflow_job` webhook (action: `queued`) を受けたら、registration token を発行して Container (Durable Object) を起動するだけの薄い実装です。

```typescript
if (url.pathname === "/webhook" && request.method === "POST") {
  const body = await request.text();
  const ok = await verifySignature(
    env.WEBHOOK_SECRET,
    body,
    request.headers.get("x-hub-signature-256"),
  );
  if (!ok) return new Response("bad signature", { status: 401 });

  // workflow_job / queued / 対象 label 以外は無視 (省略)

  const token = await getRegistrationToken(env);
  const name = `cf-runner-${payload.workflow_job.id}`;
  const container = env.RUNNER.getByName(name);
  await container.launch({
    repoUrl: `https://github.com/${env.GITHUB_REPO}`,
    token,
    labels: env.RUNNER_LABEL,
    name,
  });
  return new Response("launched");
}
```

Container 側は `@cloudflare/containers` の `Container` クラスを継承します。runner は HTTP を提供しないバッチプロセスなので `defaultPort` は設定せず、`sleepAfter` はジョブがハングしたときの課金上限のセーフティキャップとして使います。

```typescript
export class RunnerContainer extends Container<Env> {
  sleepAfter = "15m";

  async launch(opts: { repoUrl: string; token: string; labels: string; name: string }) {
    await this.start({
      envVars: {
        REPO_URL: opts.repoUrl,
        RUNNER_TOKEN: opts.token,
        RUNNER_LABELS: opts.labels,
        RUNNER_NAME: opts.name,
      },
    });
  }
}
```

### コンテナイメージ

イメージは ubuntu:24.04 に actions/runner を入れただけの素朴なものです。

https://github.com/actions/runner/releases

```dockerfile
FROM ubuntu:24.04

ARG RUNNER_VERSION=2.335.1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates curl jq git tar gzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /runner

RUN curl -fL -o runner.tar.gz \
      "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" \
    && tar xzf runner.tar.gz \
    && rm runner.tar.gz \
    && ./bin/installdependencies.sh

COPY entrypoint.sh /entrypoint.sh
ENV RUNNER_ALLOW_RUNASROOT=1
ENTRYPOINT ["/entrypoint.sh"]
```

entrypoint は `--ephemeral` で config して run するだけです。

```bash
./config.sh \
  --unattended \
  --ephemeral \
  --disableupdate \
  --url "${REPO_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "${RUNNER_LABELS}"

exec ./run.sh
```

### ワークフロー側

ワークフローは `runs-on` に self-hosted と runner の label を指定するだけです。

```yaml
jobs:
  hello:
    runs-on: [self-hosted, cf-runner]
```

## 動いた

実ジョブ (echo + checkout) が成功しました。中身は Firecracker microVM で、`uname -a` すると `Linux cloudchamber 6.18.36-cloudflare-firecracker` (linux/amd64) が返ります。

実測値はこうなりました。

| 項目 | basic (1/4 vCPU, 1GiB) | lite (1/16 vCPU, 256MiB) |
|---|---|---|
| ジョブ結果 | success | success |
| webhook 受信 → ジョブ開始 | 約 11 秒 | 約 13 秒 |
| ジョブ実行時間 | 23 秒 | 74 秒 |
| 1 ジョブあたり概算コスト | ≈ \$0.00018 | ≈ \$0.00015 |

キュー投入からジョブ開始まで、コールドスタート込みで約 11〜13 秒。GitHub-hosted runner の起動待ちと同じくらいの感覚です。

### lite は安くならない

面白かったのがここです。lite は単価が basic の約 1/3.9 なのですが、1/16 vCPU しかないので同じジョブに約 3.2 倍の時間がかかり、**「単価 × 実行時間」のジョブ単価はほぼ同じ**になりました。レイテンシの分だけ損なので、実用的な最小構成は basic だと思います。

もうひとつハマりどころ。インスタンスタイプの変更は即時反映ではないので、`wrangler containers info` で configuration の反映を確認してから計測しないと旧スペックのインスタンスで実行されます。

## 料金比較

前提となる公式単価はこうです (2026-07-20 時点)。

- **Cloudflare Containers** (Workers Paid \$5/月 が前提): vCPU \$0.000020/vCPU秒、メモリ \$0.0000025/GiB秒、ディスク \$0.00000007/GB秒。**10ms 単位課金・実行中のみ**。無料枠は 375 vCPU分、25 GiB時、200 GB時/月
- **GitHub Actions** (hosted、private リポジトリ): Linux 2コア \$0.006/分。**ジョブごとに分単位へ切り上げ**。無料枠は Free 2,000分/月、Pro/Team 3,000分/月。public リポジトリは無料・無制限

ここで効いてくるのが [2025-11-21 の料金改定](https://developers.cloudflare.com/changelog/post/2025-11-21-new-cpu-pricing/)です。CPU 課金は割当 vCPU ではなく**実際の CPU 使用量ベース**に変わっています (メモリとディスクは従来どおり割当ベース)。つまり CPU をフルに使わないジョブほど安くなります。

インスタンスタイプ別に \$/分 へ換算して比較すると次のようになります。CPU 100% の列が上限値で、実コストはこれ以下になります。

| CF インスタンス | スペック | \$/分 (CPU100%) | \$/分 (CPU20%) | GitHub 2コア (\$0.006/分) 比 |
|---|---|---|---|---|
| lite | 1/16 vCPU, 256MiB | \$0.000121 | \$0.000061 | 約 1/50〜1/98 |
| basic | 1/4 vCPU, 1GiB | \$0.000467 | \$0.000227 | 約 1/13〜1/26 |
| standard-1 | 1/2 vCPU, 4GiB | \$0.001234 | \$0.000754 | 約 1/4.9〜1/8.0 |
| standard-3 | 2 vCPU, 8GiB | \$0.003667 | \$0.001747 | 約 1/1.6〜1/3.4 |

GitHub の ubuntu-latest (private) は 2 vCPU / 8GB RAM なので、スペック同等の比較対象は standard-3。CPU をフルに使うビルドでも **CF の方が約 39% 安く**、I/O 待ち中心で CPU 使用率 20% 程度のジョブなら**約 71% 安い**。さらに CF は 10ms 単位課金・GitHub は分切り上げなので、短いジョブほど差が広がります。

### CF Containers が優位になるケース

1. **private リポジトリで無料枠を使い切っている**: 超過分は同等スペックで 39〜71% 安。軽いジョブを basic に落とせれば 1/13〜1/26
2. **短時間ジョブが大量にある**: GitHub は 1 分に切り上げるので、10 秒のジョブ 1,000 本なら GitHub \$6.00 vs CF basic 約 \$0.08 で約 75 倍差
3. **低スペックで足りるジョブ** (lint、通知など)
4. **Workers Paid を既に契約している**: 無料枠 375 vCPU分/月で basic 相当 1,500 分/月が追加費用ゼロ

### GitHub-hosted のままでいいケース

1. **public リポジトリ**: hosted runner が無料・無制限なので勝ち目なし
2. **無料枠 (2,000分/月) 以内の利用**: GitHub \$0 に対して CF は Workers Paid \$5/月 の固定費で負ける
3. **Docker が必要なジョブ**: Firecracker microVM 内でネスト仮想化ができず docker daemon が動かないので、コンテナビルド系 CI は不向き
4. **プリインストールツール前提のジョブ**: hosted runner の膨大なツールチェーンはないので、セットアップ時間がそのまま課金時間になる

### 損益分岐

損益分岐は前提の置き方で 2 通りあります。

1. **単一アカウントの総額で比較する場合** (GitHub Free の無料枠 2,000 分が丸ごと使える場合): GitHub は 2,000 分まで \$0、CF は \$5/月の固定費から始まるので、逆転は **CPU 100% のジョブで約 6,980 分/月、CPU 20% のジョブで約 3,830 分/月** (standard-3、両者の無料枠込みで計算)
2. **限界費用で比較する場合** (無料枠を他のワークロードで消化済み・Workers Paid 契約済みの場合): 1 分あたり GitHub \$0.006 vs CF standard-3 \$0.00367 (CPU100%)〜\$0.00175 (CPU20%) なので、**使った瞬間から CF が 39〜71% 安い**

![月間 CI 使用量と月額料金の比較グラフ。GitHub Free は無料枠 2,000 分を超えると傾き \$0.006/分で増え、Cloudflare standard-3 は \$5/月の固定費から始まる。交点 (損益分岐) は CPU 100% で約 6,980 分/月、CPU 20% で約 3,830 分/月](https://cdn.sh1ma.dev/20260720_1_cloudflare_containers_github_self_hosted_runners/ci-cost-vs-usage.ja.png)

総額ベースでワークロード別に置いてみると、無料枠に収まる少量利用 (1,000 分/月) では GitHub \$0 vs CF \$5〜 で GitHub の勝ち、3,000 分/月でもまだ GitHub の勝ち (\$6.00 vs \$15.28)、10,000 分/月の規模になると CF が逆転 (\$48.00 vs \$40.95)、という結果になりました。CPU 使用率が低いジョブならさらに差が開きます。

![ワークロード別の月額総額比較の棒グラフ。無料枠と固定費を織り込んだ総額で、1,000 分/月と 3,000 分/月は GitHub が安く、10,000 分/月で Cloudflare が逆転する](https://cdn.sh1ma.dev/20260720_1_cloudflare_containers_github_self_hosted_runners/ci-cost-cases.ja.png)

## まとめ

- Cloudflare Containers 上で GitHub Actions の self-hosted runner は普通に動く
- webhook 駆動 + `--ephemeral` で「ジョブが来たときだけ課金」にできる
- lite は安く見えて遅いのでジョブ単価は basic とほぼ同じ。basic が実用最小構成
- 2025-11 から CPU は実使用量課金なので、CPU を持て余すジョブほど安い (同等スペック比で 39〜71% 安)
- ただし総額で見ると、GitHub の無料枠と Workers Paid \$5/月 が効くので、逆転するのは月 4,000〜7,000 分規模から。public リポジトリや Docker ビルド前提の CI には向かない



[^1]:https://x.com/sh1ma/status/2078146772367720493
[^2]:https://x.com/sh1ma/status/2072666550436556888