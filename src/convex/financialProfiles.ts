import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("users"),
    monthlyIncome: v.number(),
    occupation: v.string(),
    studentStatus: v.optional(v.string()),
    institution: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    preferredSavingsTarget: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Upsert: update existing profile or create new one
    const existing = await ctx.db
      .query("financialProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        monthlyIncome: args.monthlyIncome,
        occupation: args.occupation,
        studentStatus: args.studentStatus,
        institution: args.institution,
        academicYear: args.academicYear,
        preferredSavingsTarget: args.preferredSavingsTarget,
        updatedAt: now,
      });
      return { id: existing._id };
    }

    const id = await ctx.db.insert("financialProfiles", {
      userId: args.userId,
      monthlyIncome: args.monthlyIncome,
      occupation: args.occupation,
      studentStatus: args.studentStatus,
      institution: args.institution,
      academicYear: args.academicYear,
      preferredSavingsTarget: args.preferredSavingsTarget,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    monthlyIncome: v.optional(v.number()),
    occupation: v.optional(v.string()),
    studentStatus: v.optional(v.string()),
    institution: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    preferredSavingsTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("financialProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!existing) throw new Error("Financial profile not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.monthlyIncome !== undefined) updates.monthlyIncome = args.monthlyIncome;
    if (args.occupation !== undefined) updates.occupation = args.occupation;
    if (args.studentStatus !== undefined) updates.studentStatus = args.studentStatus;
    if (args.institution !== undefined) updates.institution = args.institution;
    if (args.academicYear !== undefined) updates.academicYear = args.academicYear;
    if (args.preferredSavingsTarget !== undefined) updates.preferredSavingsTarget = args.preferredSavingsTarget;

    await ctx.db.patch(existing._id, updates);
    return { success: true };
  },
});

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("financialProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});
