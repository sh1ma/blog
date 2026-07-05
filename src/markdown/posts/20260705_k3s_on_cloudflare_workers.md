---
  title: "Cloudflare Workers Containers に k3s を載せてみた"
  publishedAt: "2026-07-05"
  description: "Firecracker microVM 1 台の中に k3s single-node クラスタを詰め込み、Worker を薄い gateway として前段に置く構成の技術解説。"
  tags: ["Cloudflare", "Kubernetes", "k3s", "Cloudflare Workers"]
---

Cloudflare Workers Containers の上に **k3s の single-node クラスタ**を丸ごと立てて、`kubectl` で普通に触れる状態まで持っていけました。この記事ではその構成がどうやって動いているかを説明します。

コード一式はこちらに置いています。

https://github.com/sh1ma/try-k3s-on-cf-workers-public

https://x.com/mizchi/status/2070456349197299956

https://x.com/sh1ma/status/2070688160766640444

https://x.com/sh1ma/status/2072200706883543466

https://x.com/sh1ma/status/2072224558871204290

https://x.com/sh1ma/status/2072255101541163312

https://x.com/sh1ma/status/2072329617990693297

## 全体像

構成はざっくり次のようになっています。

```
Cloudflare Worker  ──►  Container (Firecracker microVM)
                          │
                          ├─ Python status.py (PID 1, port 8080)
                          │  ├─ /health, /manage/*, /services/*
                          │  ├─ /manage/apiserver → k3s apiserver reverse-proxy (HTTP + WebSocket)
                          │  ├─ /manage/dashboard → Kubernetes Dashboard reverse-proxy
                          │  └─ /services/*       → Traefik ClusterIP:80 (verbatim)
                          │
                          ├─ svcproxy (Go, 自作 userspace kube-proxy)
                          │
                          └─ k3s server (all-in-one)
                             ├─ control plane: apiserver + controller + scheduler + SQLite
                             ├─ node: kubelet + containerd
                             └─ pods: coredns, dashboard, traefik, ...
```

登場人物は 3 層です。

- **Worker**: 外から来た HTTPS を Container Durable Object に流すだけの薄い gateway。ルーティングロジックは持たない。
- **Container の中の `status.py`**: PID 1 として立つ Python サーバ。パス prefix で「管理系」「サービス公開系」を振り分け、apiserver / Dashboard / Traefik へ reverse-proxy する。
- **k3s 本体**: control plane と node が同居する all-in-one 構成。追加で自作の userspace kube-proxy (`svcproxy`) が同じ microVM の中で常駐している。

これで外から見える URL は次の 2 系統に分かれます。

| URL prefix | 用途 |
|---|---|
| `/services/<name>/*` | クラスタに `kubectl apply` した Ingress ルール経由で backend Service に届く |
| `/manage/*` | Dashboard・apiserver reverse-proxy・`kubectl` エンドポイントなどの管理系 |

新しいサービスを公開するときは `kubectl apply -f my-ingress.yaml` するだけで `/services/<name>/*` から届くようになります。Worker 側のコードは触りません。

## Cloudflare Container の中身は Firecracker microVM

Cloudflare Workers Containers は Workers Paid プランで使える Firecracker microVM ベースの実行環境です。中で `uname -a` すると `Linux 6.18.36-cloudflare-firecracker` が返ります。

権限周りが緩く、**CapEff = 0x1ffffffffff (全 41 cap 保持)**・seccomp フィルタなし・user namespace 作成 OK・overlayfs mount OK・KVM デバイスありという、実質「特権付き VM 1 台」に近い状態です。rootless の縛り無しで rootful k3s server をそのまま起動できます。

一方で kernel の機能は built-in のものに限られます。`/lib/modules` 相当が無く、動的 module load 前提の機能はどれも動きません。ここが k3s 側の設計に強く効いてきます。

## k3s 側の構成

`k3s server` は次のフラグで起動しています。

- `--flannel-backend=host-gw`
- `--disable-kube-proxy`
- `--disable-network-policy`
- `--disable=servicelb`
- `--disable=traefik`

**内蔵の kube-proxy を無効化している**のがポイントです。Firecracker kernel には netfilter 拡張が軒並み無いため、iptables mode は `nfacct` 未サポート、nftables mode は `reject` verdict が無く、ipvs mode は `ip_vs` module がそもそも存在しない、と全 mode が動きません。flannel の VXLAN も同じ理由で使えないので host-gw に、kube-router の network policy も `NFLOG` 依存で無効化しています。

servicelb と traefik を切っているのは、外部 LB が要らない (Worker が前段に居る) のと、Traefik を自前で最新版に置きたかったためです。

pod 側は containerd の nested container として動きます。標準の CoreDNS / metrics-server / local-path-provisioner に加えて、Kubernetes Dashboard と自前の Traefik v3 (Ingress Controller) を manifest として `/var/lib/rancher/k3s/server/manifests/` に置いておくと、k3s の HelmChart/Deployment reconciler が起動時に自動で apply してくれます。

## svcproxy: 自作 userspace kube-proxy

kube-proxy を切ったので、Service の ClusterIP に飛んできたパケットを pod に届ける仕組みが必要です。これを `container/svcproxy/main.go` として Go で自作しました。外部依存ゼロで数百行の素朴な実装です。

動き方はシンプルです。

1. 3 秒ごとに `kubectl get services -A -o json` と `get endpointslices -A -o json` を叩く
2. 期待する `(ClusterIP, port) → [endpoint...]` の表を組み立てる
3. 現在の Listener 集合との差分を計算して反映

反映処理は次のとおりです。

- **新規**: `ip addr add <ClusterIP>/32 dev lo` で loopback に IP を生やし、`net.Listen("tcp", "<ClusterIP>:<port>")` で受ける。受けた接続は `io.Copy` の bidirectional splice で pod endpoint に流す
- **削除**: listener を close、参照カウントを見て lo に生やした IP も剥がす
- **endpoints 変更**: `atomic.Pointer[[]endpoint]` で入れ替える (既存接続は切らない)

これで pod からは kube-proxy が居るのと同じ挙動に見えます。UDP は未対応ですが、CoreDNS → apiserver など主要経路は TCP なので現状問題ありません。

## Worker 側と `status.py` のルーティング

Worker はほぼ空です。任意のパスを Container Durable Object に流すだけ。実際のルーティングは Container 内の `status.py` (PID 1) が担当します。

`status.py` の分岐は 3 系統です。

- `/health` — CF Container の pingEndpoint 用に軽量な生存応答を返す
- `/services/<name>/*` — Traefik の ClusterIP (`kube-system/traefik:80`) に verbatim で流す。パスは書き換えない
- `/manage/*` — 管理面。以下にさらに分岐する
  - `/manage/apiserver/*` → `https://127.0.0.1:6443` に TLS で forward (`kubectl` のバックエンド)
  - `/manage/dashboard/*` → Kubernetes Dashboard (insecure HTTP 9090) に forward
  - `/manage/kubectl?args=...` → サーバ内で `kubectl` を exec して stdout/stderr を JSON で返す

`/services/*` から Traefik に届いたリクエストは、ユーザが `kubectl apply` した `IngressRoute` + Middleware (`stripPrefix: /services/<name>`) 経由で backend Service に振り分けられます。Ingress を追加するだけで新しいサービスが `/services/<name>/*` から公開される、という体験がこれで成立します。

## `kubectl` を手元から通す

`/manage/apiserver/*` が apiserver の reverse-proxy になっているので、原理的には `kubectl --server=https://<worker>/manage/apiserver` で叩けます。ただし実運用では 2 つ問題があります。

1. Cloudflare Access (Service Token) を前段に立てているので、リクエストに `CF-Access-Client-Id` / `CF-Access-Client-Secret` ヘッダを付ける必要がある
2. `kubectl` は **`http://` エンドポイントに bearer token を送らない**ので、ローカル側も HTTPS でないと SA トークン認証が通らない

これを解決するために `bin/access-proxy.py` というローカル HTTPS proxy を挟みます。self-signed 証明書で `https://127.0.0.1:8087` を listen し、受けたリクエストに Access ヘッダを注入して Worker に転送するだけの薄い proxy です。

```sh
kubectl --server=https://127.0.0.1:8087/manage/apiserver \
        --token="$TOKEN" \
        --insecure-skip-tls-verify=true \
        get nodes
```

さらに `kubectl port-forward` / `exec` / `logs -f` などは WebSocket (HTTP/1.1 `Upgrade`) を使うので、`status.py` と `access-proxy.py` の両方に「`Upgrade: websocket` を検出したら raw TCP splice に切り替える」パスを入れています。101 を返した以降は client ↔ upstream を bidirectional に pump するだけです。

## Firecracker 由来のハマりどころ

構成を組み立てる過程で踏んだもののうち、他の人にも起きそうなものを挙げておきます。

**kube-proxy が全 mode で動かない**
netfilter 拡張が動的 module load 前提のものは全滅します (`nfacct` / `reject` / `ip_vs` / `NFLOG` など)。ただし `nf_conntrack` や iptables base の枠組みそのものは生きているので、**userspace 側で Service を成立させる**という設計にすれば普通に動きます。svcproxy はまさにその方針。

**`@cloudflare/containers` の `pingEndpoint` は "host/path" 形式**
`pingEndpoint = "/health"` (先頭スラッシュ) を渡すと URL が `http:///health` になり、hostname が空・path が空文字扱いで、実際には `GET /` が飛びます。`pingEndpoint = "container/health"` のように書く必要があります。これに気付かないまま `/` を greedy な reverse-proxy にしていると、監視トラフィックが全部その先の pod に流れて thread pool を埋め、`/health` すら詰まる、というカスケード障害を起こします。

**k3s の `--disable=X` は同名 manifest を積極的に削除する**
`--disable=traefik` を指定した状態で `traefik.yaml` を manifest ディレクトリに置くと、addon reconciler が起動時に「disabled 指定されている」と判断して物理ファイルごと消しにきます。ファイル名を `ingress-controller.yaml` のようにずらせば回避できます。

**Traefik v3 は CRD 10 個を全部 watch する**
Middleware だけ使いたくても、`middlewaretcps` / `ingressroutetcps` / `ingressrouteudps` / `tlsstores` / `tlsoptions` / `serverstransports` / `serverstransporttcps` などが CRD として定義されていないと controller cache sync が timeout して pod が exit します。全部 `x-kubernetes-preserve-unknown-fields: true` で空定義を通すのが最小コストです。

## おわりに

Cloudflare Workers Containers は「特権付き VM 1 台を Worker から起動できる箱」として扱うと素直で、kernel 制約さえ避ければ Kubernetes の control plane 一式を丸ごと詰め込めます。追加の VM や K8s コントロールプレーンのマネージドサービスに一切課金せず、Workers Paid プラン (+ Container 稼働時間) だけで k8s が動くのはちょっと面白い選択肢です。

マルチノード化や永続化はまだ着手できていないので、また続きを書けたら書きます。
