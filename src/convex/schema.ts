import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    userType: v.union(v.literal("student"), v.literal("professional"), v.literal("general")),
    currency: v.string(),
    timezone: v.string(),
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  financialProfiles: defineTable({
    userId: v.id("users"),
    monthlyIncome: v.number(),
    occupation: v.string(),
    studentStatus: v.optional(v.string()),
    institution: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    preferredSavingsTarget: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    isSystem: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_system", ["isSystem"]),

  transactions: defineTable({
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
    mlCategory: v.optional(v.string()),
    mlConfidence: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "transactionDate"])
    .index("by_user_type", ["userId", "transactionType"])
    .index("by_user_category", ["userId", "categoryId"])
    .index("by_user_merchant", ["userId", "merchant"]),

  budgets: defineTable({
    userId: v.id("users"),
    categoryId: v.optional(v.id("categories")),
    name: v.string(),
    amount: v.number(),
    periodType: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("semester"), v.literal("custom")),
    startDate: v.number(),
    endDate: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_period", ["userId", "periodType"]),

  savingsGoals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    targetDate: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  recurringTransactions: defineTable({
    userId: v.id("users"),
    categoryId: v.id("categories"),
    description: v.string(),
    amount: v.number(),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("biweekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    nextDate: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_active", ["userId", "active"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    billingCycle: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    nextBillingDate: v.number(),
    category: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  financialInsights: defineTable({
    userId: v.id("users"),
    insightType: v.union(
      v.literal("spending_increase"),
      v.literal("budget_warning"),
      v.literal("savings_tip"),
      v.literal("recurring_alert"),
      v.literal("anomaly"),
      v.literal("forecast"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    generatedAt: v.number(),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"])
    .index("by_user_type", ["userId", "insightType"])
    .index("by_user_severity", ["userId", "severity"]),
});
