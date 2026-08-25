/**
 * Shared configuration — detects whether Convex backend is available.
 * Used by all pages to decide between Convex and local data sources.
 */
const CONVEX_URL = (import.meta.env.VITE_CONVEX_URL as string) || "";
export const USE_CONVEX =
  Boolean(CONVEX_URL) &&
  CONVEX_URL !== "undefined" &&
  CONVEX_URL.startsWith("http");
