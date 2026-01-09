---
name: gh-pr
description: GitHubのPR（プルリクエスト）を管理する。PR作成、一覧表示、マージ、レビュー、チェックアウト時に使用。「PRを作りたい」「マージして」「レビューして」などのキーワードで発動。
---

# GitHub PR管理

GitHubのプルリクエストを管理するためのスキル。

## 重要な制約

**このスキルは `sh1ma/blog` リポジトリのみで使用すること。**
他のリポジトリの操作は禁止。`--repo` フラグで他リポジトリを指定してはならない。

## 利用可能なラベル

PRには必ず以下のいずれかのラベルを付けること:

| ラベル          | 用途                         |
| --------------- | ---------------------------- |
| `feature`       | 機能開発関連                 |
| `bug`           | バグ関連                     |
| `refactoring`   | リファクタ関連               |
| `documentation` | ドキュメンテーション関連     |
| `chore`         | 設定ファイルなどの雑多な変更 |
| `AI`            | AI関連                       |

## PR作成手順（推奨フロー）

### 1. 変更内容の確認

```bash
# mainからの差分コミットを確認
git log main..HEAD --oneline

# 変更ファイルを確認
git diff main..HEAD --stat
```

### 2. 適切なラベルを選択

変更内容に基づいて、上記のラベルから1つ以上選択する。

### 3. PRを作成

```bash
gh pr create \
  --title "タイトル" \
  --label "ラベル" \
  --body "$(cat <<'EOF'
## 概要

<!-- このPRで何を変更したか簡潔に説明 -->

## 変更内容

- 変更点1
- 変更点2

## 関連Issue

<!-- closes #123 -->

## テスト項目

- [ ] テスト項目1
- [ ] テスト項目2
EOF
)"
```

### 複数ラベルを付ける場合

```bash
gh pr create --title "タイトル" --label "feature" --label "AI" --body "..."
```

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
2. PR作成の場合、変更内容を確認してラベルを決定する
3. **ラベルを必ず付けてPRを作成する**
4. 結果を日本語で報告

## 注意事項

- PRは番号、URL、またはブランチ名で指定可能
- 認証が必要な場合は `gh auth login` を案内
- **他リポジトリへの操作は絶対に行わない**
- **PR作成時はラベルを必ず付けること（CIでチェックされる）**
