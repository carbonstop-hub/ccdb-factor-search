# CCDB Factor Search

Find the best-fit CCDB carbon emission factor for PCF, LCA, carbon accounting, ESG, and supply-chain work — not just a raw result list.

> **Which factor should I actually use?**

---

## Prerequisites

```bash
npm install -g @carbonstopper/cli
carbonstop auth login --api-key <your-key>
```

No key? Register at https://ccloud-d-test.carbonstop.com/.

---

## Usage

```bash
carbonstop search-factors --name "电力" --lang zh
carbonstop search-factors --name "electricity" --lang en
```

---

## What it does

- Search CCDB factors in Chinese + English
- Compare candidates across 7 ranking dimensions
- Distinguish carbon footprint factor vs emission factor
- Reject wrong-region, wrong-unit, or spend-based factors
- Return direct-use guidance

## Match classes

| Class | Meaning |
|-------|---------|
| `direct_match` | Safe after quick sanity check |
| `close_match` | Review before formal reporting |
| `fallback_generic` | Rough estimate only |
| `not_suitable` | Do not use directly |
| `api_unavailable` | Retry later |

## Examples

- 查询最新中国全国电力因子
- 帮我找聚酯切片的碳因子
- Compare carbon footprint factor vs emission factor for electricity
- Find the best CCDB factor for primary aluminium

## Files

- `SKILL.md` — agent instructions
- `references/matching-strategy.md` — candidate ranking
- `references/domain-lexicon.md` — Chinese/English term expansion
- `references/output-template.md` — result format
- `references/workflow.md` — step-by-step process
- `evals/evals.json` — evaluation cases

## License

MIT-0
