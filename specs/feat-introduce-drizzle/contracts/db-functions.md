# Database Functions Contract

**Created**: 2026-01-10

## Overview

既存のServer Actions（直接SQLクエリ）をDrizzle ORMベースの関数に置き換える。
外部インターフェース（関数シグネチャと戻り値の型）は維持する。

## Functions

### getAllArticles

全記事のメタデータを取得する。

**Current Implementation** (`src/db.ts`):
```typescript
export const getAllArticles = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    "select * from articles",
  ).all()
  return results
}
```

**New Implementation**:
```typescript
export const getAllArticles = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  return db.select().from(articles)
}
```

**Return Type**: `Article[]`

---

### countLikes

指定記事のいいね数を取得する。

**Current Implementation** (`src/db.ts`):
```typescript
export const countLikes = async (articleId: string) => {
  const context = getCloudflareContext()
  const result = await context.env.DB.prepare(
    "select count(*) from likes where article_id = ?",
  )
    .bind(articleId)
    .first<{ "count(*)": string }>()
  return result
}
```

**New Implementation**:
```typescript
export const countLikes = async (articleId: string) => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const result = await db
    .select({ count: count() })
    .from(likes)
    .where(eq(likes.articleId, articleId))
  return result[0] ?? { count: 0 }
}
```

**Input**: `articleId: string`
**Return Type**: `{ count: number }`

---

### likeArticle

記事にいいねを追加する。

**Current Implementation** (`src/db.ts`):
```typescript
export const likeArticle = async (articleId: string) => {
  const context = getCloudflareContext()
  await context.env.DB.prepare("insert into likes (article_id) values (?)")
    .bind(articleId)
    .run()
  // Discord webhook notification...
}
```

**New Implementation**:
```typescript
export const likeArticle = async (articleId: string) => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  await db.insert(likes).values({ articleId })
  // Discord webhook notification (unchanged)
}
```

**Input**: `articleId: string`
**Return Type**: `void`
**Side Effects**: Discord Webhook通知

---

### getAllTweets

全ツイートを新しい順で取得する。

**Current Implementation** (`src/tweets/tweetDomain.ts`):
```typescript
export const getAllTweets = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    "select * from tweets order by created_at desc",
  ).all<TweetDBRecord>()
  return results.map(recordToModel)
}
```

**New Implementation**:
```typescript
export const getAllTweets = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const results = await db
    .select()
    .from(tweets)
    .orderBy(desc(tweets.createdAt))
  return results.map(recordToModel)
}
```

**Return Type**: `Tweet[]`

---

### getRecentTweets

最新5件のツイートを取得する。

**Current Implementation** (`src/tweets/tweetDomain.ts`):
```typescript
const RECENT_LIMIT = 5
export const getRecentTweets = async () => {
  const context = getCloudflareContext()
  const { results } = await context.env.DB.prepare(
    `select * from tweets order by created_at desc limit ${RECENT_LIMIT}`,
  ).all<TweetDBRecord>()
  return results.map(recordToModel)
}
```

**New Implementation**:
```typescript
const RECENT_LIMIT = 5
export const getRecentTweets = async () => {
  const context = getCloudflareContext()
  const db = drizzle(context.env.DB)
  const results = await db
    .select()
    .from(tweets)
    .orderBy(desc(tweets.createdAt))
    .limit(RECENT_LIMIT)
  return results.map(recordToModel)
}
```

**Return Type**: `Tweet[]`

## Required Imports

```typescript
import { drizzle } from "drizzle-orm/d1"
import { eq, desc, count } from "drizzle-orm"
import { articles, likes, tweets } from "@/db/schema"
```

## Backward Compatibility

- 全ての関数シグネチャは維持される
- 戻り値の型は互換性を保つ（`countLikes`は若干改善）
- `"use server"`ディレクティブは維持
