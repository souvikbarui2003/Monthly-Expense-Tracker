import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    // Get system categories
    let systemCats = await ctx.db
      .query("categories")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .collect();

    // Get user-specific categories
    let userCats = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let all = [...systemCats, ...userCats];

    if (args.type) {
      all = all.filter((c) => c.type === args.type);
    }

    return all;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Category name is required");

    // Check for duplicates
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Category already exists");
    }

    const categoryId = await ctx.db.insert("categories", {
      userId: args.userId,
      name,
      type: args.type,
      icon: args.icon,
      color: args.color,
      isSystem: false,
      createdAt: Date.now(),
    });

    return { categoryId };
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.categoryId);
    if (!cat) throw new Error("Category not found");
    if (cat.isSystem) throw new Error("Cannot delete system categories");
    if (cat.userId !== args.userId) throw new Error("Unauthorized");

    // Check if category is in use
    const txs = await ctx.db
      .query("transactions")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("categoryId", args.categoryId)
      )
      .take(1);
    if (txs.length > 0) throw new Error("Category is in use by transactions");

    await ctx.db.delete(args.categoryId);
    return { success: true };
  },
});
