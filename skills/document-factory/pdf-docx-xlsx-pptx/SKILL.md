---
name: pdf-docx-xlsx-pptx
description: Automated creation and parsing of Arabic/French/English PDFs, Word DOCX, Excel XLSX spreadsheets, PowerPoint decks, CSVs, and Mermaid diagrams.
domain: document-factory
version: 1.0.0
tags: [pdf, docx, xlsx, pptx, mermaid, reports]
---

# Multi-Format Document Factory Skill (Document Factory Domain)

## Level 2 Instructions (Loaded On-Demand)
1. Generate printable RTL Arabic or LTR French/English PDFs via `generatePdfReport`.
2. Export structured Word, Excel, PowerPoint, Mermaid/Markmap diagrams, or barcodes using `createRichArtifactOrExport`.
3. When reading uploaded user documents in browser or Cowork Workspace folders, normalize content to clean Markdown before passing to LLM context.
