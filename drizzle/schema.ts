import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["meme", "poll", "moment"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  imageUrl: text("imageUrl"),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  state: varchar("state", { length: 64 }).notNull(),
  lat: varchar("lat", { length: 32 }).notNull(),
  lng: varchar("lng", { length: 32 }).notNull(),
  tags: text("tags"),
  upvotes: int("upvotes").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  approved: boolean("approved").default(false).notNull(),
  userId: int("userId"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const pollOptions = mysqlTable("poll_options", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  text: varchar("text", { length: 255 }).notNull(),
  votes: int("votes").default(0).notNull(),
});

export type PollOption = typeof pollOptions.$inferSelect;

export const pollVotes = mysqlTable("poll_votes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  optionId: int("optionId").notNull(),
  voterState: varchar("voterState", { length: 64 }),
  voterCity: varchar("voterCity", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorName: varchar("authorName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;

export const reactions = mysqlTable("reactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  count: int("count").default(1).notNull(),
});

export const upvotes = mysqlTable("upvotes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
