import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Target,
  ArrowRightLeft, ArrowUpRight, ArrowDownRight, Plus, RefreshCw,
} from "lucide-react";
import { formatCurrency, getCategoryColor } from "../lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();

  // Real Convex queries
  const overview = useQuery(
    api.dashboard.getOverview,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const monthlyTrend = useQuery(
    api.dashboard.getMonthlyTrend,
    user?.userId ? { userId: user.userId as any, months: 6 } : "skip"
  );

  const categoryBreakdown = useQuery(
    api.dashboard.getCategoryBreakdown,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const dailySpending = useQuery(
    api.dashboard.getDailySpending,
    user?.userId ? { userId: user.userId as any, days: 30 } : "skip"
  );

  const recentTransactions = useQuery(
    api.dashboard.getRecentTransactions,
    user?.userId ? { userId: user.userId as any, limit: 5 } : "skip"
  );

  const savingsGoals = useQuery(
    api.savingsGoals.list,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const isLoading =
    overview === undefined ||
    monthlyTrend === undefined ||
    categoryBreakdown === undefined;



  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="skeleton h-80 rounded-xl lg:col-span-2" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const budgetUsed = overview.budgetUtilization;
  const activeGoals = (savingsGoals || []).filter((g: { status: string }) => g.status === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </p>
        </div>
        <Link
          to="/transactions"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(overview.totalIncome)}</p>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(overview.totalExpenses)}</p>
          <p className="mt-1 text-xs text-muted-foreground">This month</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Net Savings</p>
            <PiggyBank className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(overview.balance)}</p>
          <p className="mt-1 text-xs text-primary">
            {(overview.savingsRate * 100).toFixed(0)}% savings rate
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Budget Used</p>
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{(budgetUsed * 100).toFixed(0)}%</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetUsed > 0.9 ? "bg-red-500" : budgetUsed > 0.75 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, budgetUsed * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income vs Expense chart */}
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-4">Income vs Expenses</h3>
          {monthlyTrend && monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No monthly data yet. Add some transactions to see trends.
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Spending by Category</h3>
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown.map((c: { name: string; amount: number; color: string }) => ({
                      name: c.name,
                      value: c.amount,
                      color: c.color || getCategoryColor(c.name),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((c: { name: string; color: string }, i: number) => (
                      <Cell key={i} fill={c.color || getCategoryColor(c.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryBreakdown.slice(0, 5).map((cat: { name: string; amount: number; color: string }) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || getCategoryColor(cat.name) }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No expense data yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions + Daily spending */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily spending */}
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-4">Daily Spending (Last 30 Days)</h3>
          {dailySpending && dailySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySpending.map((d: { date: string; expense: number }) => ({
                date: d.date,
                amount: d.expense,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No daily data yet.
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any) => (
                <div key={tx._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                        tx.transactionType === "income" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {tx.transactionType === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[150px]">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.categoryName} · {new Date(tx.transactionDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      tx.transactionType === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.transactionType === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No transactions yet. Add your first one!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Savings & Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings progress */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Savings Goals</h3>
          {activeGoals && activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.slice(0, 3).map((goal: any) => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal._id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No savings goals yet.</p>
          )}
          <Link to="/savings" className="mt-4 flex items-center gap-1 text-xs text-primary hover:underline">
            Manage goals <ArrowRightLeft className="h-3 w-3" />
          </Link>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Income", icon: ArrowUpRight, color: "text-green-500", to: "/transactions" },
              { label: "Add Expense", icon: ArrowDownRight, color: "text-red-500", to: "/transactions" },
              { label: "View Budgets", icon: Target, color: "text-primary", to: "/budgets" },
              { label: "AI Insights", icon: TrendingUp, color: "text-purple-500", to: "/insights" },
              { label: "Analytics", icon: Wallet, color: "text-blue-500", to: "/analytics" },
              { label: "Recurring", icon: RefreshCw, color: "text-amber-500", to: "/recurring" },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
