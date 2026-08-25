import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../App";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { USE_CONVEX } from "../lib/config";
import { localGetFinancialProfile, localUpsertFinancialProfile } from "../lib/localStore";
import { User, Briefcase, DollarSign, Target, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [occupation, setOccupation] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [currency, setCurrency] = useState(user?.currency || "INR");

  const convexProfile = useQuery(api.financialProfiles.get, USE_CONVEX && user?.userId ? { userId: user.userId as any } : "skip");
  const localProfile = useMemo(() => !USE_CONVEX && user?.userId ? localGetFinancialProfile(user.userId) : null, [user?.userId]);
  const profile = convexProfile ?? localProfile;

  const updateProfileMutation = useMutation(api.auth.updateProfile);
  const updateFinancialProfile = useMutation(api.financialProfiles.update);
  const createFinancialProfile = useMutation(api.financialProfiles.create);

  useEffect(() => {
    if (profile) {
      setOccupation(profile.occupation || "");
      setMonthlyIncome(profile.monthlyIncome?.toString() || "");
      setSavingsTarget(profile.preferredSavingsTarget?.toString() || "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      if (name !== user?.name || currency !== user?.currency) {
        if (USE_CONVEX) {
          await updateProfileMutation({ userId: user!.userId as any, name: name || undefined, currency: currency || undefined });
        }
        if (name) updateUser({ name, currency });
      }

      const income = parseFloat(monthlyIncome) || 0;
      const target = parseFloat(savingsTarget) || 0;

      if (USE_CONVEX) {
        if (profile) {
          await updateFinancialProfile({ userId: user!.userId as any, occupation: occupation || undefined, monthlyIncome: income || undefined, preferredSavingsTarget: target || undefined });
        } else if (income > 0) {
          await createFinancialProfile({ userId: user!.userId as any, monthlyIncome: income, occupation: occupation || "Not specified", preferredSavingsTarget: target });
        }
      } else {
        localUpsertFinancialProfile(user!.userId, { monthlyIncome: income, occupation: occupation || "Not specified", preferredSavingsTarget: target });
      }

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account and financial profile</p>
      </div>

      {/* Personal Info */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Personal Information</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={user?.email || ""} disabled className="mt-1 flex h-10 w-full rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
              <option value="GBP">£ GBP (British Pound)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">User Type</label>
            <div className="mt-1 flex h-10 items-center rounded-lg border bg-muted px-3 text-sm text-muted-foreground capitalize">
              {user?.userType || "General"}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Profile */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Financial Profile</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Occupation</label>
            <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g., Software Developer" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-sm font-medium">Monthly Income (₹)</label>
            <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="e.g., 45000" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-sm font-medium">Savings Target (₹/month)</label>
            <input type="number" value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)} placeholder="e.g., 15000" className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
