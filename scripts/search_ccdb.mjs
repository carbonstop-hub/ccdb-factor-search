#!/usr/bin/env node
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

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

// -------- Check CLI availability + key --------
import { homedir } from "node:os";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let cliAvailable = true;
let keyConfigured = false;
try {
  execSync("carbonstop --version", { stdio: "pipe", timeout: 3000 });
  const configPath = join(homedir(), ".config", "carbonstop-cli", "config.json");
  if (existsSync(configPath)) {
    const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
    keyConfigured = !!(cfg.api_key || (cfg.profiles?.default?.api_key));
  }
} catch {
  cliAvailable = false;
}
if (!keyConfigured) {
  cliAvailable = false;
}

// -------- Direct API (fallback when CLI unavailable or auth fails) --------
const DIRECT_URL_ENCODED = "aHR0cHM6Ly9nYXRld2F5LmNhcmJvbnN0b3AuY29tL21hbmFnZW1lbnQvc3lzdGVtL3dlYnNpdGUvcXVlcnlGYWN0b3JMaXN0Q2xhdw==";
const DIRECT_URL = Buffer.from(DIRECT_URL_ENCODED, "base64").toString("utf-8");

async function searchDirect(keyword, lang) {
  const sign = createHash("md5").update("openclaw_ccdb" + keyword).digest("hex");
  const body = JSON.stringify({ name: keyword, sign, lang });
  try {
    const resp = await fetch(DIRECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(30000),
    });
    if (resp.status === 401 || resp.status === 403) {
      return null; // auth blocked, signal caller to try CLI
    }
    if (!resp.ok) {
      console.error(`[search_ccdb] Direct API error: HTTP ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    if (data.code === 401) {
      return null; // auth blocked, signal caller to try CLI
    }
    if (data.code !== 200) {
      console.error(`[search_ccdb] API error: ${keyword} (${lang}) → ${data.msg || data.message}`);
      return [];
    }
    return data.rows || [];
  } catch (err) {
    if (err.message?.includes("401") || err.message?.includes("403")) {
      return null; // auth blocked, signal caller to try CLI
    }
    console.error(`[search_ccdb] Direct API failed: ${keyword} (${lang}) → ${err.message}`);
    return [];
  }
}

// -------- Search via CLI with retry --------
const FAILED = new Set();

function searchCLI(keyword, lang) {
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
        console.error("[search_ccdb] CLI auth failed, falling back to direct API...");
        return null; // signal to fall back
      }
      if (attempt < maxRetry) continue;
      console.error(`[search_ccdb] Failed: ${keyword} (${lang}) → ${err.message}`);
      FAILED.add(`${keyword} (${lang})`);
      return [];
    }
  }
}

async function search(keyword, lang) {
  // Path 1: CLI (preferred, shows carbonstop ecosystem)
  if (cliAvailable) {
    const cliResult = searchCLI(keyword, lang);
    if (cliResult !== null) return cliResult;
    // CLI auth failed → fall through to direct
  }
  // Path 2: Direct API fallback (server-side key check applies)
  const directResult = await searchDirect(keyword, lang);
  // null = auth blocked, [] = API error or empty
  return directResult;
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
let authBlocked = false;
const log = [];

for (const { keyword, lang } of terms) {
  const rows = await search(keyword, lang);
  if (rows === null) authBlocked = true;
  log.push({ keyword, lang, found: rows ? rows.length : 0 });
  if (rows) {
    totalAttempted += rows.length;
    for (const row of rows) {
      const key = dedupKey(row);
      if (!seen.has(key)) {
        seen.add(key);
        allRows.push(row);
      }
    }
  }
}

// -------- Summary to stderr --------
console.error(`[search_ccdb] ${terms.length} term(s) → ${allRows.length} unique / ${totalAttempted} raw`);
for (const entry of log) {
  const status = FAILED.has(`${entry.keyword} (${entry.lang})`) ? "FAIL" : `+${entry.found}`;
  console.error(`  ${entry.keyword} [${entry.lang}]: ${status}`);
}

if (authBlocked) {
  console.error("[search_ccdb] Auth required. Get a key at https://ccloud.carbonstop.com/");
}

// -------- Output JSON to stdout --------
console.log(JSON.stringify({ total: allRows.length, rows: allRows }));
