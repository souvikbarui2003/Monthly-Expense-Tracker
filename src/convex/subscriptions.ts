import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    billingCycle: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    nextBillingDate: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Amount must be greater than zero");
    if (!args.name.trim()) throw new Error("Subscription name is required");

    const now = Date.now();
    const id = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      name: args.name.trim(),
      amount: args.amount,
      billingCycle: args.billingCycle,
      nextBillingDate: args.nextBillingDate,
      category: args.category,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    nextBillingDate: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Subscription not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.nextBillingDate !== undefined) updates.nextBillingDate = args.nextBillingDate;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const remove = mutation({
  args: { id: v.id("subscriptions"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Subscription not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getMonthlyTotal = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const active = items.filter((s) => s.active);
    const cycleToMonthly: Record<string, number> = {
      weekly: 4.33,
      monthly: 1,
      quarterly: 1 / 3,
      yearly: 1 / 12,
    };

    let totalMonthly = 0;
    let totalAnnual = 0;
    for (const sub of active) {
      const monthly = sub.amount * (cycleToMonthly[sub.billingCycle] || 1);
      totalMonthly += monthly;
      totalAnnual += monthly * 12;
    }

    return { totalMonthly, totalAnnual, count: active.length, total: items.length };
  },
});
