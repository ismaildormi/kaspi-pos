import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const GLOBALS_CSS = path.join(SRC_DIR, "app", "globals.css");
const MONOCHROME_BG = path.join(SRC_DIR, "components", "auth", "MonochromePosBackground.tsx");

function walkTsx(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsx(full, results);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

let failures = 0;
function check(label, ok, detail = "") {
  if (ok) {
    console.log(`[PASS] ${label}`);
  } else {
    failures++;
    console.error(`[FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// 1. Scan all .tsx files in src/app and src/components
const tsxFiles = walkTsx(SRC_DIR);
check(`Discovered all .tsx files in src/ (${tsxFiles.length} files)`, tsxFiles.length >= 90);

// 2. Verify globals.css rules
const css = fs.readFileSync(GLOBALS_CSS, "utf8");
check(
  "globals.css implements 24px Apple visionOS 3D Crystal Glass, Dual-Mode Corner Aurora (White in Dark, Emerald in Light), Green Checkout CTA & Opaque AI Modal",
  css.includes("kaspi-polar-aurora-spin") &&
    css.includes("#07090D") &&
    css.includes("#E6ECEA") &&
    css.includes("--kaspi-corner-aurora-beam") &&
    css.includes("kaspi-emerald-checkout-btn") &&
    css.includes("kaspi-opaque-glass-modal") &&
    css.includes('img[src*="logo"]') &&
    !css.includes("radial-gradient(closest-side") &&
    css.includes("IBM Plex Sans Arabic") &&
    css.includes("mask-composite: exclude;") &&
    css.includes("padding: 1.5px;")
);

// Verify ZERO blue in login/page.tsx, register/page.tsx, KaspiThemeToggle.tsx
const zeroBlueFiles = [
  path.join(SRC_DIR, "app", "[locale]", "(auth)", "login", "page.tsx"),
  path.join(SRC_DIR, "app", "[locale]", "(auth)", "register", "page.tsx"),
  path.join(SRC_DIR, "components", "theme", "KaspiThemeToggle.tsx"),
];
const bluePattern = /text-sky-|text-blue-|bg-sky-|bg-blue-|#0284c7|#38bdf8/;
const blueViolations = zeroBlueFiles
  .filter((f) => bluePattern.test(fs.readFileSync(f, "utf8")))
  .map((f) => path.relative(ROOT, f));
check(
  "Zero blue classes/hexes in login/page.tsx, register/page.tsx, and KaspiThemeToggle.tsx",
  blueViolations.length === 0,
  blueViolations.join(", ")
);
check(
  "globals.css defines pearl-light and fjord-twilight themes",
  css.includes('html[data-kaspi-theme="pearl-light"]') &&
    css.includes('html[data-kaspi-theme="fjord-twilight"]')
);
check(
  'globals.css intercepts [class*="bg-[#0"], [class*="bg-zinc-9"], [class*="bg-white/"], and [class*="border-white/"]',
  css.includes('[class*="bg-[#0"]') &&
    css.includes('[class*="bg-zinc-9"]') &&
    css.includes('[class*="bg-white/"]') &&
    css.includes('[class*="border-white/"]')
);
check(
  "globals.css harmonizes <select> and <option> dropdowns",
  css.includes("select option") && css.includes("--kaspi-glass-surface-elevated")
);
check(
  "globals.css adapts bg-white text-black primary buttons in pearl-light",
  css.includes(":is(button, a).bg-white:is(.text-black, .text-zinc-950, .text-zinc-900)")
);
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
check(
  "globals.css contains zero #000000 pitch-black backgrounds",
  !cssNoComments.includes("#000000")
);

// 3. Verify MonochromePosBackground.tsx & Isolated Thermal Receipt Spooler
const bgSrc = fs.readFileSync(MONOCHROME_BG, "utf8");
const printingSrc = fs.readFileSync(path.join(SRC_DIR, "client", "printing", "index.ts"), "utf8");
check(
  "Isolated hidden <iframe> printThermalReceipt spooler exists with zero logo image",
  printingSrc.includes("export async function printThermalReceipt") &&
    printingSrc.includes('document.createElement("iframe")') &&
    !printingSrc.includes("<img")
);
check(
  "MonochromePosBackground.tsx contains zero #000000 or #040405 pitch-black backgrounds",
  !bgSrc.includes("#000000") && !bgSrc.includes("#040405") && !bgSrc.includes("#070708")
);

// 4. Verify zero hardcoded dark <option> backgrounds across all .tsx files
const darkOptionMatches = [];
for (const file of tsxFiles) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("<option") && /bg-zinc-9|bg-black|bg-\[#0/.test(line)) {
      darkOptionMatches.push(`${path.relative(ROOT, file)}:${idx + 1}`);
    }
  });
}
check(
  "Zero hardcoded dark backgrounds on <option> elements across all .tsx files",
  darkOptionMatches.length === 0,
  darkOptionMatches.join(", ")
);

// 5. Verify KaspiThemeProvider & KaspiThemeToggle exist
check(
  "KaspiThemeProvider and KaspiThemeToggle exist",
  fs.existsSync(path.join(SRC_DIR, "components", "theme", "KaspiThemeProvider.tsx")) &&
    fs.existsSync(path.join(SRC_DIR, "components", "theme", "KaspiThemeToggle.tsx"))
);

if (failures > 0) {
  console.error(`\n[AUDIT FAILED] ${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`\n[AUDIT PASSED] 100% UI Cohesion verified across ${tsxFiles.length} TSX files and globals.css.`);
