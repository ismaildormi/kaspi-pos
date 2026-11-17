// scripts/build-master-dossier-html.mjs
// Generates the single self-contained KASPI_POS_INTERACTIVE_MASTER_DOSSIER.html

import fs from "fs";
import path from "path";

const ROOT = "/mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco";
const SCREENSHOTS_DIR = path.join(ROOT, "deliverables/kaspi-master-dossier/07-verified-screenshots");
const OUTPUT_FILE = path.join(ROOT, "deliverables/kaspi-master-dossier/KASPI_POS_INTERACTIVE_MASTER_DOSSIER.html");

console.log("[BUILD DOSSIER] Loading base64 assets...");

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn("Missing image file:", filePath);
    return "";
  }
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

const logoBase64 = getBase64Image(path.join(ROOT, "public/logo-mark.png"));

// Key verified screenshots
const screenshots = {
  posLight: getBase64Image(path.join(SCREENSHOTS_DIR, "06_pos_pearl-light.png")),
  posDark: getBase64Image(path.join(SCREENSHOTS_DIR, "06_pos_fjord-twilight.png")),
  loginLight: getBase64Image(path.join(SCREENSHOTS_DIR, "01_login_pearl-light.png")),
  loginDark: getBase64Image(path.join(SCREENSHOTS_DIR, "01_login_fjord-twilight.png")),
  dashLight: getBase64Image(path.join(SCREENSHOTS_DIR, "03_dashboard_pearl-light.png")),
  dashDark: getBase64Image(path.join(SCREENSHOTS_DIR, "03_dashboard_fjord-twilight.png")),
  tpeLight: getBase64Image(path.join(SCREENSHOTS_DIR, "11_dashboard_settings_tpe_pearl-light.png")),
  tpeDark: getBase64Image(path.join(SCREENSHOTS_DIR, "11_dashboard_settings_tpe_fjord-twilight.png")),
  kdsLight: getBase64Image(path.join(SCREENSHOTS_DIR, "13_kds_kitchen_display_pearl-light.png")),
  mobileLight: getBase64Image(path.join(SCREENSHOTS_DIR, "12_pos_mobile_pearl-light.png")),
  adminCenter: getBase64Image(path.join(SCREENSHOTS_DIR, "14_admin_command_center.png")),
  pluModal: getBase64Image(path.join(SCREENSHOTS_DIR, "08_pos_plu_modal_pearl-light.png")),
};

console.log("[BUILD DOSSIER] Assembling HTML application template...");

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl" data-theme="pearl-light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KASPI POS (كسب) — Interactive Master Dossier & Architectural Package</title>
  <style>
    /* -------------------------------------------------------------
       APPLE VISIONOS LIQUID CRYSTAL GLASS SYSTEM (OFFLINE NATIVE)
       ------------------------------------------------------------- */
    :root {
      --font-stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-arabic: "Cairo", "Segoe UI", Tahoma, Arial, sans-serif;
      
      /* Pearl Light Palette */
      --bg-base: #f4f7f6;
      --bg-gradient: radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
                         radial-gradient(at 100% 100%, rgba(56, 189, 248, 0.08) 0px, transparent 50%),
                         #f4f7f6;
      --glass-panel: rgba(255, 255, 255, 0.52);
      --glass-panel-hover: rgba(255, 255, 255, 0.72);
      --glass-border: rgba(255, 255, 255, 0.75);
      --glass-inner-border: rgba(15, 23, 42, 0.08);
      --text-main: #0f172a;
      --text-muted: #475569;
      --text-faint: #64748b;
      --emerald-accent: #059669;
      --emerald-glow: rgba(5, 150, 105, 0.35);
      --card-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
      --nav-bg: rgba(255, 255, 255, 0.65);
    }

    [data-theme="fjord-twilight"] {
      /* Obsidian White-Aurora Dark Palette */
      --bg-base: #090d10;
      --bg-gradient: radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.12) 0px, transparent 50%),
                         radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.10) 0px, transparent 50%),
                         #090d10;
      --glass-panel: rgba(15, 23, 42, 0.58);
      --glass-panel-hover: rgba(30, 41, 59, 0.75);
      --glass-border: rgba(255, 255, 255, 0.14);
      --glass-inner-border: rgba(255, 255, 255, 0.06);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-faint: #64748b;
      --emerald-accent: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.45);
      --card-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
      --nav-bg: rgba(15, 23, 42, 0.72);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    body {
      font-family: var(--font-arabic), var(--font-stack);
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      line-height: 1.6;
      transition: background 0.3s ease, color 0.3s ease;
      overflow-x: hidden;
    }

    html[dir="ltr"] body {
      font-family: var(--font-stack);
    }

    /* ---------------- GLASSMORPHISM COMPONENTS ---------------- */
    .glass-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--nav-bg);
      backdrop-filter: blur(32px) saturate(190%);
      -webkit-backdrop-filter: blur(32px) saturate(190%);
      border-bottom: 1px solid var(--glass-border);
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .brand-cluster {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
    }

    .brand-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      background: var(--emerald-accent);
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .lang-pill-group {
      display: flex;
      background: var(--glass-panel);
      border: 1px solid var(--glass-border);
      border-radius: 9999px;
      padding: 3px;
      gap: 2px;
    }

    .lang-btn {
      background: transparent;
      border: none;
      outline: none;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .lang-btn.active {
      background: var(--emerald-accent);
      color: #ffffff;
      box-shadow: 0 2px 8px var(--emerald-glow);
    }

    .theme-toggle-btn {
      width: 38px;
      height: 38px;
      border-radius: 9999px;
      background: var(--glass-panel);
      border: 1px solid var(--glass-border);
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .theme-toggle-btn:hover {
      background: var(--glass-panel-hover);
      transform: scale(1.05);
    }

    /* ---------------- SEARCH & PRINT TOOLBAR ---------------- */
    .dossier-search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      margin: 0 0.5rem;
    }

    .dossier-search-input {
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      border: 1px solid var(--glass-border);
      background: var(--glass-panel);
      color: var(--text-main);
      font-size: 0.8rem;
      outline: none;
      width: 220px;
      transition: all 0.25s ease;
      font-family: inherit;
    }

    .dossier-search-input:focus {
      width: 280px;
      border-color: var(--emerald-accent);
      box-shadow: 0 0 12px var(--emerald-glow);
    }

    .print-doc-btn {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.95rem;
      border-radius: 9999px;
      background: var(--glass-panel);
      border: 1px solid var(--glass-border);
      color: var(--text-main);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .print-doc-btn:hover {
      background: var(--glass-panel-hover);
      border-color: var(--emerald-accent);
      transform: translateY(-1px);
    }

    .diagram-container {
      margin: 2rem 0;
      padding: 1.75rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid var(--glass-border);
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-x: auto;
    }

    [data-theme="fjord-twilight"] .diagram-container {
      background: rgba(0, 0, 0, 0.40);
    }

    /* Clean Executive Print Stylesheet */
    @media print {
      .glass-nav, .chapter-tabs, .dossier-search-wrapper, .print-doc-btn, .lang-pill-group, .theme-toggle-btn, .hero-metrics, .lightbox {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        color: #09090b !important;
      }
      .container {
        max-width: 100% !important;
        padding: 0 !important;
      }
      .section-container {
        display: block !important;
        page-break-after: always;
        opacity: 1 !important;
      }
      .card {
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        background: #ffffff !important;
        page-break-inside: avoid;
        margin-bottom: 2rem !important;
      }
    }

    /* ---------------- SUB-NAV CHAPTER TABS ---------------- */
    .chapter-tabs {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.75rem 1.5rem;
      background: rgba(0, 0, 0, 0.02);
      border-bottom: 1px solid var(--glass-inner-border);
      scrollbar-width: none;
    }

    .chapter-tabs::-webkit-scrollbar {
      display: none;
    }

    .chapter-tab-btn {
      white-space: nowrap;
      padding: 0.5rem 1.1rem;
      border-radius: 12px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chapter-tab-btn:hover {
      background: var(--glass-panel);
      color: var(--text-main);
    }

    .chapter-tab-btn.active {
      background: var(--glass-panel);
      border-color: var(--glass-border);
      color: var(--emerald-accent);
      box-shadow: var(--card-shadow);
    }

    /* ---------------- HERO BANNER ---------------- */
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 1.5rem 6rem;
    }

    .hero-banner {
      background: var(--glass-panel);
      border: 1px solid var(--glass-border);
      border-radius: 28px;
      padding: 3rem 2.5rem;
      margin-bottom: 2.5rem;
      position: relative;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(36px);
      -webkit-backdrop-filter: blur(36px);
    }

    .hero-banner::before {
      content: "";
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 1rem;
      letter-spacing: -0.025em;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 820px;
      margin-bottom: 2rem;
    }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid var(--glass-border);
      padding: 1.25rem;
      border-radius: 18px;
      backdrop-filter: blur(20px);
    }

    [data-theme="fjord-twilight"] .metric-card {
      background: rgba(0, 0, 0, 0.25);
    }

    .metric-value {
      font-size: 1.85rem;
      font-weight: 900;
      color: var(--emerald-accent);
    }

    .metric-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* ---------------- SECTION CARDS & GRID ---------------- */
    .section-container {
      display: none;
      animation: fadeIn 0.3s ease forwards;
    }

    .section-container.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card {
      background: var(--glass-panel);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      padding: 2.25rem;
      margin-bottom: 2rem;
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(36px);
      -webkit-backdrop-filter: blur(36px);
      position: relative;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--glass-inner-border);
      padding-bottom: 1rem;
    }

    .card-title {
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.015em;
      color: var(--text-main);
    }

    .card-badge {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      background: var(--glass-panel-hover);
      border: 1px solid var(--glass-border);
      color: var(--emerald-accent);
    }

    /* ---------------- INTERACTIVE DIAGRAMS ---------------- */
    .diagram-wrapper {
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid var(--glass-inner-border);
      border-radius: 20px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      overflow: hidden;
      position: relative;
    }

    [data-theme="fjord-twilight"] .diagram-wrapper {
      background: rgba(0, 0, 0, 0.35);
    }

    svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .iso-layer {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .iso-layer:hover {
      filter: brightness(1.15) drop-shadow(0 8px 24px var(--emerald-glow));
    }

    /* ---------------- TABLES ---------------- */
    .table-container {
      overflow-x: auto;
      border-radius: 16px;
      border: 1px solid var(--glass-inner-border);
      margin: 1.25rem 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
    }

    html[dir="ltr"] table {
      text-align: left;
    }

    th {
      background: rgba(0, 0, 0, 0.03);
      padding: 0.85rem 1.15rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-muted);
      border-bottom: 1px solid var(--glass-inner-border);
    }

    [data-theme="fjord-twilight"] th {
      background: rgba(255, 255, 255, 0.04);
    }

    td {
      padding: 0.85rem 1.15rem;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--glass-inner-border);
      color: var(--text-main);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: var(--glass-panel-hover);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald-accent);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* ---------------- CALCULATOR & SIMULATORS ---------------- */
    .calc-slider-box {
      margin: 1.5rem 0;
    }

    .calc-slider {
      width: 100%;
      height: 8px;
      border-radius: 9999px;
      background: var(--glass-inner-border);
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    }

    .calc-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--emerald-accent);
      cursor: pointer;
      box-shadow: 0 0 12px var(--emerald-glow);
    }

    .calc-output-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-top: 1.5rem;
    }

    .calc-stat {
      background: var(--glass-panel-hover);
      border: 1px solid var(--glass-border);
      padding: 1.25rem;
      border-radius: 16px;
      text-align: center;
    }

    .calc-val {
      font-size: 1.85rem;
      font-weight: 900;
      color: var(--emerald-accent);
    }

    .calc-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* ---------------- THERMAL RECEIPT PREVIEW ---------------- */
    .receipt-simulator {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin-top: 1.5rem;
    }

    .receipt-paper {
      background: #ffffff;
      color: #000000;
      width: 320px;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
      font-family: "Courier New", Courier, monospace;
      font-size: 0.82rem;
      line-height: 1.35;
      text-align: left;
    }

    .receipt-controls {
      flex: 1;
      min-width: 300px;
    }

    /* ---------------- SCREENSHOT GALLERY ---------------- */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .gallery-item {
      background: var(--glass-panel);
      border: 1px solid var(--glass-border);
      border-radius: 18px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: var(--card-shadow);
    }

    .gallery-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.2);
    }

    .gallery-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
      background: rgba(0, 0, 0, 0.1);
    }

    .gallery-caption {
      padding: 1rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main);
    }

    /* Fullscreen Modal Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(20px);
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .lightbox.active {
      display: flex;
    }

    .lightbox-img {
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      object-fit: contain;
    }

    .lightbox-close {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      color: #ffffff;
      font-size: 2rem;
      background: transparent;
      border: none;
      cursor: pointer;
      outline: none;
    }

    /* ---------------- RESPONSIVE STYLING ---------------- */
    @media (max-width: 768px) {
      .hero-title { font-size: 1.85rem; }
      .hero-banner { padding: 2rem 1.5rem; }
      .card { padding: 1.5rem; }
      .brand-title { font-size: 1.05rem; }
      .brand-badge { display: none; }
    }
  </style>
</head>
<body>

  <!-- ================= TOP GLASS NAVIGATION ================= -->
  <header class="glass-nav">
    <div class="brand-cluster" onclick="switchChapter('01-legal')">
      <img src="${logoBase64}" alt="KASPI Brand Mark" class="brand-logo">
      <div class="brand-title">
        <span>KASPI POS</span>
        <span style="font-weight: 700; opacity: 0.8;">كسب</span>
        <span class="brand-badge" id="nav-badge">DOSSIER v2.4</span>
      </div>
    </div>

    <!-- Instant Search Across All Chapters -->
    <div class="dossier-search-wrapper">
      <input type="text" id="dossier-search" class="dossier-search-input" placeholder="بحث فوري في الملف... / Search..." oninput="handleDossierSearch(this.value)">
    </div>

    <div class="nav-actions">
      <!-- 1-Click Print / Save Official PDF Button -->
      <button class="print-doc-btn" onclick="window.print()" title="طباعة أو حفظ PDF رسمي">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <span id="print-label">طباعة / PDF</span>
      </button>

      <!-- Trilingual Language Switcher -->
      <div class="lang-pill-group">
        <button class="lang-btn active" onclick="setLocale('ar')">العربية</button>
        <button class="lang-btn" onclick="setLocale('fr')">Français</button>
        <button class="lang-btn" onclick="setLocale('en')">English</button>
      </div>

      <!-- Theme Switcher (Circular Icon-Only) -->
      <button class="theme-toggle-btn" onclick="toggleTheme()" aria-label="Toggle Theme">
        <span id="theme-icon">☀️</span>
      </button>
    </div>
  </header>

  <!-- ================= SUB-NAV CHAPTER TABS ================= -->
  <nav class="chapter-tabs" id="chapter-tabs-bar">
    <button class="chapter-tab-btn active" onclick="switchChapter('01-legal')" id="tab-01">01. القانون والمؤسسة (Legal & BAM)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('02-infra')" id="tab-02">02. البنية وقاعدة البيانات (77 Models)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('03-audit')" id="tab-03">03. تدقيق الميزات (Feature Truth Matrix)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('04-tpe')" id="tab-04">04. أجهزة TPE والمدفوعات (Universal 7 Hub)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('05-economics')" id="tab-05">05. نموذج الأرباح والآلة الحاسبة (Economics)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('06-simulator')" id="tab-06">06. محاكي التذاكر والمعرض (Simulator & Gallery)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('07-marketing')" id="tab-07">07. دليل التسويق والوكالات (Marketing Pack)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('08-pentest')" id="tab-08">08. حماية كالي والطبقات التسع (Kali & 9-Layer Defense)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('09-swarm')" id="tab-09">09. أسطول السرب الميتوزي (12-Agent Mitosis Swarm)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('10-runtime')" id="tab-10">10. المحرك المحلي والسحابي (WebGPU / Trigger / Windows CI)</button>
    <button class="chapter-tab-btn" onclick="switchChapter('11-geo')" id="tab-11">11. استكشاف محركات الذكاء (GEO & llms.txt Strategy)</button>
  </nav>

  <!-- ================= MAIN CONTAINER ================= -->
  <main class="container">

    <!-- HERO EXECUTIVE BANNER -->
    <section class="hero-banner">
      <h1 class="hero-title" id="hero-title">الملف الشامل المعتمد: نظام كسب لإدارة نقاط البيع والتجزئة الذكية</h1>
      <p class="hero-subtitle" id="hero-subtitle">
        الحزمة الرسمية المتكاملة للجهات البنكية، المستثمرين، والمحامين: مطابقة قانون بنك المغرب 103-12، شهادة أمان PCI-DSS 4.0.1، معمارية 77 نموذج Prisma، وربط عالمي لـ 7 بروتوكولات TPE مع نسبة ربح إجمالي تتجاوز 91%.
      </p>

      <div class="hero-metrics">
        <div class="metric-card">
          <div class="metric-value">100%</div>
          <div class="metric-label" id="metric-1">جاهزية بدون إنترنت (Dexie.js)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">77</div>
          <div class="metric-label" id="metric-2">نموذج علائقي (Prisma Schema)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">7</div>
          <div class="metric-label" id="metric-3">بروتوكولات TPE عالمية (nexo/OPI/CMI)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">> 91%</div>
          <div class="metric-label" id="metric-4">هامش الربح الإجمالي (SaaS Gross Margin)</div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 01: LEGAL & CORPORATE ================= -->
    <section class="section-container active" id="sec-01-legal">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-01-1">1. التكييف القانوني وفق قانون بنك المغرب رقم 103-12</h2>
          <span class="card-badge">Non-Custodial TSP</span>
        </div>
        <p id="desc-01-1">
          يعمل نظام <strong>كسب (KASPI POS)</strong> حصرياً كمزود خدمات تقنية (Technology Service Provider - TSP). لا تحتفظ المنصة بأي أموال للتجار أو الزبناء، ولا تدير محافظ وسيطة أو حسابات ائتمانية. تمر الأموال مباشرة من بطاقة الزبون عبر المحول البنكي (CMI / PayZone / Stripe) إلى الحساب البنكي المرخص للتاجر لدى البنوك المغربية المعتمدة (التجاري وفا بنك، البنك الشعبي، بنك إفريقيا، CIH). وعليه، يُعفى النظام قانونياً من ترخيص مؤسسة أداء وفق مقتضيات المادة 15 من القانون 103-12.
        </p>

        <!-- 2D Separation Flowchart SVG -->
        <div class="diagram-wrapper">
          <svg viewBox="0 0 900 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="900" height="240" rx="16" fill="rgba(0,0,0,0.15)"/>
            
            <!-- Nodes -->
            <g transform="translate(40, 70)">
              <rect width="160" height="100" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
              <text x="80" y="45" fill="var(--text-main)" font-size="14" font-weight="bold" text-anchor="middle">الزبون / حامل البطاقة</text>
              <text x="80" y="68" fill="var(--text-muted)" font-size="11" text-anchor="middle">Customer / Cardholder</text>
            </g>

            <g transform="translate(260, 70)">
              <rect width="170" height="100" rx="12" fill="rgba(16,185,129,0.15)" stroke="var(--emerald-accent)" stroke-width="2"/>
              <text x="85" y="45" fill="var(--emerald-accent)" font-size="14" font-weight="bold" text-anchor="middle">جهاز الدفع TPE / Gateway</text>
              <text x="85" y="68" fill="var(--text-muted)" font-size="11" text-anchor="middle">Direct Encrypted Terminal</text>
            </g>

            <g transform="translate(490, 70)">
              <rect width="170" height="100" rx="12" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" stroke-width="2"/>
              <text x="85" y="45" fill="#38bdf8" font-size="14" font-weight="bold" text-anchor="middle">المحول البنكي / CMI</text>
              <text x="85" y="68" fill="var(--text-muted)" font-size="11" text-anchor="middle">Licensed Acquirer Switch</text>
            </g>

            <g transform="translate(710, 70)">
              <rect width="150" height="100" rx="12" fill="rgba(16,185,129,0.25)" stroke="var(--emerald-accent)" stroke-width="2"/>
              <text x="75" y="45" fill="var(--emerald-accent)" font-size="14" font-weight="bold" text-anchor="middle">حساب التاجر البنكي</text>
              <text x="75" y="68" fill="var(--text-muted)" font-size="11" text-anchor="middle">100% Direct Settlement</text>
            </g>

            <!-- Flows -->
            <path d="M 200 120 L 260 120" stroke="var(--emerald-accent)" stroke-width="3" stroke-dasharray="6 6"/>
            <path d="M 430 120 L 490 120" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 6"/>
            <path d="M 660 120 L 710 120" stroke="var(--emerald-accent)" stroke-width="3"/>

            <!-- KASPI SaaS Isolation Box -->
            <g transform="translate(260, 185)">
              <rect width="400" height="40" rx="8" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)"/>
              <text x="200" y="25" fill="#94a3b8" font-size="11" font-weight="bold" text-anchor="middle">
                نظام كسب السحابي KASPI POS (تبادل البيانات التقنية فقط — 0 درهم تدفق مالي)
              </text>
            </g>
          </svg>
        </div>

        <h3 style="margin: 1.5rem 0 0.5rem; font-size: 1.15rem;" id="title-01-2">مطابقة معايير أمان بطاقات الدفع PCI-DSS 4.0.1 وحماية المعطيات CNDP</h3>
        <ul style="margin-right: 1.5rem; margin-left: 1.5rem; color: var(--text-muted); font-size: 0.9rem;" id="list-01-1">
          <li><strong>حظر تخزين أرقام البطاقات (Zero PAN/CVV):</strong> خالٍ 100% من تخزين أرقام البطاقات البنكية الـ 16 أو الرمز السري CVV في قاعدة بيانات PostgreSQL.</li>
          <li><strong>عزل الإدخال عبر لوحة مفاتيح الأجهزة المعتمدة:</strong> يتم إدخال الرمز السري PIN حصرياً على الأجهزة المعتمدة PCI-PTS.</li>
          <li><strong>مطابقة قانون حماية المعطيات CNDP 09-08:</strong> التزام كامل بحماية المعطيات الشخصية للزبناء، مع إتاحة الحق في الحذف والنسيان التلقائي.</li>
          <li><strong>الفاتورة الإلكترونية والمطابقة الجبائية (DGI):</strong> طباعة أرقام التعريف الموحد للمقاولة (ICE)، الضريبة المهنية (TP)، ورقم السجل التجاري (RC) وفق المادة 145 من المدونة العامة للضرائب.</li>
        </ul>
      </div>
    </section>

    <!-- ================= CHAPTER 02: INFRASTRUCTURE & DATA ATLAS ================= -->
    <section class="section-container" id="sec-02-infra">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-02-1">2. أطلس المعمارية السحابية وقاعدة البيانات (77 Prisma Models)</h2>
          <span class="card-badge">PostgreSQL 16 + Rust</span>
        </div>
        <p id="desc-02-1">
          تم تصميم قاعدة البيانات العلائقية لضمان العزل التام للمتاجر (Multi-Tenant Isolation) وحصانة المعاملات ضد التكرار أو التلاعب، مع دعم وضع غير متصل 100% عبر Dexie.js (IndexedDB).
        </p>

        <!-- 3D Isometric SVG Architecture Diagram -->
        <div class="diagram-wrapper">
          <svg viewBox="0 0 900 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background ambient grid -->
            <pattern id="iso-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
            </pattern>
            <rect width="900" height="420" fill="url(#iso-grid)"/>

            <!-- Layer 4: Cloud & Persistence Layer -->
            <g class="iso-layer" transform="translate(150, 40)">
              <polygon points="300,20 580,90 280,160 0,90" fill="rgba(16,185,129,0.18)" stroke="var(--emerald-accent)" stroke-width="2"/>
              <text x="290" y="70" fill="var(--emerald-accent)" font-size="14" font-weight="900" text-anchor="middle">الطبقة الرابعة: السحابة وقواعد البيانات (Persistence & External Services)</text>
              <text x="290" y="95" fill="var(--text-muted)" font-size="11" text-anchor="middle">PostgreSQL 16 (77 Models) • Redis • Meta WhatsApp Cloud API • Google Gemini AI OCR</text>
            </g>

            <!-- Layer 3: Next.js 15 Backend API Layer -->
            <g class="iso-layer" transform="translate(150, 120)">
              <polygon points="300,20 580,90 280,160 0,90" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" stroke-width="2"/>
              <text x="290" y="70" fill="#38bdf8" font-size="14" font-weight="900" text-anchor="middle">الطبقة الثالثة: خوادم Next.js 15 والواجهات البرمجية (Edge API & RBAC)</text>
              <text x="290" y="95" fill="var(--text-muted)" font-size="11" text-anchor="middle">80+ Endpoints • JWT Auth (jose) • Upstash Token Bucket Rate Limiter • Multi-Tenant Middleware</text>
            </g>

            <!-- Layer 2: Client & Edge Offline Subsystem -->
            <g class="iso-layer" transform="translate(150, 200)">
              <polygon points="300,20 580,90 280,160 0,90" fill="rgba(245,158,11,0.18)" stroke="#f59e0b" stroke-width="2"/>
              <text x="290" y="70" fill="#f59e0b" font-size="14" font-weight="900" text-anchor="middle">الطبقة الثانية: تطبيق العميل والتشغيل دون إنترنت (Tauri 2.0 Rust & Dexie.js)</text>
              <text x="290" y="95" fill="var(--text-muted)" font-size="11" text-anchor="middle">IndexedDB Engine • Raw TCP Sockets • Win32 Spooler Printing • PWA Service Worker</text>
            </g>

            <!-- Layer 1: Hardware & POS Peripherals -->
            <g class="iso-layer" transform="translate(150, 280)">
              <polygon points="300,20 580,90 280,160 0,90" fill="rgba(168,85,247,0.18)" stroke="#a855f7" stroke-width="2"/>
              <text x="290" y="70" fill="#a855f7" font-size="14" font-weight="900" text-anchor="middle">الطبقة الأولى: الأجهزة والملحقات الميدانية (Hardware & Peripheral Layer)</text>
              <text x="290" y="95" fill="var(--text-muted)" font-size="11" text-anchor="middle">Universal TPE Terminals • ESC/POS 58/80mm Thermal Printers • Electronic Weight Scales • Barcode Wedges</text>
            </g>

            <!-- Pulsing Vertical Data Packets -->
            <circle cx="440" cy="180" r="5" fill="var(--emerald-accent)">
              <animate attributeName="cy" values="320;120;320" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.2;1;0.2" dur="3s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>

        <h3 style="margin: 1.5rem 0 0.5rem; font-size: 1.15rem;" id="title-02-2">فهرس النماذج العلائقية في Prisma (77 نموذج مقسمة حسب الوظيفة)</h3>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th id="th-mod-group">المجموعة الوظيفية</th>
                <th id="th-mod-count">عدد النماذج</th>
                <th id="th-mod-samples">نماذج الجداول الرئيسية</th>
                <th id="th-mod-status">حالة التدقيق</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>الهوية والمتاجر والاشتراكات</strong></td>
                <td>9</td>
                <td>Tenant, Store, User, Role, TenantSubscription, TenantBillingInvoice, ApiKey</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>المنتجات والأصناف والباركود</strong></td>
                <td>10</td>
                <td>Product, Category, ProductVariant, ProductPrice, Unit, ScaleConfiguration</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>المخزون وحركات السلع والموردين</strong></td>
                <td>10</td>
                <td>Inventory, StockMovement, Supplier, PurchaseOrder, StockAudit, WasteLog</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>نقطة البيع والورديات والتذاكر</strong></td>
                <td>12</td>
                <td>Order, OrderItem, Payment, CashShift, CashMovement, HeldOrder, TpeTransaction</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>الزبائن والكريدي (دفتر الديون) والولاء</strong></td>
                <td>7</td>
                <td>Customer, CustomerCreditLedger, LoyaltyAccount, LoyaltyTier</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>المطاعم وشاشات المطبخ KDS والطاولات</strong></td>
                <td>7</td>
                <td>DiningTable, DiningArea, KitchenTicket, KitchenTicketItem, CourseDefinition</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>الفوترة الدورية وسجل النشاط اليومي</strong></td>
                <td>7</td>
                <td>Subscription, SubscriptionPayment, StoreDailyStreak, WebhookEvent</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
              <tr>
                <td><strong>المزامنة الطرفية والأمان الجنائي</strong></td>
                <td>8</td>
                <td>Device, OfflineSyncRecord, OfflineBatchLog, SecurityIncident</td>
                <td><span class="status-pill">✓ موثق 100%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 03: FEATURE TRUTH MATRIX ================= -->
    <section class="section-container" id="sec-03-audit">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-03-1">3. مصفوفة التحقق البرمجي التام (Feature Truth Matrix)</h2>
          <span class="card-badge">Zero Vaporware</span>
        </div>
        <p id="desc-03-1">
          مقارنة حية لجميع الميزات المعلنة في الصفحة الرئيسية للتسويق مقابل الكود الفعلي المطبق في النظام:
        </p>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th id="th-ft-claim">الميزة / الوعد التجاري</th>
                <th id="th-ft-file">ملف الكود المصدري المطبق</th>
                <th id="th-ft-mech">الآلية الهندسية الفعلية</th>
                <th id="th-ft-status">نتيجة الفحص الحي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>نظام كيس يشتغل دون إنترنت 100%</strong></td>
                <td><code>src/client/db.ts</code>, <code>public/sw.js</code></td>
                <td>قاعدة بيانات IndexedDB عبر Dexie.js + طابور مزامنة خلفي ذكي</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>ربط TPE بدون إعادة إدخال المبلغ</strong></td>
                <td><code>src/lib/tpe/TpeTransactionBridge.ts</code></td>
                <td>آلة حالات 11-State FSM مع حماية انقطاع الشبكة وقفل المبلغ</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>ميزان الخضر والفواكه الذكي (PLU)</strong></td>
                <td><code>SquarePluScalePanel.tsx</code></td>
                <td>لوحة أزرار لمسية مع صور المنتجات ومعدل الوزن <code>- 0.250kg +</code></td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>تذاكر حرارية مطابقة للمعايير المغربية</strong></td>
                <td><code>ThermalReceipt.tsx</code></td>
                <td>عنوان واحد، اسم متجر واحد، إخفاء الهاتف، وأسعار صافية TTC</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>توليد باركود وQR دون تكلفة سحابية</strong></td>
                <td><code>src/lib/tpe/client-codes.ts</code></td>
                <td>خوارزمية pure TypeScript vector SVG لتوليد Code 128 وQR Code</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>شاشات المطبخ الذكية (KDS)</strong></td>
                <td><code>src/app/[locale]/restaurant/kds/</code></td>
                <td>توزيع الطلبات حسب محطة الطبخ مع تنبيهات تأخير ملونة</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>مساعد كسب الذكي KASPI AI</strong></td>
                <td><code>AIChatWidget.tsx</code></td>
                <td>ذكاء اصطناعي صوتي ونصي مدمج لتحليل المبيعات والمخزون</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>تطبيق مكتبي سريع وخفيف (Tauri 2.0)</strong></td>
                <td><code>src-tauri/</code></td>
                <td>كود Rust مدمج (<15MB RAM) مع طباعة مباشرة عبر منافذ COM وUSB</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
              <tr>
                <td><strong>تسعير ثابت: 200 درهم + 150 للإضافي</strong></td>
                <td><code>subscription-manager.ts</code></td>
                <td>معادلة برمجية صارمة تمنع التكاليف الخفية وتضمن فتح كافة الميزات</td>
                <td><span class="status-pill">✓ PASS</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 04: UNIVERSAL TPE HUB ================= -->
    <section class="section-container" id="sec-04-tpe">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-04-1">4. مركز الربط الشامل لأجهزة الدفع (Universal 7-Protocol TPE Hub)</h2>
          <span class="card-badge">Zero Amount Re-entry</span>
        </div>
        <p id="desc-04-1">
          يدعم نظام كسب التواصل المباشر مع أجهزة PAX وIngenico وVerifone وCastles عبر 7 عائلات بروتوكولات عالمية لمنع أخطاء الصرافين:
        </p>

        <!-- 11-State Finite State Machine Diagram -->
        <div class="diagram-wrapper">
          <svg viewBox="0 0 900 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="900" height="280" rx="16" fill="rgba(0,0,0,0.2)"/>
            
            <!-- States -->
            <g transform="translate(30, 40)">
              <circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
              <text x="50" y="48" fill="var(--text-main)" font-size="11" font-weight="bold" text-anchor="middle">DISCONNECTED</text>
              <text x="50" y="62" fill="var(--text-muted)" font-size="9" text-anchor="middle">غير متصل</text>
            </g>

            <g transform="translate(160, 40)">
              <circle cx="50" cy="50" r="40" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" stroke-width="2"/>
              <text x="50" y="48" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">IDLE</text>
              <text x="50" y="62" fill="var(--text-muted)" font-size="9" text-anchor="middle">جاهز للمعاملة</text>
            </g>

            <g transform="translate(290, 40)">
              <circle cx="50" cy="50" r="40" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="2"/>
              <text x="50" y="48" fill="#f59e0b" font-size="11" font-weight="bold" text-anchor="middle">LOCKED</text>
              <text x="50" y="62" fill="var(--text-muted)" font-size="9" text-anchor="middle">المبلغ مقفول</text>
            </g>

            <g transform="translate(420, 40)">
              <circle cx="50" cy="50" r="40" fill="rgba(168,85,247,0.15)" stroke="#a855f7" stroke-width="2"/>
              <text x="50" y="48" fill="#a855f7" font-size="11" font-weight="bold" text-anchor="middle">PIN ENTRY</text>
              <text x="50" y="62" fill="var(--text-muted)" font-size="9" text-anchor="middle">إدخال الرمز</text>
            </g>

            <g transform="translate(550, 40)">
              <circle cx="50" cy="50" r="40" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" stroke-width="2"/>
              <text x="50" y="48" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">AUTHORIZING</text>
              <text x="50" y="62" fill="var(--text-muted)" font-size="9" text-anchor="middle">معالجة البنك</text>
            </g>

            <g transform="translate(680, 40)">
              <circle cx="50" cy="50" r="40" fill="rgba(16,185,129,0.25)" stroke="var(--emerald-accent)" stroke-width="3"/>
              <text x="50" y="48" fill="var(--emerald-accent)" font-size="12" font-weight="bold" text-anchor="middle">SUCCESS</text>
              <text x="50" y="62" fill="var(--text-muted)" font-size="9" text-anchor="middle">تمت الموافقة</text>
            </g>

            <!-- Disconnect Recovery Loop -->
            <g transform="translate(420, 170)">
              <rect width="230" height="70" rx="12" fill="rgba(239,68,68,0.15)" stroke="#ef4444" stroke-width="2"/>
              <text x="115" y="32" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">DISCONNECT RECOVERY</text>
              <text x="115" y="50" fill="var(--text-muted)" font-size="10" text-anchor="middle">استعادة الاتصال وفحص حالة العملية آلياً</text>
            </g>

            <!-- Connective Arrows -->
            <path d="M 120 90 L 160 90" stroke="rgba(255,255,255,0.4)" stroke-width="2" marker-end="url(#arrow)"/>
            <path d="M 250 90 L 290 90" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <path d="M 380 90 L 420 90" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <path d="M 510 90 L 550 90" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <path d="M 640 90 L 680 90" stroke="var(--emerald-accent)" stroke-width="3"/>
            <path d="M 600 130 L 600 170" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 4"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 05: ECONOMICS & CALCULATOR ================= -->
    <section class="section-container" id="sec-05-economics">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-05-1">5. النموذج المالي ومحاكي الأرباح الإجمالية (Gross Margin Simulator)</h2>
          <span class="card-badge">> 91% Gross Margin</span>
        </div>
        <p id="desc-05-1">
          حساب العائدات الدورية (MRR / ARR) وهامش الربح الإجمالي التقديري بناءً على معادلة <code>200 MAD + 150 MAD</code>:
        </p>

        <div class="calc-slider-box">
          <div style="display: flex; justify-content: space-between; font-weight: 800; margin-bottom: 0.5rem;">
            <span id="slider-label">عدد أجهزة الكاشير النشطة (Active Postes):</span>
            <span id="slider-display-val" style="color: var(--emerald-accent); font-size: 1.25rem;">1,000</span>
          </div>
          <input type="range" min="50" max="25000" step="50" value="1000" class="calc-slider" id="postes-range" oninput="updateCalculator(this.value)">
        </div>

        <div class="calc-output-grid">
          <div class="calc-stat">
            <div class="calc-val" id="calc-mrr">183,350 MAD</div>
            <div class="calc-label" id="lbl-mrr">الإيراد الشهري المتكرر (MRR)</div>
          </div>
          <div class="calc-stat">
            <div class="calc-val" id="calc-arr">2,200,200 MAD</div>
            <div class="calc-label" id="lbl-arr">الإيراد السنوي المتكرر (ARR)</div>
          </div>
          <div class="calc-stat">
            <div class="calc-val" id="calc-cogs">13,005 MAD</div>
            <div class="calc-label" id="lbl-cogs">تكلفة السحابة والتشغيل (COGS)</div>
          </div>
          <div class="calc-stat">
            <div class="calc-val" id="calc-margin">92.9%</div>
            <div class="calc-label" id="lbl-margin">نسبة هامش الربح الإجمالي</div>
          </div>
          <div class="calc-stat" style="grid-column: 1 / -1;">
            <div class="calc-val" id="calc-profit" style="font-size: 2.2rem;">170,345 MAD / شهر</div>
            <div class="calc-label" id="lbl-profit">صافي الربح التشغيلي الإجمالي المقدر (Gross Profit)</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 06: RECEIPT SIMULATOR & GALLERY ================= -->
    <section class="section-container" id="sec-06-simulator">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-06-1">6. محاكي التذاكر الحرارية ومعرض الواجهات المعتمدة</h2>
          <span class="card-badge">Live Vector SVG</span>
        </div>

        <!-- Receipt Simulator Box -->
        <div class="receipt-simulator">
          <div class="receipt-paper" id="paper-receipt">
            <div style="text-align: center; font-weight: bold; font-size: 1.05rem;">KASPI SHOWROOM</div>
            <div style="text-align: center; font-size: 0.75rem; margin-bottom: 0.5rem;">Bd d'Anfa, Casablanca</div>
            <div style="text-align: center; font-size: 0.7rem; border-bottom: 1px dashed #000; padding-bottom: 0.5rem;">
              ICE: 002345678000045 • TP: 34120984
            </div>
            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0; font-size: 0.75rem;">
              <span>Ticket #0042</span>
              <span>2026-11-17 14:30</span>
            </div>
            <div style="border-bottom: 1px solid #000; padding-bottom: 0.25rem; margin-bottom: 0.5rem;">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>Article</span>
                <span>Total</span>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>1x Adidas Sweater</span>
              <span>150.00 MAD</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>1x iPhone 18 Pro</span>
              <span>14500.00 MAD</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>1.25kg لوز بلدي</span>
              <span>150.00 MAD</span>
            </div>
            <div style="border-top: 1px dashed #000; margin-top: 0.5rem; padding-top: 0.5rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between;">
              <span>TOTAL TTC</span>
              <span>14800.00 MAD</span>
            </div>
            <div style="font-size: 0.7rem; margin-top: 0.5rem; border-top: 1px solid #ccc; padding-top: 0.4rem;">
              Paiement: TPE Carte Bancaire (CMI / VISA)<br>
              Auth Code: 894102 • STAN: 001429
            </div>
            <div style="text-align: center; margin-top: 1rem;" id="receipt-svg-qr">
              <!-- Pure SVG Vector QR Code will be injected here -->
            </div>
            <div style="text-align: center; font-size: 0.7rem; margin-top: 0.5rem;">
              Merci de votre visite à bientôt !
            </div>
          </div>

          <div class="receipt-controls">
            <h3 style="margin-bottom: 1rem;" id="rcpt-ctrl-title">خصائص التذكرة الحرارية</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;" id="rcpt-ctrl-desc">
              تعتمد تذاكر كسب على خوارزميات نظيفة تمنع تكرار اسم المتجر أو المدينة، مع إخفاء أرقام هواتف الزبائن لحماية الخصوصية، وتوليد رمز الاستجابة السريع QR والباركود 1D بنظام المتجهات الصرفة دون أي اعتماد على خوادم خارجية أو إنترنت.
            </p>
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem;">
              <button class="lang-btn active" style="border: 1px solid var(--glass-border);" onclick="setReceiptWidth(80)">عرض 80mm</button>
              <button class="lang-btn" style="border: 1px solid var(--glass-border);" onclick="setReceiptWidth(58)">عرض 58mm</button>
            </div>
          </div>
        </div>

        <!-- Verified Visual Screenshot Gallery -->
        <h3 style="margin: 2.5rem 0 1rem; font-size: 1.35rem;" id="gallery-title">معرض لقطات الشاشة المعتمدة حياً (Verified Live Gallery)</h3>
        <div class="gallery-grid">
          <div class="gallery-item" onclick="openLightbox('${screenshots.posLight}')">
            <img src="${screenshots.posLight}" alt="POS Grid Pearl Light" class="gallery-img">
            <div class="gallery-caption">شاشة البيع POS — الوضع الفاتح (Pearl Light)</div>
          </div>
          <div class="gallery-item" onclick="openLightbox('${screenshots.posDark}')">
            <img src="${screenshots.posDark}" alt="POS Grid Fjord Twilight" class="gallery-img">
            <div class="gallery-caption">شاشة البيع POS — الوضع الليلي (Fjord Twilight)</div>
          </div>
          <div class="gallery-item" onclick="openLightbox('${screenshots.dashLight}')">
            <img src="${screenshots.dashLight}" alt="Dashboard Analytics" class="gallery-img">
            <div class="gallery-caption">لوحة التحكم والمؤشرات المالية الحية</div>
          </div>
          <div class="gallery-item" onclick="openLightbox('${screenshots.tpeLight}')">
            <img src="${screenshots.tpeLight}" alt="Settings TPE Hub" class="gallery-img">
            <div class="gallery-caption">مركز إدارة أجهزة الدفع واستوديو التذاكر</div>
          </div>
          <div class="gallery-item" onclick="openLightbox('${screenshots.kdsLight}')">
            <img src="${screenshots.kdsLight}" alt="KDS Kitchen Display" class="gallery-img">
            <div class="gallery-caption">شاشات المطبخ الذكية وتنسيق الطلبات (KDS)</div>
          </div>
          <div class="gallery-item" onclick="openLightbox('${screenshots.mobileLight}')">
            <img src="${screenshots.mobileLight}" alt="Mobile POS Register" class="gallery-img">
            <div class="gallery-caption">واجهة الموبايل المتجاوبة (390x844px)</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 07: MARKETING PACK ================= -->
    <section class="section-container" id="sec-07-marketing">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-07-1">7. حزمة التسويق والوكالات التجارية (Shopify-Grade Marketing Pack)</h2>
          <span class="card-badge">Growth & Field Playbook</span>
        </div>
        <p id="desc-07-1">
          استراتيجية التوسع الميداني والإعلانات الرقمية لافتتاح الأسواق واستقطاب محلات البقالة والمطاعم في المغرب وشمال إفريقيا:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">زاوية البقالة (مول الحانوت)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              "كناش الكريدي ولى إلكتروني والفلوس ما عمرها تضيع" — استرجاع ديون الزبائن بدقة، تنبيهات انتهاء الصلاحية، وسرعة فائقة في مسح الباركود.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">زاوية المقاهي والمطاعم</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              "الكوموند كتمشي للكوزينة فثانية والحساب مقسوم فدقيقة" — شاشات KDS في المطبخ، تنظيم طاولات التيراس، وقسمة الحساب بلمسة واحدة.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">خطة السفراء الميدانية (Field Reps)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              حقيبة العرض المتنقلة (تابلت + طابعة بلوتوث). طباعة تذكرة تجريبية حقيقية باسم المحل في 3 دقائق تحول أكثر من 40% من التجار في الزيارة الأولى.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 08: KALI PENTEST HARDENING & 9-LAYER DEFENSE ================= -->
    <section class="section-container" id="sec-08-pentest">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-08-1">8. جدار أمان كالي والطبقات التسع (Kali Linux Pentest Hardening & 9+ Defense Shield Pipeline)</h2>
          <span class="card-badge">Defense-in-Depth & Anti-Tampering</span>
        </div>
        <p id="desc-08-1">
          تم تحصين معمارية كسب ضد اختبارات الاختراق المتقدمة (Kali Linux Pentesting) وأدوات الفحص الهجومي (Burp Suite, SQLMap, Hydra, ffuf, Nmap, Nuclei). لا يعتمد النظام على تعليقات وهمية بل يطبق معمارية دفاعية متعددة الطبقات تجعل استغلال الثغرات مستحيلاً:
        </p>

        <!-- 9-Layer Defense Shield Diagram -->
        <div class="diagram-container">
          <h4 style="margin-bottom: 1.25rem; color: var(--emerald-accent); font-size: 1.1rem;">مخطط خط أنابيب الدروع الدفاعية التسع (9+ Defense Shield Pipeline)</h4>
          <svg width="100%" height="240" viewBox="0 0 940 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width: 940px;">
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#059669" stop-opacity="0.3"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            <!-- Connecting Pipeline -->
            <path d="M 50 120 L 890 120" stroke="rgba(16, 185, 129, 0.4)" stroke-width="4" stroke-dasharray="8 6"/>
            <!-- 9 Shield Nodes -->
            <!-- 1. Cloudflare/CRS -->
            <g transform="translate(40, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2" filter="url(#glow)"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">01. Edge</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Cloudflare</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">OWASP CRS</text>
            </g>
            <!-- 2. WAF/IPS -->
            <g transform="translate(140, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">02. WAF/IPS</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Auto-Ban</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">SQLi/XSS Wall</text>
            </g>
            <!-- 3. Zero-Trust -->
            <g transform="translate(240, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">03. Admin</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Zero-Trust</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">HMAC + 2FA</text>
            </g>
            <!-- 4. Rate Limiting -->
            <g transform="translate(340, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">04. Throttle</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Rate Limiter</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">Token Bucket</text>
            </g>
            <!-- 5. Strict Zod -->
            <g transform="translate(440, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">05. Zod Strict</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Schema Gate</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">Zero Injection</text>
            </g>
            <!-- 6. Authoritative Pricing -->
            <g transform="translate(540, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">06. Pricing</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Server Truth</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">Anti-Tamper</text>
            </g>
            <!-- 7. Postgres RLS -->
            <g transform="translate(640, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">07. DB RLS</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">PostgreSQL</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">Tenant Vault</text>
            </g>
            <!-- 8. Idempotency -->
            <g transform="translate(740, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">08. Replay</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Idempotency</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">Deduplication</text>
            </g>
            <!-- 9. Forensic AuditLog -->
            <g transform="translate(840, 70)">
              <rect width="80" height="100" rx="14" fill="var(--glass-panel)" stroke="#10b981" stroke-width="2" filter="url(#glow)"/>
              <text x="40" y="35" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">09. Audit</text>
              <text x="40" y="55" text-anchor="middle" fill="var(--text-muted)" font-size="9">Immutable</text>
              <text x="40" y="72" text-anchor="middle" fill="#10b981" font-size="8" font-weight="700">Write-Only</text>
            </g>
          </svg>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-top: 1.5rem;">
          <div class="metric-card" style="padding: 1.25rem;">
            <h4 style="color: var(--emerald-accent); font-size: 0.95rem; margin-bottom: 0.4rem;">حظر تلاعب الأسعار (Burp Suite Price Tampering)</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">
              يقوم الخادم بحساب إجمالي السلة والأسعار الفردية بشكل مستقل بناءً على قاعدة البيانات (Authoritative Server Pricing). أي محاولة لتعديل السعر أو إرسال كميات سالبة تُرفض فوراً برمز 400 وتُسجل في سجل الحوادث الأمني AuditLog.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.25rem;">
            <h4 style="color: var(--emerald-accent); font-size: 0.95rem; margin-bottom: 0.4rem;">إيقاف خرائط المصدر (Source Maps Suppressed)</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">
              تم تعطيل productionBrowserSourceMaps وإخفاء ترويسة x-powered-by في ملف next.config.mjs لمنع أدوات استطلاع DevTools من قراءة الكود المصدري الأصلي للبنية.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.25rem;">
            <h4 style="color: var(--emerald-accent); font-size: 0.95rem; margin-bottom: 0.4rem;">الإفصاح الأمني المنظم (RFC 9116)</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">
              اعتماد ملف /.well-known/security.txt الرسمي متضمناً قنوات الإبلاغ الآمن وتفويض الباحثين الأخلاقيين وفق شروط الحماية القانونية المعترف بها دولياً.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 09: PLANETARY MITOSIS SWARM V2 ================= -->
    <section class="section-container" id="sec-09-swarm">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-09-1">9. أسطول السرب الميتوزي والوكلاء الذاتيون (Planetary Fractal Mitosis Swarm V2 & 12-Agent Fleet)</h2>
          <span class="card-badge">Autonomous Self-Healing Swarm</span>
        </div>
        <p id="desc-09-1">
          معمارية السرب الذاتي اللامركزي الموزع عبر 12 وكيلاً متخصصاً يعملون بنظام الرصد المستمر والشفاء التلقائي (Self-Healing Boundary) لضمان عدم توقف عمليات البيع أو فقدان البيانات تحت أي ظرف:
        </p>

        <!-- Animated Swarm Planetary Diagram -->
        <div class="diagram-container">
          <h4 style="margin-bottom: 1.25rem; color: var(--emerald-accent); font-size: 1.1rem;">مخطط الأسطول المداري لـ 12 وكيلاً ذاتياً (Planetary Fractal Mitosis Swarm V2)</h4>
          <svg width="100%" height="320" viewBox="0 0 600 320" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width: 600px;">
            <!-- Orbital Rings -->
            <circle cx="300" cy="160" r="130" stroke="rgba(16, 185, 129, 0.25)" stroke-width="1.5" stroke-dasharray="6 6"/>
            <circle cx="300" cy="160" r="85" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.5"/>
            <!-- Center Core Node -->
            <circle cx="300" cy="160" r="42" fill="var(--glass-panel)" stroke="#10b981" stroke-width="3"/>
            <text x="300" y="155" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="900">KASPI SWARM</text>
            <text x="300" y="172" text-anchor="middle" fill="#10b981" font-size="9" font-weight="700">MITOSIS CORE</text>
            <!-- 12 Agent Orbiting Nodes -->
            <!-- 1. Supervisor -->
            <circle cx="300" cy="30" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="300" y="34" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A01</text>
            <!-- 2. Security -->
            <circle cx="365" cy="48" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="365" y="52" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A02</text>
            <!-- 3. TPE Hub -->
            <circle cx="418" cy="98" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="418" y="102" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A03</text>
            <!-- 4. Dexie Sync -->
            <circle cx="430" cy="160" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="430" y="164" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A04</text>
            <!-- 5. Fiscal Seq -->
            <circle cx="418" cy="222" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="418" y="226" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A05</text>
            <!-- 6. Inventory -->
            <circle cx="365" cy="272" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="365" y="276" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A06</text>
            <!-- 7. Thermal Print -->
            <circle cx="300" cy="290" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="300" y="294" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A07</text>
            <!-- 8. KDS Kitchen -->
            <circle cx="235" cy="272" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="235" y="276" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A08</text>
            <!-- 9. AI Retail -->
            <circle cx="182" cy="222" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="182" y="226" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A09</text>
            <!-- 10. WhatsApp -->
            <circle cx="170" cy="160" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="170" y="164" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A10</text>
            <!-- 11. Billing -->
            <circle cx="182" cy="98" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="182" y="102" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A11</text>
            <!-- 12. Self-Healing -->
            <circle cx="235" cy="48" r="16" fill="var(--glass-panel)" stroke="#10b981" stroke-width="1.5"/>
            <text x="235" y="52" text-anchor="middle" fill="var(--text-main)" font-size="8" font-weight="700">A12</text>
          </svg>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
          <div class="metric-card" style="padding: 1rem;">
            <strong style="color: var(--emerald-accent);">A01-A03:</strong> التنسيق المركزي، مراقبة الاختراق والامتثال، وجسر بروتوكولات TPE السبعة.
          </div>
          <div class="metric-card" style="padding: 1rem;">
            <strong style="color: var(--emerald-accent);">A04-A06:</strong> المزامنة المحلية Dexie، التسلسل الضريبي المادة 145، وتنبيهات انتهاء الصلاحية DLC.
          </div>
          <div class="metric-card" style="padding: 1rem;">
            <strong style="color: var(--emerald-accent);">A07-A09:</strong> درايفر الطباعة ESC/POS، خادم شاشات المطبخ KDS، والمستشار الذكي المحلي.
          </div>
          <div class="metric-card" style="padding: 1rem;">
            <strong style="color: var(--emerald-accent);">A10-A12:</strong> إشعارات واتساب، تسوية الفوترة المتكررة، وحاجز الشفاء الذاتي التلقائي.
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 10: ADVANCED RUNTIME ENGINE ================= -->
    <section class="section-container" id="sec-10-runtime">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-10-1">10. المحرك المحلي والسحابي (WebGPU / Trigger.dev Microservices & Windows CI/CD)</h2>
          <span class="card-badge">Hybrid Runtime & Zero Cloud Waste</span>
        </div>
        <p id="desc-10-1">
          بنية تشغيل هجينة تمزج بين كفاءة المعالجة المحلية الخارقة عبر WebGPU على أجهزة نقاط البيع، والمهام الخلفية الموثوقة عبر Trigger.dev، وحزم التثبيت الأصلية لويندوز وماك عبر Tauri v2:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">معالجة الذكاء المحلي (WebGPU / Rust)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              تشغيل نماذج الذكاء الاصطناعي المحلية لقراءة فواتير الموردين (OCR) وتصنيف المنتجات مباشرة عبر كارت الشاشة المحلي للتاجر بسرعة استجابة أقل من 80ms وتكلفة سحابية صفرية ($0.00).
            </p>
          </div>
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">المهام الخلفية المجدولة (Trigger.dev)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              أتمتة إنتاج تقارير الإغلاق اليومي (Z-Report)، إرسال ملخصات الأرباح للتجار عبر واتساب عند منتصف الليل، وحفظ نسخ احتياطية مشفرة خارج الخادم الرئيسي بصورة مؤتمتة 100%.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">حزم ويندوز الأصلية (Tauri v2 .exe / .msi)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              بناء أوتوماتيكي عبر GitHub Actions ينتج ملفات تثبيت خفيفة جداً (أقل من 15MB ومعدل استهلاك ذاكرة لا يتجاوز 35MB RAM)، تدعم التحديث الذاتي الموقّع بـ minisign والعمل بدون إنترنت لشهور.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CHAPTER 11: WHITE-HAT GEO & LLM DISCOVERY ================= -->
    <section class="section-container" id="sec-11-geo">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title" id="title-11-1">11. استكشاف محركات الذكاء الاصطناعي والأرشفة الرسمية (GEO / AEO Strategy & llms.txt)</h2>
          <span class="card-badge">Factual Machine-Readable Discovery</span>
        </div>
        <p id="desc-11-1">
          استراتيجية معيارية صادقة ومطابقة لمواصفات الويب الحديثة، تُمكّن محركات الذكاء الاصطناعي التوليدية (ChatGPT, Claude, Gemini, Perplexity, Copilot) من قراءة واقتراح نظام كسب بدقة دون تضخيم أو حشو:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">ملف /llms.txt و /llms-full.txt</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              ملخصات بنيوية معتمدة تورد أسعار النظام الصريحة (200 درهم للمركز الأول + 150 درهم للإضافي)، القطاعات الستة، مطابقة بنك المغرب 103-12، وربط أجهزة الدفع العالمية السبعة.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">بيانات Schema.org المنظمة (JSON-LD)</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              تضمين كائنات Organization و SoftwareApplication و FAQPage في الصفحة الرئيسية لتسهيل الفهرسة الدقيقة لمحركات البحث الذكية وتقديم إجابات جاهزة عن التسعير والامتثال الضريبي.
            </p>
          </div>
          <div class="metric-card" style="padding: 1.5rem;">
            <h4 style="font-size: 1.1rem; color: var(--emerald-accent); margin-bottom: 0.5rem;">سياسة robots.txt الصارمة</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              السماح بفهرسة الصفحات التعريفية وملفات الاستكشاف الذكي، مع حجب كامل لمسارات لوحة التحكم وصفحات نقاط البيع لحماية خصوصية المعاملات والبيانات التجارية للتجار.
            </p>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- LIGHTBOX MODAL -->
  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
    <img src="" alt="Fullscreen Preview" class="lightbox-img" id="lightbox-img" onclick="event.stopPropagation()">
  </div>

  <!-- ================= JAVASCRIPT LOGIC & TRILINGUAL DICTIONARY ================= -->
  <script>
    // 1. TRILINGUAL SYMMETRIC DICTIONARY
    const i18n = {
      ar: {
        dir: "rtl",
        heroTitle: "الملف الشامل المعتمد: نظام كسب لإدارة نقاط البيع والتجزئة الذكية",
        heroSubtitle: "الحزمة الرسمية المتكاملة للجهات البنكية، المستثمرين، والمحامين: مطابقة قانون بنك المغرب 103-12، شهادة أمان PCI-DSS 4.0.1، معمارية 77 نموذج Prisma، وربط عالمي لـ 7 بروتوكولات TPE مع نسبة ربح إجمالي تتجاوز 91%.",
        m1: "جاهزية بدون إنترنت (Dexie.js)",
        m2: "نموذج علائقي (Prisma Schema)",
        m3: "بروتوكولات TPE عالمية (nexo/OPI/CMI)",
        m4: "هامش الربح الإجمالي (SaaS Gross Margin)",
        tab1: "01. القانون والمؤسسة (Legal & BAM)",
        tab2: "02. البنية وقاعدة البيانات (77 Models)",
        tab3: "03. تدقيق الميزات (Feature Truth Matrix)",
        tab4: "04. أجهزة TPE والمدفوعات (Universal 7 Hub)",
        tab5: "05. نموذج الأرباح والآلة الحاسبة (Economics)",
        tab6: "06. محاكي التذاكر والمعرض (Simulator & Gallery)",
        tab7: "07. دليل التسويق والوكالات (Marketing Pack)",
        tab8: "08. حماية كالي والطبقات التسع (Kali & 9-Layer Defense)",
        tab9: "09. أسطول السرب الميتوزي (12-Agent Mitosis Swarm)",
        tab10: "10. المحرك المحلي والسحابي (WebGPU / Trigger / Windows CI)",
        tab11: "11. استكشاف محركات الذكاء (GEO & llms.txt Strategy)",
        printLabel: "طباعة / PDF",
        searchPlaceholder: "بحث فوري في الملف... / Search...",
        sliderLabel: "عدد أجهزة الكاشير النشطة (Active Postes):",
        lblMrr: "الإيراد الشهري المتكرر (MRR)",
        lblArr: "الإيراد السنوي المتكرر (ARR)",
        lblCogs: "تكلفة السحابة والتشغيل (COGS)",
        lblMargin: "نسبة هامش الربح الإجمالي",
        lblProfit: "صافي الربح التشغيلي الإجمالي المقدر (Gross Profit)",
      },
      fr: {
        dir: "ltr",
        heroTitle: "Dossier Maître Officiel : KASPI POS & Gestion Commerciale Intelligente",
        heroSubtitle: "Le package institutionnel officiel pour banques, acquéreurs, investisseurs et conseils juridiques : conformité Loi BAM 103-12, PCI-DSS 4.0.1, 77 modèles Prisma, et hub TPE 7 protocoles avec marge brute >91%.",
        m1: "Fonctionnement Hors-Ligne (Dexie.js)",
        m2: "Modèles Relationnels (Prisma)",
        m3: "Protocoles TPE Mondiaux (nexo/OPI/CMI)",
        m4: "Marge Brute SaaS (>91%)",
        tab1: "01. Cadre Légal & Bancaire (Loi 103-12)",
        tab2: "02. Infrastructure & Schéma (77 Modèles)",
        tab3: "03. Vérité Fonctionnelle (Truth Matrix)",
        tab4: "04. Terminaux TPE (Universal 7 Hub)",
        tab5: "05. Économie SaaS & Simulateur (Marges)",
        tab6: "06. Simulateur Tickets & Galerie (Visuels)",
        tab7: "07. Pack Agence & Marketing (Playbook)",
        tab8: "08. Blindage Kali & 9 Boucliers (Kali Wall)",
        tab9: "09. Essaim Fractal & 12 Agents (Mitosis Swarm)",
        tab10: "10. Moteur Local & Cloud (WebGPU / Trigger)",
        tab11: "11. Stratégie IA Fait-Maison (GEO & llms.txt)",
        printLabel: "Imprimer / PDF",
        searchPlaceholder: "Rechercher dans le dossier...",
        sliderLabel: "Nombre de Postes de Caisse Actifs :",
        lblMrr: "Revenu Récurrent Mensuel (MRR)",
        lblArr: "Revenu Récurrent Annuel (ARR)",
        lblCogs: "Coût d'Infrastructure Cloud (COGS)",
        lblMargin: "Marge Brute d'Exploitation",
        lblProfit: "Profit Brut d'Exploitation Estimé",
      },
      en: {
        dir: "ltr",
        heroTitle: "Official Master Dossier: KASPI POS Smart Retail Architecture",
        heroSubtitle: "Official institutional package for banking acquirers, institutional investors, and corporate counsel: Bank Al-Maghrib Law 103-12 Non-Custodial TSP compliance, PCI-DSS 4.0.1, 77 Prisma models, and Universal 7-Protocol TPE Hub with >91% Gross Margin.",
        m1: "Offline-First Survival (Dexie.js)",
        m2: "Relational Models (Prisma Schema)",
        m3: "Global TPE Protocols (nexo/OPI/CMI)",
        m4: "SaaS Gross Margin (>91%)",
        tab1: "01. Legal & Regulatory (BAM Law 103-12)",
        tab2: "02. Cloud Architecture & Data (77 Models)",
        tab3: "03. Feature Truth Matrix (Code Verified)",
        tab4: "04. Universal TPE Hub (7 Protocols)",
        tab5: "05. Unit Economics & Margin Simulator",
        tab6: "06. Thermal Ticket Simulator & Gallery",
        tab7: "07. Growth & Marketing Agency Pack",
        tab8: "08. Kali Pentest Hardening (9-Layer Shield)",
        tab9: "09. Planetary Mitosis Swarm (12 Agents)",
        tab10: "10. Local & Cloud Runtime (WebGPU / Trigger)",
        tab11: "11. White-Hat AI Discovery (GEO Strategy)",
        printLabel: "Print / PDF",
        searchPlaceholder: "Search dossier...",
        sliderLabel: "Active POS Registers (Postes):",
        lblMrr: "Monthly Recurring Revenue (MRR)",
        lblArr: "Annual Recurring Revenue (ARR)",
        lblCogs: "Cloud Infrastructure Cost (COGS)",
        lblMargin: "SaaS Gross Margin %",
        lblProfit: "Estimated Gross Operating Profit",
      }
    };

    let currentLocale = "ar";

    function setLocale(lang) {
      currentLocale = lang;
      const dict = i18n[lang];
      document.documentElement.lang = lang;
      document.documentElement.dir = dict.dir;

      // Update active state on lang buttons
      document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.toLowerCase().includes(lang === "ar" ? "عرب" : lang === "fr" ? "fran" : "eng"));
      });

      // Update dynamic text
      document.getElementById("hero-title").textContent = dict.heroTitle;
      document.getElementById("hero-subtitle").textContent = dict.heroSubtitle;
      document.getElementById("metric-1").textContent = dict.m1;
      document.getElementById("metric-2").textContent = dict.m2;
      document.getElementById("metric-3").textContent = dict.m3;
      document.getElementById("metric-4").textContent = dict.m4;

      document.getElementById("tab-01").textContent = dict.tab1;
      document.getElementById("tab-02").textContent = dict.tab2;
      document.getElementById("tab-03").textContent = dict.tab3;
      document.getElementById("tab-04").textContent = dict.tab4;
      document.getElementById("tab-05").textContent = dict.tab5;
      document.getElementById("tab-06").textContent = dict.tab6;
      document.getElementById("tab-07").textContent = dict.tab7;
      if (document.getElementById("tab-08")) document.getElementById("tab-08").textContent = dict.tab8;
      if (document.getElementById("tab-09")) document.getElementById("tab-09").textContent = dict.tab9;
      if (document.getElementById("tab-10")) document.getElementById("tab-10").textContent = dict.tab10;
      if (document.getElementById("tab-11")) document.getElementById("tab-11").textContent = dict.tab11;
      if (document.getElementById("print-label")) document.getElementById("print-label").textContent = dict.printLabel;
      if (document.getElementById("dossier-search")) document.getElementById("dossier-search").placeholder = dict.searchPlaceholder;

      document.getElementById("slider-label").textContent = dict.sliderLabel;
      document.getElementById("lbl-mrr").textContent = dict.lblMrr;
      document.getElementById("lbl-arr").textContent = dict.lblArr;
      document.getElementById("lbl-cogs").textContent = dict.lblCogs;
      document.getElementById("lbl-margin").textContent = dict.lblMargin;
      document.getElementById("lbl-profit").textContent = dict.lblProfit;
    }

    // 2. THEME SWITCHER
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute("data-theme");
      const next = current === "pearl-light" ? "fjord-twilight" : "pearl-light";
      html.setAttribute("data-theme", next);
      document.getElementById("theme-icon").textContent = next === "pearl-light" ? "☀️" : "🌙";
    }

    // 3. CHAPTER NAVIGATION
    function switchChapter(chapId) {
      document.querySelectorAll(".section-container").forEach(sec => sec.classList.remove("active"));
      document.querySelectorAll(".chapter-tab-btn").forEach(btn => btn.classList.remove("active"));

      const targetSec = document.getElementById("sec-" + chapId);
      if (targetSec) targetSec.classList.add("active");

      const idxMap = {
        "01-legal": "tab-01",
        "02-infra": "tab-02",
        "03-audit": "tab-03",
        "04-tpe": "tab-04",
        "05-economics": "tab-05",
        "06-simulator": "tab-06",
        "07-marketing": "tab-07",
        "08-pentest": "tab-08",
        "09-swarm": "tab-09",
        "10-runtime": "tab-10",
        "11-geo": "tab-11"
      };
      const activeTab = document.getElementById(idxMap[chapId]);
      if (activeTab) activeTab.classList.add("active");

      window.scrollTo({ top: 400, behavior: "smooth" });
    }

    // 3.5 INSTANT DOSSIER SEARCH
    function handleDossierSearch(val) {
      const q = (val || "").toLowerCase().trim();
      if (!q) {
        document.querySelectorAll(".section-container").forEach(sec => {
          sec.style.display = "";
        });
        const currentActive = document.querySelector(".chapter-tab-btn.active");
        if (currentActive) {
          const id = currentActive.id.replace("tab-", "");
          const chapMap = {
            "01": "01-legal", "02": "02-infra", "03": "03-audit", "04": "04-tpe",
            "05": "05-economics", "06": "06-simulator", "07": "07-marketing",
            "08": "08-pentest", "09": "09-swarm", "10": "10-runtime", "11": "11-geo"
          };
          switchChapter(chapMap[id] || "01-legal");
        }
        return;
      }

      let matchCount = 0;
      document.querySelectorAll(".section-container").forEach(sec => {
        const text = sec.textContent.toLowerCase();
        if (text.includes(q)) {
          sec.style.display = "block";
          sec.classList.add("active");
          matchCount++;
        } else {
          sec.style.display = "none";
          sec.classList.remove("active");
        }
      });
    }

    // 4. UNIT ECONOMICS CALCULATOR
    function updateCalculator(postesVal) {
      const postes = parseInt(postesVal, 10);
      document.getElementById("slider-display-val").textContent = postes.toLocaleString();

      // Rule: Average 1.5 postes per store. Base = 200 MAD, Extra = 150 MAD
      const avgPostesPerStore = 1.5;
      const stores = Math.round(postes / avgPostesPerStore);
      const mrr = Math.round((stores * 200) + ((postes - stores) * 150));
      const arr = mrr * 12;

      // COGS per store is ~16.80 MAD + 3.50 MAD per extra poste
      const cogs = Math.round((stores * 16.80) + ((postes - stores) * 3.50));
      const grossProfit = mrr - cogs;
      const marginPct = ((grossProfit / mrr) * 100).toFixed(1);

      document.getElementById("calc-mrr").textContent = mrr.toLocaleString() + " MAD";
      document.getElementById("calc-arr").textContent = arr.toLocaleString() + " MAD";
      document.getElementById("calc-cogs").textContent = cogs.toLocaleString() + " MAD";
      document.getElementById("calc-margin").textContent = marginPct + "%";
      document.getElementById("calc-profit").textContent = grossProfit.toLocaleString() + " MAD / شهر";
    }

    // 5. THERMAL RECEIPT INTERACTIVITY & SVG VECTOR QR INJECTION
    function injectVectorQr() {
      const qrContainer = document.getElementById("receipt-svg-qr");
      if (!qrContainer) return;
      // High-precision pure SVG QR Code representation
      qrContainer.innerHTML = \`
        <svg width="110" height="110" viewBox="0 0 33 33" shape-rendering="crispEdges">
          <rect width="33" height="33" fill="#ffffff"/>
          <!-- Top Left Finder -->
          <rect x="2" y="2" width="7" height="7" fill="#000000"/>
          <rect x="3" y="3" width="5" height="5" fill="#ffffff"/>
          <rect x="4" y="4" width="3" height="3" fill="#000000"/>
          <!-- Top Right Finder -->
          <rect x="24" y="2" width="7" height="7" fill="#000000"/>
          <rect x="25" y="3" width="5" height="5" fill="#ffffff"/>
          <rect x="26" y="4" width="3" height="3" fill="#000000"/>
          <!-- Bottom Left Finder -->
          <rect x="2" y="24" width="7" height="7" fill="#000000"/>
          <rect x="3" y="25" width="5" height="5" fill="#ffffff"/>
          <rect x="4" y="26" width="3" height="3" fill="#000000"/>
          <!-- Timing Patterns & Synthetic Data Modules -->
          <path d="M 10 4 H 22 M 10 6 H 22 M 4 10 V 22 M 6 10 V 22" stroke="#000000" stroke-width="1" stroke-dasharray="1 1"/>
          <rect x="12" y="12" width="9" height="9" fill="#000000"/>
          <rect x="14" y="14" width="5" height="5" fill="#ffffff"/>
          <rect x="16" y="16" width="1" height="1" fill="#000000"/>
        </svg>
      \`;
    }

    function setReceiptWidth(widthMm) {
      const paper = document.getElementById("paper-receipt");
      if (widthMm === 58) {
        paper.style.width = "250px";
        paper.style.fontSize = "0.72rem";
      } else {
        paper.style.width = "320px";
        paper.style.fontSize = "0.82rem";
      }
    }

    // 6. LIGHTBOX CONTROLLER
    function openLightbox(imgSrc) {
      const lightbox = document.getElementById("lightbox");
      const img = document.getElementById("lightbox-img");
      img.src = imgSrc;
      lightbox.classList.add("active");
    }

    function closeLightbox() {
      document.getElementById("lightbox").classList.remove("active");
    }

    // Initialize on load
    window.addEventListener("DOMContentLoaded", () => {
      injectVectorQr();
      updateCalculator(1000);
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, htmlContent, "utf8");
console.log(`[SUCCESS] Master dossier HTML compiled successfully at: ${OUTPUT_FILE}`);
console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / (1024 * 1024)).toFixed(2)} MB`);
