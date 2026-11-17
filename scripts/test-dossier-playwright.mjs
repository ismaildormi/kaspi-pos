import { createRequire } from "module";
import path from "path";
import fs from "fs";

const req = createRequire(import.meta.url);
const { chromium } = req("/tmp/pw/node_modules/playwright-core");

const DOSSIER_PATH = "/mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco/deliverables/kaspi-master-dossier/KASPI_POS_INTERACTIVE_MASTER_DOSSIER.html";
const FILE_URL = `file://${DOSSIER_PATH}`;

async function run() {
  console.log("=== PLAYWRIGHT VERIFICATION OF MASTER DOSSIER ===");
  console.log("Testing file:", FILE_URL);

  const browser = await chromium.launch({ headless: true });
  let totalErrors = 0;

  try {
    // 1. Desktop Check (1280x720)
    console.log("\n[1] Testing Desktop Viewport (1280x720)...");
    const deskContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const deskPage = await deskContext.newPage();

    const consoleErrors = [];
    deskPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await deskPage.goto(FILE_URL, { waitUntil: "load" });

    // Test Theme toggle
    await deskPage.evaluate(() => toggleTheme());
    const themeAfterToggle = await deskPage.evaluate(() => document.documentElement.getAttribute("data-theme"));
    console.log("Theme after toggle:", themeAfterToggle);

    // Test Languages (ar, fr, en)
    for (const lang of ["ar", "fr", "en"]) {
      await deskPage.evaluate((l) => setLocale(l), lang);
      const title = await deskPage.textContent("#hero-title");
      console.log(`Language [${lang}] title rendered:`, title.substring(0, 40) + "...");
    }

    // Test Chapter navigation to Chapter 13
    await deskPage.evaluate(() => switchChapter("13-cybersecurity"));
    const sec13Visible = await deskPage.evaluate(() => {
      const el = document.getElementById("sec-13-cybersecurity");
      return el && el.classList.contains("active");
    });
    console.log("Chapter 13 active status:", sec13Visible);

    // Test Screenshots presence
    const imgCount = await deskPage.evaluate(() => document.querySelectorAll("img").length);
    console.log("Embedded images count in document:", imgCount);

    if (consoleErrors.length > 0) {
      console.error("Desktop Console Errors:", consoleErrors);
      totalErrors += consoleErrors.length;
    } else {
      console.log("[PASS] Desktop 1280x720 passed with 0 console errors.");
    }
    await deskContext.close();

    // 2. Mobile Check (390x844 - iPhone 14 / modern phone)
    console.log("\n[2] Testing Mobile Viewport (390x844)...");
    const mobContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobPage = await mobContext.newPage();

    const mobErrors = [];
    mobPage.on("console", (msg) => {
      if (msg.type() === "error") {
        mobErrors.push(msg.text());
      }
    });

    await mobPage.goto(FILE_URL, { waitUntil: "load" });

    // Test interactive calculator slider
    await mobPage.evaluate(() => {
      const slider = document.getElementById("calc-slider");
      if (slider) {
        slider.value = 5;
        updateCalculator();
      }
    });
    const mrrVal = await mobPage.textContent("#calc-mrr");
    console.log("Mobile Calculator updated MRR value:", mrrVal);

    if (mobErrors.length > 0) {
      console.error("Mobile Console Errors:", mobErrors);
      totalErrors += mobErrors.length;
    } else {
      console.log("[PASS] Mobile 390x844 passed with 0 console errors.");
    }
    await mobContext.close();

  } finally {
    await browser.close();
  }

  if (totalErrors === 0) {
    console.log("\n🎉 [ALL PLAYWRIGHT CHECKS PASSED] Zero console errors across Desktop & Mobile viewports.");
    process.exit(0);
  } else {
    console.error(`\n❌ [PLAYWRIGHT FAILED] ${totalErrors} console errors detected.`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Playwright Runner Error:", err);
  process.exit(1);
});
