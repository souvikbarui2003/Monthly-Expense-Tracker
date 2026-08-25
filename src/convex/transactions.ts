import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    categoryId: v.id("categories"),
    transactionType: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    description: v.string(),
    merchant: v.optional(v.string()),
    transactionDate: v.number(),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("upi"),
      v.literal("debit_card"),
      v.literal("credit_card"),
      v.literal("bank_transfer"),
      v.literal("wallet"),
      v.literal("other")
    ),
    source: v.optional(v.string()),
    isRecurring: v.boolean(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Transaction amount must be greater than zero");
    if (!args.description.trim()) throw new Error("Description is required");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    const now = Date.now();
    const transactionId = await ctx.db.insert("transactions", {
      userId: args.userId,
      categoryId: args.categoryId,
      transactionType: args.transactionType,
      amount: args.amount,
      description: args.description.trim(),
      merchant: args.merchant?.trim(),
      transactionDate: args.transactionDate,
      paymentMethod: args.paymentMethod,
      source: args.source,
      isRecurring: args.isRecurring,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    return { transactionId };
  },
});

export const update = mutation({
  args: {
    transactionId: v.id("transactions"),
    userId: v.id("users"),
    categoryId: v.optional(v.id("categories")),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    merchant: v.optional(v.string()),
    transactionDate: v.optional(v.number()),
    paymentMethod: v.optional(
      v.union(
        v.literal("cash"),
        v.literal("upi"),
        v.literal("debit_card"),
        v.literal("credit_card"),
        v.literal("bank_transfer"),
        v.literal("wallet"),
        v.literal("other")
      )
    ),
    isRecurring: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.transactionId);
    if (!existing) throw new Error("Transaction not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.categoryId !== undefined) updates.categoryId = args.categoryId;
    if (args.amount !== undefined) {
      if (args.amount <= 0) throw new Error("Amount must be greater than zero");
      updates.amount = args.amount;
    }
    if (args.description !== undefined) updates.description = args.description.trim();
    if (args.merchant !== undefined) updates.merchant = args.merchant.trim();
    if (args.transactionDate !== undefined) updates.transactionDate = args.transactionDate;
    if (args.paymentMethod !== undefined) updates.paymentMethod = args.paymentMethod;
    if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(args.transactionId, updates);
    return { success: true };
  },
});

export const remove = mutation({
  args: { transactionId: v.id("transactions"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.transactionId);
    if (!existing) throw new Error("Transaction not found");
    if (existing.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.transactionId);
    return { success: true };
  },
});

export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    transactionType: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    search: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Collect all user transactions, then apply filters
    const allTx = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (index) =>
        index.eq("userId", args.userId)
      )
      .order("desc")
      .take(args.limit ? args.limit * 3 : 200); // Take extra for filtering

    let results = allTx;

    // Apply date range filters
    if (args.startDate) {
      results = results.filter((t) => t.transactionDate >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((t) => t.transactionDate <= args.endDate!);
    }

    // Apply other filters
    if (args.transactionType) {
      results = results.filter((t) => t.transactionType === args.transactionType);
    }
    if (args.categoryId) {
      results = results.filter((t) => t.categoryId === args.categoryId);
    }
    if (args.paymentMethod) {
      results = results.filter((t) => t.paymentMethod === args.paymentMethod);
    }
    if (args.minAmount !== undefined) {
      results = results.filter((t) => t.amount >= args.minAmount!);
    }
    if (args.maxAmount !== undefined) {
      results = results.filter((t) => t.amount <= args.maxAmount!);
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower) ||
          t.merchant?.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit after filtering
    return results.slice(0, args.limit ?? 50);
  },
});

export const get = query({
  args: { transactionId: v.id("transactions"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const tx = await ctx.db.get(args.transactionId);
    if (!tx || tx.userId !== args.userId) return null;
    return tx;
  },
});

export const getMonthlyTotals = internalQuery({
  args: {
    userId: v.id("users"),
    months: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = now - args.months * 30 * 24 * 60 * 60 * 1000;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("transactionDate", startDate)
      )
      .collect();

    const monthlyData: Record<string, { income: number; expense: number }> = {};

    for (const tx of transactions) {
      const date = new Date(tx.transactionDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      if (tx.transactionType === "income") {
        monthlyData[key].income += tx.amount;
      } else {
        monthlyData[key].expense += tx.amount;
      }
    }

    return monthlyData;
  },
});

export const getCategoryTotals = internalQuery({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    transactionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (index) =>
        index.eq("userId", args.userId)
      )
      .collect();

    let filtered = transactions;
    if (args.startDate) {
      filtered = filtered.filter((t) => t.transactionDate >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((t) => t.transactionDate <= args.endDate!);
    }
    if (args.transactionType) {
      filtered = filtered.filter((t) => t.transactionType === args.transactionType);
    }

    const categoryTotals: Record<string, number> = {};
    for (const tx of filtered) {
      const cat = await ctx.db.get(tx.categoryId);
      const catName = cat?.name || "Unknown";
      categoryTotals[catName] = (categoryTotals[catName] || 0) + tx.amount;
    }

    return categoryTotals;
  },
});

export const getTransactionCount = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return transactions.length;
  },
});
