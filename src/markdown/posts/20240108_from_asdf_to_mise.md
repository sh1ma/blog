---
  title: "asdf, direnvをやめてmiseに移行する"
  publishedAt: "2024-01-08"
---

これまで[asdf](https://asdf-vm.com/)でpythonやnodejsのランタイムのバージョン管理、
direnvを使ってディレクトリごとの環境変数管理をしていましたが、
最近になって[mise](https://mise.jdx.dev/)といういい感じそうなバージョン管理ツールを見つけたのでインストールしてみようと思います。

## asdf・direnvのアンインストール

自分はhomebrewでインストールしていたので、`brew uninstall`でアンインストールしました。

```bash
brew uninstall asdf direnv
brew autoremove
```

## miseのインストール

[miseのGetting Started](https://mise.jdx.dev/getting-started.html)そのままの手順でいけそうです。

オプショナルな設定など、詳細は公式のほうが詳しいです。

```bash
curl https://mise.jdx.dev/install.sh | sh
```

.zshrcにパスを追加します

```sh
eval "$(~/.local/bin/mise activate zsh)"
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

ターミナルを再起動すると`mise`コマンドが使えるようになっています。動作確認します。

```bash
mise -V
```

出力:

```
2024.1.12 macos-arm64 (3750934 2024-01-07)
```

いい感じですね。

## miseを使う

早速使ってみます。

miseには以下の2種類の機能があります。

- ランタイムのバージョン管理
- ディレクトリごとの環境変数管理

どちらも便利そうなので試してみます。

### ランタイムのバージョン管理

まずはnodejsの20系をインストールします。

```bash
mise use --global node@20
node -v
```

出力:

```
v20.10.0
```

うーんいい感じ。メジャーバージョンだけ指定すれば勝手にインストールしてくれるのは嬉しい。  
ちなみに`.tool-versions`のあるディレクトリで`mise use`を実行すると、指定されたバージョンがない場合は自動でインストールしてくれました。

## ディレクトリごとの環境変数管理

次にディレクトリごとの環境変数管理を試してみます。  
direnvとは違い、`.envrc`ではなく`.mise.toml`というファイルを作るようです。(.envrcを使う方法・設定もありますが割愛します)

適当なディレクトリに入り、`.mise.toml`を作成します。

```toml
[env]
HELLO = "WORLD"
```

有効化するには、`direnv`の`direnv allow`と同様に`mise trust`を実行する必要があるようです。

```bash
mise trust
```

出力:

```
mise trusted /Users/sh1ma/tmp/.mise.toml
```

`mise env`で環境変数を表示できます。

```bash
mise env | grep HELLO
```

出力:

```
export HELLO=WORLD
```

```bash
echo $HELLO
```

出力:

```
WORLD
```

良さそうですね。

## まとめ

asdfとdirenvに不満は感じていなかったのですが、2つのツールを使っていたところを1つにまとめられてスッキリした気がします。  
あ、ホームディレクトリの`.gitignore`に`.mise.toml`の追加を忘れないようにしなきゃ。
