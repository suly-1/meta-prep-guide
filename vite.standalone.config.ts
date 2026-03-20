/**
 * Standalone build config — produces a static site with separate JS/CSS files.
 * Uses hash-based routing so it works from any CDN URL.
 *
 * Usage: npx vite build --config vite.standalone.config.ts
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Redirect tRPC client to the standalone mock
      "@/lib/trpc": path.resolve(
        import.meta.dirname,
        "client/src/lib/trpc.standalone.ts"
      ),
      // Redirect useAuth to the standalone mock
      "@/_core/hooks/useAuth": path.resolve(
        import.meta.dirname,
        "client/src/_core/hooks/useAuth.standalone.ts"
      ),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  // Use the standalone HTML entry point
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/standalone"),
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      // Use the standalone HTML as the entry
      input: path.resolve(import.meta.dirname, "client/index.standalone.html"),
      output: {
        manualChunks: undefined,
        entryFileNames: "assets/app.[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
});
