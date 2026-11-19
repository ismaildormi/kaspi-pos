---
name: pos-retail-analytics
description: Read-only retail metrics, inventory velocity, VAT/TVA calculations in MAD, customer credit lookups, and receipt audit reports.
domain: commerce
version: 1.0.0
tags: [commerce, retail, analytics, tva, mad]
---

# POS & Retail Analytics Skill (Commerce Domain)

## Level 2 Instructions (Loaded On-Demand)
1. Validate tenant scope and ensure all monetary figures are formatted accurately in `MAD`.
2. Use read-only tools (`getTodaySales`, `getLowStockProducts`, `getTopSellingProducts`, `predictStockDemand`, `evaluateMathAndFinance`).
3. Never trigger destructive checkout mutations unless explicit user confirmation cards (`preparePosActionConfirmation`) are approved.
4. For printable exports or tables, invoke `generatePdfReport` or `createRichArtifactOrExport` cleanly.

## Level 3 Resource Binding
- Runtime targets: `pos-live-tools.ts`, `math-logic-engine.ts`
- Safety policy: Read-only unless user-confirmed action card is clicked.
