import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [react()],
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    // Default environment for server tests
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/**/*.test.tsx",
      "client/**/*.spec.tsx",
      "client/**/*.test.ts",
    ],
    // Inject vitest globals (describe, it, expect, etc.) into every test file
    // Required so @testing-library/jest-dom can call expect.extend() at import time
    globals: true,
    // Per-file environment override: client tests run in jsdom
    environmentMatchGlobs: [
      ["client/**", "jsdom"],
    ],
  },
});
