---
name: ccdb-factor-search
description: CCDB碳因子查询与匹配。Find and select the best-fit CCDB carbon / emission factor for PCF, LCA, carbon accounting, ESG, and supply-chain work — not just a raw search result list. Supports 碳因子 / 排放因子 / 碳足迹因子 / emission factor / carbon factor / ecoinvent / ecoinvent 因子 / 因子匹配 / 选因子 / LCA因子 / PCF因子 / scope 3 因子 / BOM因子匹配. Also activate proactively when 产品碳足迹计算 / LCA建模 / 碳核算 / 供应链排放测算 clearly need factor data.
---

# CCDB Factor Search

Find the **best-fit CCDB emission factor** for carbon footprint, PCF, LCA, and carbon accounting work — **not just a raw result list**.

> **Which factor should I actually use?**

---

## Prerequisites

This skill requires the Carbonstop CLI and a valid API Key.

```bash
npm install -g @carbonstopper/cli
carbonstop auth login --api-key <your-key>
```

**No API Key?** Register at https://ccloud-d-test.carbonstop.com/ to create one.

If the CLI is not installed or no API Key is configured, tell the user to run the commands above.

---

## Data retrieval

```bash
carbonstop search-factors --name <keyword> --lang zh
```

Search bilingually:

```bash
carbonstop search-factors --name "电力" --lang zh
carbonstop search-factors --name "electricity" --lang en
```

Collect all candidates across rounds before ranking.

---

## Search rules

### Search bilingually
Always try: Chinese core term → Chinese synonym → English equivalent → English synonym.

### Rank candidates on 7 dimensions
1. semantic fit (`name`, `description`, `specification`)
2. region fit (`countries`)
3. unit fit (`unit`)
4. applicability time (`applyYear` ~ `applyYearEnd`)
5. publication year (`year`)
6. authority (`institution`, `sourceLevel`)
7. factor-type fit (碳足迹因子 vs 排放因子)

### Be conservative
Prefer `not_suitable` or `api_unavailable` over a misleading confident answer.

### China-first bias
Chinese request + no explicit region + geo-sensitive query → prefer Chinese candidates.

### No spend-based mismatch
Reject monetary-unit factors when the user wants physical-activity factors.

### Latest-factor preference
"最新 / latest" → prefer more recent `applyYear`.

---

## Carbon footprint factor vs emission factor

- 碳足迹 / carbon footprint / PCF → prefer carbon footprint factors
- 排放因子 / CO2 emission factor → prefer emission factors
- Vague "电力因子" → warn that multiple factor types exist

---

## Match classes

- `direct_match` → highly aligned, safe after quick sanity check
- `close_match` → mostly aligned, review before formal reporting
- `fallback_generic` → rough estimate only
- `not_suitable` → do not use directly
- `api_unavailable` → retry later

---

## Multi-round refinement

1. Remove modifiers, test the core noun
2. Add process keyword
3. Add or remove geography keyword
4. Switch Chinese ↔ English
5. Broaden to parent category
6. Try domain synonyms (see `references/domain-lexicon.md`)

---

## Standard output

```yaml
推荐结果:
  匹配等级: close_match
  因子名称: 电力
  因子值: 0.5777
  单位: kgCO2e/kWh
  适用地区: 中国
  适用年份开始: 2024
  来源机构: 生态环境部
  来源级别: 国家排放因子
  使用建议: 建议人工复核后使用

选择原因:
  - 中国地区 + 最新年份 + kgCO2e 单位匹配

风险与注意事项:
  - 这是碳足迹因子，不等同于 CO2 排放因子

候选备选:
  - 0.5306 | 2023 年全国电力平均 CO2 排放因子 | kgCO2e/kWh | 生态环境部
  - 0.581  | 2022 年全国电网排放因子 | tCO2e/MWh | 生态环境部

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
| `unit` | 单位 |
| `countries` | 适用地区 |
| `applyYear` ~ `applyYearEnd` | 适用年份 |
| `year` | 发布年份 |
| `institution` | 来源机构 |
| `sourceLevel` | 来源级别 |
| `source` | 来源说明 |
| `description` | 描述 |
| `specification` | 规格说明 |

---

## References

- `references/matching-strategy.md` — candidate ranking logic
- `references/domain-lexicon.md` — Chinese/English term expansion
- `references/output-template.md` — full output structure
- `references/workflow.md` — step-by-step process
