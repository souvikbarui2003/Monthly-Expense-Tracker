import { useState, useMemo } from "react";
import { useAuth } from "../App";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { USE_CONVEX } from "../lib/config";
import { localGetTransactions, localGetCategories } from "../lib/localStore";
import { formatCurrency, generateCSVExport, downloadFile } from "../lib/utils";
import { Settings, Shield, Download, Bell, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);

  const convexTx = useQuery(api.transactions.list, USE_CONVEX && user?.userId ? { userId: user.userId as any, limit: 1000 } : "skip");
  const convexCats = useQuery(api.categories.list, USE_CONVEX && user?.userId ? { userId: user.userId as any } : "skip");
  const localTx = useMemo(() => !USE_CONVEX && user?.userId ? localGetTransactions(user.userId, { limit: 1000 }) : null, [user?.userId]);
  const localCats = useMemo(() => !USE_CONVEX && user?.userId ? localGetCategories(user.userId) : null, [user?.userId]);
  const transactions = convexTx ?? localTx;
  const categories = convexCats ?? localCats;

  const getCategoryName = (catId: string) => {
    return categories?.find((c: any) => c._id === catId)?.name || "Unknown";
  };

  const handleExport = (fmt: "csv" | "json") => {
    if (!transactions) {
      toast.error("No data to export");
      return;
    }

    const PAYMENT_LABELS: Record<string, string> = {
      cash: "Cash", upi: "UPI", debit_card: "Debit Card", credit_card: "Credit Card",
      bank_transfer: "Bank Transfer", wallet: "Wallet", other: "Other",
    };

    const exportData = transactions.map((tx: any) => ({
      date: new Date(tx.transactionDate).toISOString().split("T")[0],
      description: tx.description,
      merchant: tx.merchant || "",
      category: getCategoryName(tx.categoryId),
      type: tx.transactionType,
      amount: tx.amount,
      paymentMethod: PAYMENT_LABELS[tx.paymentMethod] || tx.paymentMethod,
    }));

    if (fmt === "csv") {
      const csv = generateCSVExport(exportData, ["date", "description", "merchant", "category", "type", "amount", "paymentMethod"]);
      downloadFile(csv, "fintrack-all-data.csv", "text/csv");
      toast.success("CSV exported");
    } else {
      downloadFile(JSON.stringify(exportData, null, 2), "fintrack-all-data.json", "application/json");
      toast.success("JSON exported");
    }
  };

  const handleDeleteAccount = () => {
    logout();
    localStorage.clear();
    toast.success("Account deleted. Your data has been removed.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "Budget Alerts", desc: "Get notified when approaching budget limits", value: budgetAlerts, onChange: setBudgetAlerts },
            { label: "Anomaly Detection", desc: "Alerts for unusual transactions", value: anomalyDetection, onChange: setAnomalyDetection },
            { label: "Weekly Summary", desc: "Receive a weekly spending summary", value: notifications, onChange: setNotifications },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button onClick={() => item.onChange(!item.value)} className={`relative h-6 w-11 rounded-full transition-colors ${item.value ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Data Management</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Export Transactions (CSV)</p>
              <p className="text-xs text-muted-foreground">Download all your transactions as CSV</p>
            </div>
            <button onClick={() => handleExport("csv")} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
              Export CSV
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Export Data (JSON)</p>
              <p className="text-xs text-muted-foreground">Download all your data as JSON</p>
            </div>
            <button onClick={() => handleExport("json")} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Verified</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h2 className="font-semibold text-red-800">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-700 mb-3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button onClick={() => setShowDeleteConfirm(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
          Delete Account
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete your account, all transactions, budgets, and savings data. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleDeleteAccount} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">Yes, Delete Everything</button>
            </div>
          </div>
        </div>
      )}

      {/* App info */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">About FinTrack AI</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>FinTrack AI is an intelligent personal finance assistant. It is not a licensed financial advisor and should not be used as a substitute for professional financial advice.</p>
        </div>
      </div>
    </div>
  );
}
