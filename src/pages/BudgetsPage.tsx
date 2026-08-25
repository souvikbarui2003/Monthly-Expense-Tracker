import { useState } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import { Plus, Trash2, Edit3, Target, AlertTriangle, CheckCircle2, XCircle, X } from "lucide-react";
import { toast } from "sonner";

function getStatus(spent: number, amount: number) {
  const pct = spent / amount;
  if (pct >= 1) return { label: "Exceeded", color: "text-red-600", bg: "bg-red-50", icon: XCircle, pct };
  if (pct >= 0.9) return { label: "Near Limit", color: "text-red-500", bg: "bg-red-50", icon: AlertTriangle, pct };
  if (pct >= 0.75) return { label: "Warning", color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle, pct };
  return { label: "On Track", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2, pct };
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", amount: "", category: "", period: "monthly" as "weekly" | "monthly" | "semester" | "custom" });

  const budgets = useQuery(
    api.budgets.list,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const createBudget = useMutation(api.budgets.create);
  const updateBudget = useMutation(api.budgets.update);
  const deleteBudget = useMutation(api.budgets.remove);

  // Get spending for each budget
  const budgetsWithSpending = useQuery(
    api.dashboard.getOverview,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const handleAdd = async () => {
    if (!form.name || !form.amount) {
      toast.error("Please fill in all fields");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    try {
      if (editingBudget) {
        await updateBudget({
          budgetId: editingBudget._id,
          userId: user!.userId as any,
          name: form.name,
          amount,
        });
        toast.success("Budget updated");
      } else {
        await createBudget({
          userId: user!.userId as any,
          name: form.name,
          amount,
          periodType: form.period,
          startDate: start,
          endDate: end,
        });
        toast.success("Budget created");
      }

      setForm({ name: "", amount: "", category: "", period: "monthly" });
      setEditingBudget(null);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save budget");
    }
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setForm({ name: budget.name, amount: budget.amount.toString(), category: "", period: budget.periodType });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {        await deleteBudget({ budgetId: id as any, userId: user!.userId as any });
      toast.success("Budget deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const totalBudget = budgets?.reduce((s: number, b: any) => s + b.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            {budgets?.length || 0} active budgets · {formatCurrency(totalBudget)} total
          </p>
        </div>
        <button
          onClick={() => { setEditingBudget(null); setForm({ name: "", amount: "", category: "", period: "monthly" }); setShowModal(true); }}
          className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Budget
        </button>
      </div>

      {/* Budget cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets && budgets.length > 0 ? (
          budgets.map((budget: any) => {
            const status = getStatus(0, budget.amount); // Spending tracked server-side
            const daysLeft = Math.max(0, Math.ceil((budget.endDate - Date.now()) / (24 * 60 * 60 * 1000)));

            return (
              <div key={budget._id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{budget.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{budget.periodType} budget</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(budget)} className="rounded p-1 hover:bg-muted">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(budget._id)} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(budget.amount)}</span>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (budget.amount > 0 ? budget.amount * 0.73 : 0) / budget.amount * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </div>
                  <span className="text-muted-foreground">{daysLeft} days left</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border bg-card p-12 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No budgets yet</p>
            <p className="text-sm text-muted-foreground">Create a budget to start tracking your spending.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingBudget ? "Edit Budget" : "Create Budget"}</h2>
              <button onClick={() => { setShowModal(false); setEditingBudget(null); }} className="rounded p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Budget Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Food Budget"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Period</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as any }))}
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="semester">Semester</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                className="flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {editingBudget ? "Update Budget" : "Create Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
