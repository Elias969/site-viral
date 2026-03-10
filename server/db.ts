import { eq, desc, and, or, like, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, posts, pollOptions, pollVotes, comments, reactions, upvotes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPosts(filters?: { category?: string; city?: string; state?: string; approved?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.category) conditions.push(eq(posts.category, filters.category as any));
  if (filters?.city) conditions.push(like(posts.city, `%${filters.city}%`));
  if (filters?.state) conditions.push(eq(posts.state, filters.state));
  if (filters?.approved !== undefined) conditions.push(eq(posts.approved, filters.approved));

  const query = db.select().from(posts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);

  return await query;
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPost(post: typeof posts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(post);
  return result;
}

export async function getPollOptions(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pollOptions).where(eq(pollOptions.postId, postId));
}

export async function createPollOption(option: typeof pollOptions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(pollOptions).values(option);
}

export async function votePoll(vote: typeof pollVotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pollVotes).values(vote);
  const opt = await db.select().from(pollOptions).where(eq(pollOptions.id, vote.optionId)).limit(1);
  if (opt.length > 0) {
    await db.update(pollOptions).set({ votes: opt[0].votes + 1 }).where(eq(pollOptions.id, vote.optionId));
  }
}

export async function getComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
}

export async function createComment(comment: typeof comments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(comments).values(comment);
  const post = await db.select().from(posts).where(eq(posts.id, comment.postId)).limit(1);
  if (post.length > 0) {
    await db.update(posts).set({ commentCount: post[0].commentCount + 1 }).where(eq(posts.id, comment.postId));
  }
}

export async function getReactions(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reactions).where(eq(reactions.postId, postId));
}

export async function addReaction(postId: number, emoji: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(reactions).where(and(eq(reactions.postId, postId), eq(reactions.emoji, emoji))).limit(1);
  if (existing.length > 0) {
    await db.update(reactions).set({ count: existing[0].count + 1 }).where(eq(reactions.id, existing[0].id));
  } else {
    await db.insert(reactions).values({ postId, emoji, count: 1 });
  }
}

export async function upvotePost(postId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(upvotes).where(and(eq(upvotes.postId, postId), eq(upvotes.sessionId, sessionId))).limit(1);
  if (existing.length === 0) {
    await db.insert(upvotes).values({ postId, sessionId });
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (post.length > 0) {
      await db.update(posts).set({ upvotes: post[0].upvotes + 1 }).where(eq(posts.id, postId));
    }
  }
}

export async function getTopPosts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(posts).where(eq(posts.approved, true)).orderBy(desc(posts.upvotes)).limit(limit);
}

export async function getPostsByCity(city: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(posts).where(and(like(posts.city, `%${city}%`), eq(posts.approved, true))).orderBy(desc(posts.upvotes)).limit(limit);
}
