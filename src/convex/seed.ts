import { v } from "convex/values";
import { mutation } from "./_generated/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const seedDemoData = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const now = Date.now();

    // Check if already seeded
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1);
    if (existing.length > 0) return { seeded: false, reason: "Already has data" };

    // Create financial profile
    await ctx.db.insert("financialProfiles", {
      userId,
      monthlyIncome: 45000,
      occupation: "Software Developer",
      studentStatus: undefined,
      institution: undefined,
      academicYear: undefined,
      preferredSavingsTarget: 15000,
      createdAt: now,
      updatedAt: now,
    });

    // Ensure system categories exist
    const ensureCategory = async (name: string, type: "income" | "expense", color: string) => {
      const existingCat = await ctx.db.query("categories").collect();
      const found = existingCat.find((c) => c.name === name);
      if (found) return found._id;
      return await ctx.db.insert("categories", {
        userId: undefined,
        name,
        type,
        color,
        isSystem: true,
        createdAt: now,
      });
    };

    const food = await ensureCategory("Food", "expense", "#f97316");
    const transport = await ensureCategory("Transport", "expense", "#3b82f6");
    const shopping = await ensureCategory("Shopping", "expense", "#8b5cf6");
    const entertainment = await ensureCategory("Entertainment", "expense", "#ec4899");
    const bills = await ensureCategory("Bills & Utilities", "expense", "#ef4444");
    const healthcare = await ensureCategory("Healthcare", "expense", "#10b981");
    const education = await ensureCategory("Education", "expense", "#6366f1");
    const rent = await ensureCategory("Rent & Housing", "expense", "#f43f5e");
    const subs = await ensureCategory("Subscriptions", "expense", "#a855f7");
    const personal = await ensureCategory("Personal Care", "expense", "#f59e0b");
    const salary = await ensureCategory("Salary", "income", "#22c55e");
    const freelance = await ensureCategory("Freelance", "income", "#10b981");
    const savingsCat = await ensureCategory("Savings", "expense", "#14b8a6");

    // Deterministic pseudo-random generator
    const seedRandom = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const transactionData: Array<{
      categoryId: any;
      transactionType: "income" | "expense";
      amount: number;
      description: string;
      merchant: string;
      transactionDate: number;
      paymentMethod: "cash" | "upi" | "debit_card" | "credit_card" | "bank_transfer" | "wallet" | "other";
      isRecurring: boolean;
    }> = [];

    const now2 = new Date();

    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthDate = new Date(now2.getFullYear(), now2.getMonth() - monthOffset, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

      // Salary
      const salaryAmount = 42000 + Math.round(seedRandom(monthOffset * 100) * 6000);
      transactionData.push({
        categoryId: salary,
        transactionType: "income",
        amount: salaryAmount,
        description: "Monthly Salary",
        merchant: "TechCorp Inc",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime(),
        paymentMethod: "bank_transfer",
        isRecurring: true,
      });

      // Freelance income (some months)
      if (seedRandom(monthOffset * 50) > 0.4) {
        transactionData.push({
          categoryId: freelance,
          transactionType: "income",
          amount: 5000 + Math.round(seedRandom(monthOffset * 77) * 10000),
          description: "Freelance Project",
          merchant: "Client Payment",
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15 + Math.round(seedRandom(monthOffset * 33) * 10)).getTime(),
          paymentMethod: "bank_transfer",
          isRecurring: false,
        });
      }

      // Rent
      transactionData.push({
        categoryId: rent,
        transactionType: "expense",
        amount: 12000,
        description: "Monthly Rent",
        merchant: "Property Management",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime(),
        paymentMethod: "bank_transfer",
        isRecurring: true,
      });

      // Food expenses
      const foodCount = 20 + Math.round(seedRandom(monthOffset * 10 + 1) * 10);
      for (let d = 0; d < foodCount; d++) {
        const day = (d % daysInMonth) + 1;
        const daySeed = monthOffset * 1000 + d;
        const foodAmounts = [150, 200, 250, 300, 350, 450, 180, 220, 280, 520, 380, 120, 160, 240];
        const descriptions = ["Lunch", "Dinner", "Breakfast", "Snacks", "Coffee"];
        const merchants = ["Swiggy", "Zomato", "Café", "Restaurant", "Street Food"];
        const methods: Array<"upi" | "debit_card" | "cash" | "wallet"> = ["upi", "debit_card", "cash", "wallet"];
        transactionData.push({
          categoryId: food,
          transactionType: "expense",
          amount: foodAmounts[Math.round(seedRandom(daySeed) * (foodAmounts.length - 1))],
          description: descriptions[Math.round(seedRandom(daySeed + 1) * 4)],
          merchant: merchants[Math.round(seedRandom(daySeed + 2) * 4)],
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), day).getTime(),
          paymentMethod: methods[Math.round(seedRandom(daySeed + 3) * 3)],
          isRecurring: false,
        });
      }

      // Transport
      const transportCount = 12 + Math.round(seedRandom(monthOffset * 20) * 6);
      for (let d = 0; d < transportCount; d++) {
        const day = (d % daysInMonth) + 1;
        const daySeed = monthOffset * 2000 + d;
        const amounts = [80, 120, 150, 200, 250, 300, 450, 60, 100, 180];
        const descs = ["Uber ride", "Auto", "Bus pass", "Metro", "Fuel"];
        const merchants = ["Uber", "Ola", "Metro", "Bus", "Shell"];
        const methods: Array<"upi" | "wallet" | "cash"> = ["upi", "wallet", "cash"];
        transactionData.push({
          categoryId: transport,
          transactionType: "expense",
          amount: amounts[Math.round(seedRandom(daySeed) * (amounts.length - 1))],
          description: descs[Math.round(seedRandom(daySeed + 1) * 4)],
          merchant: merchants[Math.round(seedRandom(daySeed + 2) * 4)],
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), day).getTime(),
          paymentMethod: methods[Math.round(seedRandom(daySeed + 3) * 2)],
          isRecurring: false,
        });
      }

      // Bills
      transactionData.push({
        categoryId: bills,
        transactionType: "expense",
        amount: 2500 + Math.round(seedRandom(monthOffset * 88) * 500),
        description: "Electricity Bill",
        merchant: "State Electricity Board",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5).getTime(),
        paymentMethod: "upi",
        isRecurring: true,
      });

      transactionData.push({
        categoryId: bills,
        transactionType: "expense",
        amount: 999,
        description: "Internet Plan",
        merchant: "Airtel Xstream",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 8).getTime(),
        paymentMethod: "upi",
        isRecurring: true,
      });

      transactionData.push({
        categoryId: bills,
        transactionType: "expense",
        amount: 599,
        description: "Mobile Recharge",
        merchant: "Jio",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10).getTime(),
        paymentMethod: "wallet",
        isRecurring: true,
      });

      // Subscriptions
      transactionData.push({
        categoryId: subs,
        transactionType: "expense",
        amount: 649,
        description: "Netflix Premium",
        merchant: "Netflix",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3).getTime(),
        paymentMethod: "credit_card",
        isRecurring: true,
      });
      transactionData.push({
        categoryId: subs,
        transactionType: "expense",
        amount: 149,
        description: "Spotify Premium",
        merchant: "Spotify",
        transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 3).getTime(),
        paymentMethod: "upi",
        isRecurring: true,
      });

      // Shopping (occasional)
      if (seedRandom(monthOffset * 44) > 0.3) {
        const shoppingItems = [
          { desc: "Amazon Order", merchant: "Amazon", amounts: [500, 1200, 2500, 3800, 800, 1500] },
          { desc: "Clothes", merchant: "Myntra", amounts: [800, 1500, 2000, 3500] },
          { desc: "Electronics", merchant: "Flipkart", amounts: [2000, 5000, 1200, 8000] },
        ];
        const item = shoppingItems[Math.round(seedRandom(monthOffset * 33) * 2)];
        transactionData.push({
          categoryId: shopping,
          transactionType: "expense",
          amount: item.amounts[Math.round(seedRandom(monthOffset * 66) * (item.amounts.length - 1))],
          description: item.desc,
          merchant: item.merchant,
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10 + Math.round(seedRandom(monthOffset * 55) * 15)).getTime(),
          paymentMethod: (["credit_card", "debit_card", "upi"] as const)[Math.round(seedRandom(monthOffset * 22) * 2)],
          isRecurring: false,
        });
      }

      // Entertainment (occasional)
      if (seedRandom(monthOffset * 99) > 0.4) {
        const eDescs = ["Movie tickets", "Concert", "Gaming", "Board games"];
        const eMerchants = ["PVR", "BookMyShow", "Steam", "Local Cafe"];
        transactionData.push({
          categoryId: entertainment,
          transactionType: "expense",
          amount: 300 + Math.round(seedRandom(monthOffset * 77) * 500),
          description: eDescs[Math.round(seedRandom(monthOffset * 11) * 3)],
          merchant: eMerchants[Math.round(seedRandom(monthOffset * 22) * 3)],
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20 + Math.round(seedRandom(monthOffset * 44) * 8)).getTime(),
          paymentMethod: "upi",
          isRecurring: false,
        });
      }

      // Healthcare (occasional)
      if (seedRandom(monthOffset * 66) > 0.6) {
        transactionData.push({
          categoryId: healthcare,
          transactionType: "expense",
          amount: 500 + Math.round(seedRandom(monthOffset * 44) * 1500),
          description: "Medical visit",
          merchant: "Apollo Clinic",
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12 + Math.round(seedRandom(monthOffset * 88) * 10)).getTime(),
          paymentMethod: "cash",
          isRecurring: false,
        });
      }

      // Education (periodic)
      if (monthOffset === 0 || monthOffset === 3) {
        const eDescs = ["Course fee", "Books", "Certification"];
        const eMerchants = ["Udemy", "Coursera", "Amazon Books"];
        transactionData.push({
          categoryId: education,
          transactionType: "expense",
          amount: 1500 + Math.round(seedRandom(monthOffset * 55) * 2000),
          description: eDescs[Math.round(seedRandom(monthOffset * 12) * 2)],
          merchant: eMerchants[Math.round(seedRandom(monthOffset * 23) * 2)],
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15).getTime(),
          paymentMethod: "credit_card",
          isRecurring: false,
        });
      }

      // Personal care (occasional)
      if (seedRandom(monthOffset * 31) > 0.5) {
        transactionData.push({
          categoryId: personal,
          transactionType: "expense",
          amount: 300 + Math.round(seedRandom(monthOffset * 41) * 400),
          description: "Haircut & grooming",
          merchant: "Local Salon",
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 25).getTime(),
          paymentMethod: "cash",
          isRecurring: false,
        });
      }

      // Monthly savings contribution
      if (salaryAmount > 0) {
        transactionData.push({
          categoryId: savingsCat,
          transactionType: "expense",
          amount: 5000 + Math.round(seedRandom(monthOffset * 13) * 3000),
          description: "Monthly Savings",
          merchant: "Savings Account",
          transactionDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 28).getTime(),
          paymentMethod: "bank_transfer",
          isRecurring: true,
        });
      }
    }

    // Insert all transactions
    for (const tx of transactionData) {
      const clampedDate = Math.min(tx.transactionDate, now);
      await ctx.db.insert("transactions", {
        userId,
        categoryId: tx.categoryId,
        transactionType: tx.transactionType,
        amount: tx.amount,
        description: tx.description,
        merchant: tx.merchant,
        transactionDate: clampedDate,
        paymentMethod: tx.paymentMethod,
        source: "seed",
        isRecurring: tx.isRecurring,
        createdAt: clampedDate,
        updatedAt: clampedDate,
      });
    }

    // Create budgets
    const currentMonthStart = new Date(now2.getFullYear(), now2.getMonth(), 1).getTime();
    const currentMonthEnd = new Date(now2.getFullYear(), now2.getMonth() + 1, 0, 23, 59, 59).getTime();

    await ctx.db.insert("budgets", {
      userId,
      name: "Food Budget",
      amount: 8000,
      periodType: "monthly",
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
      categoryId: food,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("budgets", {
      userId,
      name: "Shopping Budget",
      amount: 5000,
      periodType: "monthly",
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
      categoryId: shopping,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("budgets", {
      userId,
      name: "Total Expenses",
      amount: 30000,
      periodType: "monthly",
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
      createdAt: now,
      updatedAt: now,
    });

    // Create savings goals
    await ctx.db.insert("savingsGoals", {
      userId,
      name: "Emergency Fund",
      targetAmount: 100000,
      currentAmount: 42000,
      targetDate: new Date(now2.getFullYear() + 1, 5, 1).getTime(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("savingsGoals", {
      userId,
      name: "New Laptop",
      targetAmount: 80000,
      currentAmount: 35000,
      targetDate: new Date(now2.getFullYear(), 11, 15).getTime(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("savingsGoals", {
      userId,
      name: "Vacation Fund",
      targetAmount: 30000,
      currentAmount: 8000,
      targetDate: new Date(now2.getFullYear() + 1, 2, 1).getTime(),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create recurring transactions
    await ctx.db.insert("recurringTransactions", {
      userId,
      categoryId: rent,
      description: "Monthly Rent",
      amount: 12000,
      frequency: "monthly",
      nextDate: new Date(now2.getFullYear(), now2.getMonth() + 1, 1).getTime(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("recurringTransactions", {
      userId,
      categoryId: subs,
      description: "Netflix Subscription",
      amount: 649,
      frequency: "monthly",
      nextDate: new Date(now2.getFullYear(), now2.getMonth() + 1, 3).getTime(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("recurringTransactions", {
      userId,
      categoryId: subs,
      description: "Spotify Premium",
      amount: 149,
      frequency: "monthly",
      nextDate: new Date(now2.getFullYear(), now2.getMonth() + 1, 3).getTime(),
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create subscriptions
    await ctx.db.insert("subscriptions", {
      userId,
      name: "Netflix Premium",
      amount: 649,
      billingCycle: "monthly",
      nextBillingDate: new Date(now2.getFullYear(), now2.getMonth() + 1, 3).getTime(),
      category: "Entertainment",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("subscriptions", {
      userId,
      name: "Spotify Premium",
      amount: 149,
      billingCycle: "monthly",
      nextBillingDate: new Date(now2.getFullYear(), now2.getMonth() + 1, 3).getTime(),
      category: "Music",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return { seeded: true, transactions: transactionData.length };
  },
});
