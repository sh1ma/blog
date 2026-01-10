# Quickstart: Drizzle ORM導入

**Created**: 2026-01-10

## Prerequisites

- Node.js 22+
- pnpm
- 既存のCloudflare D1データベース（`blog-iine-counter`）

## Setup Steps

### 1. パッケージのインストール

```bash
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

### 2. 環境変数の設定（drizzle-kit用）

`drizzle-kit pull`でリモートD1をintrospectするために、以下の環境変数を設定:

```bash
# .envファイルまたはexport
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_DATABASE_ID="63fa4c1b-5b4c-46e2-b2de-e412ae5deca9"
export CLOUDFLARE_D1_TOKEN="your-d1-api-token"
```

**APIトークンの作成方法**:
1. Cloudflare Dashboard → My Profile → API Tokens
2. Create Token → Custom token
3. Permissions: `D1:Read` を追加
4. Zone Resources: `All zones` または対象ゾーン

### 3. 既存スキーマのintrospect

リモートD1から既存スキーマを取得し、Drizzleの初期マイグレーションとして登録:

```bash
pnpm drizzle-kit pull --init
```

これにより以下が生成される:
- `drizzle/schema.ts` - スキーマ定義（→ `src/db/schema.ts`に移動）
- `drizzle/meta/_journal.json` - マイグレーション履歴
- `drizzle/meta/0000_snapshot.json` - スキーマスナップショット
- `drizzle/0000_*.sql` - 初期マイグレーションSQL

### 4. スキーマファイルの移動

生成されたスキーマを`src/db/`に移動:

```bash
mkdir -p src/db
mv drizzle/schema.ts src/db/schema.ts
```

### 5. スキーマファイルの確認

`src/db/schema.ts`を確認（自動生成されたもの）:

```typescript
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: text("article_id").notNull().references(() => articles.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const tweets = sqliteTable("tweets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  content: text("content").notNull(),
})
```

### 6. wrangler.tomlの更新

`wrangler.toml`のd1_databases設定を更新:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blog-iine-counter"
database_id = "63fa4c1b-5b4c-46e2-b2de-e412ae5deca9"
migrations_dir = "drizzle"
migrations_table = "__drizzle_migrations"
```

### 7. Drizzle設定ファイル

`drizzle.config.ts`（既に作成済み、d1-httpドライバー使用）:

```typescript
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
})
```

### 8. 既存コードの移行

`src/db.ts`を更新:

```typescript
"use server"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { eq, count } from "drizzle-orm"
import { articles, likes } from "@/db/schema"

export const getAllArticles = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  return db.select().from(articles)
}

export const countLikes = async (articleId: string) => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const result = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.articleId, articleId))
  return result[0] ?? { count: 0 }
}

export const likeArticle = async (articleId: string) => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  await db.insert(likes).values({ articleId })

  await fetch(context.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `いいねされました: ${articleId}`,
    }),
  })
}
```

### 9. 動作確認

```bash
# ローカル開発サーバー起動
pnpm dev

# ビルド確認
pnpm build

# Cloudflare Pagesプレビュー
pnpm preview
```

## Verification Checklist

- [ ] TypeScriptコンパイルエラーがないこと
- [ ] 記事一覧ページでいいね数が表示されること
- [ ] いいねボタンが動作すること
- [ ] ツイート一覧が表示されること
- [ ] Cloudflare Pagesプレビューで動作すること

## Troubleshooting

### 型エラー: `Property 'articleId' does not exist`

スキーマのカラム名（`article_id`）とTypeScriptプロパティ名（`articleId`）の対応を確認。Drizzleは自動的にスネークケースからキャメルケースに変換しない。

**解決策**: スキーマ定義で明示的にカラム名を指定:
```typescript
articleId: text("article_id").notNull()
```

### エラー: `D1_ERROR: no such table`

マイグレーションが適用されていない可能性。

**解決策**:
```bash
wrangler d1 migrations apply blog-iine-counter --remote
```

### エラー: `Cannot find module 'drizzle-orm/d1'`

パッケージがインストールされていない。

**解決策**:
```bash
pnpm add drizzle-orm
```
