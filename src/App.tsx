import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { api } from "./convex/_generated/api";
import { Toaster } from "sonner";
import { USE_CONVEX } from "./lib/config";
import {
  localRegister,
  localLogin,
  localLogout,
  localUpdateProfile,
  localSeedDemoData,
} from "./lib/localStore";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetsPage from "./pages/BudgetsPage";
import SavingsPage from "./pages/SavingsPage";
import RecurringPage from "./pages/RecurringPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import InsightsPage from "./pages/InsightsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";

// ── Create Convex client (real or dummy) ────────────────────────────────────

const convexClient = new ConvexReactClient(
  USE_CONVEX ? (import.meta.env.VITE_CONVEX_URL as string) : "http://localhost:0"
);

// ── Types ──────────────────────────────────────────────────────────────────

interface User {
  userId: string;
  name: string;
  email: string;
  userType: string;
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
  seedDemoData: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: "student" | "professional" | "general";
  currency: string;
  timezone: string;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  loading: true,
  seedDemoData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Auth Provider ──────────────────────────────────────────────────────────

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Convex hooks (always called — "skip" prevents execution in local mode)
  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);
  const getCurrentUser = useQuery(
    api.auth.getCurrentUser,
    USE_CONVEX && user?.userId ? { userId: user.userId as any } : "skip"
  );
  const seedMutation = useMutation(api.seed.seedDemoData);

  // Load session from localStorage on mount
  useEffect(() => {
    const storageKey = USE_CONVEX ? "fintrack_user" : "fintrack_currentUser";
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const uid = parsed.userId || parsed.id;
        if (uid) {
          setUser({
            userId: uid,
            name: parsed.name,
            email: parsed.email,
            userType: parsed.userType,
            currency: parsed.currency || "INR",
            timezone: parsed.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            onboardingCompleted: parsed.onboardingCompleted,
          });
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, []);

  // Sync user data from Convex (only in Convex mode)
  useEffect(() => {
    if (!USE_CONVEX || getCurrentUser === undefined) return;
    if (!getCurrentUser && user) {
      setUser(null);
      localStorage.removeItem("fintrack_user");
      return;
    }
    if (getCurrentUser && user) {
      if (
        getCurrentUser.name !== user.name ||
        getCurrentUser.email !== user.email ||
        getCurrentUser.userType !== user.userType ||
        getCurrentUser.onboardingCompleted !== user.onboardingCompleted
      ) {
        const updated: User = {
          userId: user.userId,
          name: getCurrentUser.name,
          email: getCurrentUser.email,
          userType: getCurrentUser.userType,
          currency: getCurrentUser.currency,
          timezone: getCurrentUser.timezone,
          onboardingCompleted: getCurrentUser.onboardingCompleted,
        };
        setUser(updated);
        localStorage.setItem("fintrack_user", JSON.stringify(updated));
      }
    }
  }, [getCurrentUser, user]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (USE_CONVEX) {
        const result = await loginMutation({ email, password });
        const userData: User = {
          userId: result.userId,
          name: result.name,
          email: result.email,
          userType: result.userType,
          currency: "INR",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          onboardingCompleted: result.onboardingCompleted,
        };
        setUser(userData);
        localStorage.setItem("fintrack_user", JSON.stringify(userData));
      } else {
        const result = await localLogin(email, password);
        setUser({
          userId: result.id,
          name: result.name,
          email: result.email,
          userType: result.userType,
          currency: result.currency,
          timezone: result.timezone,
          onboardingCompleted: result.onboardingCompleted,
        });
      }
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      if (USE_CONVEX) {
        const result = await registerMutation({
          email: data.email,
          password: data.password,
          name: data.name,
          userType: data.userType,
          currency: data.currency,
          timezone: data.timezone,
        });
        const userData: User = {
          userId: result.userId,
          name: data.name,
          email: data.email,
          userType: data.userType,
          currency: data.currency,
          timezone: data.timezone,
          onboardingCompleted: false,
        };
        setUser(userData);
        localStorage.setItem("fintrack_user", JSON.stringify(userData));
      } else {
        const result = await localRegister(
          data.email,
          data.password,
          data.name,
          data.userType,
          data.currency,
          data.timezone,
        );
        setUser({
          userId: result.id,
          name: data.name,
          email: data.email,
          userType: data.userType,
          currency: data.currency,
          timezone: data.timezone,
          onboardingCompleted: false,
        });
      }
    },
    [registerMutation],
  );

  const logout = useCallback(() => {
    setUser(null);
    if (USE_CONVEX) {
      localStorage.removeItem("fintrack_user");
    } else {
      localLogout();
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      if (USE_CONVEX) {
        localStorage.setItem("fintrack_user", JSON.stringify(updated));
      } else {
        localUpdateProfile(prev.userId, {
          name: updated.name,
          currency: updated.currency,
          timezone: updated.timezone,
          userType: updated.userType as "student" | "professional" | "general",
        });
      }
      return updated;
    });
  }, []);

  const seedDemoData = useCallback(async () => {
    if (!user?.userId) return;
    if (USE_CONVEX) {
      try {
        await seedMutation({ userId: user.userId as any });
      } catch (err) {
        console.warn("Seed data error:", err);
      }
    } else {
      localSeedDemoData(user.userId);
    }
  }, [user?.userId, seedMutation]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading, seedDemoData }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Route Guards ───────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <MobileNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/recurring" element={<RecurringPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/guidelines" element={<GuidelinesPage />} />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

// ── App Root ───────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <ConvexProvider client={convexClient}>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ConvexProvider>
    </BrowserRouter>
  );
}
