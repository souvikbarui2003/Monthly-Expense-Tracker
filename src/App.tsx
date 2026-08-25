import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "./convex/_generated/api";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
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

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);
  const getCurrentUser = useQuery(
    api.auth.getCurrentUser,
    user?.userId ? { userId: user.userId as any } : "skip"
  );
  const completeOnboardingMutation = useMutation(api.auth.completeOnboarding);
  const seedMutation = useMutation(api.seed.seedDemoData);

  // Load session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fintrack_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.userId) {
          setUser(parsed);
        } else {
          localStorage.removeItem("fintrack_user");
        }
      } catch {
        localStorage.removeItem("fintrack_user");
      }
    }
    setLoading(false);
  }, []);

  // Sync user data from Convex when available
  useEffect(() => {
    if (getCurrentUser === undefined) return; // Still loading, skip
    if (!getCurrentUser && user) {
      // User was deleted from DB — clear session
      setUser(null);
      localStorage.removeItem("fintrack_user");
      return;
    }
    if (getCurrentUser && user) {
      // Only update if data actually changed to prevent unnecessary renders
      if (
        getCurrentUser.name !== user.name ||
        getCurrentUser.email !== user.email ||
        getCurrentUser.userType !== user.userType ||
        getCurrentUser.currency !== user.currency ||
        getCurrentUser.timezone !== user.timezone ||
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
    },
    [loginMutation]
  );

  const register = useCallback(
    async (data: RegisterData) => {
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
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("fintrack_user");
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("fintrack_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const seedDemoData = useCallback(async () => {
    if (!user?.userId) return;
    try {
      await seedMutation({ userId: user.userId as any });
    } catch (err) {
      console.warn("Seed data error:", err);
    }
  }, [user?.userId, seedMutation]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading, seedDemoData }}>
      {children}
    </AuthContext.Provider>
  );
}

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}
