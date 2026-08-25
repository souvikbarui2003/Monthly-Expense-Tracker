import { useState } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, Target, Pause, Play, Trash2, X, Award } from "lucide-react";
import { toast } from "sonner";

export default function SavingsPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showContribute, setShowContribute] = useState<any>(null);
  const [form, setForm] = useState({ name: "", targetAmount: "", targetDate: "" });
  const [contributeAmount, setContributeAmount] = useState("");

  const goals = useQuery(
    api.savingsGoals.list,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const createGoal = useMutation(api.savingsGoals.create);
  const updateGoal = useMutation(api.savingsGoals.update);
  const deleteGoal = useMutation(api.savingsGoals.remove);
  const contribute = useMutation(api.savingsGoals.contribute);

  const activeGoals = goals?.filter((g: any) => g.status === "active") || [];
  const totalSaved = goals?.reduce((s: number, g: any) => s + g.currentAmount, 0) || 0;
  const totalTarget = goals?.reduce((s: number, g: any) => s + g.targetAmount, 0) || 1;

  const handleAdd = async () => {
    if (!form.name || !form.targetAmount || !form.targetDate) {
      toast.error("Please fill in all fields");
      return;
    }
    const targetAmount = parseFloat(form.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error("Target amount must be greater than zero");
      return;
    }

    try {
      await createGoal({
        userId: user!.userId as any,
        name: form.name,
        targetAmount,
        targetDate: new Date(form.targetDate).getTime(),
      });
      setForm({ name: "", targetAmount: "", targetDate: "" });
      setShowModal(false);
      toast.success("Goal created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create goal");
    }
  };

  const handleContribute = async () => {
    if (!showContribute) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      await contribute({
        goalId: showContribute._id,
        userId: user!.userId as any,
        amount,
      });
      const newTotal = showContribute.currentAmount + amount;
      if (newTotal >= showContribute.targetAmount) {
        toast.success("🎉 Goal completed!");
      } else {
        toast.success(`Added ${formatCurrency(amount)} to ${showContribute.name}`);
      }
      setShowContribute(null);
      setContributeAmount("");
    } catch (err: any) {
      toast.error(err.message || "Failed to contribute");
    }
  };

  const handleTogglePause = async (goal: any) => {
    try {
      await updateGoal({
        goalId: goal._id,
        userId: user!.userId as any,
        status: goal.status === "active" ? "paused" : "active",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal({ goalId: id as any, userId: user!.userId as any });
      toast.success("Goal deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">
            {activeGoals.length} active goals · {formatCurrency(totalSaved)} saved
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Overall Progress</h3>
          <span className="text-sm text-muted-foreground">
            {((totalSaved / totalTarget) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, (totalSaved / totalTarget) * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted-foreground">{formatCurrency(totalSaved)} saved</span>
          <span className="text-muted-foreground">{formatCurrency(totalTarget)} target</span>
        </div>
      </div>

      {/* Goals */}
      <div className="grid gap-4 md:grid-cols-2">
        {goals && goals.length > 0 ? (
          goals.map((goal: any) => {
            const pct = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            const monthsLeft = Math.max(0, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));
            const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;

            return (
              <div
                key={goal._id}
                className={`rounded-xl border bg-card p-5 ${goal.status === "completed" ? "opacity-75" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        goal.status === "completed"
                          ? "bg-green-50 text-green-600"
                          : goal.status === "paused"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {goal.status === "completed" ? <Award className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {goal.status === "completed"
                          ? "Completed!"
                          : goal.status === "paused"
                            ? "Paused"
                            : `Target: ${formatDate(goal.targetDate, "long")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {goal.status !== "completed" && (
                      <button onClick={() => handleTogglePause(goal)} className="rounded p-1 hover:bg-muted">
                        {goal.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button onClick={() => handleDelete(goal._id)} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-sm text-muted-foreground">/ {formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goal.status === "completed" ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>{pct.toFixed(0)}% complete</span>
                  <span>{formatCurrency(remaining)} to go</span>
                </div>

                {goal.status === "active" && monthsLeft > 0 && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs">
                    <p className="text-muted-foreground">
                      Save <span className="font-medium text-foreground">{formatCurrency(monthlyNeeded)}</span>/month to reach your goal
                    </p>
                  </div>
                )}

                {goal.status !== "completed" && (
                  <button
                    onClick={() => setShowContribute(goal)}
                    className="mt-3 w-full rounded-lg border py-2 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Add Funds
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border bg-card p-12 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No savings goals yet</p>
            <p className="text-sm text-muted-foreground">Create a goal to start saving towards something.</p>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">New Savings Goal</h2>
              <button onClick={() => setShowModal(false)} className="rounded p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Goal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., New Laptop"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Amount (₹)</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Date</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handleAdd}
                className="flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContribute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add to {showContribute.name}</h2>
              <button onClick={() => setShowContribute(null)} className="rounded p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current: {formatCurrency(showContribute.currentAmount)} / {formatCurrency(showContribute.targetAmount)}
              </p>
              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={handleContribute}
                className="flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
