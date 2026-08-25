import { useState, useMemo } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { USE_CONVEX } from "../lib/config";
import { localGetCategories, localGetTransactions, localCreateTransaction, localUpdateTransaction, localDeleteTransaction } from "../lib/localStore";
import { formatCurrency, formatDate, generateCSVExport, downloadFile } from "../lib/utils";
import {
  Plus, Search, Download, Upload, Trash2, Edit3,
  ArrowUpRight, ArrowDownRight, X, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Bills & Utilities",
  "Healthcare", "Education", "Rent & Housing", "Subscriptions", "Personal Care",
  "Salary", "Freelance", "Allowance", "Other Income", "Miscellaneous",
];

const PAYMENT_METHODS = ["cash", "upi", "debit_card", "credit_card", "bank_transfer", "wallet", "other"];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash", upi: "UPI", debit_card: "Debit Card", credit_card: "Credit Card",
  bank_transfer: "Bank Transfer", wallet: "Wallet", other: "Other",
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    amount: "", description: "", merchant: "", category: "Food",
    type: "expense" as "income" | "expense", paymentMethod: "upi",
    date: new Date().toISOString().split("T")[0],
  });

  const userId = user?.userId;

  // Convex queries (skip when not connected)
  const convexTransactions = useQuery(api.transactions.list, USE_CONVEX && userId ? { userId: userId as any, search: search || undefined, transactionType: typeFilter !== "all" ? (typeFilter as "income" | "expense") : undefined, limit: 100 } : "skip");
  const convexCategories = useQuery(api.categories.list, USE_CONVEX && userId ? { userId: userId as any } : "skip");

  // Convex mutations
  const convexCreate = useMutation(api.transactions.create);
  const convexUpdate = useMutation(api.transactions.update);
  const convexDelete = useMutation(api.transactions.remove);

  // Local data (immediately available)
  const localTxData = useMemo(() => !USE_CONVEX && userId ? localGetTransactions(userId, { search: search || undefined, transactionType: typeFilter !== "all" ? typeFilter : undefined, limit: 100 }) : null, [userId, search, typeFilter, refreshKey]);
  const localCatData = useMemo(() => !USE_CONVEX && userId ? localGetCategories(userId) : null, [userId, refreshKey]);

  // Merge
  const transactions = convexTransactions ?? localTxData;
  const categories = convexCategories ?? localCatData;

  const filtered = useMemo(() => {
    if (!transactions) return [];
    if (categoryFilter !== "all") {
      const catObj = categories?.find((c: any) => c.name === categoryFilter);
      if (catObj) return transactions.filter((t: any) => t.categoryId === catObj._id);
    }
    return transactions;
  }, [transactions, categories, categoryFilter]);

  const totalIncome = filtered.filter((t: any) => t.transactionType === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpenses = filtered.filter((t: any) => t.transactionType === "expense").reduce((s: number, t: any) => s + t.amount, 0);

  const getCategoryName = (catId: string) => {
    const cat = categories?.find((c: any) => c._id === catId);
    return cat?.name || "Unknown";
  };

  const handleAdd = async () => {
    if (!form.amount || !form.description) { toast.error("Please fill in all required fields"); return; }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { toast.error("Amount must be greater than zero"); return; }
    const catObj = categories?.find((c: any) => c.name === form.category);
    if (!catObj) { toast.error("Invalid category"); return; }

    try {
      if (USE_CONVEX) {
        if (editingTx) {
          await convexUpdate({ transactionId: editingTx._id, userId: userId as any, categoryId: catObj._id as any, amount, description: form.description, merchant: form.merchant || undefined, transactionDate: new Date(form.date).getTime(), paymentMethod: form.paymentMethod as any });
        } else {
          await convexCreate({ userId: userId as any, categoryId: catObj._id as any, transactionType: form.type, amount, description: form.description, merchant: form.merchant || undefined, transactionDate: new Date(form.date).getTime(), paymentMethod: form.paymentMethod as any, isRecurring: false });
        }
      } else {
        if (editingTx) {
          localUpdateTransaction(editingTx._id, userId!, { categoryId: catObj._id, amount, description: form.description, merchant: form.merchant || undefined, transactionDate: new Date(form.date).getTime(), paymentMethod: form.paymentMethod });
        } else {
          localCreateTransaction({ userId: userId!, categoryId: catObj._id, transactionType: form.type, amount, description: form.description, merchant: form.merchant || undefined, transactionDate: new Date(form.date).getTime(), paymentMethod: form.paymentMethod, isRecurring: false });
        }
        setRefreshKey((k) => k + 1);
      }
      toast.success(editingTx ? "Transaction updated" : "Transaction added");
      setForm({ amount: "", description: "", merchant: "", category: "Food", type: "expense", paymentMethod: "upi", date: new Date().toISOString().split("T")[0] });
      setEditingTx(null);
      setShowAddModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save transaction");
    }
  };

  const handleDelete = async (txId: string) => {
    try {
      if (USE_CONVEX) {
        await convexDelete({ transactionId: txId as any, userId: userId as any });
      } else {
        localDeleteTransaction(txId, userId!);
        setRefreshKey((k) => k + 1);
      }
      toast.success("Transaction deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    const catObj = categories?.find((c: any) => c._id === tx.categoryId);
    setForm({
      amount: tx.amount.toString(), description: tx.description, merchant: tx.merchant || "",
      category: catObj?.name || "Food", type: tx.transactionType, paymentMethod: tx.paymentMethod,
      date: new Date(tx.transactionDate).toISOString().split("T")[0],
    });
    setShowAddModal(true);
  };

  const handleExport = (fmt: "csv" | "json") => {
    const exportData = filtered.map((tx: any) => ({
      date: new Date(tx.transactionDate).toISOString().split("T")[0],
      description: tx.description, merchant: tx.merchant || "",
      category: getCategoryName(tx.categoryId), type: tx.transactionType,
      amount: tx.amount, paymentMethod: PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod,
    }));
    if (fmt === "csv") {
      const csv = generateCSVExport(exportData, ["date", "description", "merchant", "category", "type", "amount", "paymentMethod"]);
      downloadFile(csv, "fintrack-transactions.csv", "text/csv");
    } else {
      downloadFile(JSON.stringify(exportData, null, 2), "fintrack-transactions.json", "application/json");
    }
    toast.success(`${fmt.toUpperCase()} exported`);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast.error("CSV file is empty or invalid"); return; }
      const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
        if (values.length < headers.length) continue;
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => (row[h] = values[idx]));
        const amount = parseFloat(row.amount || "0");
        if (isNaN(amount) || amount <= 0) continue;
        const desc = (row.description || "Imported transaction").replace(/^[=+\-@]/, "");
        const merchant = (row.merchant || "").replace(/^[=+\-@]/, "");
        const catName = row.category || "Miscellaneous";
        const catObj = categories?.find((c: any) => c.name === catName);
        try {
          if (USE_CONVEX) {
            await convexCreate({ userId: userId as any, categoryId: (catObj?._id || categories?.find((c: any) => c.name === "Miscellaneous")?._id || "") as any, transactionType: (row.type as "income" | "expense") || "expense", amount, description: desc, merchant: merchant || undefined, transactionDate: row.date ? new Date(row.date).getTime() : Date.now(), paymentMethod: (row.payment_method || row["payment method"] || "other") as any, isRecurring: false });
          } else {
            localCreateTransaction({ userId: userId!, categoryId: catObj?._id || (categories?.find((c: any) => c.name === "Miscellaneous")?._id || ""), transactionType: (row.type as "income" | "expense") || "expense", amount, description: desc, merchant: merchant || undefined, transactionDate: row.date ? new Date(row.date).getTime() : Date.now(), paymentMethod: (row.payment_method || "other"), isRecurring: false });
          }
          imported++;
        } catch { /* skip */ }
      }
      setRefreshKey((k) => k + 1);
      toast.success(`Imported ${imported} transactions`);
      setShowImportModal(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Upload className="h-4 w-4" /><span className="hidden sm:inline">Import CSV</span>
          </button>
          <button onClick={() => handleExport("csv")} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Download className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => { setEditingTx(null); setShowAddModal(true); }} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />Add
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="flex h-10 w-full rounded-lg border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Types</option><option value="income">Income</option><option value="expense">Expense</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No transactions found</p>
            <p className="text-sm text-muted-foreground">Add your first transaction or adjust filters.</p>
          </div>
        ) : (
          filtered.map((tx: any) => (
            <div key={tx._id} className="flex items-center justify-between rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tx.transactionType === "income" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  {tx.transactionType === "income" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.merchant ? `${tx.merchant} · ` : ""}{getCategoryName(tx.categoryId)} · {formatDate(tx.transactionDate, "short")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline">{PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod}</span>
                <span className={`text-sm font-semibold ${tx.transactionType === "income" ? "text-green-600" : "text-red-600"}`}>
                  {tx.transactionType === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
                <button onClick={() => handleEdit(tx)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(tx._id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingTx ? "Edit Transaction" : "Add Transaction"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingTx(null); }} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm((f) => ({ ...f, type: "expense" }))} className={`rounded-lg border p-3 text-sm font-medium ${form.type === "expense" ? "border-red-500 bg-red-50 text-red-600" : "hover:bg-muted"}`}>Expense</button>
                <button type="button" onClick={() => setForm((f) => ({ ...f, type: "income" }))} className={`rounded-lg border p-3 text-sm font-medium ${form.type === "income" ? "border-green-500 bg-green-50 text-green-600" : "hover:bg-muted"}`}>Income</button>
              </div>
              <div>
                <label className="text-sm font-medium">Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0.01" step="0.01" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What was this for?" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-sm font-medium">Merchant</label>
                <input type="text" value={form.merchant} onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))} placeholder="Where?" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {PAYMENT_METHODS.map((m) => (<option key={m} value={m}>{PAYMENT_LABELS[m]}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button onClick={handleAdd} className="flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                {editingTx ? "Update Transaction" : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Import CSV</h2>
              <button onClick={() => setShowImportModal(false)} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload a CSV file with columns: date, description, merchant, category, type, amount, payment_method</p>
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Drag and drop a CSV file or click to browse</p>
                <input type="file" accept=".csv" onChange={handleCSVImport} className="mt-4 w-full text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">Tip: Export your existing data first to see the expected format.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
