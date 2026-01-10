-- Current sql file was generated after introspecting the database
CREATE TABLE `articles` (
	`id` text PRIMARY KEY,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`article_id` text NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tweets` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`content` text NOT NULL
);