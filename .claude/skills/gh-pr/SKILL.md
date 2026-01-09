---
name: gh-pr
description: GitHubのPR（プルリクエスト）を管理する。PR作成、一覧表示、マージ、レビュー、チェックアウト時に使用。「PRを作りたい」「マージして」「レビューして」などのキーワードで発動。
---

# GitHub PR管理

GitHubのプルリクエストを管理するためのスキル。

## 重要な制約

**このスキルは `sh1ma/blog` リポジトリのみで使用すること。**
他のリポジトリの操作は禁止。`--repo` フラグで他リポジトリを指定してはならない。

## コマンド概要

```bash
gh pr <command> [flags]
```

## 主要コマンド

### PR一覧表示
```bash
gh pr list                    # 現在のリポジトリのPR一覧
gh pr list --state all        # すべてのPR（open/closed/merged）
gh pr list --author @me       # 自分が作成したPR
gh pr list --assignee @me     # 自分がアサインされたPR
gh pr list --label "bug"      # ラベルでフィルタ
```

### PR作成
```bash
gh pr create                          # 対話形式で作成
gh pr create --fill                   # コミット情報から自動入力
gh pr create --title "タイトル" --body "本文"
gh pr create --draft                  # ドラフトPRとして作成
gh pr create --base main              # ベースブランチを指定
gh pr create --assignee @me           # 自分をアサイン
gh pr create --label "enhancement"    # ラベル付与
gh pr create --reviewer user1,user2   # レビュアー指定
```

### PR表示・チェックアウト
```bash
gh pr view                    # 現在のブランチのPRを表示
gh pr view 123                # PR #123を表示
gh pr view --web              # ブラウザで開く
gh pr checkout 123            # PR #123をチェックアウト
gh pr diff 123                # PR #123の差分を表示
```

### PRマージ・クローズ
```bash
gh pr merge                   # 現在のブランチのPRをマージ
gh pr merge 123               # PR #123をマージ
gh pr merge --squash          # スカッシュマージ
gh pr merge --rebase          # リベースマージ
gh pr merge --delete-branch   # マージ後にブランチ削除
gh pr close 123               # PR #123をクローズ
gh pr reopen 123              # PR #123を再オープン
```

### PRレビュー
```bash
gh pr review                           # 対話形式でレビュー
gh pr review 123 --approve             # 承認
gh pr review 123 --request-changes -b "修正必要"
gh pr review 123 --comment -b "コメント"
gh pr checks 123                       # CIステータス確認
```

### PR編集
```bash
gh pr edit 123 --title "新タイトル"
gh pr edit 123 --body "新本文"
gh pr edit 123 --add-label "bug"
gh pr edit 123 --add-reviewer user1
gh pr ready 123                        # ドラフト解除
```

## 実行手順

1. ユーザーの要求を理解する
2. 適切なghコマンドを選択・実行
3. 結果を日本語で報告

## 注意事項

- PRは番号、URL、またはブランチ名で指定可能
- 認証が必要な場合は `gh auth login` を案内
- **他リポジトリへの操作は絶対に行わない**
