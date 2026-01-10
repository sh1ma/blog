import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"

export const articles = sqliteTable("articles", {
  id: text().primaryKey(),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
})

export const likes = sqliteTable("likes", {
  id: integer().primaryKey({ autoIncrement: true }),
  articleId: text("article_id").notNull().references(() => articles.id),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
})

export const tweets = sqliteTable("tweets", {
  id: integer().primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  content: text().notNull(),
})

// Select types (DBから取得時)
export type Article = InferSelectModel<typeof articles>
export type Like = InferSelectModel<typeof likes>
export type Tweet = InferSelectModel<typeof tweets>

// Insert types (DB挿入時)
export type NewArticle = InferInsertModel<typeof articles>
export type NewLike = InferInsertModel<typeof likes>
export type NewTweet = InferInsertModel<typeof tweets>
