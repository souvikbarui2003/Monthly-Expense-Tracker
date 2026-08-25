import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart3, Brain, Shield, Wallet, Target, TrendingUp,
  Smartphone, Zap, CheckCircle2, CreditCard, PiggyBank, RefreshCw,
} from "lucide-react";

const ParticlesSwarm = lazy(() => import("../components/visuals/ParticlesSwarm"));

const features = [
  { icon: Wallet, title: "Smart Tracking", description: "Record every transaction with automatic ML-powered categorization." },
  { icon: Target, title: "Budget Control", description: "Set monthly, weekly, or semester budgets and track utilization in real time." },
  { icon: Brain, title: "AI Insights", description: "Receive personalized financial insights and spending analysis." },
  { icon: TrendingUp, title: "Forecasting", description: "Predict future spending patterns and budget overruns before they happen." },
  { icon: Shield, title: "Secure & Private", description: "Your financial data is encrypted, isolated, and never shared." },
  { icon: BarChart3, title: "Rich Analytics", description: "Visualize trends, category breakdowns, and daily spending patterns." },
];

const steps = [
  { step: "1", title: "Create Account", desc: "Sign up in seconds with your email." },
  { step: "2", title: "Set Your Profile", desc: "Tell us about your financial goals." },
  { step: "3", title: "Track Everything", desc: "Add transactions manually or import CSV." },
  { step: "4", title: "Get Insights", desc: "Let AI analyze your spending patterns." },
];

const stats = [
  { value: "AI-Powered", label: "Categorization" },
  { value: "Real-time", label: "Analytics" },
  { value: "100%", label: "Free to Use" },
  { value: "Private", label: "Data Security" },
];

const studentFeatures = [
  "Semester-level budget tracking",
  "Allowance and part-time income management",
  "Food delivery spending alerts",
  "Student-specific expense categories",
  "Savings goals for textbooks and equipment",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">FinTrack AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/auth" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with Three.js */}
      <section className="relative overflow-hidden border-b min-h-[600px] md:min-h-[700px] flex items-center">
        {/* Three.js background */}
        <Suspense fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-purple-950" />
        }>
          <ParticlesSwarm
            particleCount={16000}
            speed={1.2}
            interactive={false}
            className="absolute inset-0 z-0"
          />
        </Suspense>

        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-background/90 via-background/70 to-background/40" />

        <div className="relative z-[2] mx-auto max-w-6xl px-4 py-20 md:py-32 w-full">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur-sm px-3 py-1 text-xs font-medium">
              <Zap className="h-3 w-3 text-primary" />
              AI-Powered Personal Finance
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Take Control of Your
              <span className="text-primary"> Financial Future</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl">
              The intelligent personal finance assistant designed for students and young professionals.
              Track spending, manage budgets, and get AI-powered insights — all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Start Tracking Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background/80 backdrop-blur-sm px-8 py-3.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4 gap-8 px-4 py-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-bold md:text-xl">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              From daily expense tracking to AI-powered financial analysis — built for real life.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border p-6 hover:shadow-sm transition-shadow">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Get started in four simple steps.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student focus */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                <Smartphone className="h-3 w-3" />
                Built for Students
              </div>
              <h2 className="text-3xl font-bold">
                Smart Budgeting for
                <span className="text-primary"> College Life</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Track your monthly allowance, manage semester budgets, and never overspend on food delivery again.
                FinTrack AI understands student finances.
              </p>
              <ul className="mt-6 space-y-3">
                {studentFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Budget</span>
                  <span className="text-sm text-muted-foreground">₹8,200 / ₹10,000</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: "82%" }} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-lg font-bold">₹42K</p>
                    <p className="text-xs text-muted-foreground">Income</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-lg font-bold">₹28K</p>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-lg font-bold text-primary">₹14K</p>
                    <p className="text-xs text-muted-foreground">Saved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to Take Control?</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Join thousands of students and young professionals managing their finances smarter with FinTrack AI.
          </p>
          <div className="mt-8">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-semibold">FinTrack AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 FinTrack AI. Built for educational and personal finance management purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
