/**
 * KASPI POS verification email (HTML).
 *
 * Email clients cannot run JavaScript, so interactivity is layered:
 *  1. Every client: language pills and the copy button are plain links to
 *     `/verify-code?code=…&lang=…(&copy=1)`, which copies on the web page.
 *  2. Clients that support <input> + :checked (Apple Mail, iOS Mail, Thunderbird, …):
 *     a pure-CSS radio-tab switcher swaps the language in place, no page load.
 *     Clients that strip <input> (Gmail, Outlook) never match :checked and keep the link pills.
 */

import {
  VERIFICATION_COPY,
  VERIFICATION_LANGS,
  VerificationLang,
  VerificationPurpose,
  normalizeVerificationCode,
} from "./verification-copy";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, 'Helvetica Neue', Arial, sans-serif";
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace";

/** Hidden-by-default styles that survive Outlook (mso-hide) and Gmail (inline display:none). */
const HIDDEN = "display:none;max-height:0;overflow:hidden;mso-hide:all;";

export function getAppBaseUrl(): string {
  const url =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://kaspi-pos.vercel.app";
  if (url.includes("127.0.0.1") || url.includes("localhost")) {
    return "https://kaspi-pos.vercel.app";
  }
  return url.replace(/\/+$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildVerifyCodeUrl(params: {
  code: string;
  lang: VerificationLang;
  purpose?: VerificationPurpose;
  copy?: boolean;
}): string {
  const qs = new URLSearchParams({ code: params.code, lang: params.lang });
  if (params.purpose === "reset") qs.set("purpose", "reset");
  if (params.copy) qs.set("copy", "1");
  return `${getAppBaseUrl()}/${params.lang}/verify-code?${qs.toString()}`;
}

/* --------------------------------- Pieces --------------------------------- */

// Inline SVG renders in Apple Mail / iOS / Thunderbird; Gmail & Outlook drop it and show text only.
const COPY_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin:0 8px;" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/></svg>`;

function renderWordmark(): string {
  return `
  <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" dir="ltr" style="margin:0 auto;">
    <tr>
      <td style="font-family:${FONT_STACK};font-size:28px;font-weight:900;letter-spacing:-0.8px;color:#09090b;line-height:1;padding-right:8px;">KASPI</td>
      <td style="background-color:#09090b;border-radius:8px;padding:5px 10px;font-family:${FONT_STACK};font-size:22px;font-weight:900;letter-spacing:-0.4px;color:#ffffff;line-height:1;">POS</td>
    </tr>
  </table>`;
}

function renderBrandBadge(): string {
  const logo = `${getAppBaseUrl()}/logo.png`;
  return `
  <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="margin:26px auto 24px auto;">
    <tr>
      <td style="border:1px solid #e4e4e7;border-radius:999px;padding:7px;background-color:#fafafa;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="border:1px solid #e4e4e7;border-radius:999px;padding:5px;background-color:#ffffff;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" valign="middle" width="64" height="64" style="width:64px;height:64px;border-radius:999px;background-color:#09090b;text-align:center;">
                    <img src="${logo}" width="40" height="40" alt="KASPI POS" style="display:inline-block;width:40px;height:40px;border:0;outline:none;vertical-align:middle;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function renderDigits(code: string): string {
  const cells = code
    .split("")
    .map(
      (d) => `
      <td style="padding:0 3px;">
        <div style="width:46px;height:56px;line-height:56px;text-align:center;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-family:${MONO_STACK};font-size:28px;font-weight:700;color:#09090b;">${d}</div>
      </td>`
    )
    .join("");
  return `
  <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" dir="ltr" style="margin:24px auto 22px auto;direction:ltr;">
    <tr>${cells}</tr>
  </table>`;
}

function renderLanguageBlock(
  lang: VerificationLang,
  code: string,
  purpose: VerificationPurpose
): string {
  const t = VERIFICATION_COPY[lang];
  const copyUrl = buildVerifyCodeUrl({ code, lang, purpose, copy: true });

  return `
  <div class="kp-b kp-b-${lang}" dir="${t.dir}" lang="${lang}" style="text-align:center;direction:${t.dir};">
    <div style="font-family:${FONT_STACK};font-size:13px;font-weight:600;color:#52525b;margin-top:12px;">${escapeHtml(t.subtitle)}</div>
    ${renderBrandBadge()}
    <div style="font-family:${FONT_STACK};font-size:25px;font-weight:800;letter-spacing:-0.4px;color:#09090b;line-height:1.25;">${escapeHtml(t.heading[purpose])}</div>
    <div style="font-family:${FONT_STACK};font-size:14px;line-height:1.65;color:#71717a;margin:10px auto 0 auto;max-width:340px;">${escapeHtml(t.description[purpose])}</div>
    ${renderDigits(code)}
    <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td align="center" style="border-radius:999px;background-color:#09090b;">
          <a href="${copyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;min-width:170px;padding:14px 30px;border-radius:999px;background-color:#09090b;font-family:${FONT_STACK};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">${COPY_ICON_SVG}${escapeHtml(t.copyBtn)}</a>
        </td>
      </tr>
    </table>
  </div>`;
}

function pillInner(lang: VerificationLang, active: boolean): string {
  const t = VERIFICATION_COPY[lang];
  const badgeBg = active ? "#ffffff" : "#f4f4f5";
  const badgeFg = active ? "#09090b" : "#52525b";
  return `<span class="kp-badge" style="display:inline-block;min-width:22px;padding:3px 6px;margin:0 6px 0 0;border-radius:999px;background-color:${badgeBg};color:${badgeFg};font-family:${MONO_STACK};font-size:10px;font-weight:700;letter-spacing:1px;text-align:center;">${t.badge}</span><span dir="${t.dir}">${t.name}</span>`;
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
  ].join(";");
}

function renderLanguageSwitcher(
  activeLang: VerificationLang,
  code: string,
  purpose: VerificationPurpose
): string {
  // Clean static pills that link to the respective localized verify page
  const links = VERIFICATION_LANGS.map((lang) => {
    const active = lang === activeLang;
    const href = buildVerifyCodeUrl({ code, lang, purpose });
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="${pillStyle(active)}">${pillInner(lang, active)}</a>`;
  }).join("");

  return `
  <div dir="ltr" style="margin-top:26px;padding-top:18px;border-top:1px solid #f4f4f5;text-align:center;">
    <div class="kp-links">${links}</div>
  </div>`;
}

/* ------------------------------ Public renderer ----------------------------- */

export interface VerificationEmailOptions {
  code: string;
  lang?: VerificationLang;
  purpose?: VerificationPurpose;
}

export function renderVerificationEmailHtml(options: VerificationEmailOptions): string {
  const code = normalizeVerificationCode(options.code);
  const lang = options.lang ?? "ar";
  const purpose = options.purpose ?? "login";
  const t = VERIFICATION_COPY[lang];

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${t.dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(t.heading[purpose])}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div style="${HIDDEN}font-size:1px;line-height:1px;color:#f4f4f5;opacity:0;">KASPI POS: ${code}</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <div class="kp-card" style="max-width:440px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:28px;padding:36px 26px 26px 26px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 12px 32px -8px rgba(16,24,40,0.12);">
          ${renderWordmark()}
          ${renderLanguageBlock(lang, code, purpose)}
          ${renderLanguageSwitcher(lang, code, purpose)}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
