# Changelog

## 0.1.6

- Replaced Python script with Carbonstop CLI (`carbonstop search-factors`)
- Added `scripts/search_ccdb.mjs` — deterministic bilingual search with retry, dedup, stderr summary
- Merged all references into SKILL.md for single-file ClawHub release
- Added tie-break rules (applyYear → sourceLevel → institution)
- Added encrypted cValue handling standard output
- Expanded domain lexicon with Chemicals, Building Materials, Agriculture, Waste
- Structured evals with expected match classes and constraints
- Removed hardcoded API paths, sign prefixes, and publishing draft files
- Removed `scripts/query_ccdb.py`, `references/api-contract.md`

## 0.1.5

- switched runtime guidance from public direct HTTP examples to CLI transport path
- added API key guidance for public usage

## 0.1.4

- added Chinese keywords to description frontmatter
- added proactive trigger section
- added script-unavailable fallback section

## 0.1.3

- upgraded README into fuller public-facing skill page
- updated api-contract.md with confirmed field meanings
- added China-first bias, region warning, recency bonus

## 0.1.2

- rewrote README to improve ClawHub presentation

## 0.1.1

- added _meta.json, improved error handling, expanded eval coverage

## 0.1.0

- initial beta release
