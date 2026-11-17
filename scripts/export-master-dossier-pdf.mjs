// scripts/export-master-dossier-pdf.mjs
import { createRequire } from "module";
import path from "path";
import fs from "fs";

const req = createRequire(import.meta.url);
const { chromium } = req("/tmp/pw/node_modules/playwright-core");

const ROOT = "/mnt/c/Users/hicha/.gemini/antigravity/scratch/pos-saas-morocco";
const HTML_FILE = path.join(ROOT, "deliverables/kaspi-master-dossier/KASPI_POS_INTERACTIVE_MASTER_DOSSIER.html");
const PDF_OUTPUT = path.join(ROOT, "deliverables/kaspi-master-dossier/KASPI_POS_INTERACTIVE_MASTER_DOSSIER.pdf");
const DESKTOP_ONEDRIVE_PDF = "/mnt/c/Users/hicha/OneDrive/Desktop/KASPI_POS_INTERACTIVE_MASTER_DOSSIER.pdf";
const DESKTOP_LOCAL_PDF = "/mnt/c/Users/hicha/Desktop/KASPI_POS_INTERACTIVE_MASTER_DOSSIER.pdf";

async function exportPdf() {
  console.log("=== EXPORTING OFFICIAL KASPI POS MASTER DOSSIER PDF ===");
  console.log("Source HTML:", HTML_FILE);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Loading HTML into headless browser...");
  await page.goto(`file://${HTML_FILE}`, { waitUntil: "networkidle" });

  // Make sure all sections are visible for printing
  await page.evaluate(() => {
    document.querySelectorAll(".section-container").forEach(sec => {
      sec.style.display = "block";
      sec.classList.add("active");
    });
    if (typeof injectVectorQr === "function") injectVectorQr();
    if (typeof updateCalculator === "function") updateCalculator(1000);
  });

  console.log("Rendering and generating PDF via Chromium print engine...");
  await page.pdf({
    path: PDF_OUTPUT,
    format: "A4",
    printBackground: true,
    margin: {
      top: "14mm",
      bottom: "14mm",
      left: "10mm",
      right: "10mm"
    },
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; padding: 0 10mm; color: #64748b; border-bottom: 0.5px solid #cbd5e1; padding-bottom: 2mm;">
        <span><strong>KASPI POS (كسب)</strong> — الملف الشامل المعتمد للمؤسسات والجهات البنكية</span>
        <span>Non-Custodial TSP (BAM Law 103-12)</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; padding: 0 10mm; color: #64748b; border-top: 0.5px solid #cbd5e1; padding-top: 2mm;">
        <span>KASPI POS MASTER DOSSIER • CONFIDENTIAL</span>
        <span>صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();

  const stats = fs.statSync(PDF_OUTPUT);
  console.log(`[SUCCESS] PDF generated: ${PDF_OUTPUT} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

  try {
    fs.copyFileSync(PDF_OUTPUT, DESKTOP_ONEDRIVE_PDF);
    console.log(`[MIRRORED] Copied to: ${DESKTOP_ONEDRIVE_PDF}`);
  } catch (e) {
    console.warn("Could not copy to OneDrive Desktop:", e.message);
  }

  try {
    fs.copyFileSync(PDF_OUTPUT, DESKTOP_LOCAL_PDF);
    console.log(`[MIRRORED] Copied to: ${DESKTOP_LOCAL_PDF}`);
  } catch (e) {
    console.warn("Could not copy to Local Desktop:", e.message);
  }
}

exportPdf().catch(err => {
  console.error("PDF Export Failed:", err);
  process.exit(1);
});
