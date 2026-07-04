# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要

- 常に日本語で説明してください。
- **依存追加は必ず `pnpm add` / `pnpm add -D` を使うこと**。`package.json` を直接編集して依存を書き込むのは禁止。バージョン指定は pnpm に解決させ、`pnpm-lock.yaml` と一貫させる。
- **`biome-ignore` (および `eslint-disable` 等の Lint 無効化コメント) は絶対に書かない**。Lint エラーは黙らせるのではなく、コードを直して解消する。`useExhaustiveDependencies` で困ったら関数を `useCallback` にして deps に載せる、`useEffect` 内へ移す、ref にする、などの手段でルールを守る形にリファクタする。

## ブランチ命名規則

Conventional Commit に準じた `<type>/<short-description>` 形式:

| type       | 用途                         |
| ---------- | ---------------------------- |
| `feat`     | 新機能追加                   |
| `fix`      | バグ修正                     |
| `refactor` | リファクタリング             |
| `docs`     | ドキュメント変更             |
| `chore`    | ビルド・設定・依存関係の変更 |

例: `feat/add-dark-mode`, `fix/broken-link`, `refactor/api-structure`

## コード修正の進め方 (CI などは除く)

- バグ・不具合は先に再現テストを書き、必ず一度 Failed することを確認してから修正する。
- テストが間違っていることもある。その場合はユーザーに伝えたうえで修正する。

## 作業後に確認すること

- VRT / E2E の変更漏れがないか確認する。
- `origin/main` にまだ取り込んでいない変更が無いか確認する。

## PR 作成前のチェック

以下がすべて通ることを確認する。失敗があれば直してから PR を作成する。

```bash
pnpm check         # biome の lint + format チェック (書き換えなし)
pnpm typecheck     # tsc -b --noEmit
pnpm test:e2e      # Playwright (VRT を除く)
```

自動修正できるものは `pnpm check:fix` で当てる。

## PR 作成時のルール

- **PR 作成には必ず `/gh-pr` スキルを使う**。`gh pr create` の直接実行は禁止。スキルにラベル付与などのルールが含まれている。
- `.github/pull_request_template.md` のセクション (概要 / 変更内容 / 関連 Issue / テスト項目 / VRT 設定 / スクリーンショット / 備考) を必ず埋める。

## 主要コマンド

```bash
pnpm dev           # 開発サーバー起動 (contentlayer build → vite dev)
pnpm build         # フルビルド: contentlayer → tsc → vite → RSS feed → OGP 画像
pnpm build:content # Contentlayer 単独ビルド (.contentlayer/generated 生成)
pnpm build:feed    # dist/feed.xml を再生成
pnpm build:ogp     # dist/og/{slug}.png と dist/articles/{slug}/index.html を再生成
pnpm preview       # pnpm build → wrangler dev (本番と同じ静的アセット挙動で確認)
pnpm deploy        # pnpm build → wrangler deploy (本番)
pnpm versions:upload  # pnpm build → wrangler versions upload (preview/staging用)

pnpm check         # biome check (書き換え無し)
pnpm check:fix     # biome check --write
pnpm typecheck     # tsc -b --noEmit

pnpm test:e2e         # Playwright (VRT を除く)
pnpm test:e2e:ui      # Playwright UI モード
pnpm test:e2e:server  # pnpm build → wrangler dev (playwright の webServer から呼ばれる)

pnpm cf-typegen    # Cloudflare 環境変数の型生成 → cloudflare-env.d.ts
```

## アーキテクチャ

**Vite 6 + React 19 SPA / TanStack Router (file-based) + TanStack Query / Contentlayer2 / Biome / Cloudflare Workers 静的アセット** で構成されるブログ。

### コンテンツパイプライン

- Markdown は `src/markdown/posts/*.md` (記事) と `src/markdown/about.md` に配置。
- `contentlayer.config.ts` で Article / About の 2 ドキュメントタイプを定義。`rehype-slug` + `rehype-autolink-headings` + `rehype-pretty-code` (shiki `one-dark-pro`) を通す。
- `pnpm build:content` が `.contentlayer/generated` に型付き JSON を生成する。ランタイムは `contentlayer/generated` を alias 経由でインポートする。

### ルーティング / データ

- ルートは file-based (`src/routes/`)。`@tanstack/router-plugin` の Vite プラグインが `src/routeTree.gen.ts` を自動生成する。生成物は Biome と Git から除外済。
- `src/routes/__root.tsx` が `QueryClient` を context に持ち、`Header` / `Footer` レイアウトを提供する。
- 記事一覧・詳細は Contentlayer 生成物を直接 import (静的)。TanStack Query は将来的な動的取得のために Provider を用意しているのみ。

### RSS / OGP の静的生成

- **RSS**: `scripts/build-feed.ts` が Contentlayer から `dist/feed.xml` を生成 (RSS 2.0)。
- **OGP**: `scripts/build-ogp.ts` が satori + `@resvg/resvg-js` で各記事 `dist/og/{slug}.png` (1200×630) を生成。フォントは IBM Plex Sans JP を fonts.gstatic.com から取得。合わせて `dist/articles/{slug}/index.html` を SPA シェルから生成し、`<title>` / OG / Twitter meta を注入する。クローラーが記事タイトルと OGP を取得できるようにするための静的シェル差分。

### Cloudflare 統合 / デプロイ

- Vite ↔ workerd の統合は **`@cloudflare/vite-plugin`** に任せる。`vite dev` は workerd ベースの dev server として動作し、ローカルからでも本番同等の静的アセットハンドリング (SPA fallback / trailing-slash) が得られる。
- `wrangler.jsonc` は `main` を持たず、`assets.not_found_handling: single-page-application` の pure static Worker。`assets.directory` は plugin が build 時に `dist/wrangler.json` を生成して自動で埋める。
- `vite build` の出力 `dist/wrangler.json` は `.wrangler/deploy/config.json` 経由で `wrangler` に自動リダイレクトされるため、リポジトリ直下から `wrangler deploy` するだけで良い。
- **Preview**: PR で `wrangler versions upload --preview-alias pr-{PR番号}` (`.github/workflows/preview-deploy.yaml`)。
- **Staging**: `main` push で `wrangler versions upload --preview-alias staging` (`.github/workflows/staging-deploy.yaml`)。
- **Production**: `deploy` ブランチへの push で `wrangler deploy` (`.github/workflows/production-deploy.yaml`)。`create-production-pr.yaml` (workflow_dispatch) で `main → deploy` PR を自動作成できる。
- 必要な Secrets: `CLOUDFLARE_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `WORKERS_SUBDOMAIN`。

### E2E / VRT

- Playwright の `webServer` は `pnpm test:e2e:server` を起動し、`http://localhost:8787` (wrangler dev) をターゲットにする。wrangler の trailing-slash redirect を再現できるため、per-article HTML の配信も含めて実際のプロダクションと同等の挙動でテストできる。
- SPA なので初期 HTML はシェル。`page.evaluate` で DOM を読むテストは `page.waitForSelector("main article")` などで描画待ちを入れること。
- VRT は `e2e/vrt.spec.ts` + `.github/workflows/vrt.yaml`。baseline は R2 (`blog-vrt`) に置いてあり、CI 側で取得・比較する。

## Lint / Format

Biome 2 に統一済み (ESLint / Prettier は撤去)。設定は `biome.json`。

- 生成物 (`dist`, `.contentlayer`, `routeTree.gen.ts`) と `worktrees`, `dev-assets`, `public` は除外済。
- `.jsonc` (wrangler.jsonc, tsconfig 系) は `overrides` で trailing comma とコメントを許可。

## 開発時のファイル管理

**`dev-assets/`** は開発時の一時ファイル・参考資料用ディレクトリ (`.gitignore` 済)。デザインファイル、実装時のメモ、コミットしたくない実験コードなど。

## Recent Changes

- `refactor/vite-biome-migration`: Next.js App Router (OpenNext) を撤去し Vite + React + TanStack Router + TanStack Query に移行。ESLint + Prettier を Biome へ統一。ツイート / いいね / 管理画面と関連 API・drizzle/D1 を削除。RSS / OGP を build 時静的生成へ。
