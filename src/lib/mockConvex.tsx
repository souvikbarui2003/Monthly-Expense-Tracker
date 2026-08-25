import React, { createContext, useContext } from "react";

/**
 * Mock ConvexProvider — satisfies useQuery/useMutation hooks in local mode.
 * Queries always return undefined (which pages interpret as "no data").
 * Mutations throw a clear error if called.
 */

interface MockConvexContext {
  runQuery: (name: string, args: unknown) => unknown;
  runMutation: (name: string, args: unknown) => unknown;
}

const MockConvexContext = createContext<MockConvexContext>({
  runQuery: () => undefined,
  runMutation: () => { throw new Error("Convex not configured — use local mode"); },
});

export function useMockConvex() {
  return useContext(MockConvexContext);
}

/**
 * Provides the same React context shape that Convex's ConvexProvider uses,
 * but without requiring a real Convex backend. This prevents useQuery/useMutation
 * from crashing when VITE_CONVEX_URL is not set.
 */
export function MockConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <MockConvexContext.Provider value={{ runQuery: () => undefined, runMutation: () => { throw new Error("Convex not configured"); } }}>
      {children}
    </MockConvexContext.Provider>
  );
}
