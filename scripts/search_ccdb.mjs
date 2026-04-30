#!/usr/bin/env node
import { execSync } from "node:child_process";

// -------- Sanitize --------
function sanitize(kw) {
  // Keep only letters, numbers, spaces, and common separators
  return kw.replace(/[^\p{L}\p{N}\s\-_./,]/gu, "").trim();
}

// -------- Parse args --------
const args = process.argv.slice(2);
const terms = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--zh" || args[i] === "--en") {
    const lang = args[i] === "--zh" ? "zh" : "en";
    const kw = args[++i];
    if (kw) terms.push({ keyword: sanitize(kw), lang });
  }
}

if (terms.length === 0) {
  console.error("Usage: node scripts/search_ccdb.mjs --zh <kw> [--zh <syn>] --en <kw> [--en <syn>]");
  process.exit(2);
}

// -------- Search via CLI with retry --------
const FAILED = new Set();

function search(keyword, lang) {
  const maxRetry = 2;
  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    try {
      const raw = execSync(
        `carbonstop search-factors --name "${keyword}" --lang ${lang}`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 30000 }
      );
      const data = JSON.parse(raw);
      if (data.code !== 200) {
        if (attempt < maxRetry) continue;
        console.error(`[search_ccdb] API error: ${keyword} (${lang}) → ${data.msg}`);
        FAILED.add(`${keyword} (${lang})`);
        return [];
      }
      return data.rows || [];
    } catch (err) {
      if (err.message?.includes("API Key") || err.message?.includes("auth")) {
        console.error("[search_ccdb] Auth required. Get a key at https://ccloud-d-test.carbonstop.com/ then:");
        console.error("  npm install -g @carbonstopper/cli");
        console.error("  carbonstop auth login --api-key <your-key>");
        process.exit(2);
      }
      if (attempt < maxRetry) continue;
      console.error(`[search_ccdb] Failed: ${keyword} (${lang}) → ${err.message}`);
      FAILED.add(`${keyword} (${lang})`);
      return [];
    }
  }
}

// -------- Dedup key --------
function dedupKey(row) {
  const id = row.id || "";
  if (id) return `id:${id}`;
  // cValue may be encrypted or empty — still use for dedup, but mark
  const cv = row.cValue || "(missing)";
  return [
    row.name || "",
    cv,
    row.unit || "",
    row.countries || "",
    row.applyYear || "",
    row.institution || "",
  ].join("|");
}

// -------- Execute --------
const seen = new Set();
const allRows = [];
let totalAttempted = 0;
const log = [];

for (const { keyword, lang } of terms) {
  const rows = search(keyword, lang);
  log.push({ keyword, lang, found: rows.length });
  totalAttempted += rows.length;
  for (const row of rows) {
    const key = dedupKey(row);
    if (!seen.has(key)) {
      seen.add(key);
      allRows.push(row);
    }
  }
}

// -------- Summary to stderr --------
console.error(`[search_ccdb] ${terms.length} term(s) → ${allRows.length} unique / ${totalAttempted} raw`);
for (const entry of log) {
  const status = FAILED.has(`${entry.keyword} (${entry.lang})`) ? "FAIL" : `+${entry.found}`;
  console.error(`  ${entry.keyword} [${entry.lang}]: ${status}`);
}

// -------- Output JSON to stdout --------
console.log(JSON.stringify({ total: allRows.length, rows: allRows }));
