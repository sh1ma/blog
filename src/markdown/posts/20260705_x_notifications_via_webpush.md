---
  title: "X の投稿を API やスクレイピング無しにストリーミングする"
  publishedAt: "2026-07-05"
  description: "ブラウザの Web Push クライアントをエミュレートし、Mozilla AutoPush 経由で X のツイート通知をリアルタイムに受信する CLI ツール Angelic Angel の技術解説。"
  tags: ["Rust", "Web Push", "X", "Twitter", "AutoPush"]
---

X (旧 Twitter) の公式 API を叩かず、スクレイピングもせず、フォロー中かつ「ツイート通知オン」にしているユーザの投稿を **リアルタイムにストリーミング** する CLI ツールを作りました。この記事ではその構成がどうやって動いているかを説明します。

コード一式はこちらに置いています。

https://github.com/sh1ma/Angelic-Angel

https://x.com/sh1ma/status/2029557172577948023

## 全体像

構成はざっくり次のようになっています。

```
X (twitter.com)  ──push──▶  Mozilla AutoPush  ◀──WebSocket──  Angelic Angel  ──HTTP POST──▶  Webhook
                            (push.services.mozilla.com)         (Rust CLI)                    (任意)
```

登場人物は次のとおりです。

- **X の通知設定 API**: プッシュサブスクリプションのエンドポイントを 1 度だけ登録する。以降このツールから X には一切アクセスしない。
- **Mozilla AutoPush**: Firefox が使っているのと同じ Web Push 配送サーバ。X から見た「Firefox クライアント」の受け皿。
- **Angelic Angel (Rust CLI)**: AutoPush に WebSocket で常時接続し、ECE (Encrypted Content-Encoding) で暗号化された通知を復号して、任意の Webhook に HTTP POST で流す。

流れとしては、

1. Angelic Angel が Mozilla AutoPush に Web Push サブスクライバとして登録する。
2. 取得したプッシュサブスクリプションのエンドポイントを、X の通知設定 API に **Firefox として** 登録する。
3. 以降、X はブラウザに通知を送るのと同じ経路 (Mozilla AutoPush) にプッシュ通知を投げる。
4. Angelic Angel は WebSocket 経由で通知を受け取り、ECE で復号して、Webhook に流す。

## なぜ「API もスクレイピングも使わない」と言えるか

このツールが X のドメインに HTTP アクセスするのは、初回の `register` コマンドで **プッシュサブスクリプションを 1 度登録する** ときだけです。ツイート本文の取得は一切していません。

- 通知データの取得元は `push.services.mozilla.com` (Mozilla AutoPush) だけ。ツイート本文もこの経路で暗号化されて届く。
- ツイート受信中は X に対して HTTP リクエストを一切送らない。API レート制限もスクレイピング検知の対象にもならない。
- 使っているのは W3C の [Push API](https://www.w3.org/TR/push-api/) と RFC 8188 (aes128gcm) / draft-ietf-httpbis-encryption-encoding-01 (aesgcm) の Encrypted Content-Encoding。ブラウザがプッシュ通知を配送するときと同じ、標準化されたフロー。

つまり X から見ると、これは「Firefox が 1 台常駐して通知を受けている」のと区別がつきません。

## 認証情報

必要なのは X アカウントの `auth_token` と `ct0` の 2 つの Cookie だけです。ブラウザで x.com にログインして DevTools から取ってきます。これは通知設定 API を叩くためだけに使われ、他の API コールには使いません。

## プッシュサブスクリプションの登録

`register` コマンドで、次の順に処理します。

1. **鍵の生成**: ECDH P-256 の鍵ペアと 16 バイトの auth secret を生成する。Firefox の `PushCrypto.sys.mjs: generateKeys()` と同じで、再購読のたびに新しく作る。
2. **Mozilla AutoPush に hello → register**: WebSocket で `wss://push.services.mozilla.com/` に繋ぎ、`hello` に続いて **X の VAPID 公開鍵** を `applicationServerKey` として渡した `register` を送る。返ってくる `pushEndpoint` がこのサブスクライバの URL。
3. **X の通知設定 API に登録**: `POST https://x.com/i/api/1.1/notifications/settings/login.json` に、次の JSON を投げる。

    ```json
    {
      "push_device_info": {
        "os_version": "Mac/Firefox",
        "udid": "Mac/Firefox",
        "env": 3,
        "locale": "en",
        "protocol_version": 1,
        "token": "<endpoint>",
        "encryption_key1": "<public_key base64url>",
        "encryption_key2": "<auth_secret base64url>"
      }
    }
    ```

    ヘッダは Firefox が送るのとほぼ同じで、`x-twitter-auth-type: OAuth2Session`・`x-csrf-token: <ct0>`・`Cookie: auth_token=...; ct0=...` を付ける。`Authorization: Bearer` は Web クライアントが使っているのと同じ固定値。

この 3 ステップが完了すると、X はこのサブスクリプション宛にプッシュ通知を投げ始めます。

## WebSocket で通知を受け続ける

`listen` コマンドは、AutoPush に WebSocket で常時接続し、通知が来るたびに ECE で復号して Webhook に流します。

ここの実装は「単に受信するだけ」に見えて、実際は **Firefox の `PushServiceWebSocket.sys.mjs` の挙動をなるべく忠実にトレース** しています。理由は、AutoPush サーバ (`autopush-rs`) がクライアントの振る舞いをかなり厳格に見ているためです。まっとうな Web Push クライアントに見えないと、`ExcessivePing` や backoff で切断されます。

具体的には次のタイマーを回しています。

- **アプリケーションレベルの ping**: 5 分ごとに `{}` を送る (Firefox は 30 分だが、途中の LB のアイドルタイムアウトを避けるため短縮)。返事は空 JSON `{}` = pong。
- **request timeout**: ping を送ってから 10 秒以内に pong が来なければ切って再接続 (Firefox の `requestTimeout = 10000ms` と同じ)。
- **WebSocket Ping frame**: RFC 6455 のフレームレベルの Ping を 150 秒ごとに送る。L7 LB / CDN 対策。
- **TCP keepalive**: ソケット層で 60 秒。NAT テーブルから叩き落とされないため。

これらのタイマーは、任意のメッセージが届いたタイミングでリセットします (Firefox の挙動と同じ)。

通知を受けたら、内容と関係なくかならず ACK を返します。Firefox 互換で 3 コードを使い分けます: `100 Delivered` / `101 DecryptionError` / `102 NotDelivered`。ACK しないと AutoPush 側が保留メッセージとして再送し続けます。

同じ `messageID` (`version`) が 2 回届いた場合は Firefox と同じく直近 100 件のリングバッファで重複判定してスキップし、それでも ACK は返します。

## 再接続戦略

Firefox の再接続戦略を移植しています。

- **指数バックオフ**: 5 秒 × 2^n、上限 5 分 (`dom.push.retryBaseInterval = 5000` と同じ計算)。
- **カウンタリセット**: hello が通ってメッセージを受信できた瞬間にリトライカウンタを 0 に戻す。「安定接続中にたまに切れた」を「連続失敗」と誤認しないため。
- **サーババックオフ**: 閉じ frame のコードが `4774` の場合、AutoPush が「一定時間繋いでくるな」と言っている合図。30 分待つ。
- **UAID 無効化**: hello レスポンスで返ってきた `uaid` が保存してあるものと違えば、ブラウザ側の `pushsubscriptionchange` に相当する状態。鍵ペアを作り直し、AutoPush に register し直し、X の通知設定 API にも登録し直す。この一連の再登録が終わってから listen ループに戻る。

## ECE 復号

通知は `Encryption-Encoding` ヘッダで `aes128gcm` (RFC 8188) か `aesgcm` (draft-01) のどちらかで来ます。X の Web Push はまだ `aesgcm` を使う場面があるので両対応にしてあります。

- **aes128gcm**: [`ece`](https://crates.io/crates/ece) crate の `ece::decrypt` に鍵ペア・auth secret・暗号文を渡すだけで済む。ヘッダは暗号文の中に埋まっている。
- **aesgcm**: 送信者公開鍵 (`Crypto-Key: dh=...`) と salt (`Encryption: salt=...`) がヘッダ側に来る。これらを base64url デコードして `ece::legacy::AesGcmEncryptedBlock` を組み立てて渡す。

復号後は UTF-8 の JSON なので、そのまま Webhook に流します。

## Webhook

`WEBHOOK_ENDPOINT` 環境変数に URL を渡しておくと、復号したペイロードをそのまま HTTP POST で送ります。

```sh
WEBHOOK_ENDPOINT=https://your-webhook.example.com/endpoint angelic-angel listen
```

ペイロードには誰の何のツイートかが平文で入ってきます。Discord に流すもよし、自作の TL に流すもよし。

## ハマりどころ

作る過程で踏んだもののうち、他の人にも起きそうなものを挙げておきます。

**Ping 間隔が短すぎると `ExcessivePing` で切られる**
`autopush-rs` は 45 秒より短い間隔の application ping を DoS 扱いで切断してきます。Firefox の 30 分は極端ですが、5 分程度が現実的な下限。

**`aesgcm` と `aes128gcm` は別物**
ヘッダを見ずに常に `aes128gcm` として復号しようとすると、`aesgcm` エンコーディングのペイロードが復号失敗します。X からの通知はどちらもあり得るので、`Encryption-Encoding` ヘッダで分岐する必要があります。

**UAID が変わったら X 側にも登録し直す必要がある**
AutoPush の UAID が invalidate されると、ブラウザなら `pushsubscriptionchange` イベントが飛んで再購読フローが走ります。CLI ではそれをコード側で再現しないといけません。鍵の再生成 → AutoPush 再 register → X の `notifications/settings/login.json` 再 POST の 3 点セット。どれか漏らすと二度と通知が届かなくなります。

**Cookie は `auth_token` と `ct0` の 2 つが必要**
`ct0` は CSRF トークンとしてリクエストヘッダ (`x-csrf-token`) と Cookie の両方に載る必要があります。片方だけだと 403。

**close code `4774` は普通の切断と扱いを変える**
30 分待たず即再接続すると、backoff を無視しているとみなされてさらに長い間止められることがあります。close frame の code をきちんと見て 30 分寝るのが正解。

## おわりに

Web Push は「ブラウザにプッシュ通知を届ける」ための仕様ですが、逆方向から見ると **「ブラウザのフリをすれば、そのサービスからの通知をブラウザ外の任意のプロセスで受けられる」** ということでもあります。X に限らず、Web Push を使っている多くのサービスで同じ手が使えるはずです。

Angelic Angel は現状 1 アカウント・1 サブスクリプションですが、複数チャネル対応や、復号後ペイロードのフィルタリング、Discord/Slack 直接投稿などをやると便利そうです。またやったら書きます。
