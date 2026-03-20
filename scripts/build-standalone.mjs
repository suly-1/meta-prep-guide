#!/usr/bin/env node
/**
 * build-standalone.mjs
 *
 * Rebuilds the standalone guide and uploads all assets to CDN.
 * Prints the new shareable link at the end.
 *
 * Usage:  pnpm build:standalone
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist/standalone");

// ─── Step 1: Build ────────────────────────────────────────────────────────────
console.log("\n🔨 Building standalone app...");
execSync("npx vite build --config vite.standalone.config.ts", {
  cwd: ROOT,
  stdio: "inherit",
});
console.log("✓ Build complete");

// ─── Step 2: Read the generated HTML ─────────────────────────────────────────
const htmlPath = resolve(DIST, "index.standalone.html");
let html = readFileSync(htmlPath, "utf-8");

// Find the main app JS and CSS references in the HTML
const assetRefs = [...html.matchAll(/(?:src|href)=["'](\/?assets\/[^"']+)['"]/g)].map(
  (m) => m[1]
);
console.log(`\n📦 HTML asset references: ${assetRefs.join(", ")}`);

// ─── Step 3: Upload helper ────────────────────────────────────────────────────
function uploadFile(filePath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const result = spawnSync("manus-upload-file", [filePath], {
      encoding: "utf-8",
      timeout: 120_000,
    });
    const output = (result.stdout || "") + (result.stderr || "");
    const match = output.match(/CDN URL:\s*(https:\/\/\S+)/);
    if (match) return match[1];
    if (i < retries - 1) {
      console.warn(`  ⚠ Retry ${i + 1} for ${filePath}`);
    }
  }
  throw new Error(`Failed to upload ${filePath} after ${retries} attempts`);
}

// ─── Step 4: Upload CSS ───────────────────────────────────────────────────────
const cssRef = assetRefs.find((r) => r.endsWith(".css"));
const appJsRef = assetRefs.find((r) => r.includes("app.") && r.endsWith(".js"));

let cssCdnUrl = null;
if (cssRef) {
  const cssPath = resolve(DIST, cssRef.replace(/^\//, ""));
  console.log(`\n⬆ Uploading CSS...`);
  cssCdnUrl = uploadFile(cssPath);
  console.log(`  → ${cssCdnUrl}`);
}

// ─── Step 5: Read app.js and find all chunk references ───────────────────────
const appJsPath = resolve(DIST, appJsRef.replace(/^\//, ""));
let appJs = readFileSync(appJsPath, "utf-8");

const chunkRefs = [...new Set(appJs.match(/"assets\/[^"]+\.js"/g) || [])].map(
  (s) => s.slice(1, -1) // strip quotes
);
console.log(`\n📦 Found ${chunkRefs.length} lazy chunk references in app.js`);

// ─── Step 6: Upload all chunks in parallel batches ───────────────────────────
const BATCH = 10;
const chunkMap = {};

async function uploadBatch(batch) {
  return Promise.all(
    batch.map(async (ref) => {
      const p = resolve(DIST, ref);
      try {
        const url = uploadFile(p);
        process.stdout.write(".");
        return [ref, url];
      } catch {
        process.stdout.write("✗");
        return [ref, null];
      }
    })
  );
}

console.log("\n⬆ Uploading chunks (parallel):");
for (let i = 0; i < chunkRefs.length; i += BATCH) {
  const batch = chunkRefs.slice(i, i + BATCH);
  const results = await uploadBatch(batch);
  for (const [ref, url] of results) {
    if (url) chunkMap[ref] = url;
  }
}
const uploaded = Object.keys(chunkMap).length;
console.log(`\n✓ Uploaded ${uploaded}/${chunkRefs.length} chunks`);

// ─── Step 7: Patch app.js with CDN chunk URLs ─────────────────────────────────
let patchedJs = appJs;
for (const [ref, cdnUrl] of Object.entries(chunkMap)) {
  patchedJs = patchedJs.replaceAll(`"${ref}"`, `"${cdnUrl}"`);
}

const patchedJsPath = resolve(DIST, "assets/app.patched.js");
writeFileSync(patchedJsPath, patchedJs);

console.log("\n⬆ Uploading patched app.js...");
const appJsCdnUrl = uploadFile(patchedJsPath);
console.log(`  → ${appJsCdnUrl}`);

// ─── Step 8: Patch the HTML ───────────────────────────────────────────────────
let patchedHtml = html;
if (cssCdnUrl && cssRef) {
  patchedHtml = patchedHtml.replace(`href="${cssRef}"`, `href="${cssCdnUrl}"`);
  patchedHtml = patchedHtml.replace(`href="/${cssRef.replace(/^\//, '')}"`, `href="${cssCdnUrl}"`);
}
patchedHtml = patchedHtml.replace(`src="${appJsRef}"`, `src="${appJsCdnUrl}"`);
patchedHtml = patchedHtml.replace(`src="/${appJsRef.replace(/^\//, '')}"`, `src="${appJsCdnUrl}"`);

const finalHtmlPath = resolve(DIST, "meta-ic67-prep-guide-latest.html");
writeFileSync(finalHtmlPath, patchedHtml);

// ─── Step 9: Upload final HTML ────────────────────────────────────────────────
console.log("\n⬆ Uploading final HTML...");
const finalCdnUrl = uploadFile(finalHtmlPath);

console.log(`
${"=".repeat(60)}
✅  SHAREABLE LINK (copy this):

   ${finalCdnUrl}

${"=".repeat(60)}
`);
