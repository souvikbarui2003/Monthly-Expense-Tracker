import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.optional(v.number()),
    targetDate: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.targetAmount <= 0) throw new Error("Target amount must be greater than zero");
    if (!args.name.trim()) throw new Error("Goal name is required");

    const now = Date.now();
    const goalId = await ctx.db.insert("savingsGoals", {
      userId: args.userId,
      name: args.name.trim(),
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount ?? 0,
      targetDate: args.targetDate,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return { goalId };
  },
});

export const update = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.goalId);
    if (!existing) throw new Error("Savings goal not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.targetAmount !== undefined) {
      if (args.targetAmount <= 0) throw new Error("Target amount must be greater than zero");
      updates.targetAmount = args.targetAmount;
    }
    if (args.currentAmount !== undefined) updates.currentAmount = Math.max(0, args.currentAmount);
    if (args.targetDate !== undefined) updates.targetDate = args.targetDate;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "completed") updates.currentAmount = existing.targetAmount;
    }

    await ctx.db.patch(args.goalId, updates);
    return { success: true };
  },
});

export const remove = mutation({
  args: { goalId: v.id("savingsGoals"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.goalId);
    if (!existing) throw new Error("Savings goal not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.goalId);
    return { success: true };
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const contribute = mutation({
  args: {
    goalId: v.id("savingsGoals"),
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Contribution must be greater than zero");
    const goal = await ctx.db.get(args.goalId);
    if (!goal) throw new Error("Savings goal not found");
    if (goal.userId !== args.userId) throw new Error("Unauthorized");
    if (goal.status !== "active") throw new Error("Goal is not active");

    const newAmount = goal.currentAmount + args.amount;
    const updates: Record<string, unknown> = {
      currentAmount: Math.min(newAmount, goal.targetAmount),
      updatedAt: Date.now(),
    };
    if (newAmount >= goal.targetAmount) {
      updates.status = "completed";
    }

    await ctx.db.patch(args.goalId, updates);
    return { success: true };
  },
});
