# CCDB Factor Search

Find the **best-fit CCDB emission factor** for carbon footprint, PCF, LCA, carbon accounting, ESG, and supply-chain work — **not just a raw result list**.

> **Which factor should I actually use?**

This skill searches in **Chinese + English**, compares candidates, filters weak matches, explains risks, and returns a **recommended factor with direct-use guidance**.

---

## Why this is better than plain search

| Plain search | This skill |
|---|---|
| Returns a list of possible factors | Recommends the best-fit factor |
| Easy to mis-pick wrong region / unit / type | Filters weak matches, explains risks |
| Stops at retrieval | Supports real carbon-accounting decisions |
| "Here are 10 factors" | "This is the best candidate — here's why, here are the risks, here are the backups" |

---

## Prerequisites

```bash
npm install -g @carbonstopper/cli
carbonstop auth login --api-key <your-key>
```

No API Key? Register at https://ccloud-d-test.carbonstop.com/.

---

## What this skill does

- Search CCDB factors in **Chinese + English**
- Compare multiple candidates and select the **best-fit** one
- Distinguish **carbon footprint factor** vs **emission factor**
- Reject weak matches: wrong-region, wrong-unit, or spend-based factors
- Return direct-use guidance: safe / review-first / estimate-only / not-suitable
- Cover **China + international sources**, including ecoinvent-related records

---

## Before vs after

### User asks
> 帮我找中国最新全国电力因子。

### Plain search might return
Multiple electricity-related candidates, mixed carbon-footprint vs emission-factor results, unclear region / year / suitability.

### This skill returns
One recommended candidate with justification, risk notes, alternatives, and whether safe for direct use.

---

## Quick start examples

```
- 查询最新中国全国电力因子
- 帮我找聚酯切片的碳因子，如果中文结果不好就切英文继续找
- 这个因子能不能直接用于正式报告？
- Compare carbon footprint factor vs emission factor for electricity
- Find the best CCDB factor for primary aluminium
```

---

## Match classes

| Class | Meaning |
|-------|---------|
| `direct_match` | Highly aligned, safe after quick sanity check |
| `close_match` | Mostly aligned, review before formal reporting |
| `fallback_generic` | Rough estimate / placeholder only |
| `not_suitable` | Do not use directly |
| `api_unavailable` | No recommendation; retry later |

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

选择原因: 中国地区 + 最新年份 + kgCO2e 单位匹配
风险与注意事项: 碳足迹因子，不等同于 CO2 排放因子
候选备选: 0.5306 | 2023 年 | kgCO2e/kWh ...
结论建议: 建议人工复核后使用
```

---

## Key rules

- **Bilingual search** — always try Chinese + English
- **China-first** — for Chinese geo-sensitive queries without explicit region
- **Latest year preferred** — for "最新" requests, rank by `applyYear`
- **No spend-based mismatch** — reject monetary-unit factors when physical-activity is needed
- **Conservative** — prefer `not_suitable` over a wrong confident answer

---

## Files

- `SKILL.md` — full agent instructions
- `references/matching-strategy.md` — candidate ranking logic
- `references/domain-lexicon.md` — Chinese/English term expansion
- `references/output-template.md` — result template
- `references/workflow.md` — step-by-step process
- `evals/evals.json` — evaluation cases

---

## License

MIT-0
