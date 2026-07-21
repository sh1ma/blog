---
title: "mise + age で環境変数を暗号化する"
publishedAt: "2026-07-06"
description: "mise が experimental で持っている age 暗号化機能で環境変数を扱ってみた話。実運用では x25519 の鍵ファイルより SSH 公開鍵を recipient にしたほうが楽。"
tags: ["mise", "age", "セキュリティ"]
---

こんにちは。前回の[記事](https://blog.sh1ma.dev/20260705_k3s_on_cloudflare_workers.md)はAIでベタ書きしていたんですがこの記事は丹精込めて自分自身で書こうと思います。

今回は普段 `mise` を愛用している筆者が、標準でサポートされている `age` による環境変数の暗号化を試してみました。  
この記事ではセットアップ方法からはじめ、そのあと使用上の注意点とプラクティスを紹介します。  
最新のセットアップ方法は[公式Docs](https://mise.jdx.dev/environments/secrets/age.html)に書いてあるので、そちらも併せて読むと良いと思います。

https://x.com/sh1ma/status/2073800662387950078?s=20

## TL;DR

- 筆者が `mise.toml` や `.env` に環境変数を平文で書くのをやめ、 `mise` 標準サポートの `age` による暗号化をセットアップした。
- `age` 以外の依存は必要なく、 `mise` の使い心地を維持したまま環境変数をセキュアに管理できるようになった
- **公式docsのセットアップ手順に書かれている `age-keygen -o ~/.config/mise/age.txt` は実行すべきでない。**
- →代わりにSSH鍵による暗号化を使うべき。

## なぜ環境変数を暗号化すべきか

**手短に結論: 平文だと盗まれる可能性があるから**

マルウェアやスパイウェアが跋扈している今日、プロジェクト内の `.env` などのファイルに平文で認証情報やシークレットをおいているとマシンが侵害されたときに攻撃者に機密情報を盗まれる危険性があります。
`npm install` などでパッケージをインストールするだけで機密情報が詐取されるケースもあり、すべての開発者にとって決して他人事ではありません。

直近でも以下のようなケースがありました。

- [2026年4月 - 偽のtanstackパッケージがnpmに公開され、`postinstall` 時に `.env` ファイルを送っていた事例](https://socket.dev/blog/tanstack-brandsquat-compromise)
- [2026年5月 - node-ipc@9.1.6, 9.2.3, 12.0.1に機密情報を外部に送信するバックドアが入っていた事例](https://securitylabs.datadoghq.com/articles/node-ipc-npm-malware-analysis/)

もちろん機密ファイルは盗まれないことが理想であり、日本のセキュリティ企業である[GMO Flatt Security](https://flatt.tech/)の提供する[Takumi Guard](https://flatt.tech/takumi/features/guard)を使ってある程度予防することもできます。しかし、このようなリスクは100%防ぐことができるものではありません。  
そのため機密データの暗号化で「盗まれてしまったとしても読ませない」対策は個人・組織問わず必要になってきます。

## 暗号化ツールの選定

先に述べた背景がありながら、筆者はこれまで一向に暗号化による対策を行ってきませんでした。  
単にツール選定が面倒だというのもありましたが、何より既に運用している `mise` による環境変数の設定の体験を損ないたくないと考えていました。

[dotenvx](https://dotenvx.com/)や[gpgによる暗号化](https://techblog.ap-com.co.jp/entry/2023/10/23/173344)も考えましたが、最終的に小難しいことを考えることなく、かつ追加のツールをインストールせずに済む `mise` + `age` 運用を採用しました

### 補足: miseによる環境変数設定

`mise` については[過去記事 - asdf, direnvをやめてmiseに移行する](https://blog.sh1ma.dev/articles/20240108_from_asdf_to_mise)を参照していただければと思いますが、プロジェクト内に `mise.toml` というファイルを配置しそこに環境変数を記述さえすれば、そのディレクトリ内で環境変数がロードされるといった代物です。

```toml title="mise.toml"
[env]
DB_HOST = "localhost:3306"
DB_PASSWORD = "abcde1234"
# .envファイルをロードすることもできる
_.file = ".env"
```

## 使ってみる

`mise` がすでに入っていることを前提に説明します。
2ステップあります。

### 1. Experimental（実験版）の機能の有効化

現状 `age` による暗号化はExperimentalです。そのため以下のコマンドで有効化する必要があります。

```bash
mise settings set experimental=true
```

### 2. `MISE_AGE_SSH_IDENTITY_FILES` にSSH鍵を指定する

[公式DocsのQuick Start](https://mise.jdx.dev/environments/secrets/age.html#quick-start)ではこのステップ（Optional）で鍵ペアの作成を行っていますが、**これはやらないでください。**
理由は安全上の懸念があるためです。詳細は後述します。

鍵の生成を行う代わりにSSH鍵を使用します。SSH鍵には必ずパスフレーズをつけてください。パスフレーズをつけなければ公式Docsのステップ2と安全上のリスクは同等のものになります。

どうやら公開鍵または秘密鍵のどちらを登録しても良いみたいですが、配列で渡す必要があります。

```bash title="~/.zshrc"
export MISE_AGE_SSH_IDENTITY_FILES=($HOME/.ssh/id_ed25519) # $HOME/.ssh/id_ed25519.pub でも可能らしい(未検証)
```

### 試してみる

上記を行うとSSH鍵を使った暗号化・復号ができるようになります。

任意のディレクトリで以下を実行し、値を入力して保存してください（入力値は表示されません）。

```bash title="暗号化された環境変数を保存するコマンド"
mise set --age-encrypt --prompt DB_PASSWORD
```

環境変数は暗号化された状態でディレクトリ内の `mise.toml` に格納されます。
以下のように:

```toml title="mise.toml"
[env]
DB_PASSWORD = { age = "Encrypted_Value_AAAAAAAAAAAAAA1234567890" }
```

ディレクトリ内で以下を実行すると環境変数の実値が読み込まれていることがわかります。

```bash
echo $DB_PASSWORD # → e.g. password1234
```

上記で登録した値が表示されていればセットアップは正しくできています。

## 安全のためのプラクティス

### 公式Docsの通りに `age-keygen` によって生成した鍵を使用せず、代わりにPassphraseのついたSSH鍵を使用する

**TL;DR: age-keygenで作った秘密鍵を盗めばmise.tomlの暗号化は意味がなくなるから**

`age-keygen` は鍵ペア（復号のための秘密鍵と暗号化のための公開鍵）を作成するコマンドですが、Passphraseを付与する機能はありません。そのため、公式Docsの通りに `age-keygen` を使用すると生の秘密鍵が `~/.config/mise/age.txt` に保存されます。

せっかくプロジェクト内の `mise.toml` の値は暗号化しているのに、攻撃者が `~/.config/mise/age.txt` を盗むことで復号できるのであればほぼ意味がありません。そのため、どのディレクトリだろうと秘密鍵を生でおいておくべきではありません。

また、同様に使用するSSH鍵にPassphraseを付けなければこれも意味がありません。攻撃者はSSHの秘密鍵を盗めば `age` 同様にすぐ復号できてしまうからです。

SSH鍵にPassphraseを設定しておけば、仮に攻撃者に秘密鍵が盗まれたとしてもPassphraseが破られない限り鍵を使用することができず、 `mise.toml` に記述した内容を復号されるのを防ぐことができます。

#### 補足: `age` と組み合わせるとPassphrase登録が可能ではある

[一応 `age` 自体にはPassphraseによる暗号化もある様](https://github.com/filosottile/age#passphrase-protected-key-files)ですが、後述するOSのSecret Storeとの連携はできないのでどちらにしてもSSH鍵を使うのが良いでしょう。

https://x.com/sh1ma/status/2073952805287825555

#### 2026-07-21追記: 署名用SSH鍵を暗号化に流用することへの注意

[@haruyama氏のポスト①](https://x.com/haruyama/status/2074296776295887031)、[②](https://x.com/haruyama/status/2074448338519568753)にてご指摘いただいた観点を追記しておきます。

本記事では「SSH 鍵を `age` の recipient として流用する」構成を紹介していますが、そもそも「署名用の鍵を暗号化にも使ってよいのか」という論点があります。

- `age` 作者の Filippo Valsorda 氏自身も、[FiloSottile/age#540](https://github.com/FiloSottile/age/discussions/540) にて「署名鍵と暗号鍵の流用は確かに安全ではなく分析が必要 (Key reuse across signatures and encryption is indeed not safe and requires analysis)」と認めており、`age` を設計した際に分析は行ったとしつつも、その分析ノートは公開できていない状態であることを述べています。参照している論文についても「HKDF の使い方が異なるため 1:1 では適用できない」と留保しており、**公式に「安全」と言い切れる根拠が示されているわけではありません**。
- 同 Discussion 内で他の参加者 (cipriancraciun 氏) は、RSA-OAEP パディングやドメイン分離ラベル (`age-encryption.org/v1/ssh-rsa`) によって他プロトコルとの相互作用は防がれているとコメントしていますが、これはあくまで一参加者による説明です。
- Filippo 氏自身の記事 [Using Ed25519 signing keys for encryption](https://words.filippo.io/using-ed25519-keys-for-encryption/) では、Ed25519 の鍵から X25519 の鍵への変換が数学的に可能であることが解説されていますが、これは「再利用が実装可能である」ことを示すものであって、実運用での安全性を保証するものではありません。

現時点で具体的な攻撃が知られているわけではありませんが、上記の通り「安全である」という明示的な保証があるわけでもありません。鍵の用途分離を厳密にしたい場合は `age` 専用の鍵ペア (可能なら Passphrase 付き) を別途用意する選択肢も検討する価値があります。

### Passphrase付きSSH鍵を使用するときはKeyChainなどのSecret Storeにパスフレーズを登録する

SSH鍵を使用して復号しようとするたびにPassphraseを入力しなければならないのは非常に手間です。  
PassphraseをKeyChainなどのSecret Storeに保存しておくことで、安全にPassphraseを保管しつつ入力を省略することができます。

MacOSの場合以下のコマンドでKeyChainにパスワードを保存できます:

```bash
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_ed25519 # または別の秘密鍵を指定
```


## まとめ

一通り `mise` + `age` を用いた環境変数の暗号化について書きました。  
セットアップはともかくとしてSSH鍵を使うべきということだけ伝わればいいナー！

