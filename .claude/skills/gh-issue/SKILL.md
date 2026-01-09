---
name: gh-issue
description: GitHubのIssueを管理する。Issue作成、一覧表示、クローズ、コメント時に使用。「Issueを作りたい」「バグ報告」「タスク登録」などのキーワードで発動。
---

# GitHub Issue管理

GitHubのIssueを管理するためのスキル。

## 重要な制約

**このスキルは `sh1ma/blog` リポジトリのみで使用すること。**
他のリポジトリの操作は禁止。`--repo` フラグで他リポジトリを指定してはならない。

## コマンド概要

```bash
gh issue <command> [flags]
```

## 主要コマンド

### Issue一覧表示
```bash
gh issue list                     # オープンなIssue一覧
gh issue list --state all         # すべてのIssue
gh issue list --state closed      # クローズ済みIssue
gh issue list --author @me        # 自分が作成したIssue
gh issue list --assignee @me      # 自分にアサインされたIssue
gh issue list --label "bug"       # ラベルでフィルタ
gh issue list --milestone "v1.0"  # マイルストーンでフィルタ
```

### Issue作成
```bash
gh issue create                           # 対話形式で作成
gh issue create --title "タイトル" --body "本文"
gh issue create --label "bug"             # ラベル付与
gh issue create --label "bug,help wanted" # 複数ラベル
gh issue create --assignee @me            # 自分にアサイン
gh issue create --milestone "v1.0"        # マイルストーン設定
gh issue create --project "Roadmap"       # プロジェクト追加
gh issue create --template "Bug Report"   # テンプレート使用
gh issue create --web                     # ブラウザで作成
```

### Issue表示
```bash
gh issue view 123                 # Issue #123を表示
gh issue view 123 --web           # ブラウザで開く
gh issue view 123 --comments      # コメントも表示
gh issue status                   # 関連Issueの状態一覧
```

### Issueクローズ・再オープン
```bash
gh issue close 123                # Issue #123をクローズ
gh issue close 123 -c "理由"      # コメント付きでクローズ
gh issue reopen 123               # Issue #123を再オープン
gh issue delete 123               # Issue #123を削除（要確認）
```

### Issue編集
```bash
gh issue edit 123 --title "新タイトル"
gh issue edit 123 --body "新本文"
gh issue edit 123 --add-label "enhancement"
gh issue edit 123 --remove-label "bug"
gh issue edit 123 --add-assignee user1
gh issue edit 123 --milestone "v2.0"
```

### Issueコメント
```bash
gh issue comment 123 -b "コメント内容"
gh issue comment 123 --edit-last -b "編集後"
gh issue comment 123 --web        # ブラウザでコメント
```

### Issueピン留め
```bash
gh issue pin 123                  # Issue #123をピン留め
gh issue unpin 123                # ピン留め解除
```

### Issueロック
```bash
gh issue lock 123                 # Issue #123をロック
gh issue unlock 123               # ロック解除
```

### Issue開発ブランチ
```bash
gh issue develop 123              # Issue用ブランチ作成
gh issue develop 123 --list       # 関連ブランチ一覧
```

## 実行手順

1. ユーザーの要求を理解する
2. 適切なghコマンドを選択・実行
3. 結果を日本語で報告

## 注意事項

- Issueは番号またはURLで指定可能
- 認証が必要な場合は `gh auth login` を案内
- プロジェクト追加には `gh auth refresh -s project` が必要な場合あり
- **他リポジトリへの操作は絶対に行わない**
