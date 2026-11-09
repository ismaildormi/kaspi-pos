/**
 * KASPI POS Welcome & Successful Sign-In Email HTML Generator.
 *
 * Strict Zero Emojis Architecture:
 * - HTML/CSS typography, geometric badges, and inline SVGs only.
 * - Center Hero Logo with emerald-green verified checkmark badge.
 * - Luxury "Digital Store Pass" mini-card.
 * - 3-Step Quick Onboarding Strip (01, 02, 03).
 * - Interactive Pure-CSS radio-tab language switcher + fallback links.
 */

import {
  WELCOME_COPY,
  WELCOME_LANGS,
  WelcomeEmailData,
  WelcomeLang,
  formatWelcomeDate,
  normalizeWelcomeLang,
  resolveStoreCategory,
} from "./welcome-copy";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, 'Helvetica Neue', Arial, sans-serif";
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace";
const HIDDEN = "display:none;max-height:0;overflow:hidden;mso-hide:all;";

export function getAppBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://kaspi-pos.vercel.app"
  ).replace(/\/+$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildWelcomePreviewUrl(
  data: WelcomeEmailData,
  lang: WelcomeLang
): string {
  const qs = new URLSearchParams();
  if (data.userName) qs.set("name", data.userName);
  if (data.storeName) qs.set("store", data.storeName);
  if (data.storeCategory) qs.set("category", data.storeCategory);
  if (data.userEmail) qs.set("email", data.userEmail);
  qs.set("lang", lang);
  return `${getAppBaseUrl()}/${lang}/welcome-email?${qs.toString()}`;
}

/* --------------------------------- Pieces --------------------------------- */

function renderWordmark(): string {
  return `
  <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" dir="ltr" style="margin:0 auto;">
    <tr>
      <td style="font-family:${FONT_STACK};font-size:28px;font-weight:900;letter-spacing:-0.8px;color:#09090b;line-height:1;padding-right:8px;">KASPI</td>
      <td style="background-color:#09090b;border-radius:8px;padding:5px 10px;font-family:${FONT_STACK};font-size:22px;font-weight:900;letter-spacing:-0.4px;color:#ffffff;line-height:1;">POS</td>
    </tr>
  </table>`;
}

/**
 * Center circular logo with emerald-green verified checkmark badge anchored at bottom-right.
 */
function renderVerifiedHeroBadge(): string {
  const logo = `${getAppBaseUrl()}/logo.png`;
  return `
  <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="margin:22px auto 20px auto;">
    <tr>
      <td align="center" valign="middle">
        <div style="position:relative;display:inline-block;width:74px;height:74px;">
          <!-- Double Ring Outer Border -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:74px;height:74px;border:1px solid #e4e4e7;border-radius:999px;background-color:#fafafa;">
            <tr>
              <td align="center" valign="middle" style="padding:4px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:64px;height:64px;border:1px solid #e4e4e7;border-radius:999px;background-color:#09090b;">
                  <tr>
                    <td align="center" valign="middle" style="text-align:center;">
                      <img src="${logo}" width="38" height="38" alt="KASPI POS" style="display:inline-block;width:38px;height:38px;border:0;outline:none;vertical-align:middle;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!-- Emerald Verified Badge (Bottom Right Anchor) -->
          <div style="position:absolute;bottom:0px;right:0px;width:22px;height:22px;line-height:20px;border-radius:999px;background-color:#10b981;border:2px solid #ffffff;color:#ffffff;font-size:12px;font-weight:900;text-align:center;box-shadow:0 2px 6px rgba(16,185,129,0.45);font-family:${FONT_STACK};">
            &#10003;
          </div>
        </div>
      </td>
    </tr>
  </table>`;
}

/**
 * Signature Feature: Digital Store Pass Mini-Card (luxury dark card)
 */
function renderStorePass(
  lang: WelcomeLang,
  data: WelcomeEmailData,
  resolvedCategory: string,
  formattedDate: string,
  resolvedOwner: string,
  resolvedStore: string
): string {
  const t = WELCOME_COPY[lang];
  const isRtl = t.dir === "rtl";

  return `
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" dir="${t.dir}" style="margin:22px 0 20px 0;background-color:#09090b;border:1px solid #27272a;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px -8px rgba(0,0,0,0.5);">
    <tr>
      <td style="padding:20px 22px;">
        <!-- Top Row: Store Name + Live Status Pill -->
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" dir="${t.dir}">
          <tr>
            <td align="${isRtl ? "right" : "left"}" style="vertical-align:middle;">
              <div style="font-family:${FONT_STACK};font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">
                ${escapeHtml(resolvedStore)}
              </div>
            </td>
            <td align="${isRtl ? "left" : "right"}" style="vertical-align:middle;">
              <span style="display:inline-block;padding:4px 10px;background-color:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);border-radius:999px;font-family:${FONT_STACK};font-size:11px;font-weight:800;color:#10b981;white-space:nowrap;line-height:1.2;">
                <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#10b981;margin-${isRtl ? "left" : "right"}:5px;vertical-align:middle;"></span>
                ${escapeHtml(t.storePass.statusBadge)}
              </span>
            </td>
          </tr>
        </table>

        <!-- Subtle Card Divider -->
        <div style="height:1px;background-color:#27272a;margin:16px 0;"></div>

        <!-- Bottom Row: 3-Column Metadata Grid -->
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" dir="${t.dir}">
          <tr>
            <!-- Category -->
            <td width="33%" align="${isRtl ? "right" : "left"}" valign="top" style="padding-right:4px;">
              <div style="font-family:${FONT_STACK};font-size:10px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                ${escapeHtml(t.storePass.categoryLabel)}
              </div>
              <div style="font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#f4f4f5;line-height:1.3;">
                ${escapeHtml(resolvedCategory)}
              </div>
            </td>
            <!-- Owner -->
            <td width="34%" align="center" valign="top" style="padding:0 4px;">
              <div style="font-family:${FONT_STACK};font-size:10px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                ${escapeHtml(t.storePass.ownerLabel)}
              </div>
              <div style="font-family:${FONT_STACK};font-size:13px;font-weight:700;color:#f4f4f5;line-height:1.3;">
                ${escapeHtml(resolvedOwner)}
              </div>
            </td>
            <!-- Date -->
            <td width="33%" align="${isRtl ? "left" : "right"}" valign="top" style="padding-left:4px;">
              <div style="font-family:${FONT_STACK};font-size:10px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                ${escapeHtml(t.storePass.dateLabel)}
              </div>
              <div style="font-family:${MONO_STACK};font-size:12px;font-weight:700;color:#d4d4d8;line-height:1.3;">
                ${escapeHtml(formattedDate)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

/**
 * 3-Step Quick Onboarding Strip with crisp monochrome numbered badges (01, 02, 03)
 */
function renderOnboardingStrip(lang: WelcomeLang): string {
  const t = WELCOME_COPY[lang];
  const isRtl = t.dir === "rtl";
  const badges = ["01", "02", "03"];

  const stepsHtml = t.onboarding.steps
    .map((stepText, idx) => {
      const isLast = idx === 2;
      return `
      <tr>
        <td valign="top" width="32" style="width:32px;padding-bottom:${isLast ? "0" : "12px"};">
          <div style="width:26px;height:26px;line-height:26px;text-align:center;border-radius:7px;background-color:#09090b;color:#ffffff;font-family:${MONO_STACK};font-size:11px;font-weight:900;">
            ${badges[idx]}
          </div>
        </td>
        <td valign="middle" align="${isRtl ? "right" : "left"}" style="padding-${isRtl ? "right" : "left"}:10px;padding-bottom:${isLast ? "0" : "12px"};font-family:${FONT_STACK};font-size:13px;font-weight:600;color:#27272a;line-height:1.45;">
          ${escapeHtml(stepText)}
        </td>
      </tr>`;
    })
    .join("");

  return `
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" dir="${t.dir}" style="margin:0 0 24px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
    <tr>
      <td style="padding:18px 20px;">
        <div style="font-family:${FONT_STACK};font-size:13px;font-weight:800;color:#09090b;margin-bottom:12px;text-align:${isRtl ? "right" : "left"};">
          ${escapeHtml(t.onboarding.sectionTitle)}
        </div>
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" dir="${t.dir}">
          ${stepsHtml}
        </table>
      </td>
    </tr>
  </table>`;
}

function renderLanguageBlock(
  lang: WelcomeLang,
  activeLang: WelcomeLang,
  data: WelcomeEmailData
): string {
  const t = WELCOME_COPY[lang];
  const isRtl = t.dir === "rtl";
  const visibility = lang === activeLang ? "display:block;" : HIDDEN;

  const resolvedOwner =
    data.userName?.trim() ||
    (data.userEmail ? data.userEmail.split("@")[0] : null) ||
    (lang === "ar" ? "التاجر" : lang === "fr" ? "Commerçant" : "Merchant");

  const resolvedStore = data.storeName?.trim() || t.defaultStoreName;
  const resolvedCategory = resolveStoreCategory(data.storeCategory, lang);
  const formattedDate = formatWelcomeDate(data.loginDate, lang);
  const launcherUrl = `${getAppBaseUrl()}/launch-desktop?token=${encodeURIComponent(
    data.handoffToken || ""
  )}&lang=${lang}&target=/${lang}/dashboard`;

  return `
  <div class="wkp-b wkp-b-${lang}" dir="${t.dir}" lang="${lang}" style="${visibility}text-align:center;direction:${t.dir};">
    <div style="font-family:${FONT_STACK};font-size:13px;font-weight:600;color:#52525b;margin-top:10px;">
      ${escapeHtml(t.subtitle)}
    </div>

    ${renderVerifiedHeroBadge()}

    <!-- Hero Heading & Description -->
    <div style="font-family:${FONT_STACK};font-size:24px;font-weight:900;letter-spacing:-0.4px;color:#09090b;line-height:1.25;margin:0 auto 10px auto;">
      ${escapeHtml(t.heroHeading(resolvedOwner))}
    </div>
    <div style="font-family:${FONT_STACK};font-size:14px;line-height:1.7;color:#52525b;margin:0 auto 6px auto;max-width:380px;">
      ${escapeHtml(t.heroDescription)}
    </div>

    <!-- Digital Store Pass Mini-Card -->
    ${renderStorePass(lang, data, resolvedCategory, formattedDate, resolvedOwner, resolvedStore)}

    <!-- 3-Step Quick Onboarding Strip -->
    ${renderOnboardingStrip(lang)}

    <!-- Primary CTA Button (Deep Black Pill linking to Desktop App Launcher) -->
    <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;">
      <tr>
        <td align="center" style="border-radius:999px;background-color:#09090b;">
          <a href="${launcherUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;min-width:220px;padding:15px 36px;border-radius:999px;background-color:#09090b;font-family:${FONT_STACK};font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;line-height:1;box-shadow:0 10px 24px -10px rgba(9,9,11,0.7);">
            ${escapeHtml(t.primaryButton)}
          </a>
        </td>
      </tr>
    </table>

    <!-- Footer Confirmation Note -->
    <div style="font-family:${FONT_STACK};font-size:12px;color:#71717a;line-height:1.6;margin:12px auto 0 auto;text-align:center;">
      ${escapeHtml(t.footerNote)}
    </div>
  </div>`;
}

function pillInner(lang: WelcomeLang, active: boolean): string {
  const t = WELCOME_COPY[lang];
  const badgeBg = active ? "#ffffff" : "#f4f4f5";
  const badgeFg = active ? "#09090b" : "#52525b";
  return `<span class="wkp-badge" style="display:inline-block;min-width:22px;padding:3px 6px;margin:0 6px 0 0;border-radius:999px;background-color:${badgeBg};color:${badgeFg};font-family:${MONO_STACK};font-size:10px;font-weight:700;letter-spacing:1px;text-align:center;">${t.badge}</span><span dir="${t.dir}">${t.name}</span>`;
}

function pillStyle(active: boolean): string {
  return [
    "display:inline-block",
    "margin:4px 3px",
    "padding:5px 13px 5px 5px",
    "border-radius:999px",
    `border:1px solid ${active ? "#09090b" : "#e5e7eb"}`,
    `background-color:${active ? "#09090b" : "#ffffff"}`,
    `color:${active ? "#ffffff" : "#3f3f46"}`,
    `font-family:${FONT_STACK}`,
    "font-size:13px",
    "font-weight:600",
    "text-decoration:none",
    "line-height:1.4",
    "cursor:pointer",
  ].join(";");
}

function renderLanguageSwitcher(
  activeLang: WelcomeLang,
  data: WelcomeEmailData
): string {
  const links = WELCOME_LANGS.map((lang) => {
    const active = lang === activeLang;
    const href = buildWelcomePreviewUrl(data, lang);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="${pillStyle(active)}">${pillInner(lang, active)}</a>`;
  }).join("");

  const labels = WELCOME_LANGS.map(
    (lang) =>
      `<label for="wkp-${lang}" class="wkp-l wkp-l-${lang}" style="${pillStyle(false)}">${pillInner(lang, false)}</label>`
  ).join("");

  return `
  <div dir="ltr" style="margin-top:24px;padding-top:18px;border-top:1px solid #f4f4f5;text-align:center;">
    <div class="wkp-links">${links}</div>
    <div class="wkp-tabs" style="${HIDDEN}">${labels}</div>
  </div>`;
}

function renderSwitcherCss(): string {
  const perLang = WELCOME_LANGS.map(
    (l) => `
    #wkp-${l}:checked ~ .wkp-card .wkp-links { display:none !important; }
    #wkp-${l}:checked ~ .wkp-card .wkp-tabs { display:block !important; max-height:none !important; overflow:visible !important; }
    #wkp-${l}:checked ~ .wkp-card .wkp-b { display:none !important; }
    #wkp-${l}:checked ~ .wkp-card .wkp-b-${l} { display:block !important; max-height:none !important; overflow:visible !important; }
    #wkp-${l}:checked ~ .wkp-card .wkp-l-${l} { background-color:#09090b !important; border-color:#09090b !important; color:#ffffff !important; }
    #wkp-${l}:checked ~ .wkp-card .wkp-l-${l} .wkp-badge { background-color:#ffffff !important; color:#09090b !important; }`
  ).join("");

  return `
  <style>
    .wkp-r { display:none !important; }
    .wkp-tabs .wkp-l { background-color:#ffffff !important; border-color:#e5e7eb !important; color:#3f3f46 !important; }
    .wkp-tabs .wkp-l .wkp-badge { background-color:#f4f4f5 !important; color:#52525b !important; }
    ${perLang}
  </style>`;
}

/* ------------------------------ Public Renderer ----------------------------- */

export function renderWelcomeEmailHtml(
  data: WelcomeEmailData,
  langOverride?: WelcomeLang
): string {
  const lang = normalizeWelcomeLang(langOverride);
  const t = WELCOME_COPY[lang];

  const radios = WELCOME_LANGS.map(
    (l) =>
      `<input type="radio" name="welcome_lang" id="wkp-${l}" class="wkp-r"${l === lang ? " checked" : ""} style="display:none;" />`
  ).join("");

  const blocks = WELCOME_LANGS.map((l) => renderLanguageBlock(l, lang, data)).join("");

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${t.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(t.subject)}</title>
  ${renderSwitcherCss()}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div style="${HIDDEN}font-size:1px;line-height:1px;color:#f4f4f5;opacity:0;">${escapeHtml(t.heroDescription)}</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        ${radios}
        <div class="wkp-card" style="max-width:460px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:24px;padding:36px 26px 26px 26px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 12px 32px -8px rgba(16,24,40,0.12);">
          ${renderWordmark()}
          ${blocks}
          ${renderLanguageSwitcher(lang, data)}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
