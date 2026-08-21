import { COOKIE_NAME } from "../shared/const.js";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ASTRA_MODEL, buildAstraMessages } from "./astra";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assistant: router({
    chat: publicProcedure
      .input(
        z.object({
          modeSystemPrompt: z.string().trim().min(20).max(1_500),
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().trim().min(1).max(5_000),
              }),
            )
            .min(1)
            .max(16),
        }),
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          model: ASTRA_MODEL,
          maxTokens: 1_000,
          messages: buildAstraMessages(input.modeSystemPrompt, input.messages),
        });
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("Astra did not return a usable response. Please try again.");
        }
        return { content: content.trim() };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
