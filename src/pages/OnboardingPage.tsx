import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Wallet, CheckCircle2 } from "lucide-react";

const steps = ["Welcome", "Your Profile", "Income & Goals", "Categories"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [occupation, setOccupation] = useState("");
  const [studentStatus, setStudentStatus] = useState("");
  const [institution, setInstitution] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Food", "Transport", "Shopping", "Entertainment", "Bills & Utilities",
  ]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const createProfile = useMutation(api.financialProfiles.create);
  const completeOnboarding = useMutation(api.auth.completeOnboarding);

  const defaultCategories = [
    "Food", "Transport", "Shopping", "Entertainment", "Bills & Utilities",
    "Healthcare", "Education", "Rent & Housing", "Subscriptions", "Personal Care",
  ];

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      // Save financial profile to Convex
      const income = parseFloat(monthlyIncome) || 0;
      const target = parseFloat(savingsTarget) || 0;
      if (income > 0) {
        await createProfile({
          userId: user.userId as any,
          monthlyIncome: income,
          occupation: occupation || "Not specified",
          studentStatus: studentStatus || undefined,
          institution: institution || undefined,
          preferredSavingsTarget: target,
        });
      }
      // Mark onboarding complete
      await completeOnboarding({ userId: user.userId as any });
      toast.success("Profile setup complete! Welcome to FinTrack AI.");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`ml-2 h-0.5 w-8 md:w-16 ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{steps[step]}</p>
        </div>

        {/* Step content */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">Welcome to FinTrack AI</h2>
              <p className="mt-2 text-muted-foreground">
                Let&apos;s set up your financial profile so you can start tracking your money smarter.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                This will only take a minute.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Your Profile</h2>
              <p className="text-sm text-muted-foreground">
                Help us personalize your experience.
              </p>
              <div>
                <label className="text-sm font-medium">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g., Software Engineer, Student"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {user?.userType === "student" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Student Status</label>
                    <select
                      value={studentStatus}
                      onChange={(e) => setStudentStatus(e.target.value)}
                      className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select...</option>
                      <option value="day_scholar">Day Scholar</option>
                      <option value="hostel">Hostel Student</option>
                      <option value="pg">Paying Guest</option>
                      <option value="rented">Rented Apartment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Institution</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="College/University name"
                      className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Income & Savings</h2>
              <p className="text-sm text-muted-foreground">
                Set your monthly income and savings target.
              </p>
              <div>
                <label className="text-sm font-medium">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g., 45000"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Savings Target (₹)</label>
                <input
                  type="number"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  placeholder="e.g., 10000"
                  className="mt-1 flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  min="0"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Your Categories</h2>
              <p className="text-sm text-muted-foreground">
                Select the expense categories that matter to you.
              </p>
              <div className="flex flex-wrap gap-2">
                {defaultCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedCategories.includes(cat)
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                You can add more categories later.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={() => {
                if (step === steps.length - 1) {
                  handleComplete();
                } else {
                  setStep(step + 1);
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {step === steps.length - 1 ? "Get Started" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
