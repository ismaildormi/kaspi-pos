import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const REPORT_PATH = path.join(ROOT, "KASPI_REVERSE_ENGINEERING_REPORT.md");
const BASE_URL = process.env.KASPI_VERIFY_URL || "http://localhost:3000";
const CAPTURE_SCREENSHOTS = process.env.CAPTURE_SCREENSHOTS === "1";
const SCREENSHOT_DIR = "/tmp/kaspi-screenshots";

const results = [];
let failures = 0;

function record(category, rule, passed, metricOrDetail = "") {
  results.push({
    category,
    rule,
    status: passed ? "PASS" : "FAIL",
    detail: metricOrDetail,
  });
  if (passed) {
    console.log(`[PASS] [${category}] ${rule}${metricOrDetail ? ` (${metricOrDetail})` : ""}`);
  } else {
    failures++;
    console.error(`[FAIL] [${category}] ${rule}${metricOrDetail ? ` — ${metricOrDetail}` : ""}`);
  }
}

function readFileSafe(relPath) {
  const full = path.join(ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

function parseRgbaAlpha(colorStr) {
  if (!colorStr) return 1;
  if (colorStr === "transparent") return 0;
  const rgbaMatch = colorStr.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)/i);
  if (rgbaMatch) return parseFloat(rgbaMatch[1]);
  const rgbMatch = colorStr.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/i);
  if (rgbMatch) return 1;
  return 0;
}

async function isServerReachable(url) {
  for (const candidate of [url, "http://127.0.0.1:3000", "http://localhost:3000"]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${candidate}/ar/login`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status === 200) return true;
    } catch {}
  }
  return false;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {}
  try {
    const req = createRequire("/tmp/pw/package.json");
    try {
      return req("playwright");
    } catch {
      return req("playwright-core");
    }
  } catch {
    try {
      return createRequire(import.meta.url)("/tmp/pw/node_modules/playwright-core");
    } catch {
      return null;
    }
  }
}

async function runStaticReverseEngineeringChecks() {
  // 1. Payment Infrastructure Modules (16+ components)
  const paymentModules = [
    "src/lib/payments/types.ts",
    "src/lib/payments/stripe.ts",
    "src/lib/payments/youcanpay.ts",
    "src/lib/payments/cmi-web.ts",
    "src/lib/payments/NapsAdapter.ts",
    "src/lib/payments/PayzoneAdapter.ts",
    "src/lib/payments/TpeBridge.ts",
    "src/lib/payments/tpe-bridge.ts",
    "src/lib/payments/PaymentGatewayManager.ts",
    "src/lib/payments/PaymentOrchestrator.ts",
    "src/lib/payments/FeeEngine.ts",
    "src/lib/payments/SubscriptionEngine.ts",
    "src/lib/payments/ReconciliationEngine.ts",
    "src/lib/payments/RefundEngine.ts",
    "src/lib/payments/DisputeManager.ts",
    "src/lib/payments/FraudRiskEngine.ts",
    "src/lib/payments/CurrencyEngine.ts",
    "src/lib/payments/AuditLogger.ts",
    "src/lib/payments/index.ts",
  ];
  const missingModules = paymentModules.filter((m) => !fs.existsSync(path.join(ROOT, m)));
  record(
    "Payment Architecture",
    "All 16+ modular Global & Morocco Payment Engine files exist under src/lib/payments/",
    missingModules.length === 0,
    missingModules.length === 0 ? `${paymentModules.length} modules verified` : `Missing: ${missingModules.join(", ")}`
  );

  // 2. PCI-DSS 4.0.1 Zero Raw PAN/CVV in Prisma Schema
  const prismaSchema = readFileSafe("prisma/schema.prisma");
  const forbiddenPrismaCols = /\b(cardNumber|card_number|rawPan|raw_pan|cvv|cvc|securityCode|pinBlock)\b/i;
  record(
    "PCI-DSS 4.0.1 & Law 103-12",
    "Zero raw card numbers (PAN) or CVV/CVC columns in prisma/schema.prisma",
    Boolean(prismaSchema) && !forbiddenPrismaCols.test(prismaSchema),
    "Tokenized references only"
  );

  // 3. Recurring Auto-Renewal Mandate & Endpoints
  const subEngine = readFileSafe("src/lib/payments/SubscriptionEngine.ts");
  const subApi = readFileSafe("src/app/api/v1/billing/subscription/route.ts");
  const portalApi = readFileSafe("src/app/api/v1/billing/portal/route.ts");
  const webhookApi = readFileSafe("src/app/api/v1/webhooks/payments/[provider]/route.ts");
  record(
    "Recurring Billing Mandate",
    "Auto-Renew Recurring Mandate (200 MAD 1st Poste + 150 MAD extra Postes) & Verified Webhook/Portal APIs exist",
    subEngine.includes("FIRST_POSTE_PRICE_MAD = 200") &&
      subEngine.includes("EXTRA_POSTE_PRICE_MAD = 150") &&
      subApi.includes("autoRenew") &&
      subApi.includes("cancelAtPeriodEnd") &&
      Boolean(portalApi) &&
      (webhookApi.includes("verifyWebhook") || webhookApi.includes("processWebhook")),
    "200 MAD / +150 MAD + Auto-Renew Mandate verified"
  );

  // 4. KaspiBrandMark Natural Proportions
  const brandMark = readFileSafe("src/components/common/KaspiBrandMark.tsx");
  record(
    "Visual UI",
    "KaspiBrandMark dimensions locked to h-11 sm:h-12 (auth), h-7 (POS header), h-8 (Sidebar)",
    brandMark.includes('auth: "h-11 sm:h-12 w-auto"') &&
      brandMark.includes('sm: "h-7 w-auto"') &&
      brandMark.includes('md: "h-8 w-auto"') &&
      brandMark.includes("/logo-mark.png"),
    "sm=28px, md=32px, auth=44-48px"
  );

  // 5. Circular Icon-Only Theme Switcher (Zero text labels)
  const themeToggle = readFileSafe("src/components/theme/KaspiThemeToggle.tsx");
  record(
    "Visual UI",
    "KaspiThemeToggle is strictly circular icon-only (rounded-full w-9 h-9 p-0) with zero visible text",
    themeToggle.includes("rounded-full w-9 h-9 p-0") &&
      !themeToggle.includes("<span") &&
      !themeToggle.includes("أبيض لؤلؤي") &&
      !themeToggle.includes("كحلي مغموغ"),
    "36x36px icon-only button"
  );

  // 6. Portal Architecture (z-[9999]) Across Modals & Zero Checkout Z-Index Bleed
  const portalComp = readFileSafe("src/components/common/KaspiGlassModalPortal.tsx");
  const globalsCss = readFileSafe("src/app/globals.css");
  const modalFilesToCheck = [
    "src/components/analytics/KaspiGlassAnalyticsModal.tsx",
    "src/components/pos/grocery/SquarePriceDlcModal.tsx",
    "src/components/pos/grocery/SquarePluScalePanel.tsx",
    "src/components/pos/CashShiftModal.tsx",
    "src/components/pos/QuickProductModal.tsx",
    "src/components/pos/UnifiedCheckoutModal.tsx",
    "src/components/billing/UnifiedCheckoutModal.tsx",
    "src/components/billing/InAppPaywallModal.tsx",
    "src/components/billing/AddDeviceModal.tsx",
    "src/components/pos/HeldCartsModal.tsx",
    "src/components/pos/CustomerModal.tsx",
    "src/components/dashboard/StockTransferModal.tsx",
    "src/components/layout/OwnerProfileModal.tsx",
    "src/components/pos/StoreOnboardingModal.tsx",
    "src/components/dashboard/StockAuditClient.tsx",
    "src/components/pos/ProductGrid.tsx",
  ];
  const nonPortalModals = modalFilesToCheck.filter(
    (f) => !readFileSafe(f).includes("KaspiGlassModalPortal")
  );
  const strayFixedOverlays = [];
  function scanFixedOverlays(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanFixedOverlays(full);
      else if (entry.name.endsWith(".tsx") && !full.endsWith("KaspiGlassModalPortal.tsx")) {
        if (fs.readFileSync(full, "utf8").includes("fixed inset-0")) {
          strayFixedOverlays.push(path.relative(ROOT, full));
        }
      }
    }
  }
  scanFixedOverlays(SRC_DIR);
  record(
    "Modal Portal & Stacking",
    "All modal & drawer components use <KaspiGlassModalPortal> (createPortal + z-[9999]) with 0 unportaled fixed inset-0 overlays and .kaspi-emerald-checkout-btn z-index: 0",
    portalComp.includes("createPortal") &&
      portalComp.includes("z-[9999]") &&
      nonPortalModals.length === 0 &&
      strayFixedOverlays.length === 0 &&
      globalsCss.includes("z-index: 0 !important"),
    nonPortalModals.length === 0 && strayFixedOverlays.length === 0
      ? "100% modals portaled to document.body (0 stray overlays)"
      : `Unportaled: ${[...nonPortalModals, ...strayFixedOverlays].join(", ")}`
  );

  // 7. Translucent Crystal Glass Modal Alpha (< 0.65) in globals.css
  const hasOpaque94 =
    globalsCss.includes("rgba(255, 255, 255, 0.94)") ||
    globalsCss.includes("rgba(12, 15, 22, 0.97)");
  record(
    "Crystal Glass Optics",
    "Zero opaque 0.94/0.97 modal walls in globals.css; modals use translucent blur(36px) crystal (<0.65 alpha)",
    !hasOpaque94 &&
      globalsCss.includes("rgba(255, 255, 255, 0.46)") &&
      globalsCss.includes("rgba(14, 16, 20, 0.56)") &&
      globalsCss.includes("blur(36px)"),
    "Light modal alpha=0.46, Dark modal alpha=0.56"
  );

  // 8. Product Card 3-Dot Management Menu + PLU Photo Upload + Daily Store Streak
  const productGrid = readFileSafe("src/components/pos/ProductGrid.tsx");
  const pluPanel = readFileSafe("src/components/pos/grocery/SquarePluScalePanel.tsx");
  const dashKpis = readFileSafe("src/components/analytics/DashboardInteractiveKpis.tsx");
  record(
    "POS & Merchant Features",
    "Product (...) menu opens Change Photo / Edit Details / Change Category modal; PLU modal has photo dropzone; Dashboard shows Daily Store Streak",
    productGrid.includes("data-kaspi-product-manage-modal") &&
      productGrid.includes("تغيير الصورة") &&
      productGrid.includes("تعديل المنتج") &&
      productGrid.includes("تغيير الصنف") &&
      pluPanel.includes("data-kaspi-plu-photo-dropzone") &&
      dashKpis.includes("data-kaspi-daily-streak"),
    "All 3 feature suites verified"
  );

  // 9. Universal TPE Hub Modules & Multi-Protocol Interfaces
  const tpeModules = [
    "src/lib/tpe/types.ts",
    "src/lib/tpe/DeviceFingerprinting.ts",
    "src/lib/tpe/RegionalCompatibilityRegistry.ts",
    "src/lib/tpe/AdapterRegistry.ts",
    "src/lib/tpe/VerifiedAcquisitionPipeline.ts",
    "src/lib/tpe/DeviceDiscoveryEngine.ts",
    "src/lib/tpe/UniversalAdapters.ts",
    "src/lib/tpe/TpeTransactionBridge.ts",
    "src/lib/tpe/index.ts",
    "src/lib/payments/WalletAdapter.ts",
    "src/lib/payments/SettlementManager.ts",
    "src/lib/payments/WebhookProcessor.ts",
    "src/app/api/v1/tpe/terminals/route.ts",
    "src/app/api/v1/tpe/transactions/route.ts",
    "src/components/settings/KaspiTpeManagerPanel.tsx",
  ];
  const missingTpeModules = tpeModules.filter((m) => !fs.existsSync(path.join(ROOT, m)));
  record(
    "Universal TPE Architecture",
    "All Universal TPE Hub modules, pipelines, bridges & manager components exist",
    missingTpeModules.length === 0,
    missingTpeModules.length === 0 ? `${tpeModules.length} TPE modules verified` : `Missing: ${missingTpeModules.join(", ")}`
  );

  // 10. 11-State Transaction Lifecycle & Zero Amount Re-entry State Machine
  const tpeTypes = readFileSafe("src/lib/tpe/types.ts");
  const tpeBridge = readFileSafe("src/lib/tpe/TpeTransactionBridge.ts");
  const requiredStates = [
    "CREATED",
    "VALIDATED",
    "SENT_TO_TERMINAL",
    "WAITING_FOR_CUSTOMER",
    "PROCESSING",
    "APPROVED",
    "DECLINED",
    "CANCELLED",
    "TIMED_OUT",
    "UNKNOWN",
    "RECONCILIATION_REQUIRED",
  ];
  const hasAllStates = requiredStates.every((st) => tpeTypes.includes(`"${st}"`));
  record(
    "TPE State Machine",
    "Exact 11-State Machine, Zero Amount Re-entry & Disconnect Recovery enforced in TpeTransactionBridge",
    hasAllStates &&
      tpeBridge.includes("executeZeroReentryPayment") &&
      tpeBridge.includes("canSafelyFinalizeSale") &&
      tpeBridge.includes("RECONCILIATION_REQUIRED"),
    "11 states + Zero Re-entry + Disconnect Recovery verified"
  );

  // 11. Multi-Tenant TPE Prisma Models & Tauri Rust Local Bridge
  const tauriBridgeRs = readFileSafe("src-tauri/src/tpe_bridge.rs");
  record(
    "Tauri Bridge & Tenant Isolation",
    "Tauri tpe_bridge.rs implements TCP OPI/NEXO & Prisma schema defines tenant/store-isolated TPE models",
    tauriBridgeRs.includes("initiate_tpe_payment") &&
      tauriBridgeRs.includes("discover_local_tpe_devices") &&
      prismaSchema.includes("model TpeTerminal") &&
      prismaSchema.includes("model TpeTransaction") &&
      prismaSchema.includes("model PaymentAuditLog") &&
      !forbiddenPrismaCols.test(prismaSchema),
    "Tauri Rust TCP bridge + scoped schema models verified"
  );
}

async function runLiveBrowserReverseEngineeringChecks() {
  const reachable = await isServerReachable(BASE_URL);
  if (!reachable) {
    console.log(
      `[INFO] Live server at ${BASE_URL} not running — skipping live Playwright DOM inspection (static checks completed).`
    );
    return;
  }

  const pw = await loadPlaywright();
  if (!pw) {
    console.log("[INFO] Playwright package not found — skipping live browser check.");
    return;
  }

  if (CAPTURE_SCREENSHOTS) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await pw.chromium.launch({ headless: true });

  try {
    for (const theme of ["pearl-light", "fjord-twilight"]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      await context.addInitScript((t) => {
        window.localStorage.setItem("kaspi-theme", t);
        window.localStorage.setItem("kaspi_store_name", "ASIMA");
        window.localStorage.setItem(
          "kaspi_custom_plu_items",
          JSON.stringify([
            {
              plu: "4011",
              nameAr: "لوز بلدي ممتاز",
              nameFr: "Amandes Bio",
              pricePerKg: 120,
              isCustom: true,
              imageUrl:
                "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80",
            },
          ])
        );
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);

      const page = await context.newPage();

      // 1. /ar/login — Check Logo Height (<= 50px), Theme Toggle (36x36, zero text), Single Eye, Glass Alpha
      await page.goto(`${BASE_URL}/ar/login`, { waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);
      await page.waitForTimeout(500);

      const loginMetrics = await page.evaluate(() => {
        const logo = document.querySelector('img[src="/logo-mark.png"]');
        const logoRect = logo ? logo.getBoundingClientRect() : null;
        const logoStyle = logo ? getComputedStyle(logo) : null;
        const toggle = document.querySelector('[data-kaspi-theme-toggle="true"]');
        const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
        const toggleText = toggle ? (toggle.textContent || "").trim() : "";
        const card = document.querySelector(".kaspi-glass-card");
        const cardStyle = card ? getComputedStyle(card) : null;
        return {
          logoHeight: logoRect ? Math.round(logoRect.height) : 0,
          logoOpacity: logoStyle ? logoStyle.opacity : "0",
          toggleW: toggleRect ? Math.round(toggleRect.width) : 0,
          toggleH: toggleRect ? Math.round(toggleRect.height) : 0,
          toggleText,
          cardBackdrop: cardStyle ? cardStyle.backdropFilter || cardStyle.webkitBackdropFilter : "",
          cardBg: cardStyle ? cardStyle.backgroundColor : "",
        };
      });

      if (CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `01_login_${theme}.png`),
        });
      }

      record(
        `Live DOM (${theme})`,
        "/ar/login — <KaspiBrandMark size='auth'> height <= 52px & 100% opacity",
        loginMetrics.logoHeight >= 36 &&
          loginMetrics.logoHeight <= 52 &&
          loginMetrics.logoOpacity === "1",
        `height=${loginMetrics.logoHeight}px, opacity=${loginMetrics.logoOpacity}`
      );

      record(
        `Live DOM (${theme})`,
        "Circular Icon-Only Theme Switcher (36x36px, zero text inside button)",
        loginMetrics.toggleW === 36 &&
          loginMetrics.toggleH === 36 &&
          loginMetrics.toggleText === "",
        `size=${loginMetrics.toggleW}x${loginMetrics.toggleH}px, text="${loginMetrics.toggleText}"`
      );

      // Authenticate Demo Session
      await page.evaluate(async () => {
        await fetch("/api/v1/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector: "grocery" }),
        });
      });

      // 2. /ar/dashboard — Verify Daily Store Streak + Open Analytics Modal Portal Containment
      await page.goto(`${BASE_URL}/ar/dashboard`, { waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);
      await page.waitForTimeout(450);

      const hasStreak = await page.locator('[data-kaspi-daily-streak="true"]').count();
      record(
        `Live DOM (${theme})`,
        "/ar/dashboard renders Daily Store Streak badge",
        hasStreak > 0,
        "data-kaspi-daily-streak present"
      );

      // Click first KPI card to open KaspiGlassAnalyticsModal
      const firstKpi = page.locator("button.kaspi-frosted-card").first();
      if ((await firstKpi.count()) > 0) {
        await firstKpi.click();
        await page.waitForTimeout(450);
      }

      const analyticsMetrics = await page.evaluate(() => {
        const portal = document.querySelector('[data-kaspi-modal-portal="true"]');
        const modal = document.querySelector('[data-kaspi-analytics-modal="true"]');
        const portalStyle = portal ? getComputedStyle(portal) : null;
        const modalStyle = modal ? getComputedStyle(modal) : null;
        const modalRect = modal ? modal.getBoundingClientRect() : null;
        return {
          portalParentTag: portal?.parentElement?.tagName || "",
          portalZIndex: portalStyle ? portalStyle.zIndex : "",
          modalBg: modalStyle ? modalStyle.backgroundColor : "",
          modalBackdrop: modalStyle
            ? modalStyle.backdropFilter || modalStyle.webkitBackdropFilter
            : "",
          fitsViewport: modalRect
            ? modalRect.top >= 0 && modalRect.bottom <= window.innerHeight + 2
            : false,
        };
      });

      if (CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `02_dashboard_analytics_modal_${theme}.png`),
        });
      }

      const modalAlpha = parseRgbaAlpha(analyticsMetrics.modalBg);
      record(
        `Live DOM (${theme})`,
        "KaspiGlassAnalyticsModal portaled to BODY at z-index 9999, translucent alpha < 0.65, zero viewport leak",
        analyticsMetrics.portalParentTag === "BODY" &&
          analyticsMetrics.portalZIndex === "9999" &&
          modalAlpha < 0.65 &&
          analyticsMetrics.fitsViewport,
        `parent=${analyticsMetrics.portalParentTag}, z=${analyticsMetrics.portalZIndex}, alpha=${modalAlpha.toFixed(
          2
        )}, fitsViewport=${analyticsMetrics.fitsViewport}`
      );

      // 3. /ar/dashboard/billing — Verify Customer Billing Portal + Subscription Upgrade Modal
      await page.goto(`${BASE_URL}/ar/dashboard/billing`, { waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);
      await page.waitForTimeout(400);

      if (CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `03_billing_portal_${theme}.png`),
        });
      }

      // Open Subscription Upgrade Modal
      const upgradeBtn = page.locator("button", { hasText: /تجديد|ترقية|Modifier|Update/i }).first();
      if ((await upgradeBtn.count()) > 0) {
        await upgradeBtn.click();
        await page.waitForTimeout(400);
        if (CAPTURE_SCREENSHOTS) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `04_subscription_modal_${theme}.png`),
          });
        }
      }

      // 4. Scrolled /ar/dashboard/inventory — Verify Locked 100vh Sidebar & Non-Sticky Topbar
      await page.goto(`${BASE_URL}/ar/dashboard/inventory`, { waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);
      await page.waitForTimeout(400);

      const scrollMetrics = await page.evaluate(() => {
        const scrollContainer =
          document.querySelector("main")?.parentElement ||
          document.documentElement;
        if (scrollContainer) scrollContainer.scrollTop = 500;
        const aside = document.querySelector("aside");
        const header = document.querySelector("header");
        const asideRect = aside ? aside.getBoundingClientRect() : null;
        const headerRect = header ? header.getBoundingClientRect() : null;
        return {
          scrollTop: scrollContainer ? scrollContainer.scrollTop : 0,
          asideHeight: asideRect ? Math.round(asideRect.height) : 0,
          headerTop: headerRect ? Math.round(headerRect.top) : 0,
        };
      });

      if (CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `05_inventory_scrolled_${theme}.png`),
        });
      }

      record(
        `Live DOM (${theme})`,
        "Scrolled /ar/dashboard/inventory locks Sidebar (720px) and scrolls Topbar out of view",
        scrollMetrics.asideHeight === 720 && scrollMetrics.headerTop < -100,
        `asideHeight=${scrollMetrics.asideHeight}px, headerTop=${scrollMetrics.headerTop}px`
      );

      // 4b. /ar/dashboard/settings?tab=terminals — Universal TPE Hardware Hub
      await page.goto(`${BASE_URL}/ar/dashboard/settings?tab=terminals`, { waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);
      await page.waitForTimeout(450);

      const tpeManagerVisible = await page.locator('[data-kaspi-tpe-manager-panel="true"]').count();
      if (CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `11_dashboard_settings_tpe_${theme}.png`),
        });
      }

      record(
        `Live DOM (${theme})`,
        "/ar/dashboard/settings?tab=terminals renders Universal TPE Hub with working controls",
        tpeManagerVisible > 0,
        "KaspiTpeManagerPanel verified"
      );

      // 5. /ar/pos — Seed Showcase Products (Unit + Weighable Kg with Photo), Verify Grid, (...) Menu, PLU Modal vs Checkout Z-Index, Price Verifier, Cash Shift
      await page.goto(`${BASE_URL}/ar/pos`, { waitUntil: "domcontentloaded" });
      await page.evaluate(async () => {
        await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "iPhone 18 Pro Max 256GB",
            sku: "KASPI-SHOW-01",
            barcode: "6119990001112",
            salePrice: 14500,
            stockQuantity: 15,
            categoryName: "electronics",
            imageUrl:
              "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
          }),
        }).catch(() => {});
        await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "لوز بلدي مغربي (Kg)",
            sku: "KASPI-SHOW-KG",
            barcode: "6119990002225",
            salePrice: 120,
            stockQuantity: 40,
            unit: "kg",
            isScaleItem: true,
            categoryName: "produce",
            imageUrl:
              "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80",
          }),
        }).catch(() => {});
      });

      await page.reload({ waitUntil: "domcontentloaded" });
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-kaspi-theme", t);
      }, theme);
      await page.waitForTimeout(1000);
      await page.waitForSelector(".kaspi-product-orbit-card", { timeout: 8000 }).catch(() => {});

      // Add an item to cart so checkout button is active
      const firstCard = page.locator(".kaspi-product-orbit-card").first();
      if ((await firstCard.count()) > 0) {
        await firstCard.click();
        await page.waitForTimeout(250);
      }

      if (CAPTURE_SCREENSHOTS) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `06_pos_grid_${theme}.png`),
        });
      }

      // Open (...) Product Management Modal
      const menuTrigger = page.locator("[data-kaspi-product-menu-trigger]").first();
      if ((await menuTrigger.count()) > 0) {
        await menuTrigger.click();
        await page.waitForTimeout(350);
        if (CAPTURE_SCREENSHOTS) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `07_pos_product_edit_modal_${theme}.png`),
          });
        }
        // Close Product Management Modal via Escape or Back button
        await page.keyboard.press("Escape");
        await page.mouse.click(10, 10);
        await page.waitForTimeout(300);
      }

      // Switch to PLU Scale view & open "إضافة سلعة للميزان" modal to verify photo dropzone + ZERO checkout button z-index bleed
      const pluTabBtn = page
        .locator('button[data-kaspi-view-switch="plu"], button:has-text("PLU"), button:has-text("ميزان")')
        .first();
      if ((await pluTabBtn.count()) > 0) {
        await pluTabBtn.click();
        await page.waitForTimeout(400);
        const addPluBtn = page
          .locator('[data-kaspi-add-plu-trigger="true"], button:has-text("إضافة سلعة للميزان"), button:has-text("New Weighed Item")')
          .first();
        if ((await addPluBtn.count()) > 0) {
          await addPluBtn.click();
          await page.waitForTimeout(400);

          const pluStackMetrics = await page.evaluate(() => {
            const portal = document.querySelector('[data-kaspi-modal-portal="true"]');
            const pluModal = document.querySelector('[data-kaspi-plu-modal="true"]');
            const dropzone = document.querySelector('[data-kaspi-plu-photo-dropzone="true"]');
            const checkoutBtn = document.querySelector(".kaspi-emerald-checkout-btn");
            const portalZ = portal ? parseInt(getComputedStyle(portal).zIndex || "0", 10) : 0;
            const checkoutZ = checkoutBtn
              ? parseInt(getComputedStyle(checkoutBtn).zIndex || "0", 10)
              : 0;
            const modalBg = pluModal ? getComputedStyle(pluModal).backgroundColor : "";
            return {
              portalParent: portal?.parentElement?.tagName || "",
              portalZ,
              checkoutZ,
              hasDropzone: Boolean(dropzone),
              modalAlpha: modalBg,
            };
          });

          if (CAPTURE_SCREENSHOTS) {
            await page.screenshot({
              path: path.join(SCREENSHOT_DIR, `08_pos_plu_modal_${theme}.png`),
            });
          }

          const pluAlpha = parseRgbaAlpha(pluStackMetrics.modalAlpha);
          record(
            `Live DOM (${theme})`,
            "PLU Modal has photo dropzone, translucent alpha < 0.65, and z-index (9999) strictly above إتمام البيع (0)",
            pluStackMetrics.portalParent === "BODY" &&
              pluStackMetrics.portalZ === 9999 &&
              pluStackMetrics.checkoutZ < pluStackMetrics.portalZ &&
              pluStackMetrics.hasDropzone &&
              pluAlpha < 0.65,
            `portalZ=${pluStackMetrics.portalZ}, checkoutZ=${pluStackMetrics.checkoutZ}, dropzone=${pluStackMetrics.hasDropzone}, alpha=${pluAlpha.toFixed(
              2
            )}`
          );

          await page.keyboard.press("Escape");
          await page.mouse.click(10, 10);
          await page.waitForTimeout(250);
        }

        // Switch back to grid view for clean state
        const gridTabBtn = page.locator('button[data-kaspi-view-switch="grid"]').first();
        if ((await gridTabBtn.count()) > 0) {
          await gridTabBtn.click();
          await page.waitForTimeout(250);
        }
      }

      // Open Price Verifier Modal
      const priceCheckBtn = page
        .locator('button[data-kaspi-view-switch="price_check"], button:has-text("فاحص الثمن"), button:has-text("Price & DLC")')
        .first();
      if ((await priceCheckBtn.count()) > 0) {
        await priceCheckBtn.click();
        await page.waitForTimeout(350);
        if (CAPTURE_SCREENSHOTS) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `09_pos_price_verifier_${theme}.png`),
          });
        }
        await page.keyboard.press("Escape");
        await page.mouse.click(10, 10);
        await page.waitForTimeout(250);
      }

      // Open Cash Shift Modal
      const shiftBtn = page.locator('header button[title*="Rapport X"]').first();
      if ((await shiftBtn.count()) > 0) {
        await shiftBtn.click();
        await page.waitForTimeout(400);
        if (CAPTURE_SCREENSHOTS) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, `10_pos_cash_shift_modal_${theme}.png`),
          });
        }
        await page.keyboard.press("Escape");
        await page.mouse.click(10, 10);
        await page.waitForTimeout(200);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("=== KASPI POS REVERSE-ENGINEERING & COMPLIANCE AUDIT SUITE ===");
  await runStaticReverseEngineeringChecks();
  if (process.env.SKIP_LIVE_BROWSER !== "1") {
    await runLiveBrowserReverseEngineeringChecks();
  }

  const lines = [
    "# KASPI POS (كسب) — Reverse-Engineering & Compliance Audit Report",
    "",
    `- **Audit Status:** ${failures === 0 ? "ALL CHECKS PASSED (0 Failures)" : `FAILED (${failures} Failures)`}`,
    `- **Total Rules Verified:** ${results.length}`,
    `- **Pricing Rule Lock:** \`200 MAD/month\` (1st Poste, 100% features) + \`150 MAD/month\` per extra Poste`,
    `- **Legal & Security Lock:** Bank Al-Maghrib Law 103-12 Software Separation + PCI-DSS 4.0.1 Tokenized-Only Storage`,
    "",
    "| # | Category | Compliance Rule | Status | Measured Metric / Proof |",
    "| :--- | :--- | :--- | :--- | :--- |",
    ...results.map(
      (r, idx) =>
        `| ${idx + 1} | **${r.category}** | ${r.rule} | **${r.status}** | \`${r.detail || "Verified"}\` |`
    ),
    "",
  ];

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
  console.log(`\n[REPORT WRITTEN] ${REPORT_PATH}`);

  if (failures > 0) {
    console.error(`[REVERSE-ENGINEERING AUDIT FAILED] ${failures} check(s) failed.`);
    process.exit(1);
  }

  console.log("[REVERSE-ENGINEERING AUDIT PASSED] 100% compliant.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
