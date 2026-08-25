import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveInsight = mutation({
  args: {
    userId: v.id("users"),
    insightType: v.union(
      v.literal("spending_increase"),
      v.literal("budget_warning"),
      v.literal("savings_tip"),
      v.literal("recurring_alert"),
      v.literal("anomaly"),
      v.literal("forecast"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("financialInsights", {
      userId: args.userId,
      insightType: args.insightType,
      title: args.title,
      message: args.message,
      severity: args.severity,
      generatedAt: Date.now(),
      metadata: args.metadata,
    });
  },
});

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("financialInsights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    let results = await q.take(args.limit ?? 20);

    if (args.severity) {
      results = results.filter((i) => i.severity === args.severity);
    }

    return results;
  },
});

export const clear = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("financialInsights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const insight of insights) {
      await ctx.db.delete(insight._id);
    }
    return { deleted: insights.length };
  },
});
