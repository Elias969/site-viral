CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorName` varchar(128) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poll_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`text` varchar(255) NOT NULL,
	`votes` int NOT NULL DEFAULT 0,
	CONSTRAINT `poll_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`optionId` int NOT NULL,
	`voterState` varchar(64),
	`voterCity` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poll_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('meme','poll','moment') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`imageUrl` text,
	`authorName` varchar(128) NOT NULL,
	`city` varchar(128) NOT NULL,
	`state` varchar(64) NOT NULL,
	`lat` varchar(32) NOT NULL,
	`lng` varchar(32) NOT NULL,
	`tags` text,
	`upvotes` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`approved` boolean NOT NULL DEFAULT false,
	`userId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`emoji` varchar(16) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	CONSTRAINT `reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upvotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `upvotes_id` PRIMARY KEY(`id`)
);
