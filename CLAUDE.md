# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要

常に日本語で説明してください。

## コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# Cloudflare Pages プレビュー
pnpm preview

# Cloudflare Pages デプロイ
pnpm deploy

# Lint
pnpm lint

# フォーマット
pnpm format
pnpm format:check

# コンテンツ（Markdown）のビルド
pnpm build:content

# Cloudflare 環境変数の型生成
pnpm cf-typegen
```

## アーキテクチャ

Next.js 15 (App Router) + Contentlayer2 + Cloudflare Workers (OpenNext) のブログ。

### 主要な構成

- **コンテンツ管理**: `src/markdown/` にMarkdownファイルを配置。Contentlayer2で処理され、`contentlayer/generated` から型付きでインポート可能
- **記事の定義**: `contentlayer.config.ts` でArticle/Aboutの2種類のドキュメントタイプを定義
- **APIルート**: `src/app/api/[[...route]]/` でHonoを使用したAPIを提供
- **データベース**: Cloudflare D1を使用（いいね機能など）。`src/db.ts` でServer Actionsとして実装
- **ストレージ**: Cloudflare R2をCDNとキャッシュ用に使用

### Cloudflare統合

`@opennextjs/cloudflare` を使用してNext.jsをCloudflare Workers上で動作させている。環境変数やD1/R2へのアクセスは `getCloudflareContext()` 経由で取得する。
