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
    // 1. Desktop Check (1440x900)
    console.log("\n[1] Testing Desktop Viewport (1440x900)...");
    const deskContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const deskPage = await deskContext.newPage();

    const consoleErrors = [];
    deskPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await deskPage.goto(FILE_URL, { waitUntil: "load" });

    // Verify Download HTML & Save PDF buttons exist
    const btnDownload = await deskPage.locator("#btn-download-html");
    const btnDownloadCount = await btnDownload.count();
    console.log("Download HTML button exists:", btnDownloadCount === 1);
    if (btnDownloadCount !== 1) {
      consoleErrors.push("Download HTML button #btn-download-html missing");
    }

    const btnPdf = await deskPage.locator("#btn-save-pdf");
    const btnPdfCount = await btnPdf.count();
    console.log("Save PDF button exists:", btnPdfCount === 1);
    if (btnPdfCount !== 1) {
      consoleErrors.push("Save PDF button #btn-save-pdf missing");
    }

    // Verify Executive Navigation Map exists
    const execMap = await deskPage.locator(".exec-nav-map");
    const execMapCount = await execMap.count();
    console.log("Executive Navigation Map exists:", execMapCount === 1);
    if (execMapCount !== 1) {
      consoleErrors.push("Executive Navigation Map .exec-nav-map missing");
    }

    // Test Theme toggle
    await deskPage.evaluate(() => toggleTheme());
    const themeAfterToggle = await deskPage.evaluate(() => document.documentElement.getAttribute("data-theme"));
    console.log("Theme after toggle:", themeAfterToggle);

    // Test Languages (ar, fr, en) and verify dir attribute
    for (const lang of ["ar", "fr", "en"]) {
      await deskPage.evaluate((l) => setLocale(l), lang);
      const title = await deskPage.textContent("#hero-title");
      const dir = await deskPage.evaluate(() => document.documentElement.getAttribute("dir"));
      console.log(`Language [${lang}] (dir=${dir}) title rendered:`, title.substring(0, 40) + "...");
    }

    // Test Chapter navigation
    for (const chap of ["01-legal", "03-audit", "04-tpe", "05-economics", "12-seat-lock", "13-cybersecurity"]) {
      await deskPage.evaluate((c) => switchChapter(c), chap);
      const isVisible = await deskPage.evaluate((c) => {
        const el = document.getElementById("sec-" + c);
        return el && el.classList.contains("active");
      }, chap);
      console.log(`Chapter ${chap} active status:`, isVisible);
      if (!isVisible) {
        consoleErrors.push(`Chapter sec-${chap} failed to activate`);
      }
    }

    // Test Screenshots presence
    const imgCount = await deskPage.evaluate(() => document.querySelectorAll("img").length);
    console.log("Embedded images count in document:", imgCount);

    if (consoleErrors.length > 0) {
      console.error("Desktop Console Errors:", consoleErrors);
      totalErrors += consoleErrors.length;
    } else {
      console.log("[PASS] Desktop 1440x900 passed with 0 console errors.");
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
        updateCalculator(5);
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
