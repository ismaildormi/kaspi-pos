---
name: unrestricted-research-apis
description: Live zero-key public API hub (FX rates, weather, cyber threat feeds, science/patents/music/maps) and SSRF-safe web research.
domain: web
version: 1.0.0
tags: [web-research, fx, weather, cyber-intel, wikipedia, public-apis]
---

# Unrestricted Web & Zero-Key Public APIs Skill (Web Domain)

## Level 2 Instructions (Loaded On-Demand)
1. Classify real-time requests into normalized `queryPublicApi` categories (`fx_rates`, `weather`, `cyber_threat_intel`, `nador_marine_weather`, `crypto_market`, etc.).
2. Use `unrestrictedWebSearch` for open web search or clean URL extraction via SSRF-safe hosts.
3. Prune raw HTML/search intermediate blobs once concise citations and structured Markdown tables are extracted.
4. Keep external citations grounded in live tool responses without fabricated URLs.
