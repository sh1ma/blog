---
name: gh-pr
description: GitHubのPRを作成・管理する。「PR作成」「マージ」「レビュー確認」「CIチェック」「レビューコメント確認」「PR一覧」などのキーワードで発動。
---

# GitHub PR管理

## 重要な制約

**`sh1ma/blog` リポジトリのみ対象。** `--repo` フラグで他リポジトリを指定してはならない。

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
| `test`          | テスト関連                   |

## スクリプト

### PR作成

```bash
.claude/skills/gh-pr/scripts/create-pr.sh --title <title> --label <label> [--label ...] --body <body>
```

- ラベルバリデーション付き（上記ラベルのみ許可）
- `--assignee sh1ma` 自動付与
- **bodyは `.github/pull_request_template.md` に沿って構成すること**（概要・変更内容・関連Issue・テスト項目・VRT設定・スクリーンショット・備考）

### レビューコメント取得

```bash
.claude/skills/gh-pr/scripts/fetch-review-comments.sh <pr_number>
```

インラインレビューコメントとレビュー状態を整形表示。

### CIチェック確認

```bash
.claude/skills/gh-pr/scripts/check-pr-status.sh [<pr_number>]
```

省略時は現在のブランチのPR。

## Visual Regression Test (VRT)

PRを作成すると自動でVRTが実行される。

- R2からベースライン取得 → スクリーンショット撮影 → 差分検出 → PRにコメント通知
- **UIに意図的な変更がある場合**: PRテンプレートの「VRT設定」で「スナップショットを更新する」にチェック
- **意図しない差分**: コードを修正してVRT再実行
- VRT関連のPRには `test` ラベルも推奨

## 実行手順

1. PR作成時は `create-pr.sh` を使用し、テンプレートに沿ったbodyを渡す
2. レビューコメント確認は `fetch-review-comments.sh` を使用
3. CIチェック確認は `check-pr-status.sh` を使用
4. 一覧・マージ・編集などは `gh pr` コマンドを直接使用
5. 結果を日本語で報告
