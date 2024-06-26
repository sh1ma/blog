---
  title: "iTerm2でOption+矢印キーを使って単語移動を出来るようにする"
  publishedAt: "2024-01-28"
---

私は長年iTerm2を使っているのにまともに単語移動を設定してきませんでした。  
流石に`Option + <arrow key>`で単語移動したかったので今回は矢印キーとOptionを組み合わせて単語移動を出来るようにしました。

## 設定方法

「グローバルキーマップ」を変更するかiTerm2のプロファイルごとに設定するかの2通りがあります。  
自分はグローバルキーマップは変えず、iTerm2のデフォルトプロファイルのみ変更する方法でやりました。  
以下で説明するのはデフォルトプロファイルのみ変更する方法です。

### 1. iTerm2の設定からKeysタブにいき、 Key Mappingsを開きます。

![iTerm2のKey Mappingsタブを開いたときの画面のスクリーンショット](https://cdn.sh1ma.dev/20240128-1.png)

こんな感じの画面。

### 2, 画面下部の「+」ボタンを押して、新しいキーマッピングを追加します。

![Key MappingsタブからOption + →にショートカットを割り当てているときのスクリーンショット](https://cdn.sh1ma.dev/20240128-2.png)

「Keyboard Shortcut」のフィールドをクリックするとショートカットキーの入力待ちになるので、`Option + →`を入力します。

Actionには「Send Escape Sequence」を選択し、`f`を入力します。  
これは、`Option + →`を押したときに`Esc + f`を送信するという意味です。(iTerm2ではデフォルトで`Esc + f`が単語移動のショートカットになっています。)

同様の手順で、`Option + ←`を`Esc + b`に設定します。

設定を保存したら完了です。
