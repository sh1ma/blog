---
title: "Cloudflareに独自ドメインのメールクライアントを構築した"
publishedAt: "2026-07-06"
priority: 2
description: "Cloudflare公式OSSの agentic-inbox を使って、独自ドメインでメールを送受信できるセルフホストなメールクライアントを Cloudflare Workers 上に構築してみたレポート。"
tags: ["Cloudflare", "Workers", "Email Routing", "OSS"]
---

今回も丹精込めて記事は手書きです。（英語版はClaude Codeに翻訳させてる。許して〜）

以前から独自ドメインでメールを運用してみたいなーと思いつつ[DMARC](https://dmarc.org/resources/specification/)とか[DKIM](https://datatracker.ietf.org/doc/html/rfc6376)とかの対応とか難しそうだし何より安定運用ができる気がしなかったので気が引けていました。  

今日GitHubをぼんやり眺めていたら、[Hono](https://hono.dev/)の作者でCloudflareでエンジニアをやっている[yusukebeさん](https://github.com/yusukebe)が[agentic-inbox](https://github.com/cloudflare/agentic-inbox)というリポジトリをStarしているのがFeedに流れてきました。

リポジトリのDescription曰く、どうやらメールの送受信どちらもできるような書きぶり。

>  A self-hosted email client with an AI agent, running entirely on Cloudflare Workers 

和訳: 
> _Cloudflare Workers上で完全に動作する、AIエージェント付きのセルフホスト型メールクライアント_

https://github.com/cloudflare/agentic-inbox

これを見たとき「でもCloudflareって[Email Routing](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)で受信しかできないような・・・？」と思い調べたら[2025年9月からPrivate Betaをやっていて](https://blog.cloudflare.com/email-service/)、[2026年7月に遂にPublic Betaとなっていた](https://blog.cloudflare.com/email-for-agents/)みたいです。なかなかタイムリーに見つけられた感。

実際[Send Emailsの公式Docs](https://developers.cloudflare.com/email-service/get-started/send-emails/)が026年4月頃には既にあるようでした。


筆者はEmail Routingを使って受信だけ独自ドメインだけで運用していましたが送信もずっとやりたいなーと思っていたし、とにかく面白そうなのでセットアップしてみることにしました。本記事はそのレポート記事です。

https://x.com/sh1ma/status/2073997367980982449?s=20



**注意: _どうやらWorkers Paid Planでないと使えないようです。_**

## TL;DR

- Cloudflare公式の [agentic-inbox](https://github.com/cloudflare/agentic-inbox) を使うと、独自ドメインでメールの送受信ができる Web メールクライアントを Cloudflare Workers 上に丸ごとホストできる。
- 受信は Email Routing、送信は Email Service、メールボックスは Durable Object (SQLite) + ファイル添付は R2、認証は Cloudflare Access というフル Cloudflare 構成。
- 「Deploy to Cloudflare」ボタンで一発デプロイできるが、**その後の Email Routing の catch-all 設定・Cloudflare Access のシークレット設定を忘れると動かない**。（筆者はデプロイについてはリポジトリクローンしてClaude Codeにやらせました）
- [Workers AI](https://developers.cloudflare.com/workers-ai/) との統合機能もあるらしく、例えば受信したメールへの気の利いた返信の下書きを作ってくれるらしい。

## agentic-inbox どんなやつ？

Cloudflare公式ブログで説明されているので一読するといいかも。

https://blog.cloudflare.com/email-for-agents/

[cloudflare/agentic-inbox](https://github.com/cloudflare/agentic-inbox) はCloudflareが公開しているセルフホスト型のメールクライアントです。使う技術スタックは全てCloudflareのサービスで完結します。

https://github.com/cloudflare/agentic-inbox

### 特徴

- 受信は [Email Routing](https://developers.cloudflare.com/email-routing/)、送信は [Email Service](https://developers.cloudflare.com/email-service/) の `send_email` bindingにより実現されている。
- 各メールボックスに専用の [Durable Object](https://developers.cloudflare.com/durable-objects/) + SQLite が割り当てられ、添付ファイルは [R2](https://developers.cloudflare.com/r2/) に保存される。
- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) + [Workers AI (`@cf/moonshotai/kimi-k2.5`)](https://developers.cloudflare.com/workers-ai/models/kimi-k2.5/) で、どうやら受信メールを読んで返信の下書きを作ってくれるらしい・・・。
- 本番環境ではCloudflare Accessの設定が求められる。Access Controlsを設定しなければ自身もアクセスできない。

Cloudflare 公式ブログの [Email for Agents](https://blog.cloudflare.com/email-for-agents/) と併せて読むと、なぜこの構成なのかがわかりやすいです。


## セットアップ

READMEに従っていくだけですので簡単に。

### 1. Deploy to Cloudflare でデプロイする

READMEの「[Deploy to Cloudflare](https://github.com/cloudflare/agentic-inbox#to-set-up)」ボタンを押すと、Cloudflare 側で R2 バケット・Durable Object・Workers AI を勝手にプロビジョニングしてくれます。途中で `DOMAINS` (受信させたいドメイン) を聞かれるので入力します。

ここまでで Worker 自体は立ちますが、まだメールは受信できません。以下の設定が別途必要です。

### 2. Email Routing の catch-all を Worker に向ける

Cloudflareダッシュボードで対象ドメインの _Email Routing_ を開き、_catch-all_ ルールを agentic-inbox Worker に転送するようにします。これをやらないと受信メールが Worker に届きません。

### 3. Email Service を有効化する

Cloudflare Dashboardの _Email Sending_ の設定ページに行き、メールのドメインに使用するZoneを選択します。
今回自分はたまたま持っていた [soysoysoysoy.soy](https://soysoysoysoy.soy) を使用しました

![Cloudflare DashboardのEmail Sendingページのスクリーンショット](https://cdn.sh1ma.dev/50d86893-d8e4-4111-b126-1fc5623c11e2.png)

### 4. Cloudflare Access を設定する

本番環境ではAccessが必須で、未設定だと `Cloudflare Access must be configured in production` と怒られます。

画像の通りDashboardのagentic-inbox Worker の `Settings → Domains` メニューへ行き、_Worker URL_ のProduction URLの公開範囲を _Public_ から _Restricted_ に変更します。このとき画像のようなモーダルが出現します。

![モーダルにAudience (aud)とJWKs URLが表示されているスクリーンショット](https://cdn.sh1ma.dev/720346bc-bb40-44df-bc95-28ad77602751.png)



モーダルのそれぞれの値は設定の必要のある以下の環境変数に対応しています。

- Audience (aud) → `POLICY_AUD`
- JWKs URL: `TEAM_DOMAIN`

これらを Worker のシークレットに設定します。

```bash
# 実行するとそれぞれ入力待ちになるので値をペーストしてEnter
wrangler secret put POLICY_AUD 
wrangler secret put TEAM_DOMAIN 
```


### 5. メールボックスを作る

デプロイした Web UI （先ほどの画面のProduction URL）にアクセスして、`hello@yourdomain.com` みたいなアドレスでメールボックスを作成します。ここまでやってようやく送受信ができるようになります。

![デプロイしたagentic-inboxのホーム画面。まだメールボックスが作成されていないのでNo mailboxes yetと表示されている](https://cdn.sh1ma.dev/c58acad7-3008-41b8-addc-25f551cebed4.png)

![メールボックスを作成したあとの画面。メールボックス一覧にメールボックスが一つ作成されている](https://cdn.sh1ma.dev/a075804a-64f4-4c90-baa7-6f1c79c8d96b.png)


ここまで正しくできていればメールの送受信が可能になります。

実際に送っている様子は以下のツイートから↓

https://x.com/sh1ma/status/2074068714899829193?s=20

## まとめ

独自ドメインを使ったメールの送受信をするのにZohoだったりGoogle Workspaceを利用する方法がありますが、軒並み有料なのが自分の中でネックでした。

これなら既に契約しているWorker Paidプランの中でおさまるのでかなり嬉しい！

みなさんもご興味があればぜひ独自ドメインのメールクライアントをCloudflare上に構築してはいかがでしょうか
（AI機能も使ってみたいね・・・使う相手がいなかった）

