#!/usr/bin/env node
import { execSync } from "node:child_process";

// -------- Parse args --------
const args = process.argv.slice(2);
const terms = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--zh" || args[i] === "--en") {
    const lang = args[i] === "--zh" ? "zh" : "en";
    const keyword = args[++i];
    if (keyword) terms.push({ keyword, lang });
  }
}

if (terms.length === 0) {
  console.error("Usage: node scripts/search_ccdb.mjs --zh <keyword> [--zh <synonym>] --en <keyword> [--en <synonym>]");
  console.error("Example: node scripts/search_ccdb.mjs --zh 电力 --en electricity --en \"grid electricity\"");
  process.exit(2);
}

// -------- Search via CLI --------
function search(keyword, lang) {
  try {
    const raw = execSync(
      `npx -y @carbonstopper/cli search-factors --name "${keyword}" --lang ${lang}`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 30000 }
    );
    const data = JSON.parse(raw);
    if (data.code !== 200) {
      console.error(`[search_ccdb] API error (${keyword}): ${data.msg}`);
      return [];
    }
    return data.rows || [];
  } catch (err) {
    if (err.message?.includes("API Key") || err.message?.includes("auth")) {
      console.error("[search_ccdb] Authentication required. Run:");
      console.error("  npm install -g @carbonstopper/cli");
      console.error("  carbonstop auth login --api-key <your-key>");
      process.exit(2);
    }
    console.error(`[search_ccdb] ${keyword}: ${err.message}`);
    return [];
  }
}

// -------- Execute all searches, deduplicate --------
const seen = new Set();
const allRows = [];

for (const { keyword, lang } of terms) {
  const rows = search(keyword, lang);
  for (const row of rows) {
    const key = `${row.name}|${row.cValue}|${row.unit}|${row.countries}`;
    if (!seen.has(key)) {
      seen.add(key);
      allRows.push(row);
    }
  }
}

console.log(JSON.stringify({ total: allRows.length, rows: allRows }));
