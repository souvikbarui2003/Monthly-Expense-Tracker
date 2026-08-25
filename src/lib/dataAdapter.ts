/**
 * Data adapter — provides a unified hook interface for both Convex and localStorage modes.
 * Pages import from here instead of directly from convex/react.
 */
import { useAuth } from "../App";
import {
  localGetCategories,
  localGetTransactions,
  localCreateTransaction,
  localUpdateTransaction,
  localDeleteTransaction,
  localGetBudgets,
  localCreateBudget,
  localUpdateBudget,
  localDeleteBudget,
  localGetSavingsGoals,
  localCreateSavingsGoal,
  localUpdateSavingsGoal,
  localContributeSavingsGoal,
  localDeleteSavingsGoal,
  localGetRecurring,
  localCreateRecurring,
  localUpdateRecurring,
  localDeleteRecurring,
  localGetSubscriptions,
  localCreateSubscription,
  localDeleteSubscription,
  localGetFinancialProfile,
  localUpsertFinancialProfile,
  localCompleteOnboarding,
  localGetDashboardOverview,
  localGetMonthlyTrend,
  localGetCategoryBreakdown,
  localGetDailySpending,
  localGetRecentTransactions,
  localSeedDemoData,
} from "./localStore";

// Re-export the USE_CONVEX flag
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;
export const USE_CONVEX = Boolean(CONVEX_URL && CONVEX_URL !== "" && CONVEX_URL !== "undefined");

// ── Dashboard data hooks ───────────────────────────────────────────────────

export function useDashboardOverview(userId: string | undefined) {
  const { user } = useAuth();

  if (USE_CONVEX) {
    // Convex mode — handled by useQuery in the component
    return undefined;
  }

  if (!userId || !user) return undefined;
  return localGetDashboardOverview(userId);
}

export function useMonthlyTrend(userId: string | undefined, months: number) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetMonthlyTrend(userId, months);
}

export function useCategoryBreakdown(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetCategoryBreakdown(userId);
}

export function useDailySpending(userId: string | undefined, days: number) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetDailySpending(userId, days);
}

export function useRecentTransactions(userId: string | undefined, limit: number) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetRecentTransactions(userId, limit);
}

// ── Categories ─────────────────────────────────────────────────────────────

export function useLocalCategories(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetCategories(userId);
}

// ── Transactions ───────────────────────────────────────────────────────────

export function useLocalTransactions(
  userId: string | undefined,
  opts?: {
    search?: string;
    transactionType?: string;
    categoryId?: string;
    limit?: number;
  },
) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetTransactions(userId, opts);
}

export function useCreateLocalTransaction() {
  return async (data: {
    userId: string;
    categoryId: string;
    transactionType: "income" | "expense";
    amount: number;
    description: string;
    merchant?: string;
    transactionDate: number;
    paymentMethod: string;
    isRecurring: boolean;
  }) => {
    localCreateTransaction({
      userId: data.userId,
      categoryId: data.categoryId,
      transactionType: data.transactionType,
      amount: data.amount,
      description: data.description,
      merchant: data.merchant,
      transactionDate: data.transactionDate,
      paymentMethod: data.paymentMethod,
      isRecurring: data.isRecurring,
    });
  };
}

export function useUpdateLocalTransaction() {
  return async (data: {
    transactionId: string;
    userId: string;
    categoryId?: string;
    amount?: number;
    description?: string;
    merchant?: string;
    transactionDate?: number;
    paymentMethod?: string;
  }) => {
    const updates: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.description !== undefined) updates.description = data.description;
    if (data.merchant !== undefined) updates.merchant = data.merchant;
    if (data.transactionDate !== undefined) updates.transactionDate = data.transactionDate;
    if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
    localUpdateTransaction(data.transactionId, data.userId, updates);
  };
}

export function useDeleteLocalTransaction() {
  return async (data: { transactionId: string; userId: string }) => {
    localDeleteTransaction(data.transactionId, data.userId);
  };
}

// ── Budgets ────────────────────────────────────────────────────────────────

export function useLocalBudgets(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetBudgets(userId);
}

export function useCreateLocalBudget() {
  return async (data: {
    userId: string;
    name: string;
    amount: number;
    periodType: "weekly" | "monthly" | "semester" | "custom";
    startDate: number;
    endDate: number;
    categoryId?: string;
  }) => {
    localCreateBudget(data);
  };
}

export function useUpdateLocalBudget() {
  return async (data: {
    budgetId: string;
    userId: string;
    name?: string;
    amount?: number;
  }) => {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.amount !== undefined) updates.amount = data.amount;
    localUpdateBudget(data.budgetId, data.userId, updates);
  };
}

export function useDeleteLocalBudget() {
  return async (data: { budgetId: string; userId: string }) => {
    localDeleteBudget(data.budgetId, data.userId);
  };
}

// ── Savings Goals ──────────────────────────────────────────────────────────

export function useLocalSavingsGoals(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetSavingsGoals(userId);
}

export function useCreateLocalSavingsGoal() {
  return async (data: {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate: number;
  }) => {
    localCreateSavingsGoal({
      userId: data.userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      targetDate: data.targetDate,
      status: "active",
    });
  };
}

export function useContributeLocalSavingsGoal() {
  return async (data: { goalId: string; userId: string; amount: number }) => {
    localContributeSavingsGoal(data.goalId, data.userId, data.amount);
  };
}

export function useUpdateLocalSavingsGoal() {
  return async (data: {
    goalId: string;
    userId: string;
    status?: "active" | "completed" | "paused";
  }) => {
    const updates: Record<string, unknown> = {};
    if (data.status !== undefined) updates.status = data.status;
    localUpdateSavingsGoal(data.goalId, data.userId, updates);
  };
}

export function useDeleteLocalSavingsGoal() {
  return async (data: { goalId: string; userId: string }) => {
    localDeleteSavingsGoal(data.goalId, data.userId);
  };
}

// ── Recurring ──────────────────────────────────────────────────────────────

export function useLocalRecurring(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetRecurring(userId);
}

export function useCreateLocalRecurring() {
  return async (data: {
    userId: string;
    categoryId: string;
    description: string;
    amount: number;
    frequency: string;
    nextDate: number;
  }) => {
    localCreateRecurring({
      userId: data.userId,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      frequency: data.frequency,
      nextDate: data.nextDate,
      active: true,
    });
  };
}

export function useDeleteLocalRecurring() {
  return async (data: { id: string; userId: string }) => {
    localDeleteRecurring(data.id, data.userId);
  };
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export function useLocalSubscriptions(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetSubscriptions(userId);
}

// ── Financial Profile ──────────────────────────────────────────────────────

export function useLocalFinancialProfile(userId: string | undefined) {
  if (USE_CONVEX) return undefined;
  if (!userId) return undefined;
  return localGetFinancialProfile(userId);
}

export function useUpsertLocalFinancialProfile() {
  return async (data: {
    userId: string;
    monthlyIncome: number;
    occupation: string;
    studentStatus?: string;
    institution?: string;
    preferredSavingsTarget: number;
  }) => {
    localUpsertFinancialProfile(data.userId, {
      monthlyIncome: data.monthlyIncome,
      occupation: data.occupation,
      studentStatus: data.studentStatus,
      institution: data.institution,
      preferredSavingsTarget: data.preferredSavingsTarget,
    });
  };
}

export function useLocalCompleteOnboarding() {
  return async (data: { userId: string }) => {
    localCompleteOnboarding(data.userId);
  };
}

// ── Seed ───────────────────────────────────────────────────────────────────

export function useLocalSeedDemoData() {
  return async (data: { userId: string }) => {
    localSeedDemoData(data.userId);
  };
}
