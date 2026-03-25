#!/usr/bin/env node
/**
 * deploy-github-pages.mjs
 *
 * Builds the Vite client app using the STANDALONE config (localStorage-only,
 * no backend required) and pushes the dist/standalone folder to the gh-pages branch.
 *
 * Deploys to TWO GitHub Pages sites:
 *   1. suly-1/meta-prep-guide       → www.metaguide.blog  (remote: github)
 *   2. suly-1/meta-interview-guide  → metaengguide.pro    (remote: metaengguide)
 *
 * Usage:  pnpm deploy:github-pages
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, copyFileSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist/standalone");

// ── Step 1: Build with standalone config (no backend, localStorage-only) ────
console.log("📦 Building for GitHub Pages (standalone, base: /)…");
execSync("npx vite build --config vite.standalone.config.ts --base=/", {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

// ── Step 2: Rename standalone HTML to index.html ─────────────────────────────
const standaloneHtml = resolve(DIST, "index.standalone.html");
const indexHtml = resolve(DIST, "index.html");
if (existsSync(standaloneHtml)) {
  copyFileSync(standaloneHtml, indexHtml);
  console.log("📄 Renamed index.standalone.html → index.html");
}

// ── Helper: deploy with a specific CNAME to a specific remote ────────────────
function deployTo(remote, cname, displayUrl) {
  console.log(`📝 Writing CNAME file: ${cname}…`);
  writeFileSync(resolve(DIST, "CNAME"), `${cname}\n`);
  console.log(`🚀 Deploying to gh-pages branch (${remote})…`);
  execSync(
    `node node_modules/gh-pages/bin/gh-pages.js --dist dist/standalone --branch gh-pages --remote ${remote} --message "Deploy to GitHub Pages [skip ci]"`,
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log(`✅ Deployed! Visit: ${displayUrl}`);
}

// ── Step 3: Deploy to suly-1/meta-prep-guide → www.metaguide.blog ────────────
deployTo("github", "www.metaguide.blog", "https://www.metaguide.blog/");

// ── Step 4: Deploy to suly-1/meta-interview-guide → metaengguide.pro ─────────
try {
  execSync("git remote get-url metaengguide", { cwd: ROOT, stdio: "pipe" });
} catch {
  execSync(
    "git remote add metaengguide https://github.com/suly-1/meta-interview-guide.git",
    { cwd: ROOT, stdio: "inherit" }
  );
}
deployTo("metaengguide", "metaengguide.pro", "https://metaengguide.pro/");

// ── Step 5: Post-deploy smoke test ───────────────────────────────────────────
// Wait 10 seconds for GitHub Pages CDN to propagate, then run smoke tests.
// If smoke tests fail, the script exits with code 1 so CI/CD pipelines can
// detect the failure. The site is already deployed at this point — this step
// alerts you before users notice the problem.
// Set SKIP_SMOKE_TEST=1 to skip (e.g. for fast iterative deploys).
if (process.env.SKIP_SMOKE_TEST !== "1") {
  console.log("⏳ Waiting 10s for CDN propagation before smoke test…");
  await new Promise(r => setTimeout(r, 10_000));
  console.log("🔍 Running post-deploy smoke test…");
  try {
    execSync("npx tsx scripts/smoke-test.ts https://www.metaguide.blog", {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.error(
      "⚠️  Smoke test failed — site is deployed but may have issues."
    );
    console.error(
      "   Run manually: npx tsx scripts/smoke-test.ts https://www.metaguide.blog"
    );
    process.exit(1);
  }
} else {
  console.log("⏭  Smoke test skipped (SKIP_SMOKE_TEST=1)");
}
