#!/usr/bin/env node
import { execSync } from "node:child_process";

// -------- Domain lexicon for bilingual term expansion --------
const lexicon = {
  "电力": ["electricity", "grid electricity", "purchased electricity"],
  "外购电": ["purchased electricity", "outsourced electricity", "grid electricity"],
  "电网电力": ["grid electricity"],
  "蒸汽": ["steam"],
  "外购蒸汽": ["purchased steam", "imported steam", "steam"],
  "天然气": ["natural gas"],
  "柴油": ["diesel"],
  "汽油": ["gasoline", "petrol"],
  "煤": ["coal"],
  "聚酯切片": ["polyester chip", "PET chip", "PET resin"],
  "聚酯粒": ["polyester granule", "PET granule"],
  "聚酯棉": ["polyester fiber", "PET fiber"],
  "PET树脂": ["PET resin"],
  "原铝": ["primary aluminium", "primary aluminum"],
  "铝锭": ["aluminium ingot", "aluminum ingot"],
  "钢材": ["steel"],
  "铜": ["copper"],
  "纸箱": ["corrugated box", "carton board", "cardboard box"],
  "塑料包装": ["plastic packaging"],
  "公路运输": ["road transport", "trucking"],
  "海运": ["ocean freight", "sea freight"],
  "空运": ["air freight"],
  "铁路运输": ["rail freight"],
  "热力": ["heat", "thermal energy"],
  "热力和蒸汽": ["heat and steam", "thermal energy", "steam"],
};

// -------- Expand terms from keyword --------
function expand(keyword) {
  const terms = { zh: [keyword], en: [] };
  // direct lexicon lookup
  if (lexicon[keyword]) {
    for (const en of lexicon[keyword]) terms.en.push(en);
  }
  // also try partial matching
  for (const [zh, ens] of Object.entries(lexicon)) {
    if (zh.includes(keyword) || keyword.includes(zh)) {
      for (const en of ens) {
        if (!terms.en.includes(en)) terms.en.push(en);
      }
    }
  }
  return terms;
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
      console.error(`[search_ccdb] API error: ${data.msg}`);
      return [];
    }
    return data.rows || [];
  } catch (err) {
    if (err.message?.includes("API Key") || err.message?.includes("auth")) {
      console.error("[search_ccdb] Authentication required. Run:");
      console.error("  npm install -g @carbonstopper/cli");
      console.error("  carbonstop auth login --api-key <your-key>");
      console.error("  Get a key at https://ccloud-d-test.carbonstop.com/");
      process.exit(2);
    }
    console.error(`[search_ccdb] search failed for "${keyword}": ${err.message}`);
    return [];
  }
}

// -------- Main --------
const keyword = process.argv[2];
if (!keyword) {
  console.error("Usage: node scripts/search_ccdb.mjs <keyword>");
  process.exit(2);
}

const terms = expand(keyword);
const seen = new Set();
const allRows = [];

// Round 1: Chinese
for (const zh of terms.zh) {
  const rows = search(zh, "zh");
  for (const row of rows) {
    const key = `${row.name}|${row.cValue}|${row.unit}|${row.countries}`;
    if (!seen.has(key)) {
      seen.add(key);
      allRows.push(row);
    }
  }
}

// Round 2: English
for (const en of terms.en) {
  const rows = search(en, "en");
  for (const row of rows) {
    const key = `${row.name}|${row.cValue}|${row.unit}|${row.countries}`;
    if (!seen.has(key)) {
      seen.add(key);
      allRows.push(row);
    }
  }
}

// Round 3: core English term (final pass)
if (!terms.en.includes(keyword)) {
  const rows = search(keyword, "en");
  for (const row of rows) {
    const key = `${row.name}|${row.cValue}|${row.unit}|${row.countries}`;
    if (!seen.has(key)) {
      seen.add(key);
      allRows.push(row);
    }
  }
}

console.log(JSON.stringify({ total: allRows.length, rows: allRows }));
