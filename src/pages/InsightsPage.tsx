import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  RefreshCw, Zap, Target, BarChart3, Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function InsightsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "spending" | "budget" | "forecast" | "anomalies">("all");
  const [categorizeResult, setCategorizeResult] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);
  const [forecastResult, setForecastResult] = useState<any>(null);

  const overview = useQuery(
    api.dashboard.getOverview,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const budgets = useQuery(
    api.budgets.list,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const monthlyTrend = useQuery(
    api.dashboard.getMonthlyTrend,
    user?.userId ? { userId: user.userId as any, months: 3 } : "skip"
  );

  const modelStatus = useQuery(api.mlInference.getModelStatus, {});

  const insights = useQuery(
    api.insights.list,
    user?.userId ? { userId: user.userId as any, limit: 20 } : "skip"
  );

  const categorizeAction = useAction(api.mlInference.categorize);
  const detectAnomaliesAction = useAction(api.mlInference.detectAnomalies);
  const forecastAction = useAction(api.mlInference.forecast);

  // Generate insights on mount
  useEffect(() => {
    if (!user?.userId) return;

    // Auto-categorize a sample transaction
    categorizeAction({ description: "Swiggy dinner", amount: 380 })
      .then(setCategorizeResult)
      .catch(() => {});

    // Detect anomalies
    detectAnomaliesAction({ userId: user.userId as any })
      .then(setAnomalies)
      .catch(() => {});

    // Get forecast
    forecastAction({ userId: user.userId as any, monthsAhead: 1 })
      .then(setForecastResult)
      .catch(() => {});
  }, [user?.userId]);

  // Build insights from real data
  const computedInsights: Array<{
    type: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
    icon: React.ElementType;
    color: string;
  }> = [];

  // Spending increase insight
  if (monthlyTrend && monthlyTrend.length >= 2) {
    const current = monthlyTrend[monthlyTrend.length - 1];
    const previous = monthlyTrend[monthlyTrend.length - 2];
    if (previous.expense > 0) {
      const change = ((current.expense - previous.expense) / previous.expense) * 100;
      if (Math.abs(change) > 5) {
        computedInsights.push({
          type: "spending_increase",
          title: `Spending ${change > 0 ? "Increased" : "Decreased"} ${Math.abs(change).toFixed(0)}%`,
          message: `Your monthly expenses ${change > 0 ? "increased" : "decreased"} from ${formatCurrency(previous.expense)} to ${formatCurrency(current.expense)}.`,
          severity: change > 20 ? "critical" : change > 10 ? "warning" : "info",
          icon: change > 0 ? TrendingUp : TrendingDown,
          color: change > 0 ? "text-red-600" : "text-green-600",
        });
      }
    }
  }

  // Budget warnings
  if (budgets && budgets.length > 0) {
    const totalBudget = budgets.reduce((s: number, b: any) => s + b.amount, 0);
    const spent = overview?.totalExpenses || 0;
    const utilization = totalBudget > 0 ? spent / totalBudget : 0;

    if (utilization > 0.9) {
      computedInsights.push({
        type: "budget_warning",
        title: `Budget Warning: ${(utilization * 100).toFixed(0)}% Used`,
        message: `You have used ${(utilization * 100).toFixed(0)}% of your total monthly budget. Remaining: ${formatCurrency(Math.max(0, totalBudget - spent))}.`,
        severity: utilization >= 1 ? "critical" : "warning",
        icon: AlertTriangle,
        color: "text-red-600",
      });
    }
  }

  // Savings rate
  if (overview) {
    const savingsRate = overview.savingsRate;
    computedInsights.push({
      type: "savings_tip",
      title: `Savings Rate: ${(savingsRate * 100).toFixed(0)}%`,
      message: savingsRate >= 0.2
        ? `Great job! Your savings rate of ${(savingsRate * 100).toFixed(0)}% exceeds the recommended 20%.`
        : `Your current savings rate is ${(savingsRate * 100).toFixed(0)}%. Financial experts recommend saving at least 20% of your income.`,
      severity: savingsRate >= 0.2 ? "info" : "warning",
      icon: Target,
      color: savingsRate >= 0.2 ? "text-green-600" : "text-amber-600",
    });
  }

  // Monthly summary
  if (overview) {
    computedInsights.push({
      type: "general",
      title: "Monthly Summary",
      message: `This month: ${formatCurrency(overview.totalIncome)} income, ${formatCurrency(overview.totalExpenses)} expenses. Net savings: ${formatCurrency(overview.balance)}.`,
      severity: "info",
      icon: BarChart3,
      color: "text-blue-600",
    });
  }

  // Forecast
  if (forecastResult && forecastResult.predictedAmount > 0) {
    computedInsights.push({
      type: "forecast",
      title: "Spending Forecast",
      message: `Predicted spending for next month: ${formatCurrency(forecastResult.predictedAmount)} (range: ${formatCurrency(forecastResult.range?.low || 0)} – ${formatCurrency(forecastResult.range?.high || 0)}).`,
      severity: "info",
      icon: TrendingUp,
      color: "text-purple-600",
    });
  }

  // ML categorization demo
  if (categorizeResult) {
    computedInsights.push({
      type: "general",
      title: "ML Categorization Active",
      message: `Transaction "Swiggy dinner" → Category: ${categorizeResult.category}, Subcategory: ${categorizeResult.subcategory}, Confidence: ${(categorizeResult.confidence * 100).toFixed(0)}%.`,
      severity: "info",
      icon: Zap,
      color: "text-primary",
    });
  }

  // Filtered insights
  const filtered = activeTab === "all"
    ? computedInsights
    : activeTab === "spending"
      ? computedInsights.filter((i) => i.type === "spending_increase" || i.type === "savings_tip" || i.type === "general")
      : activeTab === "budget"
        ? computedInsights.filter((i) => i.type === "budget_warning")
        : activeTab === "forecast"
          ? computedInsights.filter((i) => i.type === "forecast")
          : computedInsights.filter((i) => i.type === "anomaly");

  const tabs = [
    { id: "all" as const, label: "All Insights" },
    { id: "spending" as const, label: "Spending" },
    { id: "budget" as const, label: "Budget Risk" },
    { id: "forecast" as const, label: "Forecast" },
    { id: "anomalies" as const, label: "Anomalies" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Financial Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">AI-powered insights for your financial health</p>
        </div>
        <button
          onClick={() => {
            if (!user?.userId) return;
            detectAnomaliesAction({ userId: user.userId as any }).then(setAnomalies).catch(() => {});
            forecastAction({ userId: user.userId as any, monthsAhead: 1 }).then(setForecastResult).catch(() => {});
            toast.success("Insights refreshed");
          }}
          className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div key={idx} className="rounded-xl border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    insight.severity === "critical" ? "bg-red-50" : insight.severity === "warning" ? "bg-amber-50" : "bg-blue-50"
                  }`}>
                    <Icon className={`h-5 w-5 ${insight.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{insight.title}</h3>
                      {insight.severity === "critical" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Urgent</span>
                      )}
                      {insight.severity === "warning" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Warning</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Brain className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No insights available yet</p>
            <p className="text-sm text-muted-foreground">Add more transactions to receive personalized insights.</p>
          </div>
        )}
      </div>

      {/* Anomalies section */}
      {anomalies && anomalies.anomalies && anomalies.anomalies.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Unusual Transactions Detected</h3>
          </div>
          <div className="space-y-3">
            {anomalies.anomalies.map((anomaly: any) => (
              <div key={anomaly.transactionId} className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{anomaly.description}</p>
                    <p className="text-sm text-muted-foreground">{anomaly.message}</p>
                    <p className="text-xs text-amber-700 mt-1">{anomaly.deviation} · Z-score: {anomaly.zScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Status */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          ML Model Status
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {modelStatus?.models.map((model: any) => (
            <div key={model.name} className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">{model.name}</p>
              <p className="text-xs text-muted-foreground">{model.description}</p>
              <div className="mt-2 flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${model.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-xs text-muted-foreground">{model.version}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
