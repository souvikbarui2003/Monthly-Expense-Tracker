/**
 * LocalStore — localStorage-based data layer for FinTrack AI.
 * Used when VITE_CONVEX_URL is not configured (no Convex backend).
 *
 * Provides register/login + full CRUD for all financial entities.
 * All data is scoped per user via a simple userId derived from the email.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  userType: "student" | "professional" | "general";
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LocalCategory {
  _id: string;
  userId: string | undefined;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  isSystem: boolean;
  createdAt: number;
}

export interface LocalTransaction {
  _id: string;
  userId: string;
  categoryId: string;
  transactionType: "income" | "expense";
  amount: number;
  description: string;
  merchant?: string;
  transactionDate: number;
  paymentMethod: string;
  source?: string;
  isRecurring: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LocalBudget {
  _id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  periodType: "weekly" | "monthly" | "semester" | "custom";
  startDate: number;
  endDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface LocalSavingsGoal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: number;
  status: "active" | "completed" | "paused";
  createdAt: number;
  updatedAt: number;
}

export interface LocalRecurring {
  _id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  frequency: string;
  nextDate: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LocalSubscription {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: number;
  category: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LocalFinancialProfile {
  _id: string;
  userId: string;
  monthlyIncome: number;
  occupation: string;
  studentStatus?: string;
  institution?: string;
  academicYear?: string;
  preferredSavingsTarget: number;
  createdAt: number;
  updatedAt: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PREFIX = "fintrack_";

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

// Simple hash for passwords (same approach as Convex auth.ts)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "fintrack_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Auth ───────────────────────────────────────────────────────────────────

export function getCurrentLocalUser(): LocalUser | null {
  const raw = localStorage.getItem(PREFIX + "currentUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentLocalUser(user: LocalUser | null): void {
  if (user) {
    localStorage.setItem(PREFIX + "currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem(PREFIX + "currentUser");
  }
}

export async function localRegister(
  email: string,
  password: string,
  name: string,
  userType: "student" | "professional" | "general",
  currency: string,
  timezone: string,
): Promise<LocalUser> {
  const users = load<LocalUser>("users");
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const now = Date.now();
  const passwordHash = await hashPassword(password);
  const user: LocalUser = {
    id: `user_${uid()}`,
    email: email.toLowerCase(),
    passwordHash,
    name,
    userType,
    currency,
    timezone,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };

  users.push(user);
  save("users", users);

  // Create default categories
  const cats = load<LocalCategory>("categories");
  const defaultCats = getDefaultCategories();
  for (const dc of defaultCats) {
    cats.push({
      _id: `cat_${uid()}`,
      userId: undefined,
      name: dc.name,
      type: dc.type as "income" | "expense",
      icon: dc.icon,
      color: dc.color,
      isSystem: true,
      createdAt: now,
    });
  }
  save("categories", cats);

  setCurrentLocalUser(user);
  return user;
}

export async function localLogin(
  email: string,
  password: string,
): Promise<LocalUser> {
  const users = load<LocalUser>("users");
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  setCurrentLocalUser(user);
  return user;
}

export function localLogout(): void {
  setCurrentLocalUser(null);
}

export function localCompleteOnboarding(userId: string): void {
  const users = load<LocalUser>("users");
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx].onboardingCompleted = true;
    users[idx].updatedAt = Date.now();
    save("users", users);
    setCurrentLocalUser(users[idx]);
  }
}

export function localUpdateProfile(
  userId: string,
  updates: Partial<Pick<LocalUser, "name" | "currency" | "timezone" | "userType">>,
): void {
  const users = load<LocalUser>("users");
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates, updatedAt: Date.now() };
    save("users", users);
    setCurrentLocalUser(users[idx]);
  }
}

// ── Categories ─────────────────────────────────────────────────────────────

export function localGetCategories(userId?: string): LocalCategory[] {
  const all = load<LocalCategory>("categories");
  const system = all.filter((c) => c.isSystem);
  const userCats = userId ? all.filter((c) => c.userId === userId) : [];
  return [...system, ...userCats];
}

export function localCreateCategory(
  userId: string,
  name: string,
  type: "income" | "expense",
  color?: string,
): LocalCategory {
  const cats = load<LocalCategory>("categories");
  const cat: LocalCategory = {
    _id: `cat_${uid()}`,
    userId,
    name,
    type,
    color,
    isSystem: false,
    createdAt: Date.now(),
  };
  cats.push(cat);
  save("categories", cats);
  return cat;
}

// ── Transactions ───────────────────────────────────────────────────────────

export function localGetTransactions(
  userId: string,
  opts?: {
    search?: string;
    transactionType?: string;
    categoryId?: string;
    startDate?: number;
    endDate?: number;
    paymentMethod?: string;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
  },
): LocalTransaction[] {
  let txs = load<LocalTransaction>("transactions").filter(
    (t) => t.userId === userId,
  );

  txs.sort((a, b) => b.transactionDate - a.transactionDate);

  if (opts?.startDate) txs = txs.filter((t) => t.transactionDate >= opts.startDate!);
  if (opts?.endDate) txs = txs.filter((t) => t.transactionDate <= opts.endDate!);
  if (opts?.transactionType) txs = txs.filter((t) => t.transactionType === opts.transactionType);
  if (opts?.categoryId) txs = txs.filter((t) => t.categoryId === opts.categoryId);
  if (opts?.paymentMethod) txs = txs.filter((t) => t.paymentMethod === opts.paymentMethod);
  if (opts?.minAmount !== undefined) txs = txs.filter((t) => t.amount >= opts.minAmount!);
  if (opts?.maxAmount !== undefined) txs = txs.filter((t) => t.amount <= opts.maxAmount!);
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    txs = txs.filter(
      (t) =>
        t.description.toLowerCase().includes(s) ||
        t.merchant?.toLowerCase().includes(s),
    );
  }

  return txs.slice(0, opts?.limit ?? 500);
}

export function localCreateTransaction(
  tx: Omit<LocalTransaction, "_id" | "createdAt" | "updatedAt">,
): LocalTransaction {
  const all = load<LocalTransaction>("transactions");
  const newTx: LocalTransaction = {
    ...tx,
    _id: `tx_${uid()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  all.push(newTx);
  save("transactions", all);
  return newTx;
}

export function localUpdateTransaction(
  txId: string,
  userId: string,
  updates: Partial<Omit<LocalTransaction, "_id" | "createdAt" | "userId">>,
): void {
  const all = load<LocalTransaction>("transactions");
  const idx = all.findIndex((t) => t._id === txId && t.userId === userId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    save("transactions", all);
  }
}

export function localDeleteTransaction(txId: string, userId: string): void {
  const all = load<LocalTransaction>("transactions");
  save(
    "transactions",
    all.filter((t) => !(t._id === txId && t.userId === userId)),
  );
}

// ── Budgets ────────────────────────────────────────────────────────────────

export function localGetBudgets(userId: string): LocalBudget[] {
  return load<LocalBudget>("budgets")
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function localCreateBudget(
  b: Omit<LocalBudget, "_id" | "createdAt" | "updatedAt">,
): LocalBudget {
  const all = load<LocalBudget>("budgets");
  const nb: LocalBudget = { ...b, _id: `bud_${uid()}`, createdAt: Date.now(), updatedAt: Date.now() };
  all.push(nb);
  save("budgets", all);
  return nb;
}

export function localUpdateBudget(
  budgetId: string,
  userId: string,
  updates: Partial<Omit<LocalBudget, "_id" | "createdAt" | "userId">>,
): void {
  const all = load<LocalBudget>("budgets");
  const idx = all.findIndex((b) => b._id === budgetId && b.userId === userId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    save("budgets", all);
  }
}

export function localDeleteBudget(budgetId: string, userId: string): void {
  const all = load<LocalBudget>("budgets");
  save("budgets", all.filter((b) => !(b._id === budgetId && b.userId === userId)));
}

// ── Savings Goals ──────────────────────────────────────────────────────────

export function localGetSavingsGoals(userId: string): LocalSavingsGoal[] {
  return load<LocalSavingsGoal>("savingsGoals").filter((g) => g.userId === userId);
}

export function localCreateSavingsGoal(
  g: Omit<LocalSavingsGoal, "_id" | "createdAt" | "updatedAt">,
): LocalSavingsGoal {
  const all = load<LocalSavingsGoal>("savingsGoals");
  const ng: LocalSavingsGoal = { ...g, _id: `sg_${uid()}`, createdAt: Date.now(), updatedAt: Date.now() };
  all.push(ng);
  save("savingsGoals", all);
  return ng;
}

export function localUpdateSavingsGoal(
  goalId: string,
  userId: string,
  updates: Partial<Omit<LocalSavingsGoal, "_id" | "createdAt" | "userId">>,
): void {
  const all = load<LocalSavingsGoal>("savingsGoals");
  const idx = all.findIndex((g) => g._id === goalId && g.userId === userId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    save("savingsGoals", all);
  }
}

export function localContributeSavingsGoal(
  goalId: string,
  userId: string,
  amount: number,
): void {
  const all = load<LocalSavingsGoal>("savingsGoals");
  const idx = all.findIndex((g) => g._id === goalId && g.userId === userId);
  if (idx >= 0) {
    const goal = all[idx];
    const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    all[idx] = {
      ...goal,
      currentAmount: newAmount,
      status: newAmount >= goal.targetAmount ? "completed" : goal.status,
      updatedAt: Date.now(),
    };
    save("savingsGoals", all);
  }
}

export function localDeleteSavingsGoal(goalId: string, userId: string): void {
  const all = load<LocalSavingsGoal>("savingsGoals");
  save("savingsGoals", all.filter((g) => !(g._id === goalId && g.userId === userId)));
}

// ── Recurring Transactions ─────────────────────────────────────────────────

export function localGetRecurring(userId: string): LocalRecurring[] {
  return load<LocalRecurring>("recurring").filter((r) => r.userId === userId);
}

export function localCreateRecurring(
  r: Omit<LocalRecurring, "_id" | "createdAt" | "updatedAt">,
): LocalRecurring {
  const all = load<LocalRecurring>("recurring");
  const nr: LocalRecurring = { ...r, _id: `rec_${uid()}`, createdAt: Date.now(), updatedAt: Date.now() };
  all.push(nr);
  save("recurring", all);
  return nr;
}

export function localUpdateRecurring(
  id: string,
  userId: string,
  updates: Partial<Omit<LocalRecurring, "_id" | "createdAt" | "userId">>,
): void {
  const all = load<LocalRecurring>("recurring");
  const idx = all.findIndex((r) => r._id === id && r.userId === userId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    save("recurring", all);
  }
}

export function localDeleteRecurring(id: string, userId: string): void {
  const all = load<LocalRecurring>("recurring");
  save("recurring", all.filter((r) => !(r._id === id && r.userId === userId)));
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export function localGetSubscriptions(userId: string): LocalSubscription[] {
  return load<LocalSubscription>("subscriptions").filter((s) => s.userId === userId);
}

export function localCreateSubscription(
  s: Omit<LocalSubscription, "_id" | "createdAt" | "updatedAt">,
): LocalSubscription {
  const all = load<LocalSubscription>("subscriptions");
  const ns: LocalSubscription = { ...s, _id: `sub_${uid()}`, createdAt: Date.now(), updatedAt: Date.now() };
  all.push(ns);
  save("subscriptions", all);
  return ns;
}

export function localDeleteSubscription(id: string, userId: string): void {
  const all = load<LocalSubscription>("subscriptions");
  save("subscriptions", all.filter((s) => !(s._id === id && s.userId === userId)));
}

// ── Financial Profile ──────────────────────────────────────────────────────

export function localGetFinancialProfile(
  userId: string,
): LocalFinancialProfile | null {
  return (
    load<LocalFinancialProfile>("profiles").find((p) => p.userId === userId) ??
    null
  );
}

export function localUpsertFinancialProfile(
  userId: string,
  data: Omit<LocalFinancialProfile, "_id" | "createdAt" | "updatedAt" | "userId">,
): LocalFinancialProfile {
  const all = load<LocalFinancialProfile>("profiles");
  const idx = all.findIndex((p) => p.userId === userId);
  const now = Date.now();

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data, updatedAt: now };
    save("profiles", all);
    return all[idx];
  }

  const profile: LocalFinancialProfile = {
    _id: `fp_${uid()}`,
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  all.push(profile);
  save("profiles", all);
  return profile;
}

// ── Seed Demo Data ─────────────────────────────────────────────────────────

export function localSeedDemoData(userId: string): { seeded: boolean; transactions: number } {
  const txs = load<LocalTransaction>("transactions");
  if (txs.some((t) => t.userId === userId)) {
    return { seeded: false, transactions: 0 };
  }

  const now = Date.now();
  const nowDate = new Date();
  const cats = localGetCategories();

  const findCat = (name: string) => cats.find((c) => c.name === name);

  const food = findCat("Food");
  const transport = findCat("Transport");
  const shopping = findCat("Shopping");
  const entertainment = findCat("Entertainment");
  const bills = findCat("Bills & Utilities");
  const healthcare = findCat("Healthcare");
  const education = findCat("Education");
  const rent = findCat("Rent & Housing");
  const subs = findCat("Subscriptions");
  const salary = findCat("Salary");
  const freelance = findCat("Freelance");

  const seedRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const newTxs: LocalTransaction[] = [];

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - monthOffset, 1);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    // Salary
    if (salary) {
      const amt = 42000 + Math.round(seedRandom(monthOffset * 100) * 6000);
      newTxs.push(makeTx(userId, salary._id, "income", amt, "Monthly Salary", "TechCorp Inc", new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime(), "bank_transfer", true));
    }

    // Freelance (some months)
    if (freelance && seedRandom(monthOffset * 50) > 0.4) {
      newTxs.push(makeTx(userId, freelance._id, "income", 5000 + Math.round(seedRandom(monthOffset * 77) * 10000), "Freelance Project", "Client Payment", new Date(monthDate.getFullYear(), monthDate.getMonth(), 15 + Math.round(seedRandom(monthOffset * 33) * 10)).getTime(), "bank_transfer", false));
    }

    // Rent
    if (rent) {
      newTxs.push(makeTx(userId, rent._id, "expense", 12000, "Monthly Rent", "Property Management", new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime(), "bank_transfer", true));
    }

    // Food
    if (food) {
      const foodCount = 20 + Math.round(seedRandom(monthOffset * 10 + 1) * 10);
      const foodAmounts = [150, 200, 250, 300, 350, 450, 180, 220, 280, 520];
      const descriptions = ["Lunch", "Dinner", "Breakfast", "Snacks"];
      const merchants = ["Swiggy", "Zomato", "Cafe", "Restaurant"];
      for (let d = 0; d < foodCount; d++) {
        const day = (d % daysInMonth) + 1;
        const daySeed = monthOffset * 1000 + d;
        newTxs.push(makeTx(userId, food._id, "expense", foodAmounts[Math.round(seedRandom(daySeed) * (foodAmounts.length - 1))], descriptions[Math.round(seedRandom(daySeed + 1) * 3)], merchants[Math.round(seedRandom(daySeed + 2) * 3)], new Date(monthDate.getFullYear(), monthDate.getMonth(), day).getTime(), "upi", false));
      }
    }

    // Transport
    if (transport) {
      const transportCount = 12 + Math.round(seedRandom(monthOffset * 20) * 6);
      const amounts = [80, 120, 150, 200, 250, 300];
      const descs = ["Uber ride", "Auto", "Bus pass", "Metro"];
      for (let d = 0; d < transportCount; d++) {
        const day = (d % daysInMonth) + 1;
        const daySeed = monthOffset * 2000 + d;
        newTxs.push(makeTx(userId, transport._id, "expense", amounts[Math.round(seedRandom(daySeed) * (amounts.length - 1))], descs[Math.round(seedRandom(daySeed + 1) * 3)], "Uber", new Date(monthDate.getFullYear(), monthDate.getMonth(), day).getTime(), "wallet", false));
      }
    }

    // Bills
    if (bills) {
      newTxs.push(makeTx(userId, bills._id, "expense", 2500 + Math.round(seedRandom(monthOffset * 88) * 500), "Electricity Bill", "State Electricity Board", new Date(monthDate.getFullYear(), monthDate.getMonth(), 5).getTime(), "upi", true));
      newTxs.push(makeTx(userId, bills._id, "expense", 999, "Internet Plan", "Airtel Xstream", new Date(monthDate.getFullYear(), monthDate.getMonth(), 8).getTime(), "upi", true));
      newTxs.push(makeTx(userId, bills._id, "expense", 599, "Mobile Recharge", "Jio", new Date(monthDate.getFullYear(), monthDate.getMonth(), 10).getTime(), "wallet", true));
    }

    // Subscriptions
    if (subs) {
      newTxs.push(makeTx(userId, subs._id, "expense", 649, "Netflix Premium", "Netflix", new Date(monthDate.getFullYear(), monthDate.getMonth(), 3).getTime(), "credit_card", true));
      newTxs.push(makeTx(userId, subs._id, "expense", 149, "Spotify Premium", "Spotify", new Date(monthDate.getFullYear(), monthDate.getMonth(), 3).getTime(), "upi", true));
    }

    // Shopping (occasional)
    if (shopping && seedRandom(monthOffset * 44) > 0.3) {
      newTxs.push(makeTx(userId, shopping._id, "expense", 800 + Math.round(seedRandom(monthOffset * 66) * 3000), "Amazon Order", "Amazon", new Date(monthDate.getFullYear(), monthDate.getMonth(), 10 + Math.round(seedRandom(monthOffset * 55) * 15)).getTime(), "credit_card", false));
    }

    // Entertainment
    if (entertainment && seedRandom(monthOffset * 99) > 0.4) {
      newTxs.push(makeTx(userId, entertainment._id, "expense", 300 + Math.round(seedRandom(monthOffset * 77) * 500), "Movie tickets", "PVR", new Date(monthDate.getFullYear(), monthDate.getMonth(), 20 + Math.round(seedRandom(monthOffset * 44) * 8)).getTime(), "upi", false));
    }

    // Healthcare
    if (healthcare && seedRandom(monthOffset * 66) > 0.6) {
      newTxs.push(makeTx(userId, healthcare._id, "expense", 500 + Math.round(seedRandom(monthOffset * 44) * 1500), "Medical visit", "Apollo Clinic", new Date(monthDate.getFullYear(), monthDate.getMonth(), 12).getTime(), "cash", false));
    }

    // Education (some months)
    if (education && (monthOffset === 0 || monthOffset === 3)) {
      newTxs.push(makeTx(userId, education._id, "expense", 1500 + Math.round(seedRandom(monthOffset * 55) * 2000), "Course fee", "Udemy", new Date(monthDate.getFullYear(), monthDate.getMonth(), 15).getTime(), "credit_card", false));
    }
  }

  // Save transactions
  const allTxs = load<LocalTransaction>("transactions");
  allTxs.push(...newTxs);
  save("transactions", allTxs);

  // Create budgets
  const currentMonthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
  const currentMonthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59).getTime();
  const allBuds = load<LocalBudget>("budgets");
  if (food) allBuds.push(makeBudget(userId, "Food Budget", 8000, "monthly", currentMonthStart, currentMonthEnd, food._id));
  if (shopping) allBuds.push(makeBudget(userId, "Shopping Budget", 5000, "monthly", currentMonthStart, currentMonthEnd, shopping._id));
  allBuds.push(makeBudget(userId, "Total Expenses", 30000, "monthly", currentMonthStart, currentMonthEnd));
  save("budgets", allBuds);

  // Create savings goals
  const allGoals = load<LocalSavingsGoal>("savingsGoals");
  allGoals.push({
    _id: `sg_${uid()}`, userId, name: "Emergency Fund", targetAmount: 100000, currentAmount: 42000,
    targetDate: new Date(nowDate.getFullYear() + 1, 5, 1).getTime(), status: "active", createdAt: now, updatedAt: now,
  });
  allGoals.push({
    _id: `sg_${uid()}`, userId, name: "New Laptop", targetAmount: 80000, currentAmount: 35000,
    targetDate: new Date(nowDate.getFullYear(), 11, 15).getTime(), status: "active", createdAt: now, updatedAt: now,
  });
  allGoals.push({
    _id: `sg_${uid()}`, userId, name: "Vacation Fund", targetAmount: 30000, currentAmount: 8000,
    targetDate: new Date(nowDate.getFullYear() + 1, 2, 1).getTime(), status: "active", createdAt: now, updatedAt: now,
  });
  save("savingsGoals", allGoals);

  // Create recurring
  const allRec = load<LocalRecurring>("recurring");
  if (rent) allRec.push(makeRecurring(userId, rent._id, "Monthly Rent", 12000, "monthly", new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1).getTime()));
  if (subs) {
    allRec.push(makeRecurring(userId, subs._id, "Netflix Subscription", 649, "monthly", new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 3).getTime()));
    allRec.push(makeRecurring(userId, subs._id, "Spotify Premium", 149, "monthly", new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 3).getTime()));
  }
  save("recurring", allRec);

  // Create subscriptions
  const allSubs = load<LocalSubscription>("subscriptions");
  allSubs.push({ _id: `sub_${uid()}`, userId, name: "Netflix Premium", amount: 649, billingCycle: "monthly", nextBillingDate: new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 3).getTime(), category: "Entertainment", active: true, createdAt: now, updatedAt: now });
  allSubs.push({ _id: `sub_${uid()}`, userId, name: "Spotify Premium", amount: 149, billingCycle: "monthly", nextBillingDate: new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 3).getTime(), category: "Music", active: true, createdAt: now, updatedAt: now });
  save("subscriptions", allSubs);

  return { seeded: true, transactions: newTxs.length };
}

// ── Dashboard Helpers ──────────────────────────────────────────────────────

export function localGetDashboardOverview(userId: string) {
  const now = Date.now();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const txs = localGetTransactions(userId, { startDate: monthStart, endDate: now });
  const profile = localGetFinancialProfile(userId);

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const tx of txs) {
    if (tx.transactionType === "income") totalIncome += tx.amount;
    else totalExpenses += tx.amount;
  }

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? balance / totalIncome : 0;

  // All-time
  const allTxs = localGetTransactions(userId);
  let allTimeIncome = 0;
  let allTimeExpenses = 0;
  for (const tx of allTxs) {
    if (tx.transactionType === "income") allTimeIncome += tx.amount;
    else allTimeExpenses += tx.amount;
  }

  // Budgets
  const budgets = localGetBudgets(userId);
  const activeBudgets = budgets.filter((b) => b.startDate <= now && b.endDate >= now);
  let totalBudget = 0;
  let totalBudgetSpent = 0;
  for (const b of activeBudgets) {
    totalBudget += b.amount;
    const budgetTxs = txs.filter((t) => {
      if (t.transactionType !== "expense") return false;
      if (b.categoryId && t.categoryId !== b.categoryId) return false;
      return t.transactionDate >= b.startDate && t.transactionDate <= b.endDate;
    });
    totalBudgetSpent += budgetTxs.reduce((s, t) => s + t.amount, 0);
  }

  // Savings
  const goals = localGetSavingsGoals(userId);
  const activeGoals = goals.filter((g) => g.status === "active");
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    allTimeIncome,
    allTimeExpenses,
    allTimeBalance: allTimeIncome - allTimeExpenses,
    transactionCount: txs.length,
    allTimeTransactionCount: allTxs.length,
    activeBudgetCount: activeBudgets.length,
    totalBudget,
    totalBudgetSpent,
    budgetUtilization: totalBudget > 0 ? totalBudgetSpent / totalBudget : 0,
    activeGoalsCount: activeGoals.length,
    totalSaved,
    totalTarget,
    savingsProgress: totalTarget > 0 ? totalSaved / totalTarget : 0,
    monthlyIncome: profile?.monthlyIncome ?? totalIncome,
  };
}

export function localGetMonthlyTrend(userId: string, months: number) {
  const now = new Date();
  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = monthDate.getTime();
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59).getTime();
    const txs = localGetTransactions(userId, { startDate: monthStart, endDate: monthEnd });
    let income = 0;
    let expense = 0;
    for (const tx of txs) {
      if (tx.transactionType === "income") income += tx.amount;
      else expense += tx.amount;
    }
    results.push({
      month: monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      income, expense, savings: income - expense, transactionCount: txs.length,
    });
  }
  return results;
}

export function localGetCategoryBreakdown(userId: string) {
  const now = Date.now();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const txs = localGetTransactions(userId, { startDate: monthStart, endDate: now, transactionType: "expense" });
  const cats = localGetCategories();

  const categoryTotals: Record<string, { amount: number; count: number; color: string }> = {};
  for (const tx of txs) {
    const cat = cats.find((c) => c._id === tx.categoryId);
    const catName = cat?.name || "Unknown";
    const catColor = cat?.color || "#6b7280";
    if (!categoryTotals[catName]) categoryTotals[catName] = { amount: 0, count: 0, color: catColor };
    categoryTotals[catName].amount += tx.amount;
    categoryTotals[catName].count += 1;
  }

  const total = Object.values(categoryTotals).reduce((s, c) => s + c.amount, 0);
  return Object.entries(categoryTotals)
    .map(([name, data]) => ({ name, ...data, percentage: total > 0 ? data.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export function localGetDailySpending(userId: string, days: number) {
  const now = new Date();
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).getTime();
    const txs = localGetTransactions(userId, { startDate: dayStart, endDate: dayEnd });
    let income = 0;
    let expense = 0;
    for (const tx of txs) {
      if (tx.transactionType === "income") income += tx.amount;
      else expense += tx.amount;
    }
    results.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      income, expense,
    });
  }
  return results;
}

export function localGetRecentTransactions(userId: string, limit: number) {
  const txs = localGetTransactions(userId, { limit });
  const cats = localGetCategories();
  return txs.slice(0, limit).map((tx) => {
    const cat = cats.find((c) => c._id === tx.categoryId);
    return { ...tx, categoryName: cat?.name || "Unknown", categoryColor: cat?.color || "#6b7280" };
  });
}

// ── Internal helpers ───────────────────────────────────────────────────────

function makeTx(
  userId: string,
  categoryId: string,
  transactionType: "income" | "expense",
  amount: number,
  description: string,
  merchant: string,
  transactionDate: number,
  paymentMethod: string,
  isRecurring: boolean,
): LocalTransaction {
  return {
    _id: `tx_${uid()}`,
    userId,
    categoryId,
    transactionType,
    amount,
    description,
    merchant,
    transactionDate,
    paymentMethod: paymentMethod as LocalTransaction["paymentMethod"],
    source: "seed",
    isRecurring,
    createdAt: transactionDate,
    updatedAt: transactionDate,
  };
}

function makeBudget(
  userId: string,
  name: string,
  amount: number,
  periodType: "weekly" | "monthly" | "semester" | "custom",
  startDate: number,
  endDate: number,
  categoryId?: string,
): LocalBudget {
  return {
    _id: `bud_${uid()}`,
    userId,
    name,
    amount,
    periodType,
    startDate,
    endDate,
    categoryId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function makeRecurring(
  userId: string,
  categoryId: string,
  description: string,
  amount: number,
  frequency: string,
  nextDate: number,
): LocalRecurring {
  return {
    _id: `rec_${uid()}`,
    userId,
    categoryId,
    description,
    amount,
    frequency,
    nextDate,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function getDefaultCategories() {
  return [
    { name: "Salary", type: "income", icon: "briefcase", color: "#22c55e" },
    { name: "Freelance", type: "income", icon: "laptop", color: "#10b981" },
    { name: "Allowance", type: "income", icon: "wallet", color: "#14b8a6" },
    { name: "Scholarship", type: "income", icon: "award", color: "#06b6d4" },
    { name: "Other Income", type: "income", icon: "plus-circle", color: "#6b7280" },
    { name: "Food", type: "expense", icon: "utensils", color: "#f97316" },
    { name: "Transport", type: "expense", icon: "car", color: "#3b82f6" },
    { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#8b5cf6" },
    { name: "Entertainment", type: "expense", icon: "film", color: "#ec4899" },
    { name: "Bills & Utilities", type: "expense", icon: "zap", color: "#ef4444" },
    { name: "Healthcare", type: "expense", icon: "heart", color: "#10b981" },
    { name: "Education", type: "expense", icon: "book-open", color: "#6366f1" },
    { name: "Rent & Housing", type: "expense", icon: "home", color: "#f43f5e" },
    { name: "Subscriptions", type: "expense", icon: "repeat", color: "#a855f7" },
    { name: "Personal Care", type: "expense", icon: "smile", color: "#f59e0b" },
    { name: "Savings", type: "expense", icon: "piggy-bank", color: "#14b8a6" },
    { name: "Miscellaneous", type: "expense", icon: "more-horizontal", color: "#6b7280" },
  ];
}
