import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(isAdmin = false): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: isAdmin ? "admin" : "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Posts Router", () => {
  it("should list posts", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const posts = await caller.posts.list({ limit: 10 });
    expect(Array.isArray(posts)).toBe(true);
  });

  it("should filter posts by category", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const memes = await caller.posts.list({ category: "meme", limit: 10 });
    expect(Array.isArray(memes)).toBe(true);
  });

  it("should get top posts", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const topPosts = await caller.posts.top(10);
    expect(Array.isArray(topPosts)).toBe(true);
  });

  it("should get posts by city", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const cityPosts = await caller.posts.byCity({ city: "São Paulo", limit: 10 });
    expect(Array.isArray(cityPosts)).toBe(true);
  });
});

describe("Comments Router", () => {
  it("should list comments for a post", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const comments = await caller.comments.list(1);
    expect(Array.isArray(comments)).toBe(true);
  });

  it("should create a comment", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.comments.create({
      postId: 1,
      authorName: "Test Author",
      content: "Test comment",
    });
    expect(result.success).toBe(true);
  });
});

describe("Reactions Router", () => {
  it("should list reactions for a post", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const reactions = await caller.reactions.list(1);
    expect(Array.isArray(reactions)).toBe(true);
  });

  it("should add a reaction", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.reactions.add({
      postId: 1,
      emoji: "😂",
    });
    expect(result.success).toBe(true);
  });
});

describe("Upvotes Router", () => {
  it("should add an upvote", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.upvotes.add({
      postId: 1,
      sessionId: "test-session",
    });
    expect(result.success).toBe(true);
  });
});

describe("Polls Router", () => {
  it("should get poll options", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const options = await caller.polls.getOptions(1);
    expect(Array.isArray(options)).toBe(true);
  });

  it("should vote on a poll", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.polls.vote({
      postId: 1,
      optionId: 1,
      voterState: "SP",
      voterCity: "São Paulo",
    });
    expect(result.success).toBe(true);
  });
});

describe("Auth Router", () => {
  it("should get current user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.id).toBe(1);
    expect(user?.name).toBe("Test User");
  });

  it("should logout", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
