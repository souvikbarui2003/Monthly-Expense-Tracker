import { v } from "convex/values";
import { query } from "./_generated/server";

export const getOverview = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const start = args.startDate ?? monthStart;
    const end = args.endDate ?? now;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("transactionDate", start).lte("transactionDate", end)
      )
      .collect();

    const profile = await ctx.db
      .query("financialProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      if (tx.transactionType === "income") totalIncome += tx.amount;
      else totalExpenses += tx.amount;
    }

    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

    // Get all-time totals
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let allTimeIncome = 0;
    let allTimeExpenses = 0;
    for (const tx of allTransactions) {
      if (tx.transactionType === "income") allTimeIncome += tx.amount;
      else allTimeExpenses += tx.amount;
    }

    // Active budgets
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeBudgets = budgets.filter((b) => b.startDate <= now && b.endDate >= now);
    let totalBudget = 0;
    let totalBudgetSpent = 0;

    for (const budget of activeBudgets) {
      totalBudget += budget.amount;
      const budgetExpenses = transactions.filter((t) => {
        if (t.transactionType !== "expense") return false;
        if (budget.categoryId && t.categoryId !== budget.categoryId) return false;
        return t.transactionDate >= budget.startDate && t.transactionDate <= budget.endDate;
      });
      totalBudgetSpent += budgetExpenses.reduce((sum, t) => sum + t.amount, 0);
    }

    // Savings goals
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const activeGoals = goals.filter((g) => g.status === "active");
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

    return {
      // Current period
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      // All time
      allTimeIncome,
      allTimeExpenses,
      allTimeBalance: allTimeIncome - allTimeExpenses,
      // Transactions count
      transactionCount: transactions.length,
      allTimeTransactionCount: allTransactions.length,
      // Budgets
      activeBudgetCount: activeBudgets.length,
      totalBudget,
      totalBudgetSpent,
      budgetUtilization: totalBudget > 0 ? totalBudgetSpent / totalBudget : 0,
      // Savings
      activeGoalsCount: activeGoals.length,
      totalSaved,
      totalTarget,
      savingsProgress: totalTarget > 0 ? totalSaved / totalTarget : 0,
      // Monthly income from profile
      monthlyIncome: profile?.monthlyIncome ?? totalIncome,
    };
  },
});

export const getMonthlyTrend = query({
  args: {
    userId: v.id("users"),
    months: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const results = [];

    for (let i = args.months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = monthDate.getTime();
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59).getTime();

      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_user_date", (q) =>
          q
            .eq("userId", args.userId)
            .gte("transactionDate", monthStart)
            .lte("transactionDate", monthEnd)
        )
        .collect();

      let income = 0;
      let expense = 0;
      for (const tx of transactions) {
        if (tx.transactionType === "income") income += tx.amount;
        else expense += tx.amount;
      }

      results.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
        income,
        expense,
        savings: income - expense,
        transactionCount: transactions.length,
      });
    }

    return results;
  },
});

export const getCategoryBreakdown = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    transactionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const start = args.startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const end = args.endDate ?? now;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("transactionDate", start).lte("transactionDate", end)
      )
      .collect();

    const filtered = args.transactionType
      ? transactions.filter((t) => t.transactionType === args.transactionType)
      : transactions.filter((t) => t.transactionType === "expense");

    const categoryTotals: Record<string, { amount: number; count: number; color: string }> = {};

    for (const tx of filtered) {
      const cat = await ctx.db.get(tx.categoryId);
      const catName = cat?.name || "Unknown";
      const catColor = cat?.color || "#6b7280";
      if (!categoryTotals[catName]) categoryTotals[catName] = { amount: 0, count: 0, color: catColor };
      categoryTotals[catName].amount += tx.amount;
      categoryTotals[catName].count += 1;
    }

    const total = Object.values(categoryTotals).reduce((sum, c) => sum + c.amount, 0);

    return Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: total > 0 ? data.amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  },
});

export const getDailySpending = query({
  args: {
    userId: v.id("users"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const results = [];

    for (let i = args.days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).getTime();

      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_user_date", (q) =>
          q
            .eq("userId", args.userId)
            .gte("transactionDate", dayStart)
            .lte("transactionDate", dayEnd)
        )
        .collect();

      let income = 0;
      let expense = 0;
      for (const tx of transactions) {
        if (tx.transactionType === "income") income += tx.amount;
        else expense += tx.amount;
      }

      results.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        income,
        expense,
      });
    }

    return results;
  },
});

export const getRecentTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);

    const enriched = [];
    for (const tx of transactions) {
      const cat = await ctx.db.get(tx.categoryId);
      enriched.push({
        ...tx,
        categoryName: cat?.name || "Unknown",
        categoryColor: cat?.color || "#6b7280",
      });
    }

    return enriched;
  },
});
