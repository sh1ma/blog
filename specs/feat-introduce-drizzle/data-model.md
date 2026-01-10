# Data Model: Drizzle ORM導入

**Created**: 2026-01-10

## Entities

### Article

記事のメタデータを管理するエンティティ。Contentlayerで管理されるMarkdownファイルとの参照キーとして使用。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PK | 記事のslug（例: "my-first-post"） |
| createdAt | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時 |

**Drizzle Schema**:
```typescript
export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})
```

### Like

記事に対する「いいね」を記録するエンティティ。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO INCREMENT | いいねの一意識別子 |
| articleId | text | NOT NULL, FK → articles.id | いいね対象の記事ID |
| createdAt | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP | いいね日時 |

**Drizzle Schema**:
```typescript
export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: text("article_id").notNull().references(() => articles.id),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
})
```

### Tweet

ブログオーナーのツイート（短文投稿）を管理するエンティティ。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | integer | PK, AUTO INCREMENT | ツイートの一意識別子 |
| createdAt | text | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 投稿日時 |
| content | text | NOT NULL | ツイート本文 |

**Drizzle Schema**:
```typescript
export const tweets = sqliteTable("tweets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  content: text("content").notNull(),
})
```

## Relationships

```
┌──────────────┐         ┌──────────────┐
│   articles   │◄────────│    likes     │
│              │    1:N  │              │
│ id (PK)      │         │ id (PK)      │
│ created_at   │         │ article_id   │──FK
│              │         │ created_at   │
└──────────────┘         └──────────────┘

┌──────────────┐
│    tweets    │  (独立エンティティ)
│              │
│ id (PK)      │
│ created_at   │
│ content      │
└──────────────┘
```

## Type Definitions (Generated)

Drizzleスキーマから推論される型:

```typescript
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"

// Select types (DBから取得時)
export type Article = InferSelectModel<typeof articles>
export type Like = InferSelectModel<typeof likes>
export type Tweet = InferSelectModel<typeof tweets>

// Insert types (DB挿入時)
export type NewArticle = InferInsertModel<typeof articles>
export type NewLike = InferInsertModel<typeof likes>
export type NewTweet = InferInsertModel<typeof tweets>
```

## Validation Rules

### Article
- `id`: 空文字不可、slugとして有効な文字列（英数字とハイフン）

### Like
- `articleId`: 存在するarticles.idを参照していること（外部キー制約）

### Tweet
- `content`: 空文字不可

## Migration Notes

既存のマイグレーションファイル（`migrations/0001_initial.sql`, `migrations/0002_add_tweets_table.sql`）で定義されたスキーマに完全に一致させる。

カラム名のマッピング:
- TypeScript: `createdAt` → DB: `created_at`
- TypeScript: `articleId` → DB: `article_id`
