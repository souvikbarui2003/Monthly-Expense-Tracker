import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Wallet, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<"student" | "professional" | "general">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    if (mode === "register") {
      if (!name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      if (name.trim().length < 2) {
        toast.error("Name must be at least 2 characters");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
    }
    if (mode === "login" && password.length < 8) {
      toast.error("Invalid credentials");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        await register({
          email,
          password,
          name: name.trim(),
          userType,
          currency: "INR",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        toast.success("Account created!");
        navigate("/onboarding");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative items-center justify-center">
        <div className="max-w-md text-center p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">FinTrack AI</h2>
          <p className="mt-3 text-muted-foreground">
            Intelligent personal finance management for students and young professionals.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "Smart Tracking", value: "Auto-categorize" },
              { label: "AI Insights", value: "Predictive" },
              { label: "Budget Control", value: "Real-time" },
              { label: "Analytics", value: "Visual" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-card p-4 text-left">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">FinTrack AI</span>
          </div>

          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Enter your credentials to access your account"
              : "Start managing your finances today"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="flex h-10 w-full rounded-lg border bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex h-10 w-full rounded-lg border bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="flex h-10 w-full rounded-lg border bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="text-sm font-medium">I am a...</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {[
                    { value: "student", label: "Student" },
                    { value: "professional", label: "Professional" },
                    { value: "general", label: "General" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUserType(opt.value as typeof userType)}
                      className={`rounded-lg border p-2.5 text-sm font-medium transition-colors ${
                        userType === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
