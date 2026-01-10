import { relations } from "drizzle-orm/relations";
import { articles, likes } from "./schema";

export const likesRelations = relations(likes, ({one}) => ({
	article: one(articles, {
		fields: [likes.articleId],
		references: [articles.id]
	}),
}));

export const articlesRelations = relations(articles, ({many}) => ({
	likes: many(likes),
}));