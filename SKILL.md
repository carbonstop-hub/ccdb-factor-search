---
name: ccdb-factor-search
description: CCDB碳因子查询与匹配。Find and select the best-fit CCDB carbon / emission factor for PCF, LCA, carbon accounting, ESG, and supply-chain work — not just a raw search result list. Supports 碳因子 / 排放因子 / 碳足迹因子 / emission factor / carbon factor / ecoinvent / ecoinvent factor / ecoinvent 因子 / 因子匹配 / 选因子 / LCA因子 / PCF因子 / scope 3 因子 / BOM因子匹配. Covers a broad range of factor sources across China and international datasets, including ecoinvent-related records and other mainstream public or institutional sources. Also activate proactively when 产品碳足迹计算 / LCA建模 / 碳核算 / 供应链排放测算 clearly need factor data even if the user did not explicitly say "查因子".
---

# CCDB Factor Search

Find the **best-fit CCDB emission factor** for carbon footprint, PCF, LCA, and carbon accounting work — **not just a raw result list**.

> **Which factor should I actually use?**

This skill searches in **Chinese + English**, compares candidates, filters weak matches, explains risks, and returns a **recommended factor with direct-use guidance**.

---

## Why this is better than plain search

- **plain search** → returns a list of possible factors
- **this skill** → recommends the best-fit factor for the actual use case
- **plain search** → easy to mis-pick wrong region / wrong unit / wrong factor type
- **this skill** → filters weak matches and explains risks before use
- **plain search** → stops at retrieval
- **this skill** → supports real carbon-accounting decisions

---

## Prerequisites

```bash
npm install -g @carbonstopper/cli
carbonstop auth login --api-key <your-key>
```

**No API Key?** Register at https://ccloud-d-test.carbonstop.com/ to create one.

If the CLI is not installed or no API Key is configured, tell the user to run the commands above. Do not attempt to work around missing auth.

---

## Data retrieval

Use the bundled search script. Provide Chinese and English search terms explicitly (use the domain lexicon below to expand). The script executes all searches and returns merged, deduplicated results:

```bash
node scripts/search_ccdb.mjs --zh "电力" --en "electricity" --en "grid electricity"
```

Pass all search terms from your search strategy as `--zh` or `--en` arguments. The script handles execution and deduplication.

If the script fails with authentication errors, tell the user to configure the CLI:

```bash
npm install -g @carbonstopper/cli
carbonstop auth login --api-key <your-key>
```

Get an API Key at https://ccloud-d-test.carbonstop.com/.

---

## Workflow

### Step 1 — Normalize the request

Extract as many of these fields as possible from the user's request:
- material / product / fuel / energy type
- process or activity
- lifecycle stage
- geography / country / region
- time period
- unit requirements
- industry context
- whether the user wants 碳足迹因子 or 排放因子

### Step 2 — Build search terms and collect candidates

Use the domain lexicon to expand the user's keyword into Chinese + English search terms, then run:

```bash
node scripts/search_ccdb.mjs --zh "<核心词>" --zh "<同义词>" --en "<English>" --en "<synonym>"
```

Example for 聚酯切片:
```bash
node scripts/search_ccdb.mjs --zh "聚酯切片" --zh "PET切片" --en "polyester chip" --en "PET resin"
```

The script executes all searches and returns merged, deduplicated JSON.

### Step 3 — Evaluate suitability

Check each candidate on:
- semantic object match
- lifecycle stage match
- region match
- unit match
- recency / source reliability
- factor type (碳足迹 vs 排放)

Reject candidates that are clearly about a different object, stage, or region.

### Step 4 — Return the best factor

Explain: what was selected, why, what risks remain, what alternatives were considered, whether it can be used directly or only as reference.

### If nothing suitable is found

Return all search terms attempted, why results were unsuitable, and what clarification would improve matching. Do not fabricate a recommendation.

---

## Constraints to extract and preserve

Always try to preserve these from the user request:
- target object or activity
- process / stage / scenario
- geography / grid / country / region
- unit
- year / applicability period
- source preference if the user implies it

---

## Candidate selection hierarchy

Prefer candidates in this order:
1. direct semantic match + matching region + matching unit
2. direct semantic match + matching region + compatible unit
3. direct semantic match + weaker region match + compatible unit
4. broader parent-category fallback with explicit warning

---

## Ranking dimensions

Judge candidates across 7 dimensions:
1. semantic fit (`name`, `description`, `specification`)
2. region fit (`countries`)
3. unit fit (`unit`)
4. applicability time (`applyYear` ~ `applyYearEnd`)
5. publication year (`year`)
6. authority (`institution`, `sourceLevel`)
7. factor-type fit (碳足迹因子 vs 排放因子)

---

## Red flags

Downgrade or reject candidates when:
- country/region conflicts with the user requirement
- unit is clearly incompatible with the intended use
- the result refers to a different lifecycle stage or category
- the result is too generic while a more specific candidate exists
- the result is spend-based / monetary-unit when the user wanted physical-activity factors

---

## Match classes

- `direct_match` → highly aligned, safe after quick sanity check
- `close_match` → mostly aligned, review before formal reporting
- `fallback_generic` → rough estimate / placeholder only
- `not_suitable` → do not use directly
- `api_unavailable` → no recommendation; retry later

---

## Key working rules

### Carbon footprint factor vs emission factor
- 碳足迹 / carbon footprint / PCF → prefer carbon footprint factors
- 排放因子 / CO2 emission factor → prefer emission factors
- Vague "电力因子" → warn that multiple factor types exist and should not be mixed

### China-first bias for Chinese requests
Chinese request + no explicit region + geo-sensitive query (电力 / 蒸汽 / 天然气) → prefer Chinese candidates.

### Region warning
For geo-sensitive factors, if region is missing, surface that as a risk.

### Latest-factor requests
"最新 / latest" → ranking should prefer more recent `applyYear`, not only lexical similarity.

### No spend-based mismatch
If the user wants a physical activity factor, do not recommend spend-based / monetary-unit factors.

### Be conservative
Do not force a recommendation when evidence is weak. Prefer `not_suitable` or `api_unavailable` over a misleading confident answer.

---

## Multi-round refinement

If the first search set does not yield a reliable result:
1. remove modifiers and test the core noun
2. add process keyword
3. add or remove geography keyword
4. switch Chinese ↔ English
5. broaden to parent category
6. try common domain synonyms (see lexicon below)

---

## Domain lexicon

Use this to expand search terms before or during iterative search.

### Energy
- 电力 → electricity, grid electricity, purchased electricity
- 外购电 → purchased electricity, outsourced electricity, grid electricity
- 电网电力 → grid electricity
- 蒸汽 → steam
- 外购蒸汽 → purchased steam, imported steam, steam
- 天然气 → natural gas
- 柴油 → diesel
- 汽油 → gasoline, petrol
- 煤 → coal

### Materials
- 聚酯切片 → polyester chip, PET chip, PET resin
- PET树脂 → PET resin
- 原铝 → primary aluminium, primary aluminum
- 铝锭 → aluminium ingot, aluminum ingot
- 钢材 → steel
- 铜 → copper
- 纸箱 → corrugated box, carton board, cardboard box
- 塑料包装 → plastic packaging

### Logistics / Transport
- 公路运输 → road transport, trucking
- 海运 → ocean freight, sea freight
- 空运 → air freight
- 铁路运输 → rail freight

### Lifecycle / Scenario
- cradle-to-gate → 从摇篮到大门, 原材料到出厂
- gate-to-gate → 厂内生产阶段, 从门到门
- 范畴3 → scope 3
- 生产资料 → purchased goods, capital goods, upstream materials

### Lexicon usage

When the first query is weak:
1. switch between Chinese and English equivalents
2. try broader parent terms
3. try more process-specific terms
4. use lifecycle or scenario cues only when the user explicitly needs them

---

## Output template

Use this structure for every result:

```yaml
推荐结果:
  匹配等级: direct_match | close_match | fallback_generic | not_suitable
  因子名称:
  英文名称:
  因子值:
  单位:
  适用地区:
  适用年份开始:
  适用年份结束:
  发布年份:
  来源机构:
  来源说明:

选择原因:
  - 为什么它是当前最合适的结果
  - 哪些字段与用户需求直接匹配
  - 哪些字段只是近似匹配

风险与注意事项:
  - 地域风险
  - 单位风险
  - 生命周期/场景风险
  - 数据是否加密

检索路径:
  - 中文词:
  - 英文词:
  - 调整过的词:

候选备选:
  - 候选 1:
  - 候选 2:
  - 候选 3:

结论建议:
  - 是否建议直接使用
  - 是否建议用户补充信息后再查
```

### Concrete example

```yaml
推荐结果:
  匹配等级: close_match
  因子名称: 电力
  英文名称: Electricity
  因子值: 0.5777
  单位: kgCO2e/kWh
  适用地区: 中国
  适用年份开始: 2024
  适用年份结束: 2024
  发布年份: 2024
  来源机构: 生态环境部
  来源说明: 2024年全国电力平均碳足迹因子

选择原因:
  - 中国地区精确匹配
  - 2024 最新适用年份
  - kgCO2e 单位与碳足迹需求一致
  - 生态环境部官方发布

风险与注意事项:
  - 这是碳足迹因子，不等同于 CO2 排放因子
  - 若用于正式核算或核查，请先确认适用口径
  - 全国平均因子，不区分区域电网

候选备选:
  - 0.5306 | 2023 年全国电力平均 CO2 排放因子 | kgCO2e/kWh | 生态环境部
  - 0.581  | 2022 年全国电网排放因子 | tCO2e/MWh | 生态环境部
  - 0.2556 | 2023 年电力供应因子 | kgCO2e/kWh | 非洲（不匹配）

检索路径:
  - 中文词: 电力
  - 英文词: electricity, grid electricity, purchased electricity

结论建议:
  - 建议人工复核后使用
  - 如需更精确，请确认区域电网和具体年份
```

---

## Key fields reference

| Field | Description |
|-------|-------------|
| `name` | 因子名称 |
| `cValue` | 因子值 |
| `unit` | 单位 (kgCO₂e/kWh, tCO₂e/t, etc.) |
| `countries` | 适用国家/地区 |
| `applyYear` | 适用年份开始 |
| `applyYearEnd` | 适用年份结束 |
| `year` | 数据发布年份 |
| `institution` | 来源机构 |
| `sourceLevel` | 来源级别 (国家排放因子/国际排放因子/行业) |
| `source` | 来源文献/文件说明 |
| `description` | 描述 |
| `specification` | 规格说明 |

Note: `cValue` may be encrypted or unavailable for restricted data tiers.

---

## Typical example prompts

### Example 1 — latest China electricity factor
> 查询最新的中国全国电力因子，单位最好是 kgCO2e/kWh。

Expected: prioritize China electricity candidates, prefer recent applicable years, distinguish carbon footprint vs emission factor, return direct-use guidance.

### Example 2 — bilingual material lookup
> 帮我找聚酯切片的碳因子，如果中文结果不好就切英文继续找。

Expected: derive PET / polyester synonyms, search bilingually, compare candidates across rounds, return one recommended factor plus alternatives.

### Example 3 — conservative screening
> 请帮我找原铝的排放因子，优先物理量单位，不要误选成按金额计算的因子。

Expected: reject or downgrade spend-based factors, prefer physical-unit candidates, explain why the chosen factor is safer.

### Example 4 — suitability review
> 这个因子能不能直接用于正式报告？

Expected: explain whether it is direct-use / needs review / estimate-only / not suitable.
