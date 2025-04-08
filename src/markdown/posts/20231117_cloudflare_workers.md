---
  title: "Cloudflare WorkersでWASIが使えるらしいので試した"
  publishedAt: "2023-11-17"
---

[Cloudflare WorkersでWASIが使えるらしいという記事](https://blog.cloudflare.com/announcing-wasi-on-workers/)
を見てすごいと思ったので試してみた。

## 環境

- rustc 1.73.0
- Cloudflare Workers
- npm
  - `npx wrangler@wasm`を実行するのに必要です
- wasmtime

## 本題

### 前準備

ビルドターゲットに`wasm32-wasi`を使うので、`wasm32-wasi`をインストールします。

```bash
rustup target add wasm32-wasi
```

まず`cargo new`でプロジェクトつくります

```bash
cargo new hello_world
```

一度実行してみます

```bash
cargo run
```

当然ですが以下の出力になります

```
Hello, world!
```

これをwasmにビルドします

```bash
cargo build --target wasm32-wasi --release
```

`target/wasm32-wasi/release`に`hello_world.wasm`ファイルができます。

試しに手元でwasmが動くか確認したいのでwasmランタイムの[wasmtime](https://wasmtime.dev/)を使ってみます。

まずはwasmtimeのインストール

```bash
curl https://wasmtime.dev/install.sh -sSf | bash
```

次にwasmを実行してみます。

```bash
wasmtime target/wasm32-wasi/release/hello_world.wasm
```

これも`Hello, world!`と出力されます。ここまでで下準備は完了です。

### Cloudflare Workersで動かす

```bash
npx wrangler@wasm dev target/wasm32-wasi/release/hello_world.wasm
```

```
 ⛅️ wrangler 0.0.0-c0d7699
---------------------------
⬣ Listening at http://localhost:8787
```

こんな感じでサーバーが立ち上がるのでブラウザなどでアクセスすると`Hello, World!`が出力されるのがわかると思います。
どうやらHTTPリクエストをトリガーにmain関数が叩かれているようです。

POSTリクエストを使えば標準入力を渡せるっぽいのでやってみます。

まずは標準入力を受け取るようなコードに書き換えます

```rust
fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    println!("Hello, world! {}", input);
}
```

これを再度ビルドして、wranlgerで実行します。

```bash
cargo build --target wasm32-wasi --release
npx wrangler@wasm dev target/wasm32-wasi/release/hello_world.wasm
```

curlでPOSTリクエストを送ってみます。

```bash
curl -X POST -d sh1ma https://localhost:8787
```

レスポンスは`Hello, World! sh1ma`となりました。

## まとめ

こんな感じでただのrustプログラムをCloudflare Workersで動かすことができました。

ただ現状WASIからCloudflare d1のAPIなどを叩くことはできない？らしい(人に聞いた)です。

これを使って画像からexifを削除した結果を返すFunctionを作ってみようと思ってるので出来たらgithubにコードあげると思います。
