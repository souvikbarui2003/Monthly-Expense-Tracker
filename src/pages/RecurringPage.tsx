import { useState } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, RefreshCw, Trash2, Edit3, X, CreditCard, Pause, Play } from "lucide-react";
import { toast } from "sonner";

const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"] as const;
const FREQUENCY_LABELS: Record<string, string> = { daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };
const CATEGORIES = ["Rent & Housing", "Bills & Utilities", "Subscriptions", "Entertainment", "Food", "Education", "Healthcare", "Shopping", "Miscellaneous"];

export default function RecurringPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly", category: "Subscriptions" });

  const items = useQuery(
    api.recurringTransactions.list,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const subscriptions = useQuery(
    api.subscriptions.list,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const monthlyTotalRecurring = useQuery(
    api.recurringTransactions.getMonthlyTotal,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const monthlyTotalSubs = useQuery(
    api.subscriptions.getMonthlyTotal,
    user?.userId ? { userId: user.userId as any } : "skip"
  );

  const createRecurring = useMutation(api.recurringTransactions.create);
  const updateRecurring = useMutation(api.recurringTransactions.update);
  const deleteRecurring = useMutation(api.recurringTransactions.remove);
  const createSub = useMutation(api.subscriptions.create);
  const updateSub = useMutation(api.subscriptions.update);
  const deleteSub = useMutation(api.subscriptions.remove);

  const allItems = [...(items || []), ...(subscriptions || [])];
  const activeItems = allItems.filter((i: any) => i.active !== false);
  const monthlyRecurring = (monthlyTotalRecurring?.totalMonthly || 0);
  const monthlySubs = (monthlyTotalSubs?.totalMonthly || 0);
  const annualTotal = (monthlyRecurring + monthlySubs) * 12;

  const handleAdd = async () => {
    if (!form.name || !form.amount) { toast.error("Please fill in all fields"); return; }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { toast.error("Amount must be greater than zero"); return; }

    const now = new Date();
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    try {
      if (editingItem) {
        if (editingItem._type === "subscription") {
          await updateSub({ id: editingItem._id, userId: user!.userId as any, name: form.name, amount });
        } else {
          await updateRecurring({ id: editingItem._id, userId: user!.userId as any, description: form.name, amount });
        }
        toast.success("Updated successfully");
      } else {
        // Create as subscription by default
        await createSub({
          userId: user!.userId as any,
          name: form.name,
          amount,
          billingCycle: form.frequency as "monthly",
          nextBillingDate: nextDate,
          category: form.category,
        });
        toast.success("Created successfully");
      }
      setForm({ name: "", amount: "", frequency: "monthly", category: "Subscriptions" });
      setEditingItem(null);
      setShowModal(false);
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const handleToggle = async (item: any) => {
    try {
      if (item._type === "subscription") {
        await updateSub({ id: item._id, userId: user!.userId as any, active: !item.active });
      } else {
        await updateRecurring({ id: item._id, userId: user!.userId as any, active: !item.active });
      }
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (item: any) => {
    try {
      if (item._type === "subscription") {
        await deleteSub({ id: item._id, userId: user!.userId as any });
      } else {
        await deleteRecurring({ id: item._id, userId: user!.userId as any });
      }
      toast.success("Deleted");
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Expenses & Subscriptions</h1>
          <p className="text-sm text-muted-foreground">{activeItems.length} active · {allItems.length} total</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setForm({ name: "", amount: "", frequency: "monthly", category: "Subscriptions" }); setShowModal(true); }}
          className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Monthly Total</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(monthlyRecurring + monthlySubs)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Annual Total</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(annualTotal)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Active Items</p>
          <p className="mt-1 text-2xl font-bold">{activeItems.length}</p>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {allItems.length > 0 ? (
          allItems.map((item: any) => {
            const isSub = item._type === "subscription";
            return (
              <div key={item._id} className={`flex items-center justify-between rounded-xl border bg-card p-4 transition-opacity ${!item.active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isSub ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                    {isSub ? <CreditCard className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name || item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[item.frequency || item.billingCycle] || "Monthly"} · {item.category || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggle(item)} className="rounded p-1 hover:bg-muted">
                      {item.active !== false ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { setEditingItem(item); setForm({ name: item.name || item.description, amount: item.amount.toString(), frequency: item.frequency || item.billingCycle || "monthly", category: item.category || "Subscriptions" }); setShowModal(true); }} className="rounded p-1 hover:bg-muted">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <RefreshCw className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No recurring expenses yet</p>
            <p className="text-sm text-muted-foreground">Add subscriptions and recurring bills.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingItem ? "Edit" : "Add"} Recurring</h2>
              <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Netflix" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm font-medium">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleAdd} className="flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {editingItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
