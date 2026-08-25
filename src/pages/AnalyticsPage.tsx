import { useState, useMemo } from "react";
import { useAuth } from "../App";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { USE_CONVEX } from "../lib/config";
import { localGetMonthlyTrend, localGetCategoryBreakdown, localGetDailySpending } from "../lib/localStore";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";
import { formatCurrency, getCategoryColor } from "../lib/utils";

const COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#10b981", "#f59e0b", "#6b7280", "#14b8a6", "#f43f5e"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period] = useState("6m");

  const convexMonthly = useQuery(api.dashboard.getMonthlyTrend, USE_CONVEX && user?.userId ? { userId: user.userId as any, months: 6 } : "skip");
  const convexCat = useQuery(api.dashboard.getCategoryBreakdown, USE_CONVEX && user?.userId ? { userId: user.userId as any } : "skip");
  const convexDaily = useQuery(api.dashboard.getDailySpending, USE_CONVEX && user?.userId ? { userId: user.userId as any, days: 30 } : "skip");

  const localMonthly = useMemo(() => !USE_CONVEX && user?.userId ? localGetMonthlyTrend(user.userId, 6) : null, [user?.userId]);
  const localCat = useMemo(() => !USE_CONVEX && user?.userId ? localGetCategoryBreakdown(user.userId) : null, [user?.userId]);
  const localDaily = useMemo(() => !USE_CONVEX && user?.userId ? localGetDailySpending(user.userId, 30) : null, [user?.userId]);

  const monthlyTrend = convexMonthly ?? localMonthly;
  const categoryBreakdown = convexCat ?? localCat;
  const dailySpending = convexDaily ?? localDaily;

  const isLoading = USE_CONVEX ? (monthlyTrend === undefined) : (monthlyTrend === null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
        <div className="grid gap-6 lg:grid-cols-2">{[...Array(2)].map((_, i) => <div key={i} className="skeleton h-80 rounded-xl" />)}</div>
      </div>
    );
  }

  const totalSpent = categoryBreakdown?.reduce((s: number, c: any) => s + c.amount, 0) || 0;
  const avgDaily = dailySpending && dailySpending.length > 0 ? dailySpending.reduce((s: number, d: any) => s + d.expense, 0) / dailySpending.length : 0;
  const avgMonthly = monthlyTrend && monthlyTrend.length > 0 ? monthlyTrend.reduce((s: number, m: any) => s + m.expense, 0) / monthlyTrend.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your financial data</p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Monthly</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(avgMonthly)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Daily</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(avgDaily)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="mt-1 text-xl font-bold">{categoryBreakdown?.reduce((s: number, c: any) => s + c.count, 0) || 0}</p>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Income vs Expenses</h3>
          {monthlyTrend && monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="incGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incGradA)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGradA)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Category Breakdown</h3>
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown.map((c: any) => ({ name: c.name, value: c.amount }))}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Daily Spending (Last 30 Days)</h3>
          {dailySpending && dailySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailySpending.map((d: any) => ({ date: d.date, amount: d.expense, isWeekend: new Date(d.dateKey).getDay() % 6 === 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {dailySpending.map((_: any, i: number) => <Cell key={i} fill={i % 7 >= 5 ? "#ec4899" : "#3b82f6"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Weekday</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-pink-500" /> Weekend</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-4">Spending by Category</h3>
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryBreakdown.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {categoryBreakdown.slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>
      </div>

      {/* Spending insights */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Spending Insights</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Highest Category</p>
              <p className="mt-1 text-lg font-bold" style={{ color: COLORS[0] }}>{categoryBreakdown[0]?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(categoryBreakdown[0]?.amount || 0)} this period</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Total Categories</p>
              <p className="mt-1 text-lg font-bold text-purple-600">{categoryBreakdown.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active spending categories</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="mt-1 text-lg font-bold text-blue-600">{categoryBreakdown.reduce((s: number, c: any) => s + c.count, 0)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Across all categories</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
