import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash wrapper — Convex runs Node.js-compatible runtime
async function hashPassword(password: string): Promise<string> {
  // Use a simple SHA-256 based approach compatible with Convex runtime
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "fintrack_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hashValue;
}

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    userType: v.union(v.literal("student"), v.literal("professional"), v.literal("general")),
    currency: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("An account with this email already exists");
    }

    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const now = Date.now();
    const passwordHash = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      name: args.name,
      userType: args.userType,
      currency: args.currency,
      timezone: args.timezone,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create default system categories
    const defaultCategories = getDefaultCategories();
    for (const cat of defaultCategories) {
      await ctx.db.insert("categories", {
        userId: undefined,
        name: cat.name,
        type: cat.type as "income" | "expense",
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
        createdAt: now,
      });
    }

    return { userId };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await verifyPassword(args.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      onboardingCompleted: user.onboardingCompleted,
    };
  },
});

export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      currency: user.currency,
      timezone: user.timezone,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
    };
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    timezone: v.optional(v.string()),
    userType: v.optional(v.union(v.literal("student"), v.literal("professional"), v.literal("general"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.currency !== undefined) updates.currency = args.currency;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.userType !== undefined) updates.userType = args.userType;

    await ctx.db.patch(args.userId, updates);
    return { success: true };
  },
});

export const completeOnboarding = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      onboardingCompleted: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

function getDefaultCategories() {
  return [
    // Income categories
    { name: "Salary", type: "income", icon: "briefcase", color: "#22c55e" },
    { name: "Freelance", type: "income", icon: "laptop", color: "#10b981" },
    { name: "Allowance", type: "income", icon: "wallet", color: "#14b8a6" },
    { name: "Scholarship", type: "income", icon: "award", color: "#06b6d4" },
    { name: "Investment Returns", type: "income", icon: "trending-up", color: "#8b5cf6" },
    { name: "Other Income", type: "income", icon: "plus-circle", color: "#6b7280" },
    // Expense categories
    { name: "Food", type: "expense", icon: "utensils", color: "#f97316" },
    { name: "Transport", type: "expense", icon: "car", color: "#3b82f6" },
    { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#8b5cf6" },
    { name: "Entertainment", type: "expense", icon: "film", color: "#ec4899" },
    { name: "Bills & Utilities", type: "expense", icon: "zap", color: "#ef4444" },
    { name: "Healthcare", type: "expense", icon: "heart", color: "#10b981" },
    { name: "Education", type: "expense", icon: "book-open", color: "#6366f1" },
    { name: "Rent & Housing", type: "expense", icon: "home", color: "#f43f5e" },
    { name: "Subscriptions", type: "expense", icon: "repeat", color: "#a855f7" },
    { name: "Personal Care", type: "expense", icon: "smile", color: "#f59e0b" },
    { name: "Savings", type: "expense", icon: "piggy-bank", color: "#14b8a6" },
    { name: "Miscellaneous", type: "expense", icon: "more-horizontal", color: "#6b7280" },
  ];
}
