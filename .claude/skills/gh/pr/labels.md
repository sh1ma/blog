# PR ラベル

`sh1ma/blog` の PR には **1 つ以上のラベル必須** (CI でチェックされる)。変更内容に該当するものを 1 つ以上選ぶ。

## 使えるラベルの調べ方

ラベルはリポジトリ側で随時追加・削除されるので、ここには一覧を書かない。実行時に取得する。

```bash
gh label list                           # 名前・説明・色を表示
gh label list --json name,description   # 機械可読
```

description に用途 (日本語) が書かれているので、変更内容に合うものを選ぶ。

## 付け方

`gh pr create --label <name>` で指定。複数付ける場合は `--label` を複数回渡す。詳細は `gh pr create --help`。
