import { NextRequest, NextResponse } from "next/server";
import { isSafePublicHttpUrl, runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";

export const runtime = "nodejs";
export const maxDuration = 30;

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Prepares fetched HTML for safe sandboxed iframe rendering with relative-asset <base> resolution
 * and Chrome-like click-through navigation bridging back to the Studio Browser parent.
 */
function buildProxiedBrowserHtml(rawHtml: string, finalUrl: string): {
  title: string;
  proxiedHtml: string;
} {
  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : finalUrl;

  // Strip frame-busting meta CSP headers only inside the fetched external HTML copy
  let clean = rawHtml
    .replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "")
    .replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");

  const originBase = escapeAttr(finalUrl);
  const bridgeScript = `<script>
(function(){
  document.addEventListener("click", function(e){
    var target = e.target;
    while (target && target.tagName !== "A") target = target.parentElement;
    if (!target || !target.getAttribute) return;
    var rawHref = target.getAttribute("href");
    if (!rawHref || rawHref.charAt(0) === "#" || /^javascript:/i.test(rawHref)) return;
    try {
      var abs = new URL(rawHref, ${JSON.stringify(finalUrl)}).toString();
      if (/^https?:\\/\\//i.test(abs)) {
        e.preventDefault();
        parent.postMessage({ source: "heyuka-studio-browser", type: "navigate", url: abs }, "*");
      }
    } catch (_) {}
  }, true);
  document.addEventListener("submit", function(e){
    var form = e.target;
    if (!form || form.tagName !== "FORM") return;
    var action = form.getAttribute("action") || ${JSON.stringify(finalUrl)};
    try {
      var u = new URL(action, ${JSON.stringify(finalUrl)});
      var fd = new FormData(form);
      if ((form.getAttribute("method") || "get").toLowerCase() === "get") {
        e.preventDefault();
        fd.forEach(function(v, k){ u.searchParams.set(k, String(v)); });
        parent.postMessage({ source: "heyuka-studio-browser", type: "navigate", url: u.toString() }, "*");
      }
    } catch (_) {}
  }, true);
})();
</script>`;

  const baseTag = `<base href="${originBase}" target="_self" />`;
  if (/<head[^>]*>/i.test(clean)) {
    clean = clean.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}`);
  } else {
    clean = `<!doctype html><html><head>${baseTag}</head><body>${clean}</body></html>`;
  }

  if (/<\/body>/i.test(clean)) {
    clean = clean.replace(/<\/body>/i, `${bridgeScript}\n</body>`);
  } else {
    clean = `${clean}\n${bridgeScript}`;
  }

  return { title, proxiedHtml: clean };
}

async function handleBrowse(params: { url?: string; query?: string; lang?: string }) {
  const lang = String(params.lang || "en").slice(0, 2);
  const rawUrl = String(params.url || "").trim();
  const rawQuery = String(params.query || "").trim();

  // Extract ?q= if user entered a Google Search URL directly
  let effectiveQuery = rawQuery;
  let effectiveUrl = rawUrl;
  if (effectiveUrl) {
    try {
      const u = new URL(effectiveUrl);
      if (/^(www\.)?google\.[a-z.]+$/i.test(u.hostname)) {
        const q = u.searchParams.get("q");
        if (q && q.trim()) {
          effectiveQuery = q.trim();
          effectiveUrl = "";
        } else {
          return NextResponse.json({
            ok: true,
            kind: "google_home",
            url: "https://www.google.com/",
            title: "Google",
            results: [],
          });
        }
      }
    } catch {}
  }

  if (!effectiveUrl && effectiveQuery) {
    const searchRes = await runUnrestrictedWebResearch({ query: effectiveQuery, lang });
    return NextResponse.json({
      ok: searchRes.ok || (searchRes.results?.length || 0) > 0,
      kind: "search",
      title: `${effectiveQuery} - Google Search`,
      url: `https://www.google.com/search?q=${encodeURIComponent(effectiveQuery)}`,
      source: searchRes.source,
      results: searchRes.results || [],
    });
  }

  if (!effectiveUrl || !isSafePublicHttpUrl(effectiveUrl)) {
    return NextResponse.json(
      { ok: false, error: "Invalid or blocked URL (only public HTTP/HTTPS allowed)." },
      { status: 400 }
    );
  }

  const [readerRes, htmlRes] = await Promise.allSettled([
    runUnrestrictedWebResearch({ url: effectiveUrl, lang }),
    fetch(effectiveUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KaspiHeyukaBrowser/3.0; +https://kaspi-pos.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8500),
    }),
  ]);

  const extractedText =
    readerRes.status === "fulfilled" && readerRes.value.ok
      ? readerRes.value.extractedText || ""
      : "";

  let title = effectiveUrl;
  let proxiedHtml = "";
  let finalUrl = effectiveUrl;

  if (htmlRes.status === "fulfilled" && htmlRes.value.ok) {
    finalUrl = htmlRes.value.url && isSafePublicHttpUrl(htmlRes.value.url) ? htmlRes.value.url : effectiveUrl;
    const ct = htmlRes.value.headers.get("content-type") || "";
    const textBody = (await htmlRes.value.text()).slice(0, 1_200_000);
    if (ct.includes("html") || /<!doctype|<html|<body/i.test(textBody)) {
      const built = buildProxiedBrowserHtml(textBody, finalUrl);
      title = built.title;
      proxiedHtml = built.proxiedHtml;
    } else if (textBody) {
      proxiedHtml = `<!doctype html><html><body style="font-family:monospace;white-space:pre-wrap;padding:16px;background:#111;color:#eee">${escapeAttr(
        textBody.slice(0, 60000)
      )}</body></html>`;
    }
  }

  if (!proxiedHtml && extractedText) {
    return NextResponse.json({
      ok: true,
      kind: "reader",
      url: finalUrl,
      title,
      extractedText,
    });
  }

  if (!proxiedHtml && !extractedText) {
    return NextResponse.json({
      ok: false,
      error: "Target website refused direct preview; open in external tab.",
      url: effectiveUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    kind: "page",
    url: finalUrl,
    title,
    proxiedHtml,
    extractedText,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await handleBrowse(body);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Browse failed" }, { status: 500 });
  }
}
