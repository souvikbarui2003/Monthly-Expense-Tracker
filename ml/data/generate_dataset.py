#!/usr/bin/env python3
"""
FinTrack AI - Synthetic Financial Dataset Generator

Generates realistic financial transaction data for ML model training.
The data is entirely synthetic and should never be mistaken for real individual records.

Features:
- 100,000+ transaction records
- Realistic spending patterns for students and professionals
- Temporal patterns (weekday/weekend, monthly cycles, semester patterns)
- Category-appropriate spending distributions
- Payment method distributions
- Merchant name generation
"""

import os
import json
import random
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

# Configuration
NUM_USERS = 500
NUM_TRANSACTIONS_MIN = 100000
NUM_TRANSACTIONS_MAX = 150000
SEED = 42

random.seed(SEED)
np.random.seed(SEED)

# --- Category Definitions ---

STUDENT_EXPENSE_CATEGORIES = {
    "Food": {
        "subcategories": ["Food Delivery", "Groceries", "Restaurant", "Café", "Street Food"],
        "merchants": ["Swiggy", "Zomato", "BigBasket", "Restaurant", "Café Coffee Day",
                       "McDonald's", "Subway", "Local Dhaba", "Campus Canteen", "Amul Store"],
        "amount_range": (80, 600),
        "frequency_weight": 0.30,
    },
    "Transport": {
        "subcategories": ["Cab", "Public Transit", "Fuel", "Parking", "Bike Share"],
        "merchants": ["Uber", "Ola", "Metro", "Bus", "Auto", "Rapido", "Petrol Pump"],
        "amount_range": (30, 500),
        "frequency_weight": 0.18,
    },
    "Shopping": {
        "subcategories": ["Electronics", "Clothing", "Stationery", "Accessories"],
        "merchants": ["Amazon", "Flipkart", "Myntra", "Decathlon", "Local Store"],
        "amount_range": (200, 5000),
        "frequency_weight": 0.08,
    },
    "Entertainment": {
        "subcategories": ["Movies", "Gaming", "Events", "Outings"],
        "merchants": ["PVR", "BookMyShow", "Steam", "PlayStation", "Local Cafe"],
        "amount_range": (100, 1500),
        "frequency_weight": 0.06,
    },
    "Bills & Utilities": {
        "subcategories": ["Electricity", "Internet", "Phone", "Water"],
        "merchants": ["State Electricity Board", "Airtel", "Jio", "BSNL", "ACT Fibernet"],
        "amount_range": (300, 2500),
        "frequency_weight": 0.08,
    },
    "Healthcare": {
        "subcategories": ["Medical", "Pharmacy", "Dental", "Vision"],
        "merchants": ["Apollo Clinic", "CVS Pharmacy", "Local Doctor", "Lenskart"],
        "amount_range": (200, 3000),
        "frequency_weight": 0.03,
    },
    "Education": {
        "subcategories": ["Tuition", "Books", "Courses", "Certification"],
        "merchants": ["Udemy", "Coursera", "Amazon Books", "College Fee", " coaching center"],
        "amount_range": (500, 10000),
        "frequency_weight": 0.06,
    },
    "Personal Care": {
        "subcategories": ["Grooming", "Fitness", "Personal"],
        "merchants": ["Local Salon", " gym", "Nykaa", "Health & Glow"],
        "amount_range": (150, 2000),
        "frequency_weight": 0.04,
    },
    "Subscriptions": {
        "subcategories": ["Streaming", "Software", "Cloud", "Music"],
        "merchants": ["Netflix", "Spotify", "YouTube Premium", "Adobe", "Canva", "GitHub"],
        "amount_range": (100, 800),
        "frequency_weight": 0.05,
    },
    "Miscellaneous": {
        "subcategories": ["Gifts", "Donations", "Other"],
        "merchants": ["Gift Shop", "Temple", "Other"],
        "amount_range": (100, 2000),
        "frequency_weight": 0.06,
    },
}

STUDENT_INCOME_CATEGORIES = {
    "Allowance": {
        "amount_range": (5000, 20000),
        "frequency": "monthly",
        "merchants": ["Family Transfer", "Bank Transfer"],
    },
    "Scholarship": {
        "amount_range": (10000, 50000),
        "frequency": "quarterly",
        "merchants": ["University", "Scholarship Committee"],
    },
    "Part-time Income": {
        "amount_range": (2000, 15000),
        "frequency": "irregular",
        "merchants": ["Tutoring Center", "Freelance Client", "Campus Job"],
    },
}

PROFESSIONAL_EXPENSE_CATEGORIES = {
    "Food": {
        "subcategories": ["Food Delivery", "Groceries", "Restaurant", "Café", "Lunch"],
        "merchants": ["Swiggy", "Zomato", "BigBasket", "Restaurant", "Café",
                       "Domino's", "KFC", "Subway", "Local Restaurant"],
        "amount_range": (100, 800),
        "frequency_weight": 0.25,
    },
    "Transport": {
        "subcategories": ["Cab", "Fuel", "Public Transit", "Parking", "Maintenance"],
        "merchants": ["Uber", "Ola", "Metro", "Shell", "BP", "Parking"],
        "amount_range": (50, 600),
        "frequency_weight": 0.12,
    },
    "Rent & Housing": {
        "subcategories": ["Rent", "Maintenance", "Furnishing"],
        "merchants": ["Landlord", "Housing Society", "IKEA", "Local Furniture"],
        "amount_range": (8000, 25000),
        "frequency_weight": 0.10,
    },
    "Shopping": {
        "subcategories": ["Electronics", "Clothing", "Home", "Gifts"],
        "merchants": ["Amazon", "Flipkart", "Myntra", "IKEA", "Local Store"],
        "amount_range": (500, 10000),
        "frequency_weight": 0.08,
    },
    "Entertainment": {
        "subcategories": ["Movies", "Dining Out", "Events", "Travel"],
        "merchants": ["PVR", "BookMyShow", "Restaurant", "MakeMyTrip"],
        "amount_range": (200, 5000),
        "frequency_weight": 0.06,
    },
    "Bills & Utilities": {
        "subcategories": ["Electricity", "Internet", "Phone", "Water", "Gas"],
        "merchants": ["State Electricity Board", "Airtel", "Jio", "Indane Gas"],
        "amount_range": (500, 5000),
        "frequency_weight": 0.08,
    },
    "Healthcare": {
        "subcategories": ["Medical", "Insurance", "Pharmacy", "Dental"],
        "merchants": ["Hospital", "Insurance Co.", "Pharmacy", "Doctor"],
        "amount_range": (500, 10000),
        "frequency_weight": 0.04,
    },
    "Insurance": {
        "subcategories": ["Health", "Life", "Vehicle", "Travel"],
        "merchants": ["LIC", "ICICI Lombard", "HDFC Ergo", "Bajaj Allianz"],
        "amount_range": (1000, 8000),
        "frequency_weight": 0.03,
    },
    "Subscriptions": {
        "subcategories": ["Streaming", "Software", "Gym", "Cloud"],
        "merchants": ["Netflix", "Spotify", "Adobe", "Gym", "GitHub", "Notion"],
        "amount_range": (100, 2000),
        "frequency_weight": 0.05,
    },
    "Personal Care": {
        "subcategories": ["Grooming", "Fitness", "Personal"],
        "merchants": ["Salon", "Gym", "Store"],
        "amount_range": (200, 3000),
        "frequency_weight": 0.04,
    },
    "Investments": {
        "subcategories": ["Mutual Fund", "Stocks", "Fixed Deposit", "PPF"],
        "merchants": ["Groww", "Zerodha", "SBI Mutual Fund", "HDFC Bank"],
        "amount_range": (1000, 30000),
        "frequency_weight": 0.04,
    },
    "Miscellaneous": {
        "subcategories": ["Gifts", "Repairs", "Other"],
        "merchants": ["Gift Shop", "Repair Shop", "Other"],
        "amount_range": (200, 5000),
        "frequency_weight": 0.05,
    },
}

PROFESSIONAL_INCOME_CATEGORIES = {
    "Salary": {
        "amount_range": (25000, 100000),
        "frequency": "monthly",
        "merchants": ["Employer", "Company Salary"],
    },
    "Freelance": {
        "amount_range": (5000, 30000),
        "frequency": "irregular",
        "merchants": ["Freelance Client", "Upwork", "Fiverr"],
    },
    "Investment Returns": {
        "amount_range": (500, 10000),
        "frequency": "quarterly",
        "merchants": ["Broker", "Bank Interest"],
    },
}

PAYMENT_METHODS = ["cash", "upi", "debit_card", "credit_card", "bank_transfer", "wallet"]
PAYMENT_WEIGHTS_STUDENT = [0.20, 0.35, 0.20, 0.05, 0.10, 0.10]
PAYMENT_WEIGHTS_PROFESSIONAL = [0.10, 0.25, 0.20, 0.20, 0.15, 0.10]

AGE_GROUPS = ["18-21", "22-25", "26-30", "31-35", "36-45"]
CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata",
          "Ahmedabad", "Jaipur", "Lucknow", "Bhopal", "Indore", "Nagpur", "Kochi"]


def generate_user(user_id: int) -> Dict:
    """Generate a user profile."""
    is_student = random.random() < 0.5
    user_type = "student" if is_student else "professional"

    if is_student:
        age_group = random.choices(["18-21", "22-25"], weights=[0.6, 0.4])[0]
        monthly_income = np.random.lognormal(mean=9.5, sigma=0.4)  # ~13K-20K
        monthly_income = max(5000, min(30000, round(monthly_income / 100) * 100))
        occupation = random.choice(["Student", "Intern", "Part-time Worker"])
    else:
        age_group = random.choices(["22-25", "26-30", "31-35", "36-45"], weights=[0.3, 0.35, 0.2, 0.15])[0]
        monthly_income = np.random.lognormal(mean=10.8, sigma=0.5)  # ~30K-70K
        monthly_income = max(20000, min(200000, round(monthly_income / 1000) * 1000))
        occupation = random.choice(["Software Engineer", "Data Analyst", "Product Manager",
                                     "Consultant", "Designer", "Marketing", "Finance", "Doctor", "Teacher"])

    return {
        "user_id": f"U{user_id:05d}",
        "age_group": age_group,
        "user_type": user_type,
        "occupation": occupation,
        "city": random.choice(CITIES),
        "monthly_income": monthly_income,
    }


def generate_transactions(user: Dict, start_date: datetime, end_date: datetime) -> List[Dict]:
    """Generate realistic transactions for a user."""
    transactions = []
    is_student = user["user_type"] == "student"
    categories = STUDENT_EXPENSE_CATEGORIES if is_student else PROFESSIONAL_EXPENSE_CATEGORIES
    income_categories = STUDENT_INCOME_CATEGORIES if is_student else PROFESSIONAL_INCOME_CATEGORIES
    payment_weights = PAYMENT_WEIGHTS_STUDENT if is_student else PAYMENT_WEIGHTS_PROFESSIONAL

    # Generate monthly income transactions
    current_date = start_date
    while current_date <= end_date:
        for inc_cat, inc_info in income_categories.items():
            if inc_info["frequency"] == "monthly" or (inc_info["frequency"] == "quarterly" and current_date.month % 3 == 1):
                if inc_info["frequency"] == "monthly" or random.random() < 0.35:
                    amount = round(np.random.uniform(*inc_info["amount_range"]) / 100) * 100
                    # Income is usually at month start
                    day = min(random.randint(1, 5), 28)
                    tx_date = current_date.replace(day=day)
                    if tx_date > end_date:
                        continue
                    merchant = random.choice(inc_info["merchants"])
                    transactions.append({
                        "transaction_id": f"TX{len(transactions):07d}",
                        "user_id": user["user_id"],
                        "date": tx_date.strftime("%Y-%m-%d"),
                        "description": f"{inc_cat} - {merchant}",
                        "merchant": merchant,
                        "amount": amount,
                        "transaction_type": "income",
                        "category": inc_cat,
                        "subcategory": inc_cat,
                        "payment_method": "bank_transfer",
                        "recurring": True,
                        "day_of_week": tx_date.strftime("%A"),
                        "month": tx_date.strftime("%B"),
                        "academic_period": "semester" if is_student else "N/A",
                        "budget_category": inc_cat,
                    })

        # Generate expense transactions for this month
        month_end = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        num_days_in_month = (month_end - current_date.replace(day=1)).days + 1

        for cat_name, cat_info in categories.items():
            # Number of transactions per category per month
            base_freq = cat_info["frequency_weight"]
            if is_student and cat_name == "Education":
                base_freq *= 2  # Students spend more on education
            if not is_student and cat_name == "Rent & Housing":
                base_freq = 1  # Fixed monthly

            num_tx = max(1, int(np.random.poisson(base_freq * 15)))

            for _ in range(num_tx):
                # Day of month
                if cat_name in ["Bills & Utilities", "Rent & Housing", "Insurance", "Subscriptions"]:
                    day = random.randint(1, 10)  # Bills usually early month
                elif random.random() < 0.7:
                    day = random.randint(1, num_days_in_month)  # Spread throughout
                else:
                    day = random.randint(max(1, num_days_in_month - 5), num_days_in_month)  # End of month

                tx_date = current_date.replace(day=min(day, num_days_in_month))
                if tx_date > end_date:
                    continue

                # Weekend adjustment
                is_weekend = tx_date.weekday() >= 5
                amount_min, amount_max = cat_info["amount_range"]
                amount = round(np.random.uniform(amount_min, amount_max) / 10) * 10

                if is_weekend and cat_name in ["Food", "Entertainment"]:
                    amount = int(amount * random.uniform(1.1, 1.5))

                # Monthly salary cycle: more spending around salary dates
                if day <= 5 or day >= 25:
                    if cat_name in ["Shopping", "Entertainment"]:
                        amount = int(amount * random.uniform(1.0, 1.3))

                # Semester patterns for students
                if is_student:
                    month = tx_date.month
                    if month in [6, 7, 12, 1]:  # Semester breaks
                        if cat_name == "Food":
                            amount = int(amount * random.uniform(0.7, 0.9))  # Less food delivery
                        if cat_name == "Transport":
                            amount = int(amount * random.uniform(0.5, 0.8))  # Less transport
                    elif month in [2, 8]:  # Semester start
                        if cat_name == "Education":
                            amount = int(amount * random.uniform(1.5, 3.0))  # Fees
                        if cat_name == "Shopping":
                            amount = int(amount * random.uniform(1.2, 1.8))  # Books/supplies

                merchant = random.choice(cat_info["merchants"])
                subcategory = random.choice(cat_info["subcategories"])
                payment_method = np.random.choice(PAYMENT_METHODS, p=payment_weights)

                description_templates = [
                    f"{merchant} - {subcategory}",
                    f"{subcategory} at {merchant}",
                    f"Payment to {merchant}",
                    f"{cat_name} - {merchant}",
                ]

                transactions.append({
                    "transaction_id": f"TX{len(transactions):07d}",
                    "user_id": user["user_id"],
                    "date": tx_date.strftime("%Y-%m-%d"),
                    "description": random.choice(description_templates),
                    "merchant": merchant,
                    "amount": amount,
                    "transaction_type": "expense",
                    "category": cat_name,
                    "subcategory": subcategory,
                    "payment_method": payment_method,
                    "recurring": cat_name in ["Bills & Utilities", "Subscriptions", "Rent & Housing"],
                    "day_of_week": tx_date.strftime("%A"),
                    "month": tx_date.strftime("%B"),
                    "academic_period": _get_academic_period(tx_date) if is_student else "N/A",
                    "budget_category": cat_name,
                })

        current_date = month_end + timedelta(days=1)

    return transactions


def _get_academic_period(date: datetime) -> str:
    """Determine academic period based on date."""
    month = date.month
    if month in [8, 9, 10, 11, 12]:
        return "Fall Semester"
    elif month in [1, 2, 3, 4, 5]:
        return "Spring Semester"
    else:
        return "Summer Break"


def generate_dataset():
    """Generate the complete synthetic dataset."""
    print(f"Generating dataset with {NUM_USERS} users...")
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2026, 8, 1)

    users = [generate_user(i) for i in range(NUM_USERS)]
    all_transactions = []

    for i, user in enumerate(users):
        if (i + 1) % 50 == 0:
            print(f"  Generating transactions for user {i + 1}/{NUM_USERS}...")
        txns = generate_transactions(user, start_date, end_date)
        all_transactions.extend(txns)

    print(f"Generated {len(all_transactions)} total transactions")

    df = pd.DataFrame(all_transactions)

    # Save dataset
    output_dir = os.path.join(os.path.dirname(__file__), "datasets")
    os.makedirs(output_dir, exist_ok=True)

    csv_path = os.path.join(output_dir, "financial_transactions.csv")
    df.to_csv(csv_path, index=False)
    print(f"Dataset saved to {csv_path}")

    # Save users separately
    users_df = pd.DataFrame(users)
    users_path = os.path.join(output_dir, "users.csv")
    users_df.to_csv(users_path, index=False)
    print(f"Users saved to {users_path}")

    # Generate dataset report
    report = {
        "num_records": len(df),
        "num_users": df["user_id"].nunique(),
        "date_range": f"{df['date'].min()} to {df['date'].max()}",
        "category_distribution": df["category"].value_counts().to_dict(),
        "user_type_distribution": df.merge(users_df, on="user_id")["user_type"].value_counts().to_dict() if "user_type" in users_df.columns else {},
        "average_transaction": float(df["amount"].mean()),
        "median_transaction": float(df["amount"].median()),
        "total_income": float(df[df["transaction_type"] == "income"]["amount"].sum()),
        "total_expenses": float(df[df["transaction_type"] == "expense"]["amount"].sum()),
        "payment_method_distribution": df["payment_method"].value_counts().to_dict(),
        "missing_values": df.isnull().sum().to_dict(),
        "duplicate_ids": int(df["transaction_id"].duplicated().sum()),
    }

    report_path = os.path.join(output_dir, "dataset_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"Report saved to {report_path}")

    return df, users_df


if __name__ == "__main__":
    df, users = generate_dataset()
    print("\n--- Dataset Summary ---")
    print(f"Records: {len(df)}")
    print(f"Users: {df['user_id'].nunique()}")
    print(f"\nCategory Distribution:")
    print(df["category"].value_counts().head(10))
    print(f"\nTransaction Type:")
    print(df["transaction_type"].value_counts())
    print(f"\nPayment Methods:")
    print(df["payment_method"].value_counts())
