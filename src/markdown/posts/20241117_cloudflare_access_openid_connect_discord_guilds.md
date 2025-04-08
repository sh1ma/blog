---
title: Cloudflare Accessを使ってDiscordサーバーに入っている人のみにWebサイトを公開する
publishedAt: "2024-11-17"
---

自宅鯖で[stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui)を建てました。自分だけ使うのはもったいないけど世界中に公開するのは怖い・・・と思ったので身内Discordサーバーに入っている人だけがアクセスできるようにしました。今回はその手順を紹介します。

## ざっくりやること

（以下を見て「わかった！」って方はもう記事を見なくてもいいかもです）

Cloudflare Workers + DiscordのOauthを使ってOpenID Connectに使える認証サーバを構築し、それをCloudflare Zero Trustの認証プロバイダに登録する。Cloudflare Accessで認証したユーザのClaimを確認し、Discordサーバーに入っているか判定する。

## 本編

### 前提

- Cloudflareに登録済みなこと
- wrangler(cloudflareのcli)をセットアップしていること。[セットアップ方法は公式サイトに解説があります。](https://developers.cloudflare.com/workers/get-started/guide/)

### 1. Discord Developer Portalでアプリを作る

まずは[Discord　Developer Portal](https://discord.com/developers/applications)にアクセスして認証に使う用のApplicationsを作ります。「OAuth2」のページの「Client information」にある「Client ID」と「Client Secret」をメモしておきます。

### 2. Cloudflare Workersで認証サーバを構築

自分で作ってもいいですが既に以下の実装を公開している方がいるのでそれを使います。

[Erisa/discord-oidc-worker: Sign into Discord on Cloudflare Access, powered by Cloudflare Workers!](https://github.com/Erisa/discord-oidc-worker)

まずは`git clone`などを使いリポジトリをダウンロードします。

```bash
git clone https://github.com/Erisa/discord-oidc-worker
```

`discord-oidc-worker`をセットアップしていきす。  
セットアップ方法はGithubのREADMEに書いてありますがここでも解説します。

まずはnpmを使って依存関係をダウンロードします。

```bash
cd discord-oidc-worker
npm install
```

[Cloudflare Workers KV](https://developers.cloudflare.com/kv/)を用意します。セットアップ方法は二種類あります。wranglerを使った方法とCloudflareのWebコンソールからぽちぽちやる方法です。wranglerの方が簡単なのでこちらを紹介します。

以下のコマンドでcloudflare workers KVを作成します。このKVは[JSON Web Key(JWK)](https://openid-foundation-japan.github.io/rfc7517.ja.html)の保管に使います。

wranglerのバージョンが3.60.0以上であれば`kv:namespace`ではなく`kv namespace`に読み替えてください。

```bash
npx wrangler kv:namespace create "discord_oidc_keys"
```

成功すると以下のような出力が出ると思います。

```
🌀 Creating namespace with title "worker-discord_oidc_keys"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "discord_oidc_keys", id = "..." }
```

これの`{ binding = "discord_oidc_keys", ...}`の`binding`を`KV`に変更してwrangler.tomlにコピペします。  
wrangler.tomlは以下のようになります。

```toml
name = "discord-oidc"
main = "worker.js"
compatibility_date = "2022-12-24"

kv_namespaces = [
  { binding = "KV", id = "..." },
]
```

次はconfig.sample.jsonをもとにconfig.jsonを作成します。

```bash
cp config.sample.json config.json
```

config.jsonを編集します。1でメモしたclient idとclient secretを使います。以下の通り書き換えてください。

```json
{
  "clientId": "YOUR_DISCORD_CLIENT_ID",
  "clientSecret": "YOUR_DISCORD_CLIENT_SECRET",
  "redirectURL": "https://YOUR_CLOUDFLARE_USER_NAME.cloudflareaccess.com/cdn-cgi/access/callback",
  "serversToCheckRolesFor": ["YOUR_DISCORD_SERVER_ID"]
}
```

- `YOUR_DISCORD_CLIENT_ID`を実際のdiscordのclient idに書き換える
- `YOUR_DISCORD_CLIENT_SECRET`を実際のdiscordのclient secretに書き換える
- `YOUR_CLOUDFLARE_USER_NAME`を実際のcloudflareのユーザネームに書き換える
- `YOUR_DISCORD_SERVER_ID`をwebサイトにアクセスできるユーザーの入っているDiscordサーバーに書き換える（複数登録できます）

最後にデプロイします

```bash
npx wrangler publish
```

wranglerのバージョンが新しければ以下を実行します

```bash
npx wrangler deploy
```

### 3. Cloudflare Zero Trustを設定する

先ほどたてたCloudflare WorkersをCloudflare Zero Trustの認証プロバイダに登録します。

「Settings」の「Authentication」に行き、「Login Methods」の項目の「Add New」をクリックして「Add OpenID Connect」ページに移動します。

![Login Methodsの項目。右上に"Add New"がある](https://cdn.sh1ma.dev/e7593de96bfacde6ff31f37b754d1a3a798e4487259c50ca3fc4a8a3e3d5b6c8.png)

![Add OpenID Connectページのフォーム](https://cdn.sh1ma.dev/cb3a61f1c721045dcf8c76ed4d8cf859496be2d7ca6a07e91c63f516973874ac.png)

フォームの項目を以下の通りに埋めます。

- Name: 自由。好きな名前を設定してください
- App ID: DiscordのClient ID
- Client secret: DiscordのClient secret
- Auth URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/authorize/guilds`
- Token URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/token`
- Certificate URL: `https://discord-oidc.YOUR_CLOUDFLARE_USER_NAME.workers.dev/jwks.json`
- Proof Key for Code Exchange (PKCE): オンにする
- Email claim: 入力不要

OIDC Claimsは以下のように設定します

- id
- username
- discriminator
- guilds

![OIDC Claimsの設定例](https://cdn.sh1ma.dev/7d03223d6f859dfcb3b1d89d71c735c18a88e9a75a7bd3d40ba5b1018b0a4ece.png)

以上を記入したら「Test」を押して実際に試してみるとよいでしょう。よさそうであれば「Save」を押して保存してください。

### 4. Cloudflare Accessを設定する

3で作った認証をCloudflare Accessで使う設定をします。  
Cloudflare Accessのページに行き、「Add an application」ボタンでアプリを作ります。

![Cloudflare Accessの設定ページ。中央に「Add an apllication」ボタンがある](https://cdn.sh1ma.dev/28a085caedc57bf6b75fd879a130773a66da4d201af43c8841f1984ecadfc6b4.png)

「Self Hosted」を選択します。

![Add an applicationページ。一番右がSelf Hosted](https://cdn.sh1ma.dev/85ef9dea3e66b4d0245c3f132baf1073500f817b14d657bd11fa43f009188a03.png)

Application Configurationでアクセスを制限したいアプリのドメインを設定します。

- Session Durationはセッションが有効な期間を設定します

Identity ProvidersはOpenID Connectのみに設定します。

![Identity Providersの設定。OpenID Connectのみ設定されている](https://cdn.sh1ma.dev/665058db0746c05deaffc0a738d50846403730c31656b3537a1f69348de830a4.png)

「Next」を押してPoliciesの設定へ進みます。

Configure Rulesを設定します。

Includeに以下を追加します

- OIDC Claimsを選択
- 「Claim name」に「guilds」を入力する
- 「Claim value」にDiscordのサーバーIDを入力

![Configure Rules](https://cdn.sh1ma.dev/a5c3d3707f376737b69927383efe607f4103c7de4351f447b4cd887850de1000.png)

「Save Policy」を押して保存すれば設定完了。対象のドメインに移動して以下のような画面になっていれば成功しています。ログインして動作確認してみてください。

![対象のドメインにアクセスしたときのスクリーンショット。中央にログインを促すフォームが出ている](https://cdn.sh1ma.dev/6be3fe282e3223637453d12f4c0b002fd0d3cca0cc2d14a2ea2354782d1ed578.png)

## まとめ

予想以上に簡単にできてよかったです。discord-oidc-workerはサーバだけでなくユーザ自身での認証もできるのでそちらも使うことがあるかもしれません。
