---
name: math-physics-agro-health
description: Exact symbolic algebra, decimal currency calculations, Hijri/solar astronomy, OpenFDA/PubMed medical literature, SoilGrids/NASA agro data.
domain: science
version: 1.0.0
tags: [math, algebra, astronomy, medical, agriculture, science]
---

# Math, Astronomy & Research Science Skill (Science Domain)

## Level 2 Instructions (Loaded On-Demand)
1. Never approximate floating-point finance math; delegate calculations to `evaluateMathAndFinance` (Decimal/Dinero/MathJS/Nerdamer).
2. Route Hijri calendar and solar/twilight calculations for Nador & global coordinates cleanly via `suncalc` helpers.
3. Query verified biomedical or agricultural endpoints through `queryPublicApi` (`openfda_drug`, `pubmed_papers`, `openalex_science`, `soilgrids_agri`, `nasa_power_agri`).
