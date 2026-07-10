---
title: "Cloudflare R2をMacOSのFinderから見られるようにしてみた"
publishedAt: "2026-07-10"
description: "Rclone の nfsmount で Cloudflare R2 バケットを macOS の Finder から読み書きできるようにした話。macFUSE 不要でセットアップできる。"
tags: ["Cloudflare", "R2", "Rclone"]
---

こんにちは。世間は[GPT‑5.6がリリースされた](https://openai.com/ja-JP/index/previewing-gpt-5-6-sol/)ことで盛り上がっていますね。自分はまだ使っていません（契約してはいる）。


今回はCloudflare R2とRcloneを共有フォルダとしてマウントし、MacOSのFinderから操作できるようにしてみた記事です。

https://x.com/sh1ma/status/2075519775388930305?s=20

## TL;DR

- RcloneとR2を組み合わせることにより仮想的にOSにマウントできた。 
- MacOSにマウントしたR2のリソースをFinderで表示・操作することができた。
- macFUSEを入れなくても `rclone nfsmount` を使えばmacOS標準のNFSクライアントでマウントできる。
- Finderからマウントすると `.DS_Store` / `._*` がバケットに書き込まれるので、 `defaults write com.apple.desktopservices DSDontWriteNetworkStores true` で抑制しておくと良い。

[Rclone · Cloudflare R2 docs](https://developers.cloudflare.com/r2/examples/rclone/)

## 経緯（興味ある人だけどうぞ）

このブログで載せる画像や動画などのメディアは基本的にバインディングされた[Cloudflare R2](https://developers.cloudflare.com/r2/)で管理していますが、これは記事執筆の障害になっていました。記事にメディアを挿入しようとする度に「画像を手元に用意し、リネームし、Exif等のファイルメタデータを消して、WranglerやWeb UIからアップロードする」という煩雑な工程を踏む必要があったためです。

以前は自前でファイルアップロード用の管理画面を作って画像管理を行っていましたが、メンテが捗らず結局使わなくなってしまいました。

最近ブログ投稿を再開し、記事をいくつか投稿するなかでやはりメディアの取り回しは課題だと感じたので今回紹介する方法で解決を目指しました。

Finderと書いてはいるものの、Windowsやその他の大概のOSで同じようなことができるはずです。


## Rcloneとは

[Rclone](https://rclone.org/) は「rsyncのクラウド版」的なCLIツールで、S3, GCS, Azure Blob, Dropbox, Google Drive などの70種類以上のオブジェクトストレージ・クラウドストレージを共通のインターフェースで扱えるものです。Cloudflare R2はS3互換なので、Rcloneの `s3` provider として `Cloudflare` を指定するだけで使えます。

そしてこのRcloneのおまけ的機能に `rclone mount` があり、これを使うとリモートストレージをローカルのファイルシステムとしてマウントできます。

## macOSでどうマウントするか

`rclone mount` は内部的にFUSEを利用するため、通常はmacFUSEを別途インストールする必要があります。しかしmacFUSEはkext（カーネル拡張）を要求し、System Integrity Protection（SIP）を弱める必要があるなど、個人的にはあまり入れたくないシロモノです。

そこで今回は `rclone nfsmount` を使います。これはRcloneが内蔵のNFSサーバをlocalhost上に立て、それをmacOS標準のNFSクライアントからマウントするという方式で、macFUSEは不要でsudoも要りません。

## セットアップ

### 1. Rcloneのインストール

MacOSならHomebrewで入れます。 

各OSのインストール手順は以下から  
https://rclone.org/install/

```bash
brew install rclone
```

バージョン確認。

```bash
$ rclone version
rclone v1.74.4
- os/version: darwin 26.3.1 (64 bit)
- os/kernel: 25.3.0 (arm64)
```

### 2. R2のAPIトークンを発行する

RcloneはS3互換API経由でR2にアクセスするため、専用のR2 APIトークンが必要です。 `wrangler` のOAuthトークンは使えないので注意。

Cloudflare Dashboardから発行します:

![Cloudflare Dashboard トークン一覧画面](https://cdn.sh1ma.dev/edd2e855-d360-4934-b78d-ea2597a42c3a.png)


1. `https://dash.cloudflare.com/<account_id>/r2/api-tokens` を開く
2. 「Create API token」を押す
3. Permissions を `Object Read & Write` に、Bucketは対象バケットに絞る（推奨）
4. 発行後に表示される **Access Key ID** と **Secret Access Key** を控える

![Cloudflare Dashboard トークン作成後の画面](https://cdn.sh1ma.dev/fe8a13e7-d5e8-4d67-951c-644ee1201232.png)

Secretは発行直後にしか表示されないので忘れずコピーしておきましょう。

### 3. rclone config を書く

対話モード（ `rclone config` ）でも良いのですが、値がわかっているので直接 `~/.config/rclone/rclone.conf` を書いてしまいます。

```ini title="~/.config/rclone/rclone.conf"
[sh1madev-cdn]
type = s3
provider = Cloudflare
access_key_id = <ACCESS_KEY_ID>
secret_access_key = <SECRET_ACCESS_KEY>
region = auto
endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

- `[sh1madev-cdn]` はremoteの名前（後述するマウントコマンドで使う）。任意の名前でOK。
- `endpoint` はCloudflareダッシュボードの各バケットの「Settings」ページからも確認できる。
- `region = auto` はR2のお約束。

疎通確認:

```bash
rclone ls sh1madev-cdn:sh1madev-cdn --max-depth 1 | head
```

バケット内のオブジェクトが一覧表示されればOKです。

### 4. マウントポイントを作ってマウントする

```bash
mkdir -p ~/mnt/sh1madev-cdn

rclone nfsmount sh1madev-cdn:sh1madev-cdn ~/mnt/sh1madev-cdn \
  --vfs-cache-mode writes \
  --daemon \
  --log-file=/tmp/rclone-sh1madev-cdn.log \
  --log-level INFO
```

各オプションの意味:

- `--vfs-cache-mode writes`: 書き込みを一度ローカルにバッファしてからR2にアップロードする。これを付けないと書き込み系の操作でエラーになりがちなので基本必須。
- `--daemon`: バックグラウンド常駐。
- `--log-file` / `--log-level`: 何か起きたときに切り分けるためログを吐く。

マウントできたか確認:

```bash
$ mount | grep sh1madev-cdn
localhost:/sh1madev-cdn sh1madev-cdn on /Users/sh1ma/mnt/sh1madev-cdn (nfs, nodev, nosuid, mounted by sh1ma)

$ ls ~/mnt/sh1madev-cdn | head
aaa.png
bbb.png
ccc.webp
...
```

これでFinderからも `~/mnt/sh1madev-cdn` を開けば普通にR2の中身が見えます。

アンマウントするときは:

```bash
umount ~/mnt/sh1madev-cdn
```

## Finderで開くときの注意: `.DS_Store` / `._*` をバケットに書き込ませない

Finderで開いた瞬間にmacOSが `.DS_Store` やAppleDouble形式のリソースフォーク（ `._ファイル名` ）をせっせとバケット内に書き込みだします。

自分の場合、実際にバケットの中を見たら過去の作業で汚染された痕跡が既に残っていました。

```
8196 .DS_Store
4096 ._.DS_Store
4096 ._128c5211dfc9d313ea1d331c388fb4008425959049fcf191138a056efa1927b9.png
...
```

これを抑制するにはmacOSの隠しオプションを叩きます。

```bash
defaults write com.apple.desktopservices DSDontWriteNetworkStores true
killall Finder
```

これで少なくとも `.DS_Store` は書き込まれなくなります。

既に混入している分は掃除しておきましょう。 `--dry-run` を付けて対象を確認したうえで実行するのが安心。

```bash
# ドライラン
rclone delete sh1madev-cdn:sh1madev-cdn --include ".DS_Store" --include "._*" --dry-run

# 問題なければ --dry-run を外す
rclone delete sh1madev-cdn:sh1madev-cdn --include ".DS_Store" --include "._*"
```

## セキュリティ上の注意

- `~/.config/rclone/rclone.conf` にAccess Key IDとSecret Access Keyが**平文**で書かれます。心配なら `rclone config` の `--password` でconfig自体を暗号化するオプションもあるので、そちらを検討してください。

## まとめ

macFUSEを入れずにR2をmacOSにマウントできました。 `rclone nfsmount` は本当に便利で、これで記事執筆時のメディア取り回しが「Finderで画像コピーして貼る」だけで済むようになりました。

同じ悩みを抱えている方はぜひ試してみてください。
