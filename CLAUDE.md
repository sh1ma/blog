# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要

常に日本語で説明してください。

## 作業開始前のルール

**コード変更を伴う作業を開始する前に、必ず `/git-worktree` スキルを使用してworktreeとブランチを作成すること。**

### ブランチ命名規則

Conventional Commitに準じた形式:

```
<type>/<short-description>
```

| type       | 用途                         |
| ---------- | ---------------------------- |
| `feat`     | 新機能追加                   |
| `fix`      | バグ修正                     |
| `refactor` | リファクタリング             |
| `docs`     | ドキュメント変更             |
| `chore`    | ビルド・設定・依存関係の変更 |

例: `feat/add-dark-mode`, `fix/like-button-error`, `refactor/api-structure`

## PR作成前のルール

**PRを作成する前に、必ず以下のコマンドを実行し、問題があれば修正すること。**

```bash
pnpm lint
pnpm format:check
```

問題がある場合は `pnpm format` でフォーマットを修正し、lintエラーは手動で修正する。

## PR作成時のルール

**PRを作成する際は、必ず `/gh-pr` スキルを使用すること。**

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

## Active Technologies

- TypeScript 5.9.2 / Next.js 15.4.10 + Tailwind CSS 3.4.19, @tailwindcss/typography 0.5.19, React 19.1.2
- Cloudflare D1（いいね機能）、R2（CDN）
- drizzle-orm, drizzle-kit（型安全なD1データベースアクセス）

## Recent Changes

- feat/introduce-drizzle: drizzle-ormを導入してD1データベースアクセスを型安全に
- refactor/unify-design-system: TypeScript 5.9.2 / Next.js 15.4.10 + Tailwind CSS追加
