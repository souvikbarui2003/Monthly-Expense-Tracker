import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    categoryId: v.optional(v.id("categories")),
    name: v.string(),
    amount: v.number(),
    periodType: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("semester"), v.literal("custom")),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Budget amount must be greater than zero");
    if (!args.name.trim()) throw new Error("Budget name is required");
    if (args.endDate <= args.startDate) throw new Error("End date must be after start date");

    const now = Date.now();
    const budgetId = await ctx.db.insert("budgets", {
      userId: args.userId,
      categoryId: args.categoryId,
      name: args.name.trim(),
      amount: args.amount,
      periodType: args.periodType,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
    });

    return { budgetId };
  },
});

export const update = mutation({
  args: {
    budgetId: v.id("budgets"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.budgetId);
    if (!existing) throw new Error("Budget not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.amount !== undefined) {
      if (args.amount <= 0) throw new Error("Amount must be greater than zero");
      updates.amount = args.amount;
    }
    if (args.categoryId !== undefined) updates.categoryId = args.categoryId;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;

    await ctx.db.patch(args.budgetId, updates);
    return { success: true };
  },
});

export const remove = mutation({
  args: { budgetId: v.id("budgets"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.budgetId);
    if (!existing) throw new Error("Budget not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.budgetId);
    return { success: true };
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { budgetId: v.id("budgets"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== args.userId) return null;
    return budget;
  },
});

export const getWithSpending = query({
  args: {
    userId: v.id("users"),
    budgetId: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== args.userId) return null;

    // Get transactions within budget period
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q
          .eq("userId", args.userId)
          .gte("transactionDate", budget.startDate)
          .lte("transactionDate", budget.endDate)
      )
      .collect();

    const expenses = transactions.filter((t) => {
      if (t.transactionType !== "expense") return false;
      if (budget.categoryId && t.categoryId !== budget.categoryId) return false;
      return true;
    });

    const spent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.amount - spent;
    const utilization = budget.amount > 0 ? spent / budget.amount : 0;

    // Calculate days
    const now = Date.now();
    const totalDays = Math.max(1, (budget.endDate - budget.startDate) / (24 * 60 * 60 * 1000));
    const elapsedDays = Math.min(totalDays, Math.max(0, (now - budget.startDate) / (24 * 60 * 60 * 1000)));
    const daysRemaining = Math.max(0, (budget.endDate - now) / (24 * 60 * 60 * 1000));

    // Budget status
    let status: "healthy" | "warning" | "near_limit" | "exceeded" = "healthy";
    if (utilization >= 1) status = "exceeded";
    else if (utilization >= 0.9) status = "near_limit";
    else if (utilization >= 0.75) status = "warning";

    // Daily burn rate
    const dailySpendRate = elapsedDays > 0 ? spent / elapsedDays : 0;
    const projectedTotal = dailySpendRate * totalDays;

    return {
      budget,
      spent,
      remaining: Math.max(0, remaining),
      utilization,
      status,
      totalDays,
      elapsedDays: Math.round(elapsedDays),
      daysRemaining: Math.round(daysRemaining),
      dailySpendRate,
      projectedTotal,
      willExceed: projectedTotal > budget.amount,
    };
  },
});
