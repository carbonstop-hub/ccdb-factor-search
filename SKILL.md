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

Search via the Carbonstop CLI:

```bash
carbonstop search-factors --name "电力" --lang zh
carbonstop search-factors --name "electricity" --lang en
```

Collect all candidates across rounds before ranking.

---

## What this skill must do

### 1. Parse the real search intent
Identify from the request: material / process / activity, region, year, unit, use purpose, whether the user wants 碳足迹因子 or 排放因子.

### 2. Search bilingually
Always try: Chinese core term → Chinese synonym → English equivalent → English synonym.

### 3. Rank candidates instead of trusting the first hit
Judge across 7 dimensions:
- semantic fit (`name`, `description`, `specification`)
- region fit (`countries`)
- unit fit (`unit`)
- applicability time (`applyYear` ~ `applyYearEnd`)
- publication year (`year`)
- authority (`institution`, `sourceLevel`)
- factor-type fit (碳足迹因子 vs 排放因子)

### 4. Be conservative
Do not force a recommendation when evidence is weak. Prefer `not_suitable` or `api_unavailable` over a misleading confident answer.

### 5. Explain the choice
The final answer should explain: what was selected, why, what risks remain, what alternatives were considered, whether the result can be used directly or only as reference.

---

## Before vs after

### User asks
> 帮我找中国最新全国电力因子。

### Plain search might return
- multiple electricity-related candidates, mixed carbon-footprint vs emission-factor results, unclear region/year/suitability

### This skill returns
- one recommended candidate, why it was selected, risk notes, alternatives considered, direct-use guidance

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

---

## Standard output example

```yaml
推荐结果:
  匹配等级: close_match
  因子名称: 电力
  因子值: 0.5777
  单位: kgCO2e/kWh
  适用地区: 中国
  适用年份开始: 2024
  适用年份结束: 2024
  发布年份: 2024
  来源机构: 生态环境部
  来源级别: 国家排放因子
  使用建议: 建议人工复核后使用

选择原因:
  - 中国地区 + 最新年份 + kgCO2e 单位与用户需求一致

风险与注意事项:
  - 这是碳足迹因子，不等同于 CO2 排放因子
  - 若用于正式核算或核查，请先确认适用口径

候选备选:
  - 0.5306 | 2023 年全国电力平均 CO2 排放因子 | kgCO2e/kWh | 生态环境部
  - 0.581  | 2022 年全国电网排放因子         | tCO2e/MWh  | 生态环境部

检索路径:
  - 中文词: 电力
  - 英文词: electricity, grid electricity

结论建议: 建议人工复核后使用
```

---

## Key fields

| Field | Description |
|-------|-------------|
| `name` | 因子名称 |
| `cValue` | 因子值 |
| `unit` | 单位 (kgCO₂e/kWh, tCO₂e/t, etc.) |
| `countries` | 适用地区 |
| `applyYear` ~ `applyYearEnd` | 适用年份范围 |
| `year` | 发布年份 |
| `institution` | 来源机构 |
| `sourceLevel` | 来源级别 (国家/国际/行业) |
| `source` | 来源说明 |
| `description` | 描述 |
| `specification` | 规格说明 |

---

## Multi-round refinement

If the first search set does not yield a reliable result:
1. Remove modifiers, test the core noun
2. Add process keyword
3. Add or remove geography keyword
4. Switch Chinese ↔ English
5. Broaden to parent category
6. Try common domain synonyms (see `references/domain-lexicon.md`)

---

## References

- `references/matching-strategy.md` — candidate ranking logic
- `references/domain-lexicon.md` — Chinese/English term expansion
- `references/output-template.md` — full output structure
- `references/workflow.md` — step-by-step process
