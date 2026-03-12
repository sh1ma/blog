---
name: gh-issue
description: GitHubのIssueを作成・管理する。「Issue作成」「バグ報告」「タスク登録」「Issue一覧」「Issueクローズ」などのキーワードで発動。
---

# GitHub Issue管理

## 重要な制約

**`sh1ma/blog` リポジトリのみ対象。** `--repo` フラグで他リポジトリを指定してはならない。

## 利用可能なラベル

| ラベル          | 用途                         |
| --------------- | ---------------------------- |
| `feature`       | 機能開発関連                 |
| `bug`           | バグ関連                     |
| `refactoring`   | リファクタ関連               |
| `documentation` | ドキュメンテーション関連     |
| `chore`         | 設定ファイルなどの雑多な変更 |
| `AI`            | AI関連                       |
| `test`          | テスト関連                   |

## Issue作成

**テンプレート**: `.github/ISSUE_TEMPLATE/default.md` のセクション（やること・目的・方針・タスク）に沿ってbodyを構成すること。

```bash
.claude/skills/gh-issue/scripts/create-issue.sh --title <title> --label <label> [--label ...] --body <body>
```

- ラベルバリデーション付き（上記ラベルのみ許可）
- `--assignee sh1ma` 自動付与

## 実行手順

1. Issue作成時はスクリプトを使用し、テンプレートに沿ったbodyを渡す
2. 一覧・表示・編集・クローズなどは `gh issue` コマンドを直接使用
3. 結果を日本語で報告
