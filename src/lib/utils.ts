import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(date: string | number | Date, format: string = "medium"): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  if (format === "short") return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  if (format === "long") return d.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export function getMonthName(month: number): string {
  return new Date(2024, month).toLocaleDateString("en-IN", { month: "long" });
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Food": "#f97316",
    "Transport": "#3b82f6",
    "Shopping": "#8b5cf6",
    "Entertainment": "#ec4899",
    "Bills & Utilities": "#ef4444",
    "Healthcare": "#10b981",
    "Education": "#6366f1",
    "Savings": "#14b8a6",
    "Income": "#22c55e",
    "Rent & Housing": "#f43f5e",
    "Subscriptions": "#a855f7",
    "Personal Care": "#f59e0b",
    "Miscellaneous": "#6b7280",
    "Salary": "#22c55e",
    "Freelance": "#10b981",
    "Allowance": "#14b8a6",
    "Scholarship": "#06b6d4",
    "Investment Returns": "#8b5cf6",
    "Other Income": "#6b7280",
  };
  return colors[category] || "#6b7280";
}

/**
 * Sanitize a cell value for CSV export to prevent formula injection.
 * Cells starting with =, +, -, @, \t, \r are prefixed with a tab character.
 */
export function sanitizeCSVCell(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `"\t${trimmed.replace(/"/g, '""')}"`;
  }
  if (trimmed.includes(",") || trimmed.includes('"') || trimmed.includes("\n")) {
    return `"${trimmed.replace(/"/g, '""')}"`;
  }
  return trimmed;
}

export function generateCSVExport(
  data: Record<string, unknown>[],
  headers: string[]
): string {
  const headerRow = headers.map((h) => sanitizeCSVCell(h)).join(",");
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return sanitizeCSVCell(str);
      })
      .join(",")
  );
  return [headerRow, ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
