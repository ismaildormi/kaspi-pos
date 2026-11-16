import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

function walkFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const tsxFiles = walkFiles(SRC_DIR, [".tsx"]);
const allFiles = walkFiles(SRC_DIR, [".ts", ".tsx", ".css"]);

const globalsPath = path.join(SRC_DIR, "app", "globals.css");
const globalsCss = fs.readFileSync(globalsPath, "utf8");

const loginPath = path.join(SRC_DIR, "app", "[locale]", "(auth)", "login", "page.tsx");
const loginTsx = fs.readFileSync(loginPath, "utf8");

const registerPath = path.join(SRC_DIR, "app", "[locale]", "(auth)", "register", "page.tsx");
const registerTsx = fs.readFileSync(registerPath, "utf8");

const themeTogglePath = path.join(SRC_DIR, "components", "theme", "KaspiThemeToggle.tsx");
const themeToggleTsx = fs.existsSync(themeTogglePath) ? fs.readFileSync(themeTogglePath, "utf8") : "";

const bgCanvasPath = path.join(SRC_DIR, "components", "auth", "MonochromePosBackground.tsx");
const bgCanvasTsx = fs.readFileSync(bgCanvasPath, "utf8");

const aiWidgetPath = path.join(SRC_DIR, "components", "ai", "AIChatWidget.tsx");
const aiWidgetTsx = fs.readFileSync(aiWidgetPath, "utf8");

const posHeaderPath = path.join(SRC_DIR, "components", "pos", "PosHeader.tsx");
const posHeaderTsx = fs.readFileSync(posHeaderPath, "utf8");

const dashboardLayoutPath = path.join(SRC_DIR, "app", "[locale]", "dashboard", "layout.tsx");
const dashboardLayoutTsx = fs.readFileSync(dashboardLayoutPath, "utf8");

const sidebarPath = path.join(SRC_DIR, "components", "layout", "Sidebar.tsx");
const sidebarTsx = fs.readFileSync(sidebarPath, "utf8");

const printingPath = path.join(SRC_DIR, "client", "printing", "index.ts");
const printingTs = fs.existsSync(printingPath) ? fs.readFileSync(printingPath, "utf8") : "";

const groceryConsolePath = path.join(SRC_DIR, "components", "dashboard", "GroceryInventoryConsole.tsx");
const groceryConsoleTsx = fs.readFileSync(groceryConsolePath, "utf8");

const analyticsApiPath = path.join(SRC_DIR, "app", "api", "v1", "analytics", "timeseries", "route.ts");
const analyticsModalPath = path.join(SRC_DIR, "components", "analytics", "KaspiGlassAnalyticsModal.tsx");
const kaspiBrandMarkPath = path.join(SRC_DIR, "components", "common", "KaspiBrandMark.tsx");
const appleBackBtnPath = path.join(SRC_DIR, "components", "common", "AppleBackButton.tsx");

let failures = 0;

function check(label, passed, detail = "") {
  if (passed) {
    console.log(`[PASS] ${label}`);
  } else {
    failures++;
    console.error(`[FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1. Discover all .tsx files
check(`Discovered all .tsx files in src/ (${tsxFiles.length} files)`, tsxFiles.length >= 100);

// 2. Apple visionOS Crystal Glass (26px/28px blur, Dual-Mode Corner Aurora mask-composite, Emerald & Primary CTAs, Opaque Glass Modal)
const hasVisionGlass =
  (globalsCss.includes("blur(28px)") || globalsCss.includes("blur(26px)")) &&
  globalsCss.includes("mask-composite: exclude") &&
  globalsCss.includes(".kaspi-polar-aurora-orbit") &&
  globalsCss.includes(".kaspi-glass-surface") &&
  globalsCss.includes(".kaspi-glass-card") &&
  globalsCss.includes(".kaspi-sidebar-glass") &&
  globalsCss.includes(".kaspi-primary-cta-btn") &&
  globalsCss.includes(".kaspi-emerald-checkout-btn") &&
  globalsCss.includes(".kaspi-opaque-glass-modal");
check(
  "globals.css implements 28px visionOS Crystal Glass, Dual-Mode Corner Aurora, Primary/Emerald CTAs & Opaque Modals",
  hasVisionGlass
);

check(
  "login & register pages do not wrap text inputs with kaspi-polar-aurora-orbit and use .kaspi-primary-cta-btn",
  !loginTsx.includes("rounded-2xl kaspi-polar-aurora-orbit") &&
    !registerTsx.includes("rounded-2xl kaspi-polar-aurora-orbit") &&
    loginTsx.includes("kaspi-primary-cta-btn") &&
    registerTsx.includes("kaspi-primary-cta-btn")
);

// 3. Password native Chromium/Edge/WebKit eye suppression in globals.css (Fixes double-eye in RTL Arabic)
const hasPasswordEyeSuppression =
  globalsCss.includes("::-ms-reveal") && globalsCss.includes("::-ms-clear");
check(
  "globals.css suppresses native browser password reveal/clear icons (fixes double-eye in RTL)",
  hasPasswordEyeSuppression
);

// 4. Zero blue classes/hexes in Auth & Theme toggle
const blueRegex = /(?:bg|text|border|ring|from|to|via)-(?:blue|indigo|sky|cyan)-\d+|#(?:0066ff|3b82f6|2563eb|1d4ed8|0284c7|38bdf8)/i;
check(
  "Zero blue classes/hexes in login/page.tsx, register/page.tsx, and KaspiThemeToggle.tsx",
  !blueRegex.test(loginTsx) && !blueRegex.test(registerTsx) && !blueRegex.test(themeToggleTsx)
);

// 5. Dual themes defined
check(
  "globals.css defines pearl-light and fjord-twilight themes",
  globalsCss.includes('data-kaspi-theme="pearl-light"') &&
    globalsCss.includes('data-kaspi-theme="fjord-twilight"')
);

// 6. Intercepts dark utility classes in pearl-light
check(
  'globals.css intercepts [class*="bg-[#0"], [class*="bg-zinc-9"], [class*="bg-white/"], and [class*="border-white/"]',
  globalsCss.includes('[class*="bg-[#0"]') &&
    globalsCss.includes('[class*="bg-zinc-9"]') &&
    globalsCss.includes('[class*="bg-white/"]') &&
    globalsCss.includes('[class*="border-white/"]')
);

// 7. Select/Option harmonization & primary white button adaptation in pearl-light
check(
  "globals.css harmonizes <select> and <option> dropdowns",
  globalsCss.includes("select option") || globalsCss.includes("select,")
);
check(
  "globals.css adapts bg-white text-black primary buttons in pearl-light",
  globalsCss.includes('pearl-light"] :is(button, a).bg-white')
);

// 8. Zero pitch-black #000000 backgrounds in CSS & auth background canvas
check(
  "globals.css contains zero #000000 pitch-black backgrounds",
  !globalsCss.toLowerCase().includes("#000000")
);
check(
  "MonochromePosBackground.tsx contains zero #000000 or #040405 pitch-black backgrounds",
  !bgCanvasTsx.toLowerCase().includes("#000000") &&
    !bgCanvasTsx.toLowerCase().includes("#040405")
);

// 9. Isolated hidden <iframe> printThermalReceipt spooler with zero logo image
check(
  "Isolated hidden <iframe> printThermalReceipt spooler exists with zero logo image",
  printingTs.includes("printThermalReceipt") &&
    printingTs.includes("iframe") &&
    !printingTs.includes("<img")
);

// 10. Zero hardcoded dark backgrounds on <option> elements across .tsx files
const optionWithDarkBg = tsxFiles.filter((f) =>
  /<option[^>]*className="[^"]*(?:bg-zinc-9|bg-black|bg-\[#0)/i.test(fs.readFileSync(f, "utf8"))
);
check(
  "Zero hardcoded dark backgrounds on <option> elements across all .tsx files",
  optionWithDarkBg.length === 0,
  optionWithDarkBg.join(", ")
);

// 11. AIChatWidget independent fixed bottom anchor
check(
  "AIChatWidget uses independent fixed viewport bottom-corner anchor",
  aiWidgetTsx.includes("fixed") && aiWidgetTsx.includes("bottom-")
);

// 12. Desktop App download clutter removed + zero kaspi-logo-immutable-frame wrappers
const hasImmutableFrame = tsxFiles.some((f) =>
  fs.readFileSync(f, "utf8").includes("kaspi-logo-immutable-frame")
);
check(
  "Desktop App button removed from PosHeader & dashboard layout, and zero kaspi-logo-immutable-frame wrappers in TSX",
  !posHeaderTsx.includes("launch-desktop") &&
    !dashboardLayoutTsx.includes("launch-desktop") &&
    !hasImmutableFrame
);

// 13. KaspiThemeProvider and KaspiThemeToggle exist
const hasThemeProvider = allFiles.some((f) =>
  fs.readFileSync(f, "utf8").includes("KaspiThemeProvider")
);
check(
  "KaspiThemeProvider and KaspiThemeToggle exist",
  hasThemeProvider && fs.existsSync(themeTogglePath)
);

// 14. Locked full-height sidebar & naturally scrolling dashboard header
const headerMatch = dashboardLayoutTsx.match(/<header\s+className="([^"]+)"/);
const headerClass = headerMatch ? headerMatch[1] : "";
check(
  "dashboard/layout.tsx locks sidebar shell height (md:h-screen md:overflow-hidden) and uses non-sticky top header",
  dashboardLayoutTsx.includes("md:h-screen md:overflow-hidden") &&
    dashboardLayoutTsx.includes("md:overflow-y-auto") &&
    Boolean(headerClass) &&
    !headerClass.includes("sticky top-0") &&
    !sidebarTsx.includes("md:sticky")
);

// 15. Interactive Real-Data Analytics API & Modal Chart components exist + zero fake hardcoded numbers
const hasRealAnalyticsFiles =
  fs.existsSync(analyticsApiPath) && fs.existsSync(analyticsModalPath);
const hasFakeInventoryHardcodes =
  groceryConsoleTsx.includes("2,450,000") || groceryConsoleTsx.includes("3,980,000");
check(
  "/api/v1/analytics/timeseries & KaspiGlassAnalyticsModal exist and GroceryInventoryConsole has zero hardcoded fake totals",
  hasRealAnalyticsFiles && !hasFakeInventoryHardcodes
);

// 16. Frameless Authentic 3D Metallic Infinity Cutout (/logo-mark.png) used across Auth, Sidebar & PosHeader
const brandMarkTsx = fs.existsSync(kaspiBrandMarkPath) ? fs.readFileSync(kaspiBrandMarkPath, "utf8") : "";
const hasLogoMarkAsset = fs.existsSync(path.join(ROOT, "public", "logo-mark.png"));
check(
  "KaspiBrandMark renders frameless /logo-mark.png cutout (zero fake SVG) across MonochromePosBackground, Sidebar & PosHeader",
  hasLogoMarkAsset &&
    brandMarkTsx.includes("/logo-mark.png") &&
    !brandMarkTsx.includes("<svg") &&
    bgCanvasTsx.includes("<KaspiBrandMark") &&
    sidebarTsx.includes("<KaspiBrandMark") &&
    posHeaderTsx.includes("<KaspiBrandMark")
);

// 17. Unified Apple Back Navigation Pill adopted across modals
const modalBackAdopters = tsxFiles.filter((f) =>
  fs.readFileSync(f, "utf8").includes("<AppleBackButton")
);
check(
  `AppleBackButton component exists and is adopted across modal components (${modalBackAdopters.length} files)`,
  fs.existsSync(appleBackBtnPath) && modalBackAdopters.length >= 12
);

if (failures > 0) {
  console.error(`\n[AUDIT FAILED] ${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\n[AUDIT PASSED] All architectural & visionOS UI cohesion checks passed cleanly.");
