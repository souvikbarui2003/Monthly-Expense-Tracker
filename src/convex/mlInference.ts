import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { api } from "./_generated/api";

// Keyword-based categorization (works without ML model)
const CATEGORY_KEYWORDS: Record<string, Record<string, string[]>> = {
  "Food": {
    "Food Delivery": ["swiggy", "zomato", "doordash", "ubereats", "food delivery", "takeout"],
    "Groceries": ["walmart", "kroger", "whole foods", "trader joe", "grocery", "supermarket", "aldi", "bigbasket"],
    "Restaurant": ["restaurant", "cafe", "diner", "pizza", "burger", "sushi", "chipotle", "mcdonald", "starbucks", "subway"],
    "Coffee": ["starbucks", "coffee", "latte", "espresso", "dunkin"],
  },
  "Transport": {
    "Cab": ["uber", "lyft", "ola", "cab", "taxi", "ride"],
    "Fuel": ["shell", "bp", "exxon", "gas station", "fuel", "petrol", "diesel"],
    "Public Transit": ["metro", "bus pass", "transit", "railway", "train", "subway card", "dtc"],
    "Parking": ["parking", "garage"],
  },
  "Shopping": {
    "Electronics": ["amazon", "best buy", "apple store", "electronic", "laptop", "phone", "headphones", "flipkart"],
    "Clothing": ["nike", "adidas", "zara", "h&m", "clothing", "fashion", "clothes", "shoes", "myntra"],
    "Home": ["ikea", "home depot", "target", "furniture", "decor"],
  },
  "Entertainment": {
    "Streaming": ["netflix", "spotify", "hulu", "disney+", "youtube premium", "apple music", "prime video", "hotstar"],
    "Movies": ["cinema", "movie", "theater", "fandango", "pvr", "bookmyshow"],
    "Games": ["steam", "playstation", "xbox", "nintendo", "gaming"],
  },
  "Bills & Utilities": {
    "Electricity": ["electric", "power", "energy", "utility", "electricity board", "seb"],
    "Internet": ["internet", "wifi", "broadband", "comcast", "at&t", "verizon", "airtel xstream"],
    "Phone": ["phone bill", "mobile", "airtel", "jio", "vodafone", "t-mobile", "recharge"],
    "Water": ["water bill", "sewer"],
  },
  "Healthcare": {
    "Medical": ["doctor", "hospital", "clinic", "pharmacy", "cvs", "walgreens", "medical", "health", "apollo"],
    "Insurance": ["insurance", "health insurance", "dental", "vision"],
  },
  "Education": {
    "Tuition": ["tuition", "university", "college", "school", "semester fee"],
    "Books": ["book", "textbook", "amazon books", "barnes"],
    "Courses": ["udemy", "coursera", "course", "training", "certification"],
  },
  "Rent & Housing": {
    "Rent": ["rent", "apartment", "housing", "landlord", "property management"],
    "Maintenance": ["maintenance", "repair", "plumber"],
  },
  "Subscriptions": {
    "Software": ["adobe", "microsoft 365", "notion", "figma", "canva", "github"],
    "Gym": ["gym", "fitness", "planet fitness", "membership"],
    "Entertainment": ["netflix", "spotify", "hulu", "disney+"],
  },
  "Savings": {
    "Investment": ["investment", "stock", "mutual fund", "401k", "ira"],
    "Emergency Fund": ["emergency", "savings"],
  },
};

export const categorize = action({
  args: {
    description: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const desc = args.description.toLowerCase();

    let bestMatch = { category: "Miscellaneous", subcategory: "General", confidence: 0.3 };

    for (const [category, subcategories] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const [subcategory, keywords] of Object.entries(subcategories)) {
        for (const keyword of keywords) {
          if (desc.includes(keyword.toLowerCase())) {
            const keywordLength = keyword.length;
            const confidence = Math.min(0.98, 0.6 + (keywordLength / desc.length) * 0.3 + (desc.includes(keyword) ? 0.1 : 0));

            if (confidence > bestMatch.confidence) {
              bestMatch = {
                category,
                subcategory,
                confidence: Math.round(confidence * 100) / 100,
              };
            }
          }
        }
      }
    }

    // Amount-based heuristics
    if (args.amount) {
      if (args.amount > 10000 && bestMatch.confidence < 0.6) {
        bestMatch = { category: "Education", subcategory: "Tuition", confidence: 0.5 };
      }
    }

    return {
      category: bestMatch.category,
      subcategory: bestMatch.subcategory,
      confidence: bestMatch.confidence,
      model_version: "keyword-based-v1",
    };
  },
});

export const forecast = action({
  args: {
    userId: v.id("users"),
    categoryId: v.optional(v.id("categories")),
    monthsAhead: v.number(),
  },
  handler: async (ctx, args) => {
    // Simple moving average forecast based on historical spending
    const now = Date.now();
    const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;

    const transactions = await ctx.runQuery(api.transactions.list, {
      userId: args.userId,
      startDate: sixMonthsAgo,
      endDate: now,
      transactionType: "expense",
    });

    if (!transactions || transactions.length === 0) {
      return {
        predictedAmount: 0,
        confidence: 0,
        range: { low: 0, high: 0 },
        model_version: "ma-forecast-v1",
        disclaimer: "Insufficient data for forecasting. Start logging transactions to receive predictions.",
      };
    }

    // Filter by category if provided
    const filtered = args.categoryId
      ? transactions.filter((t: { categoryId: string }) => t.categoryId === args.categoryId)
      : transactions;

    // Calculate monthly averages
    const monthlyTotals: Record<string, number> = {};
    for (const tx of filtered) {
      const date = new Date(tx.transactionDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + tx.amount;
    }

    const monthlyValues = Object.values(monthlyTotals);
    if (monthlyValues.length === 0) {
      return {
        predictedAmount: 0,
        confidence: 0,
        range: { low: 0, high: 0 },
        model_version: "ma-forecast-v1",
      };
    }

    // Weighted moving average (recent months weighted more)
    const weights = monthlyValues.map((_, i) => i + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedAvg = monthlyValues.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;

    // Standard deviation for range
    const mean = monthlyValues.reduce((s, v) => s + v, 0) / monthlyValues.length;
    const variance = monthlyValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / monthlyValues.length;
    const stdDev = Math.sqrt(variance);

    const predicted = Math.round(weightedAvg * 100) / 100;
    const confidence = Math.min(0.95, 0.5 + monthlyValues.length * 0.08);

    return {
      predictedAmount: predicted,
      confidence: Math.round(confidence * 100) / 100,
      range: {
        low: Math.round(Math.max(0, predicted - stdDev) * 100) / 100,
        high: Math.round((predicted + stdDev) * 100) / 100,
      },
      model_version: "ma-forecast-v1",
      monthsAnalyzed: monthlyValues.length,
      trend: monthlyValues.length >= 2
        ? monthlyValues[monthlyValues.length - 1] > monthlyValues[monthlyValues.length - 2] ? "increasing" as const : "decreasing" as const
        : "stable" as const,
    };
  },
});

export const budgetRisk = action({
  args: {
    userId: v.id("users"),
    budgetId: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.runQuery(api.budgets.get, {
      budgetId: args.budgetId,
      userId: args.userId,
    }) as { startDate: number; endDate: number; amount: number; categoryId?: string } | null;

    if (!budget) {
      return { risk: "unknown" as const, probability: 0, message: "Budget not found" };
    }

    const now = Date.now();
    const totalDays = Math.max(1, (budget.endDate - budget.startDate) / (24 * 60 * 60 * 1000));
    const elapsedDays = Math.max(1, (now - budget.startDate) / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.max(0, (budget.endDate - now) / (24 * 60 * 60 * 1000));

    // Get spending in this budget period
    const transactions = await ctx.runQuery(api.transactions.list, {
      userId: args.userId,
      startDate: budget.startDate,
      endDate: Math.min(now, budget.endDate),
      transactionType: "expense",
    }) as Array<{ categoryId: string; amount: number }>;

    const spent = transactions
      .filter((t) => !budget.categoryId || t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);

    const utilization = spent / budget.amount;
    const timeProgress = elapsedDays / totalDays;
    const dailySpendRate = spent / elapsedDays;
    const projectedSpend = dailySpendRate * totalDays;

    // Risk calculation
    let probability = 0;
    if (utilization > 1) {
      probability = 1;
    } else if (timeProgress > 0 && budget.amount > 0) {
      const expectedRate = timeProgress;
      const actualRate = utilization;
      const deviation = actualRate - expectedRate;
      const z = 4 * deviation;
      probability = 1 / (1 + Math.exp(-z));
      if (daysRemaining < 7) {
        probability = Math.min(1, probability * 1.2);
      }
    }

    let risk: "low" | "medium" | "high" | "critical";
    if (probability < 0.3) risk = "low";
    else if (probability < 0.6) risk = "medium";
    else if (probability < 0.85) risk = "high";
    else risk = "critical";

    const remainingDailyBudget = daysRemaining > 0
      ? Math.max(0, budget.amount - spent) / daysRemaining
      : 0;

    return {
      risk,
      probability: Math.round(probability * 100) / 100,
      utilization: Math.round(utilization * 100) / 100,
      projectedSpend: Math.round(projectedSpend * 100) / 100,
      willExceed: projectedSpend > budget.amount,
      daysRemaining: Math.round(daysRemaining),
      dailyBudgetRemaining: Math.round(remainingDailyBudget * 100) / 100,
      currentDailyRate: Math.round(dailySpendRate * 100) / 100,
      message: risk === "critical"
        ? "Your spending is on track to exceed this budget significantly. Consider reducing expenses immediately."
        : risk === "high"
          ? "You are at risk of exceeding this budget. Monitor spending closely."
          : risk === "medium"
            ? "Your spending is slightly above expected pace. Stay mindful."
            : "Your spending is on track within this budget.",
      model_version: "rule-based-v1",
    };
  },
});

export const detectAnomalies = action({
  args: {
    userId: v.id("users"),
    transactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const transactions = await ctx.runQuery(api.transactions.list, {
      userId: args.userId,
      startDate: threeMonthsAgo,
      transactionType: "expense",
    }) as Array<{ _id: string; amount: number; description: string; transactionDate: number; categoryId: string }>;

    if (!transactions || transactions.length < 10) {
      return {
        anomalies: [],
        message: "Insufficient transaction history for anomaly detection. Need at least 10 transactions.",
        model_version: "statistical-v1",
      };
    }

    const amounts: number[] = transactions.map((t) => t.amount);
    const mean: number = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const q1 = sortedAmounts[Math.floor(sortedAmounts.length * 0.25)];
    const q3 = sortedAmounts[Math.floor(sortedAmounts.length * 0.75)];
    const iqr = q3 - q1;
    const upperFence = q3 + 1.5 * iqr;
    const lowerFence = Math.max(0, q1 - 1.5 * iqr);

    const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: Array<{
      transactionId: string;
      amount: number;
      description: string;
      zScore: number;
      deviation: string;
      message: string;
    }> = [];

    for (const tx of transactions) {
      if (tx.amount > upperFence || tx.amount < lowerFence) {
        const zScore = stdDev > 0 ? (tx.amount - mean) / stdDev : 0;

        // Only check the specific transaction if one was provided
        if (!args.transactionId || tx._id === args.transactionId) {
          anomalies.push({
            transactionId: tx._id,
            amount: tx.amount,
            description: tx.description,
            zScore: Math.round(zScore * 100) / 100,
            deviation: tx.amount > upperFence
              ? `${Math.round(((tx.amount - upperFence) / (mean || 1)) * 100)}% above typical range`
              : `${Math.round(((lowerFence - tx.amount) / (mean || 1)) * 100)}% below typical range`,
            message: tx.amount > upperFence
              ? `This transaction (₹${tx.amount.toFixed(2)}) is significantly higher than your typical spending pattern (average: ₹${mean.toFixed(2)}). Review recommended.`
              : `This transaction (₹${tx.amount.toFixed(2)}) is significantly lower than your typical spending pattern. Review recommended.`,
          });
        }
      }
    }

    return {
      anomalies: anomalies.slice(0, 20),
      statistics: {
        mean: Math.round(mean * 100) / 100,
        median: Math.round(sortedAmounts[Math.floor(sortedAmounts.length / 2)] * 100) / 100,
        upperFence: Math.round(upperFence * 100) / 100,
        lowerFence: Math.round(lowerFence * 100) / 100,
        transactionCount: transactions.length,
      },
      model_version: "statistical-v1",
    };
  },
});

export const getModelStatus = query({
  args: {},
  handler: async () => {
    return {
      models: [
        {
          name: "Expense Categorizer",
          version: "keyword-based-v1",
          type: "classification",
          status: "active",
          accuracy: null,
          description: "Keyword-based transaction categorization",
        },
        {
          name: "Spending Forecaster",
          version: "ma-forecast-v1",
          type: "regression",
          status: "active",
          description: "Weighted moving average spending prediction",
        },
        {
          name: "Budget Risk Predictor",
          version: "rule-based-v1",
          type: "classification",
          status: "active",
          description: "Rule-based budget overrun probability",
        },
        {
          name: "Anomaly Detector",
          version: "statistical-v1",
          type: "detection",
          status: "active",
          description: "IQR-based statistical anomaly detection",
        },
      ],
      lastUpdated: Date.now(),
    };
  },
});
