// Client test setup — only runs in jsdom environment
// jest-dom matchers are imported in individual test files via:
//   import "@testing-library/jest-dom";

// Polyfill localStorage for jsdom if not already present
if (typeof window !== "undefined" && !window.localStorage) {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    },
  });
}
