# KASPI POS — PERMANENT ENGINEERING CONSTITUTION & NON-REGRESSION RULES

> **REPOSITORY:** `pos-saas-morocco` / `kaspi-pos`
> **STATUS:** Permanent Architecture & Non-Regression Directive
> **TARGET AUDIENCE:** All AI Agents, Autonomous Subagents, and Developers working on this codebase.

---

## 1. Strict Scope Lock (Zero Unrequested Edits)
- **Asset Integrity:** Never crop, modify, compress, or overwrite existing image assets (specifically `public/logo.png`), icons, audio files, or fonts unless the user explicitly and verbatim requests an asset change.
- **No Collateral Regressions:** Never delete, strip, downscale, or remove existing animations (e.g., SVG kinetic cart animation in `CartPanel.tsx`, 3D button micro-physics, drawer transitions), working features, or user options when performing edits on a file.
- **Minimal Atomic Changes:** Confine code edits strictly to the targeted components, endpoints, and documents described in the active task.

---

## 2. 100% Tri-Lingual Synchronization (`ar`, `fr`, `en`)
- **No Hardcoded Strings:** Every UI label, modal title, button text, badge, tooltip, placeholder, AI prompt suggestion, and error message must be dynamically synchronized with the active application locale (`ar` | `fr` | `en`).
- **Dynamic Path & Cookie Awareness:** Components (including root-mounted overlays such as `AIChatWidget.tsx`) must resolve the locale dynamically from the route URL (`usePathname()`), `NEXT_LOCALE` cookie, or HTML lang attribute.
- **AI Response Alignment:** AI chat endpoints and local fallback engines must generate responses strictly in the client's selected locale (`English` for `en`, `Français` for `fr`, `العربية` for `ar`).
- **Zero Language Leaks:** An Arabic-mode session must never display raw French or English error strings, and an English or French session must never display hardcoded Arabic assistant titles.

---

## 3. Permanent `dir="ltr"` Layout Geometry & Typography
- **Permanent LTR Geometry:** The physical layout of the application (sidebar on the left, action controls, POS split screen, cart panel, dialog positions) must strictly maintain LTR geometry across all languages. Do NOT mirror the layout or reverse containers when switching to Arabic.
- **Arabic Typography:** For Arabic text (font family `Cairo` / `Noto Sans Arabic`), enforce `letter-spacing: 0 !important` to preserve correct Arabic script cursive connections.
- **Tabular Numerics:** All currency figures, quantities, barcodes, and transaction counts must enforce `tabular-nums` and `font-mono` where applicable.

---

## 4. Zero-State Cleanliness & Design Simplicity
- **No Cluttered Toolbars:** Never invent cluttered toolbars, fake grocery shelf buttons (`خبز 1.20`, `حليب 3.50`), or duplicate mock buttons on the main screen.
- **Real Merchant Data:** Merchants manage their own catalog through the real Product Catalog and `QuickProductModal.tsx`.
- **Monochrome Obsidian Craftsmanship:** Adhere strictly to the V-OMEGA Obsidian Titanium Monochrome visual identity (`#09090B` base, `#18181B` borders, titanium accents, `#FFFFFF` primary action buttons).

---

## 5. Zero Emojis Anywhere (Strict Monochrome & Lucide Vector Discipline)
- **Zero Unicode Emojis:** Never render or inject Unicode emojis (`🔒`, `🔓`, `⚡`, `✨`, `🚀`, `🔥`, `🎉`, `⚠️`, `✅`, `❌`, `📦`, `🛒`, `💰`, etc.) into UI components, status badges, modal titles, buttons, toasts, push alerts, or email templates.
- **Monochrome Lucide Vector Icons Only:** Use clean, scalable Lucide icons (e.g. `<Lock />`, `<Unlock />`, `<Sparkles />`, `<AlertTriangle />`, `<Check />`) styled in high-contrast monochrome (`text-white`, `text-zinc-400`, `text-emerald-400` where semantic status is required).
- **Subtle Status Rings:** Do NOT use garish yellow or orange dot badges on avatars; use subtle, elegant monochrome white or emerald rings and clean borders.
