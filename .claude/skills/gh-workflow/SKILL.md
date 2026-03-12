---
name: gh-workflow
description: GitHub Actionsのワークフローを実行・確認する。「CI確認」「VRT実行」「デプロイ」「ワークフロー」「Actions」「lint実行」「E2E」などのキーワードで発動。
---

# GitHub Workflow管理

## 重要な制約

**`sh1ma/blog` リポジトリのみ対象。** `--repo` フラグで他リポジトリを指定してはならない。

## 利用可能なワークフロー

| 短縮名               | ファイル                        | トリガー            |
| -------------------- | ------------------------------- | ------------------- |
| `vrt`                | `vrt.yaml`                      | PR / dispatch       |
| `vrt-update-baseline`| `vrt-update-baseline.yaml`      | dispatch            |
| `lint`               | `lint.yaml`                     | PR / push           |
| `e2e`                | `e2e.yaml`                      | PR / dispatch       |
| `preview-deploy`     | `preview-deploy.yaml`           | PR                  |
| `staging-deploy`     | `staging-deploy.yaml`           | push to main        |
| `production-deploy`  | `production-deploy.yaml`        | dispatch / workflow  |
| `register-articles`  | `register-articles-to-d1.yaml`  | push to main        |
| `create-production-pr`| `create-production-pr.yaml`    | dispatch            |

## スクリプト

### ワークフロー実行

```bash
.claude/skills/gh-workflow/scripts/run-workflow.sh <workflow_name> [--ref <branch>] [--update-snapshots] [--pr <n>]
```

- `--update-snapshots`: `vrt` 専用。スナップショット更新モード
- `--pr <n>`: `vrt-update-baseline` 専用。対象PR番号

### ステータス確認

```bash
.claude/skills/gh-workflow/scripts/check-workflow-status.sh [<workflow_name>] [--limit <n>]
```

## 実行手順

1. ユーザーの要求に応じて適切なスクリプトまたは `gh` コマンドを実行
2. ログ確認は `gh run view <id> --log-failed` を使用
3. 再実行は `gh run rerun <id> [--failed]` を使用
4. 結果を日本語で報告
