---
name: gh-workflow
description: GitHub Actionsのワークフローを管理する。ワークフロー実行、一覧表示、ログ確認、再実行時に使用。「CI確認」「デプロイ実行」「ワークフロー」「Actions」などのキーワードで発動。
---

# GitHub Workflow管理

GitHub Actionsのワークフローを管理するためのスキル。

## 重要な制約

**このスキルは `sh1ma/blog` リポジトリのみで使用すること。**
他のリポジトリの操作は禁止。`--repo` フラグで他リポジトリを指定してはならない。

## コマンド概要

```bash
gh workflow <command> [flags]
gh run <command> [flags]
```

## ワークフロー管理

### ワークフロー一覧
```bash
gh workflow list                  # ワークフロー一覧
gh workflow list --all            # 無効化されたものも含む
```

### ワークフロー表示
```bash
gh workflow view                  # 対話形式で選択して表示
gh workflow view deploy.yml       # 特定のワークフローを表示
gh workflow view deploy.yml --web # ブラウザで開く
```

### ワークフロー有効化・無効化
```bash
gh workflow enable deploy.yml     # ワークフローを有効化
gh workflow disable deploy.yml    # ワークフローを無効化
```

### ワークフロー実行（workflow_dispatch）
```bash
gh workflow run deploy.yml                    # ワークフロー実行
gh workflow run deploy.yml --ref main         # ブランチ指定
gh workflow run deploy.yml -f key=value       # 入力パラメータ指定
gh workflow run deploy.yml -F key=@file.txt   # ファイルから入力
```

## 実行履歴（Run）管理

### 実行一覧
```bash
gh run list                       # 最近の実行一覧
gh run list --limit 20            # 件数指定
gh run list --workflow deploy.yml # ワークフロー絞り込み
gh run list --status failure      # ステータスで絞り込み
gh run list --branch main         # ブランチで絞り込み
gh run list --user @me            # 自分がトリガーした実行
```

### 実行詳細表示
```bash
gh run view                       # 対話形式で選択
gh run view 123456789             # 実行ID指定
gh run view 123456789 --web       # ブラウザで開く
gh run view 123456789 --log       # ログ表示
gh run view 123456789 --log-failed # 失敗したジョブのログのみ
```

### 実行ウォッチ
```bash
gh run watch                      # 対話形式で選択して監視
gh run watch 123456789            # 特定の実行を監視
gh run watch 123456789 --exit-status # 終了時にステータスコード返却
```

### 実行キャンセル
```bash
gh run cancel 123456789           # 実行をキャンセル
```

### 実行再実行
```bash
gh run rerun 123456789            # 実行を再実行
gh run rerun 123456789 --failed   # 失敗したジョブのみ再実行
gh run rerun 123456789 --debug    # デバッグログ有効で再実行
```

### 成果物ダウンロード
```bash
gh run download 123456789         # すべての成果物をダウンロード
gh run download 123456789 -n artifact-name  # 特定の成果物のみ
gh run download 123456789 -D ./output       # 出力先指定
```

### ステータス値
- `queued` - キュー待ち
- `in_progress` - 実行中
- `completed` - 完了
- `success` - 成功
- `failure` - 失敗
- `cancelled` - キャンセル

## 実行手順

1. ユーザーの要求を理解する
2. 適切なghコマンドを選択・実行
3. 結果を日本語で報告

## 注意事項

- ワークフローはファイル名またはIDで指定可能
- 実行（run）はIDで指定
- `workflow_dispatch` トリガーがないワークフローは `gh workflow run` できない
- 認証が必要な場合は `gh auth login` を案内
- **他リポジトリへの操作は絶対に行わない**
