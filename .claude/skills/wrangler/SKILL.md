---
name: wrangler
description: Cloudflare Workersのwranglerコマンドを管理する。D1データベース、R2ストレージ、シークレット、Workers開発・デプロイ時に使用。「D1」「R2」「デプロイ」「wrangler」「Cloudflare」などのキーワードで発動。
---

# Wrangler CLI管理

Cloudflare Workers開発のためのwranglerコマンドを管理するスキル。

## 重要な制約

**このスキルは `sh1ma/blog` リポジトリのみで使用すること。**
他のプロジェクトへの操作は禁止。

## Workers開発・デプロイ

### 開発サーバー起動

```bash
wrangler dev                      # ローカル開発サーバー起動
wrangler dev --remote             # リモートリソースに接続して開発
wrangler dev --local              # 完全ローカルモード
wrangler dev --port 8787          # ポート指定
```

### デプロイ

```bash
wrangler deploy                   # Workerをデプロイ
wrangler deploy --dry-run         # ドライラン（実際にはデプロイしない）
wrangler deploy --env production  # 環境指定
```

### ログ監視

```bash
wrangler tail                     # リアルタイムログ監視
wrangler tail --format pretty     # 整形表示
wrangler tail --status error      # エラーのみフィルタ
wrangler tail --search "keyword"  # キーワードフィルタ
```

### バージョン管理

```bash
wrangler deployments list         # デプロイ履歴一覧
wrangler rollback                 # 前バージョンにロールバック
wrangler rollback <version-id>    # 特定バージョンにロールバック
```

## D1データベース

### データベース操作

```bash
wrangler d1 list                  # D1データベース一覧
wrangler d1 info <name>           # データベース情報
wrangler d1 create <name>         # データベース作成
wrangler d1 delete <name>         # データベース削除
```

### SQLクエリ実行

```bash
wrangler d1 execute <db> --command "SELECT * FROM users"     # SQL実行
wrangler d1 execute <db> --file schema.sql                   # SQLファイル実行
wrangler d1 execute <db> --command "..." --local             # ローカルDB対象
wrangler d1 execute <db> --command "..." --remote            # リモートDB対象
wrangler d1 execute <db> --command "..." --json              # JSON出力
```

### マイグレーション

```bash
wrangler d1 migrations list <db>              # マイグレーション一覧
wrangler d1 migrations create <db> <message>  # マイグレーション作成
wrangler d1 migrations apply <db>             # マイグレーション適用
wrangler d1 migrations apply <db> --local     # ローカルに適用
wrangler d1 migrations apply <db> --remote    # リモートに適用
```

### エクスポート・タイムトラベル

```bash
wrangler d1 export <db> --output backup.sql   # データエクスポート
wrangler d1 time-travel restore <db>          # ポイントインタイムリストア
```

## R2ストレージ

### バケット管理

```bash
wrangler r2 bucket list                       # バケット一覧
wrangler r2 bucket create <name>              # バケット作成
wrangler r2 bucket info <bucket>              # バケット情報
wrangler r2 bucket delete <bucket>            # バケット削除
```

### オブジェクト操作

```bash
wrangler r2 object get <bucket>/<key>         # オブジェクト取得
wrangler r2 object put <bucket>/<key>         # オブジェクトアップロード
wrangler r2 object delete <bucket>/<key>      # オブジェクト削除
```

### バケット設定

```bash
wrangler r2 bucket lifecycle list <bucket>    # ライフサイクルルール一覧
wrangler r2 bucket cors list <bucket>         # CORS設定一覧
wrangler r2 bucket notification list <bucket> # 通知設定一覧
```

## シークレット管理

```bash
wrangler secret list                          # シークレット一覧
wrangler secret put <key>                     # シークレット設定（対話式）
wrangler secret delete <key>                  # シークレット削除
wrangler secret bulk secrets.json             # 一括設定（JSONファイル）
```

### シークレットJSON形式

```json
{
  "API_KEY": "your-api-key",
  "DATABASE_URL": "your-database-url"
}
```

## 認証・アカウント

```bash
wrangler login                    # Cloudflareにログイン
wrangler logout                   # ログアウト
wrangler whoami                   # 認証状態確認
```

## 型生成

```bash
wrangler types                    # TypeScript型定義を生成
```

## 実行手順

1. ユーザーの要求を理解する
2. 適切なwranglerコマンドを選択・実行
3. 結果を日本語で報告

## 注意事項

- `--local` はローカル開発用、`--remote` は本番環境用
- D1マイグレーションは `migrations/` ディレクトリに配置
- シークレットは `wrangler secret put` で対話的に設定（コマンドラインに値を含めない）
- **他プロジェクトへの操作は絶対に行わない**
