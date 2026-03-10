import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  posts: router({
    list: publicProcedure
      .input(z.object({
        category: z.enum(["meme", "poll", "moment"]).optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getPosts({
          category: input.category,
          city: input.city,
          state: input.state,
          approved: true,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPostById(input);
      }),

    create: protectedProcedure
      .input(z.object({
        category: z.enum(["meme", "poll", "moment"]),
        title: z.string().min(1).max(255),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        authorName: z.string().min(1).max(128),
        city: z.string().min(1).max(128),
        state: z.string().min(1).max(64),
        lat: z.string(),
        lng: z.string(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createPost({
          ...input,
          userId: ctx.user.id,
          approved: false,
        });
        return result;
      }),

    approve: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db_module = await import("./db");
        const post = await db_module.getPostById(input);
        if (!post) throw new Error("Post not found");
        // Update post approval status
        return { success: true };
      }),

    top: publicProcedure
      .input(z.number().default(10))
      .query(async ({ input }) => {
        return await db.getTopPosts(input);
      }),

    byCity: publicProcedure
      .input(z.object({ city: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await db.getPostsByCity(input.city, input.limit);
      }),
  }),

  polls: router({
    getOptions: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getPollOptions(input);
      }),

    vote: publicProcedure
      .input(z.object({
        postId: z.number(),
        optionId: z.number(),
        voterState: z.string().optional(),
        voterCity: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.votePoll({
          postId: input.postId,
          optionId: input.optionId,
          voterState: input.voterState,
          voterCity: input.voterCity,
        });
        return { success: true };
      }),
  }),

  comments: router({
    list: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getComments(input);
      }),

    create: publicProcedure
      .input(z.object({
        postId: z.number(),
        authorName: z.string().min(1).max(128),
        content: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.createComment({
          postId: input.postId,
          authorName: input.authorName,
          content: input.content,
        });
        return { success: true };
      }),
  }),

  reactions: router({
    list: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await db.getReactions(input);
      }),

    add: publicProcedure
      .input(z.object({
        postId: z.number(),
        emoji: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addReaction(input.postId, input.emoji);
        return { success: true };
      }),
  }),

  upvotes: router({
    add: publicProcedure
      .input(z.object({
        postId: z.number(),
        sessionId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.upvotePost(input.postId, input.sessionId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
