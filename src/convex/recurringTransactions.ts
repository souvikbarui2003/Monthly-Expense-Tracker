import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    categoryId: v.id("categories"),
    description: v.string(),
    amount: v.number(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    nextDate: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Amount must be greater than zero");
    if (!args.description.trim()) throw new Error("Description is required");

    const now = Date.now();
    const id = await ctx.db.insert("recurringTransactions", {
      userId: args.userId,
      categoryId: args.categoryId,
      description: args.description.trim(),
      amount: args.amount,
      frequency: args.frequency,
      nextDate: args.nextDate,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("recurringTransactions"),
    userId: v.id("users"),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    nextDate: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Recurring transaction not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.categoryId !== undefined) updates.categoryId = args.categoryId;
    if (args.nextDate !== undefined) updates.nextDate = args.nextDate;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const remove = mutation({
  args: { id: v.id("recurringTransactions"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Recurring transaction not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getMonthlyTotal = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("active", true))
      .collect();

    const frequencyToMonthly: Record<string, number> = {
      daily: 30,
      weekly: 4.33,
      biweekly: 2,
      monthly: 1,
      quarterly: 1 / 3,
      yearly: 1 / 12,
    };

    let totalMonthly = 0;
    for (const item of items) {
      totalMonthly += item.amount * (frequencyToMonthly[item.frequency] || 1);
    }

    return { totalMonthly, count: items.length, items };
  },
});
