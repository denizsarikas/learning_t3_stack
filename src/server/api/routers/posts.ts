import { clerkClient } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profilePicture: user.profileImageUrl,
  };
};

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
    });
    const authorIds = posts.map((post) => post.authorId);
    const users = await clerkClient.users.getUserList({
      userId: authorIds,
      limit: 100,
    });
    const filteredUsers = users.map(filterUserForClient);
    const postsWithAuthors = posts.map((post) => {
      const author = filteredUsers.find((users) => users.id === post.authorId);
      if (!author) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for post not found",
        });
      }
      return {
        post,
        author,
      };
    });
    return postsWithAuthors;
  }),
});


