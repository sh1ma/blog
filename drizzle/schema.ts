import {
  sqliteTable,
  AnySQLiteColumn,
  integer,
  text,
  numeric,
  foreignKey,
} from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const d1Migrations = sqliteTable("d1_migrations", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  appliedAt: numeric("applied_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
})

export const articles = sqliteTable("articles", {
  id: text().primaryKey(),
  createdAt: numeric("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
})

export const likes = sqliteTable("likes", {
  id: integer().primaryKey({ autoIncrement: true }),
  articleId: text("article_id")
    .notNull()
    .references(() => articles.id),
  createdAt: numeric("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
})

export const tweets = sqliteTable("tweets", {
  id: integer().primaryKey({ autoIncrement: true }),
  createdAt: numeric("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  content: text().notNull(),
})
