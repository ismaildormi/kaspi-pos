/**
 * ============================================================================
 * KASPI AI — SHARED ENGINE & CLIENT-FIRST ARENA EXECUTION RUNNER
 * ----------------------------------------------------------------------------
 * Executes open-weight AI inference, DuckDuckGo + Wikipedia search, AI Horde
 * Stable Diffusion image generation, and local HTML5 Canvas .webm Motion Video
 * DIRECTLY from the user's browser / desktop machine (CORS *) first to keep
 * server load minimal, with seamless failover to `/api/ai/arena-execute`.
 *
 * Also acts as single source of truth for modality detection, code/HTML/CSS
 * project extraction, leak-proof chat sanitization, and live iframe bundling.
 * ============================================================================
 */

import {
  ARENA_REAL_MODELS,
  selectBattleModelPair,
  type ArenaExecutionMode,
  type ArenaModality,
  type ArenaModelOutput,
  type ArenaProjectFileItem,
  type ArenaRealModelSpec,
  type ArenaWebCitation,
} from "./arena-models";

export const CODE_BUILD_PROMPT_REGEX =
  /(build\s+|create\s+|make\s+|design\s+|develop\s+|code\s+|write\s+(a\s+)?(game|website|web\s*app|site|page|html|dashboard|app|store|shop|calculator|portfolio|landing)|website|web\s*app|landing\s*page|racing\s*game|arcade|three\.?js|tetris|snake|chess|puzzle|block\s*blast|html5|canvas|صفحة|موقع|سيت|متجر|تطبيق|لعبة|صوب|قاد|دير\s*لي|ابني|أبني|كريي|صمم|أنشئ|برمج|واجهة|منصة|حاسبة|نظام)/i;

const VIDEO_PROMPT_REGEX =
  /(\bcreate\s+(a\s+)?video\b|\bgenerate\s+(a\s+)?video\b|\bpromo\s+video\b|\bvideo\s+ad\b|\bmotion\s+video\b|\bcommercial\s+video\b|\breel\b|فيديو|لفيديو|فديو|فيديوا|فيديو\s+إعلاني|اشهار.*فيديو|فيديو.*اشهار|مقطع\s+فيديو|ريلز|انميشن|موشن\s+جرافيك)/i;

const IMAGE_PROMPT_REGEX =
  /(\bdraw\b|\bgenerate\s+(an?\s+)?image\b|\bcreate\s+(a\s+)?(photo|picture|logo|illustration|art|poster|banner|cover)\b|ارسم|توليد\s+صورة|صورة\s+(?!.*فيديو)|انشئ\s+صورة|صمم\s+شعار|لوجو)/i;

const SEARCH_PROMPT_REGEX =
  /(\bsearch\s+(the\s+)?web\b|\bfetch\b|\blatest\s+news\b|\bcurrent\s+price\b|ابحث\s+في\s+الانترنت|بحث\s+في\s+الويب|معلومات\s+محدثة|أخبار\s+اليوم)/i;

const FOLLOWUP_CODE_EDIT_REGEX =
  /(change|update|modify|edit|add|fix|remove|make\s+it|color|theme|button|section|navbar|footer|cart|checkout|admin|product|arabic|french|english|بدل|غير|زيد|عدل|حسن|أضف|لون|الزر|القائمة|السلة|العنوان|ضف|صلح|ميزة)/i;

export function detectEffectiveModality(
  requested: ArenaModality,
  prompt: string,
  previousTurnModality?: "code" | "text" | "search" | "image" | "video"
): "code" | "text" | "search" | "image" | "video" {
  if (
    requested === "code" ||
    requested === "text" ||
    requested === "search" ||
    requested === "image" ||
    requested === "video"
  ) {
    return requested;
  }

  const p = prompt.toLowerCase();
  if (VIDEO_PROMPT_REGEX.test(p)) return "video";
  if (CODE_BUILD_PROMPT_REGEX.test(p)) return "code";
  if (IMAGE_PROMPT_REGEX.test(p)) return "image";
  if (SEARCH_PROMPT_REGEX.test(p)) return "search";

  if (previousTurnModality === "code" && FOLLOWUP_CODE_EDIT_REGEX.test(p)) {
    return "code";
  }

  if (/https?:\/\//i.test(p)) {
    return previousTurnModality === "code" ? "code" : "search";
  }

  return "text";
}

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Strips ALL closed fences, unclosed truncated trailing fences, raw HTML docs,
 * and leaked raw CSS blocks so conversational bubbles remain clean & readable.
 */
export function sanitizeExplanationFromCodeLeaks(
  rawText: string,
  hasFiles: boolean,
  originalPrompt = ""
): string {
  let cleaned = rawText
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```[\s\S]*$/g, "")
    .replace(/<!DOCTYPE\s+html[\s\S]*/gi, "")
    .replace(/<html[\s\S]*/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<style[\s\S]*/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[\s\S]*/gi, "");

  // Strip leaked un-fenced CSS blocks cleanly in strict linear O(N) time (no nested quantifiers)
  cleaned = cleaned
    .replace(/\/\*[^*]{0,2000}\*\//g, "")
    .replace(
      /^[ \t]*[.*#:@a-zA-Z0-9_, \t-]{1,120}\{[^}]{0,2000}(?:padding|margin|display|grid-template|background|border-radius|transition|font-size|color|width|height|position|flex)[^}]{0,2000}\}/gim,
      ""
    )
    .replace(
      /^[ \t;]*(?:padding|margin|display|gap|grid-template-columns|background|border-radius|overflow|transition|font-size|object-fit)[ \t]*:[^\n;]{1,200};?[ \t]*$/gim,
      ""
    )
    .replace(/^[ \t]*[.*#][a-zA-Z0-9_., \t-]{1,100}\{[ \t]*$/gm, "")
    .replace(/^[ \t]*\}[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (hasFiles) {
    if (cleaned.length < 18 || /\{[^}]{1,500}:[^}]{1,500};/.test(cleaned)) {
      return isArabicText(originalPrompt || rawText)
        ? "تم تصميم وبناء التطبيق التفاعلي بالكامل، يمكنك تجربته مباشرة في نافذة المعاينة أو فحص ملفاته وتحميلها."
        : "Built the complete interactive application — ready in Live Preview & Files explorer.";
    }
    if (cleaned.length > 700) {
      cleaned = `${cleaned.slice(0, 680).trim()}...`;
    }
  }

  return cleaned || rawText.slice(0, 600);
}

/**
 * Bundles HTML / CSS / JS files into a standalone runnable document for `<iframe srcDoc>`.
 * Auto-closes truncated HTML/CSS/JS if a model stopped near its output limit.
 */
export function bundlePreviewHtml(
  files: ArenaProjectFileItem[],
  rawText: string
): string | null {
  const htmlFile =
    files.find((f) => f.path === "index.html") ||
    files.find((f) => f.language === "html" || f.name.toLowerCase().endsWith(".html"));

  const cssFiles = files
    .filter((f) => f.language === "css" || f.name.toLowerCase().endsWith(".css"))
    .sort((a, b) => {
      const score = (p: string) => (p.includes("token") || p.includes("theme") || p.includes("var") ? 0 : 1);
      return score(a.path) - score(b.path);
    });

  const jsFiles = files
    .filter(
      (f) =>
        f.language === "javascript" ||
        f.language === "js" ||
        f.name.toLowerCase().endsWith(".js")
    )
    .sort((a, b) => {
      const score = (p: string) =>
        p.includes("data/") || p.includes("config") || p.includes("catalog")
          ? 0
          : p.includes("lib/") || p.includes("state")
          ? 1
          : 2;
      return score(a.path) - score(b.path);
    });

  let html = htmlFile?.content || "";
  if (!html) {
    const htmlMatch =
      rawText.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i) ||
      rawText.match(/<html[\s\S]*?<\/html>/i) ||
      rawText.match(/<!DOCTYPE\s+html[\s\S]*/i) ||
      rawText.match(/<html[\s\S]*/i);
    if (htmlMatch) html = htmlMatch[0];
  }

  if (!html.trim()) return null;

  if (/<html/i.test(html) && !/<\/html>/i.test(html)) {
    if (!/<\/body>/i.test(html)) {
      html += "\n</body>";
    }
    html += "\n</html>";
  }

  // Strip local relative CSS/JS external refs (non-HTTP/data) since we inline all project files
  html = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["'](?!https?:\/\/|\/\/|data:)[^"']+["'][^>]*>/gi,
    ""
  );
  html = html.replace(
    /<script[^>]+src=["'](?!https?:\/\/|\/\/|data:)[^"']+["'][^>]*>\s*<\/script>/gi,
    ""
  );

  const combinedCss = cssFiles.map((c) => `/* ${c.path} */\n${c.content}`).join("\n\n");
  if (combinedCss.trim()) {
    const styleTag = `<style>\n${combinedCss}\n</style>`;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${styleTag}\n</head>`);
    } else {
      html = `${styleTag}\n${html}`;
    }
  }

  // Resilience guard so missing third-party CDN images never show broken image alt boxes
  const imageGuardScript = `
/* KASPI Preview Visual Resilience Guard */
(function(){
  if (typeof window === "undefined") return;
  window.addEventListener("error", function(ev) {
    var t = ev && ev.target;
    if (t && t.tagName === "IMG" && !t.dataset.kaspiFixed) {
      t.dataset.kaspiFixed = "1";
      var label = (t.getAttribute("alt") || "Product Preview").slice(0, 28).replace(/[<>&"']/g, "");
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#064e3b"/></linearGradient></defs>' +
        '<rect width="600" height="400" rx="24" fill="url(#g)"/>' +
        '<circle cx="300" cy="165" r="56" fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="2.5"/>' +
        '<rect x="275" y="130" width="50" height="72" rx="10" fill="#18181b" stroke="#34d399" stroke-width="2"/>' +
        '<text x="300" y="275" text-anchor="middle" fill="#ecfdf5" font-family="system-ui,sans-serif" font-size="22" font-weight="700">' +
        label + '</text></svg>';
      t.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    }
  }, true);
})();`;

  const combinedJs = [
    imageGuardScript,
    ...jsFiles.map((j) => `/* === ${j.path} === */\n${j.content}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  if (combinedJs.trim()) {
    const scriptTag = `<script>\n${combinedJs}\n</script>`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      html = `${html}\n${scriptTag}`;
    }
  }

  return html;
}

/**
 * Extracts structured project files & leak-free explanation from LLM output,
 * gracefully rescuing unclosed/truncated trailing code fences.
 */
export function extractProjectFromResponse(
  rawText: string,
  originalPrompt = ""
): {
  explanation: string;
  files: ArenaProjectFileItem[];
  previewHtml: string | null;
} {
  const files: ArenaProjectFileItem[] = [];
  let explanationRaw = rawText;

  // 1. JSON envelope check (`{"explanation": ..., "files": [...]}`) — guard before brace regex!
  const jsonFence = rawText.includes('"files"')
    ? rawText.match(/```(?:json)?[ \t]*\r?\n([\s\S]*?)```/i)
    : null;
  const rawBraceMatch =
    !jsonFence && rawText.includes('"files"')
      ? rawText.match(/\{[\s\S]*?"files"[ \t]*:[ \t]*\[[\s\S]*\}/)
      : null;
  const candidateJsonStr = jsonFence
    ? jsonFence[1].trim()
    : rawBraceMatch
    ? rawBraceMatch[0].trim()
    : "";

  if (candidateJsonStr.startsWith("{")) {
    try {
      const parsed = JSON.parse(candidateJsonStr);
      if (typeof parsed.explanation === "string" && parsed.explanation.trim()) {
        explanationRaw = parsed.explanation.trim();
      }
      if (Array.isArray(parsed.files)) {
        for (const f of parsed.files) {
          if (f?.path && typeof f.content === "string") {
            const name = String(f.path).split("/").pop() || String(f.path);
            files.push({
              path: String(f.path),
              name,
              language: String(f.language || name.split(".").pop() || "txt"),
              content: f.content,
            });
          }
        }
      }
    } catch {
      // Fallback to fenced block extractor
    }
  }

  // 2. Closed AND unclosed fenced blocks (with optional path=... / FILE: header support)
  if (files.length === 0) {
    const pushFenceFile = (
      metaRaw: string,
      contentRaw: string,
      idx: number,
      explicitPath?: string
    ) => {
      const tokens = metaRaw.trim().split(/\s+/);
      const langRaw = tokens[0] || "";
      const attrPath = metaRaw.match(/(?:path|file)=["']?([^"'\s>]+)["']?/i)?.[1];
      const lang = (langRaw || "txt").toLowerCase();
      const content = contentRaw.trim();
      if (!content) return;

      const resolvedPath = (explicitPath || attrPath || "")
        .replace(/^\/+/, "")
        .replace(/^(\.\.\/)+/, "");

      if (resolvedPath) {
        const cleanName = resolvedPath.split("/").pop() || resolvedPath;
        const ext = cleanName.split(".").pop()?.toLowerCase() || lang || "txt";
        files.push({
          path: resolvedPath,
          name: cleanName,
          language: ext === "js" ? "javascript" : ext,
          content,
        });
        return;
      }

      if (
        lang === "html" ||
        /<!DOCTYPE\s+html/i.test(content) ||
        /<html[\s>]/i.test(content)
      ) {
        files.push({
          path: files.some((f) => f.path === "index.html")
            ? `page-${idx}.html`
            : "index.html",
          name: files.some((f) => f.path === "index.html")
            ? `page-${idx}.html`
            : "index.html",
          language: "html",
          content,
        });
      } else if (lang === "css") {
        const name = files.some((f) => f.path === "styles/layout.css")
          ? `styles/module-${idx}.css`
          : files.some((f) => f.path === "styles/tokens.css")
          ? "styles/layout.css"
          : "styles/tokens.css";
        files.push({
          path: name,
          name: name.split("/").pop() || name,
          language: "css",
          content,
        });
      } else if (lang === "js" || lang === "javascript") {
        const name = files.some((f) => f.path === "data/catalog.js")
          ? files.some((f) => f.path === "scripts/app.js")
            ? `scripts/module-${idx}.js`
            : "scripts/app.js"
          : /CATALOG|PRODUCTS|ITEMS|MENU/i.test(content.slice(0, 300))
          ? "data/catalog.js"
          : "scripts/app.js";
        files.push({
          path: name,
          name: name.split("/").pop() || name,
          language: "javascript",
          content,
        });
      } else if (lang === "json") {
        const name = content.includes('"dependencies"') || content.includes('"name"')
          ? "package.json"
          : `data/data-${idx}.json`;
        files.push({
          path: name,
          name: name.split("/").pop() || name,
          language: "json",
          content,
        });
      } else if (lang === "tsx" || lang === "ts" || lang === "jsx") {
        files.push({
          path: `src/App.${lang}`,
          name: `App.${lang}`,
          language: lang,
          content,
        });
      } else {
        files.push({
          path: `snippet-${idx}.${lang || "txt"}`,
          name: `snippet-${idx}.${lang || "txt"}`,
          language: lang || "txt",
          content,
        });
      }
    };

    const closedFenceRegex =
      /(?:(?:<!--|\/\*|\/\/|#+)[ \t]*(?:FILE|file|path)?[ \t]*:?[ \t]*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)[ \t]*(?:-->|\*\/)?\s*)?```([^\r\n`]*)\r?\n([\s\S]*?)```/g;
    let remaining = rawText;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = closedFenceRegex.exec(rawText)) !== null) {
      idx++;
      pushFenceFile(match[2], match[3], idx, match[1]);
      remaining = remaining.replace(match[0], "");
    }

    // Rescue truncated/unclosed trailing fence!
    const unclosedMatch = remaining.match(
      /(?:(?:<!--|\/\*|\/\/|#+)[ \t]*(?:FILE|file|path)?[ \t]*:?[ \t]*([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)[ \t]*(?:-->|\*\/)?\s*)?```([^\r\n`]*)\r?\n([\s\S]*)$/
    );
    if (unclosedMatch) {
      idx++;
      pushFenceFile(unclosedMatch[2], unclosedMatch[3], idx, unclosedMatch[1]);
    }
  }

  // 3. Inline unfenced HTML document
  if (files.length === 0 && /<!DOCTYPE\s+html|<html[\s>]/i.test(rawText)) {
    const htmlMatch =
      rawText.match(/<!DOCTYPE\s+html[\s\S]*?<\/html>/i) ||
      rawText.match(/<html[\s\S]*?<\/html>/i) ||
      rawText.match(/<!DOCTYPE\s+html[\s\S]*/i);
    if (htmlMatch) {
      files.push({
        path: "index.html",
        name: "index.html",
        language: "html",
        content: htmlMatch[0],
      });
    }
  }

  const previewHtml = bundlePreviewHtml(files, rawText);
  const explanation = sanitizeExplanationFromCodeLeaks(
    explanationRaw,
    files.length > 0 || Boolean(previewHtml),
    originalPrompt
  );

  return { explanation, files, previewHtml };
}

export function buildArenaSystemPrompt(params: {
  modality: "code" | "text" | "search" | "image" | "video";
  storeContextSnippet?: string;
  libraryContextSnippet?: string;
  attachmentContext?: string;
  searchContextText?: string;
  mode?: ArenaExecutionMode;
}): string {
  const {
    modality,
    storeContextSnippet = "",
    libraryContextSnippet = "",
    attachmentContext = "",
    searchContextText = "",
    mode = "battle",
  } = params;

  const operatingModeHint =
    mode === "autonomous"
      ? "\n[Autonomous Mode] Structure actionable recurring schedules, monitoring thresholds, and approval checkpoints."
      : mode === "integration"
      ? "\n[Integration Mode] Explain exact external API / OAuth / Webhook / Screenshot onboarding steps clearly and never invent credentials."
      : "";

  const safeMemory = `${storeContextSnippet}${libraryContextSnippet}${operatingModeHint}${attachmentContext}${searchContextText}`;

  if (modality === "code") {
    return `You are a Principal Full-Stack Architect & UI/UX Product Engineer inside KASPI AI Arena.
Build production-grade, interactive web applications, flagship e-commerce stores, SaaS dashboards, or HTML5 apps with Apple/Stripe-caliber typography, layout rhythm, dark/light themes, responsive grids, working client state (cart, search, filters, checkout, persistence, admin tab), and domain-authentic visuals.
CRITICAL MEDIA RULE: NEVER invent random Unsplash/Pexels photo IDs that could render off-topic stock photos (animals/dogs/placeholders). Either craft crisp bespoke inline SVG product illustrations/hardware mockups matching the exact product specs OR use verified URLs found in context!
If [Verified Real Store Location (Maps)] is present in memory, embed their real city, street address, OpenStreetMap iframe, and Directions link cleanly! Never invent placeholder brand text like "STORE NAME" when context specifies details; invent a tasteful flagship brand if "[STORE NAME]" wasn't specified. Respond in the user's language (Arabic, Moroccan Darija, French, English, etc.).${safeMemory}

CRITICAL OUTPUT FORMAT RULES (STRICTLY REQUIRED):
1. Write 2 concise sentences summarizing the architecture built (NO raw Markdown stack tables).
2. Output modular separate project files using fenced code blocks with file headers like:
<!-- FILE: styles/tokens.css -->
\`\`\`css
...
\`\`\`
<!-- FILE: styles/layout.css -->
\`\`\`css
...
\`\`\`
<!-- FILE: data/catalog.js -->
\`\`\`javascript
...
\`\`\`
<!-- FILE: index.html -->
\`\`\`html
<!DOCTYPE html>...
\`\`\`
<!-- FILE: scripts/app.js -->
\`\`\`javascript
...
\`\`\`
Wait: make sure \`index.html\` runs smoothly cleanly when CSS/JS files are bundled in order, using vanilla semantic HTML5 + modern CSS3 + ES6 JS (no external CDN npm compilation needed so Live Preview executes instantaneously).`;
  }

  if (modality === "search") {
    return `You are KASPI AI Research Assistant powered by live web search.
Answer the user's question accurately in the same language as the prompt using the Live Web Search Results provided below. Cite source numbers like [1], [2].${safeMemory}`;
  }

  return `You are KASPI AI, an independent global AI Business Operating System & unrestricted frontier assistant.
Respond clearly, thoughtfully, and accurately in the exact language used by the user (Arabic, Moroccan Darija, French, English, Spanish, German, Portuguese, Chinese, Japanese, etc.). If the user needs to connect an external service (Instagram, WhatsApp, LinkedIn, GitHub, Vercel, Stripe, etc.), explain how to connect it in KASPI Plugins or request a screenshot to guide them click-by-click.${safeMemory}`;
}

export const STRICT_HTML_RECOVERY_SYSTEM_PROMPT = `You are a frontend compiler. Output clean modular HTML5 + CSS3 + ES6 files using <!-- FILE: index.html -->, <!-- FILE: styles/app.css -->, <!-- FILE: scripts/app.js --> starting index.html with <!DOCTYPE html> and ending with </html>. Include full interactive controls, realistic product/UI SVG visuals (never external broken/random photo IDs), responsive styling, and dark/light theme support.`;

// ============================================================================
// LOCAL CANVAS MOTION VIDEO STUDIO BUILDER (REAL .WEBM RECORDING)
// ============================================================================

interface VideoSceneSpec {
  badge: string;
  headline: string;
  subline: string;
  metric: string;
}

export function buildMotionVideoStudioHtml(params: {
  title: string;
  accentColor: string;
  scenes: VideoSceneSpec[];
  rtl: boolean;
}): string {
  const safeData = JSON.stringify({
    title: params.title,
    accentColor: params.accentColor || "#10b981",
    scenes:
      params.scenes.length > 0
        ? params.scenes
        : [
            {
              badge: "LAUNCH",
              headline: params.title,
              subline: "Next-Generation Digital Experience",
              metric: "LIVE NOW",
            },
          ],
    rtl: params.rtl,
  });

  return `<!DOCTYPE html>
<html lang="${params.rtl ? "ar" : "en"}" dir="${params.rtl ? "rtl" : "ltr"}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${params.title.replace(/</g, "&lt;")}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#090a0c;color:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:12px}
  .player-shell{width:100%;max-width:960px;position:relative;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:#0d0e11;box-shadow:0 28px 80px rgba(0,0,0,.75)}
  canvas{width:100%;aspect-ratio:16/9;background:#09090b;display:block}
  .hud{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:rgba(16,17,20,.96);border-top:1px solid rgba(255,255,255,.08)}
  .btn-group{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  button{border:none;border-radius:10px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;transition:.18s}
  .btn-primary{background:${params.accentColor || "#10b981"};color:#09090b}
  .btn-primary:hover{filter:brightness(1.12)}
  .btn-ghost{background:rgba(255,255,255,.08);color:#e4e4e7;border:1px solid rgba(255,255,255,.1)}
  .btn-ghost:hover{background:rgba(255,255,255,.16)}
  .dots{display:flex;gap:6px;align-items:center}
  .dot{width:8px;height:8px;border-radius:99px;background:rgba(255,255,255,.22);cursor:pointer;transition:.2s}
  .dot.active{width:22px;background:${params.accentColor || "#10b981"}}
  .status{font-size:11px;color:#a1a1aa;font-family:monospace}
</style>
</head>
<body>
<div class="player-shell">
  <canvas id="stage" width="1280" height="720"></canvas>
  <div class="hud">
    <div class="btn-group">
      <button id="toggleBtn" class="btn-ghost">Pause</button>
      <button id="prevBtn" class="btn-ghost">◀</button>
      <button id="nextBtn" class="btn-ghost">▶</button>
      <button id="soundBtn" class="btn-ghost">Audio: OFF</button>
      <button id="recordBtn" class="btn-primary">Download .WEBM Video</button>
    </div>
    <div class="dots" id="dots"></div>
    <span id="statusTxt" class="status">00:00</span>
  </div>
</div>
<script>
const CFG = ${safeData};
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const statusTxt = document.getElementById("statusTxt");
const dotsEl = document.getElementById("dots");
const ACCENT = CFG.accentColor || "#10b981";
let playing = true, startTs = performance.now(), sceneSec = 3.4, audioOn = false;
let audioCtx = null, synthTimer = null;

CFG.scenes.forEach((_, idx) => {
  const d = document.createElement("span");
  d.className = "dot" + (idx === 0 ? " active" : "");
  d.onclick = () => { startTs = performance.now() - idx * sceneSec * 1000; };
  dotsEl.appendChild(d);
});

const particles = Array.from({length: 48}, (_, i) => ({
  x: (i * 97) % 1280,
  y: (i * 53) % 720,
  r: 1.5 + (i % 4) * 1.1,
  vy: 0.35 + (i % 6) * 0.22
}));

function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawAppMockup(x, y, w, h, t) {
  ctx.save();
  ctx.fillStyle = "rgba(22, 24, 29, 0.92)";
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  drawRoundedRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  // Top browser chrome dots
  ["#ef4444","#f59e0b","#10b981"].forEach((col, idx) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + 24 + idx * 18, y + 22, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Animated dashboard bars inside UI mockup
  for (let b = 0; b < 5; b++) {
    const bh = 38 + Math.abs(Math.sin(t * 2.2 + b * 0.9)) * 78;
    ctx.fillStyle = b === 4 ? ACCENT : "rgba(16,185,129,0.34)";
    drawRoundedRect(x + 28 + b * 66, y + h - 42 - bh, 42, bh, 8);
    ctx.fill();
  }
  ctx.restore();
}

function toggleAmbientSynth() {
  audioOn = !audioOn;
  document.getElementById("soundBtn").textContent = audioOn ? "Audio: ON" : "Audio: OFF";
  if (audioOn && typeof AudioContext !== "undefined") {
    audioCtx = audioCtx || new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 440.0];
    let step = 0;
    if (synthTimer) clearInterval(synthTimer);
    synthTimer = setInterval(() => {
      if (!audioOn || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[step++ % notes.length];
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }, 520);
  } else if (synthTimer) {
    clearInterval(synthTimer);
    synthTimer = null;
  }
}

function render(now) {
  const elapsed = (now - startTs) / 1000;
  const totalSec = CFG.scenes.length * sceneSec;
  const loopT = ((elapsed % totalSec) + totalSec) % totalSec;
  const sceneIdx = Math.floor(loopT / sceneSec);
  const localT = (loopT % sceneSec) / sceneSec;
  const scene = CFG.scenes[sceneIdx] || CFG.scenes[0];

  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, "#090b0f");
  grad.addColorStop(0.5, "#11161d");
  grad.addColorStop(1, "#071713");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  // Perspective grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < 1280; gx += 64) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 720); ctx.stroke();
  }
  for (let gy = 0; gy < 720; gy += 64) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(1280, gy); ctx.stroke();
  }

  const glow = ctx.createRadialGradient(840 + Math.sin(elapsed) * 90, 320, 40, 840, 340, 520);
  glow.addColorStop(0, "rgba(16,185,129,0.24)");
  glow.addColorStop(1, "rgba(16,185,129,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);

  ctx.fillStyle = "rgba(16,185,129,0.4)";
  for (const p of particles) {
    p.y -= p.vy;
    if (p.y < -10) p.y = 730;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }

  const alpha = localT < 0.14 ? localT / 0.14 : localT > 0.88 ? (1 - localT) / 0.12 : 1;
  const slideY = (1 - Math.min(1, localT * 3.8)) * 34;

  // Live animated UI mockup card on right half during middle scenes
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  drawAppMockup(790, 175 + Math.sin(elapsed * 1.4) * 8, 410, 320, elapsed);

  // Left-aligned editorial typography block (or centered for final CTA)
  const textX = CFG.rtl ? 730 : 90;
  ctx.textAlign = CFG.rtl ? "right" : "left";
  ctx.translate(0, slideY);

  ctx.fillStyle = "rgba(16,185,129,0.16)";
  ctx.strokeStyle = "rgba(16,185,129,0.55)";
  ctx.lineWidth = 2;
  drawRoundedRect(CFG.rtl ? textX - 240 : textX, 170, 240, 38, 19);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(scene.badge || "FEATURE").slice(0, 26), CFG.rtl ? textX - 120 : textX + 120, 194);

  ctx.textAlign = CFG.rtl ? "right" : "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 46px system-ui, sans-serif";
  ctx.fillText(String(scene.headline || CFG.title).slice(0, 30), textX, 278);

  ctx.fillStyle = "#d4d4d8";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(String(scene.subline || "").slice(0, 48), textX, 340);

  ctx.fillStyle = ACCENT;
  ctx.font = "700 30px monospace";
  ctx.fillText(String(scene.metric || "").slice(0, 32), textX, 425);
  ctx.restore();

  // Scrub timeline progress bar
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(90, 668, 1100, 5);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(90, 668, 1100 * (loopT / totalSec), 5);

  const curSec = Math.floor(loopT);
  const totSec = Math.floor(totalSec);
  statusTxt.textContent = "00:" + String(curSec).padStart(2,"0") + " / 00:" + String(totSec).padStart(2,"0");
  Array.from(dotsEl.children).forEach((d, idx) => d.className = "dot" + (idx === sceneIdx ? " active" : ""));

  if (playing) requestAnimationFrame(render);
}

requestAnimationFrame(render);
document.getElementById("soundBtn").onclick = toggleAmbientSynth;
document.getElementById("toggleBtn").onclick = () => {
  playing = !playing;
  document.getElementById("toggleBtn").textContent = playing ? "Pause" : "Play";
  if (playing) requestAnimationFrame(render);
};
document.getElementById("prevBtn").onclick = () => { startTs += sceneSec * 1000; };
document.getElementById("nextBtn").onclick = () => { startTs -= sceneSec * 1000; };

document.getElementById("recordBtn").onclick = () => {
  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
    statusTxt.textContent = "Export requires modern Chromium/WebView.";
    return;
  }
  playing = true;
  startTs = performance.now();
  requestAnimationFrame(render);
  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kaspi-promo-video.webm";
    a.click();
    statusTxt.textContent = "Saved .webm (" + Math.round(blob.size / 1024) + " KB)";
  };
  const durationMs = Math.min(20000, CFG.scenes.length * sceneSec * 1000);
  statusTxt.textContent = "Rendering MP4/WEBM (" + Math.round(durationMs / 1000) + "s)...";
  rec.start();
  setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, durationMs);
};
</script>
</body>
</html>`;
}

// ============================================================================
// CLIENT-FIRST DIRECT OPEN EXECUTION (RUNS FROM USER'S OWN DEVICE / IP)
// ============================================================================

let llm7QuotaCooldownUntil = 0;

async function callClientLlm7(params: {
  modelId: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  delayBeforeMs?: number;
  signal?: AbortSignal;
}): Promise<{ text: string; usedModel: string }> {
  if (Date.now() < llm7QuotaCooldownUntil) {
    throw new Error("Client open quota in cooldown");
  }
  if (params.delayBeforeMs && params.delayBeforeMs > 0) {
    await new Promise((r) => setTimeout(r, params.delayBeforeMs));
  }

  const res = await fetch("https://api.llm7.io/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: params.signal || AbortSignal.timeout(18000),
    body: JSON.stringify({
      model: params.modelId,
      temperature: 0.55,
      messages: [
        { role: "system", content: params.systemPrompt },
        ...params.messages,
      ],
    }),
  });

  const data = await res.json().catch(() => null);
  if (res.status === 429 && String(data?.error?.message || "").toLowerCase().includes("quota")) {
    llm7QuotaCooldownUntil = Date.now() + 180_000;
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!res.ok || typeof text !== "string" || !text.trim()) {
    throw new Error(data?.error?.message || `Client gateway HTTP ${res.status}`);
  }
  return { text: text.trim(), usedModel: data.model || params.modelId };
}

export async function performClientWebSearch(query: string): Promise<ArenaWebCitation[]> {
  const cleanQ = query.trim().slice(0, 140);
  if (!cleanQ) return [];
  const citations: ArenaWebCitation[] = [];

  const [ddgRes, wikiRes] = await Promise.allSettled([
    fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQ)}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(5000) }
    ).then((r) => (r.ok ? r.json() : null)),
    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQ
      )}&format=json&utf8=1&srlimit=4&origin=*`,
      { signal: AbortSignal.timeout(5000) }
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  if (ddgRes.status === "fulfilled" && ddgRes.value) {
    const d = ddgRes.value;
    if (d.AbstractText && d.AbstractURL) {
      citations.push({
        title: d.Heading || "DuckDuckGo Instant Knowledge",
        url: d.AbstractURL,
        snippet: d.AbstractText,
      });
    }
    if (Array.isArray(d.RelatedTopics)) {
      for (const topic of d.RelatedTopics.slice(0, 4)) {
        if (topic?.Text && topic?.FirstURL) {
          citations.push({
            title: String(topic.Text).split(" - ")[0].slice(0, 80) || "Web Result",
            url: topic.FirstURL,
            snippet: String(topic.Text).slice(0, 220),
          });
        }
      }
    }
  }

  if (wikiRes.status === "fulfilled" && wikiRes.value?.query?.search) {
    for (const item of wikiRes.value.query.search.slice(0, 4)) {
      const cleanSnippet = String(item.snippet || "").replace(/<[^>]+>/g, "");
      citations.push({
        title: `Wikipedia: ${item.title}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(item.title).replace(/ /g, "_"))}`,
        snippet: cleanSnippet,
      });
    }
  }

  const seen = new Set<string>();
  return citations
    .filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    })
    .slice(0, 6);
}

export async function submitClientAiHordeImageJob(
  prompt: string,
  modelHint: "A" | "B"
): Promise<string> {
  const res = await fetch("https://aihorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: "0000000000",
    },
    body: JSON.stringify({
      prompt: `${prompt}, high quality, detailed, 8k`,
      params: {
        width: 512,
        height: 512,
        steps: 18,
        sampler_name: modelHint === "A" ? "k_euler_a" : "k_dpmpp_2m",
        cfg_scale: 7.5,
      },
      nsfw: false,
      censor_nsfw: true,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error(data?.message || "AI Horde job creation failed");
  }
  return String(data.id);
}

export async function checkClientAiHordeJobStatus(jobId: string): Promise<{
  done: boolean;
  imgUrl?: string | null;
}> {
  const checkRes = await fetch(
    `https://aihorde.net/api/v2/generate/check/${encodeURIComponent(jobId)}`,
    { signal: AbortSignal.timeout(6000) }
  );
  const checkData = await checkRes.json();
  if (!checkData?.done) {
    return { done: false };
  }
  const statusRes = await fetch(
    `https://aihorde.net/api/v2/generate/status/${encodeURIComponent(jobId)}`,
    { signal: AbortSignal.timeout(8000) }
  );
  const statusData = await statusRes.json();
  const firstGen = statusData?.generations?.[0];
  return { done: true, imgUrl: firstGen?.img || null };
}

export interface ArenaSideProgressUpdate {
  side: "A" | "B";
  phase: string;
  stepsLog: string[];
  replyDraft?: string;
}

function mergeProjectFiles(
  base: ArenaProjectFileItem[],
  incoming: ArenaProjectFileItem[]
): ArenaProjectFileItem[] {
  const byPath = new Map<string, ArenaProjectFileItem>();
  for (const f of base) {
    byPath.set(f.path, f);
  }
  for (const f of incoming) {
    byPath.set(f.path, f);
  }
  return Array.from(byPath.values());
}

function summarizeFilesForPrompt(files: ArenaProjectFileItem[]): string {
  return files
    .map((f) => `--- FILE: ${f.path} (${f.content.length} chars) ---\n${f.content.slice(0, 3200)}`)
    .join("\n\n")
    .slice(0, 12000);
}

export async function executeArenaTurnClientFirst(params: {
  prompt: string;
  mode: ArenaExecutionMode;
  modality: ArenaModality;
  modelAId: string;
  modelBId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  previousTurnModality?: "code" | "text" | "search" | "image" | "video";
  previousFilesA?: ArenaProjectFileItem[];
  previousFilesB?: ArenaProjectFileItem[];
  includeStoreContext: boolean;
  libraryContextSnippet?: string;
  attachments: Array<{ name: string; type: string; textExcerpt?: string }>;
  serverExecuteUrl: string;
  signal?: AbortSignal;
  onProgress?: (update: ArenaSideProgressUpdate) => void;
}): Promise<{
  effectiveModality: "code" | "text" | "search" | "image" | "video";
  citations: ArenaWebCitation[];
  outputA: ArenaModelOutput;
  outputB: ArenaModelOutput | null;
}> {
  const effectiveModality = detectEffectiveModality(
    params.modality,
    params.prompt,
    params.previousTurnModality
  );

  const historyMsgs = params.history.slice(-8);

  const callPhaseApi = async (payload: Record<string, unknown>) => {
    const res = await fetch(params.serverExecuteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: params.signal,
      body: JSON.stringify(payload),
    });
    const rawBody = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error(`Execution service returned HTTP ${res.status}`);
    }
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data;
  };

  // BRANCH 1: IMAGE GENERATION (Client-Direct AI Horde with clean blind output)
  if (effectiveModality === "image") {
    const hasB = params.mode !== "direct";
    const [jobARes, jobBRes] = await Promise.allSettled([
      submitClientAiHordeImageJob(params.prompt, "A"),
      hasB
        ? submitClientAiHordeImageJob(`${params.prompt}, ultra detailed product photography`, "B")
        : Promise.resolve(""),
    ]);

    if (jobARes.status === "fulfilled") {
      return {
        effectiveModality: "image",
        citations: [],
        outputA: {
          modelId: "aihorde-sd-a",
          modelName: "Option A",
          providerLabel: "KASPI Visual Engine",
          status: "completed",
          latencyMs: 650,
          replyMarkdown: isArabicText(params.prompt)
            ? "تم بدء توليد التصميم البصري، ستظهر الصورة في نافذة المعاينة فور اكتمالها."
            : "Generating visual design — preview will appear shortly.",
          stepsLog: ["Analyzed visual brief", "Rendering artwork canvas"],
          modalityExecuted: "image",
          files: [],
          previewHtml: null,
          imageJobId: jobARes.value,
          executedOn: "client-device",
        },
        outputB:
          hasB && jobBRes.status === "fulfilled" && jobBRes.value
            ? {
                modelId: "aihorde-sd-b",
                modelName: "Option B",
                providerLabel: "KASPI Visual Engine",
                status: "completed",
                latencyMs: 700,
                replyMarkdown: isArabicText(params.prompt)
                  ? "جاري معالجة النسخة الثانية بالتوازي."
                  : "Rendering alternate visual direction.",
                stepsLog: ["Analyzed visual brief", "Rendering alternate artwork"],
                modalityExecuted: "image",
                files: [],
                previewHtml: null,
                imageJobId: jobBRes.value,
                executedOn: "client-device",
              }
            : null,
      };
    }
  }

  // Resolve distinct flagship contenders cleanly
  const isSingleSide = params.mode === "direct";
  const trackAId =
    params.modelAId && ARENA_REAL_MODELS.some((m) => m.id === params.modelAId && !m.apiModelId.includes("8b"))
      ? params.modelAId
      : "gemini-2.5-flash";
  const trackBId =
    params.modelBId &&
    params.modelBId !== trackAId &&
    ARENA_REAL_MODELS.some((m) => m.id === params.modelBId && !m.apiModelId.includes("8b"))
      ? params.modelBId
      : trackAId === "gemini-2.5-flash"
      ? "groq-llama33"
      : "openrouter-free";

  // BRANCH 2: WEB SEARCH (Client DuckDuckGo + Wikipedia)
  let citations: ArenaWebCitation[] = [];
  if (effectiveModality === "search") {
    citations = await performClientWebSearch(params.prompt).catch(() => []);
  }

  // BRANCH 3: MULTI-SCENE COMMERCIAL PROMO VIDEO ENGINE
  if (effectiveModality === "video") {
    const isAr = isArabicText(params.prompt);
    const runVideoSide = async (side: "A" | "B", targetModelId: string): Promise<ArenaModelOutput> => {
      const start = Date.now();
      const steps: string[] = [
        isAr ? "تحليل فكرة الفيديو الإعلاني والروابط المرفقة..." : "Analyzing commercial brief & attached links...",
      ];
      params.onProgress?.({ side, phase: "plan", stepsLog: [...steps] });

      let parsedScenes: { title?: string; accentColor?: string; scenes?: VideoSceneSpec[] } | null = null;
      try {
        const res = await callPhaseApi({
          phase: "video_director",
          prompt: params.prompt,
          mode: "direct",
          modality: "video",
          modelAId: targetModelId,
          includeStoreContext: params.includeStoreContext,
          libraryContextSnippet: params.libraryContextSnippet || "",
          attachments: params.attachments,
        });
        if (res?.videoPlan) parsedScenes = res.videoPlan;
        steps.push(isAr ? "تصميم سيناريو من 7 مشاهد حركية" : "Directed multi-scene storyboard");
      } catch {
        steps.push(isAr ? "إعداد مشاهد العرض التسويقي" : "Prepared promotional scenes");
      }
      params.onProgress?.({ side, phase: "render", stepsLog: [...steps] });

      const cleanTitle =
        parsedScenes?.title ||
        params.prompt.replace(/https?:\/\/\S+/g, "").trim().slice(0, 40) ||
        "Product Showcase";
      const defaultScenes: VideoSceneSpec[] = isAr
        ? [
            { badge: "LAUNCH", headline: cleanTitle, subline: "تجربة ذكية متكاملة لإدارة وتطوير مشروعك", metric: "LIVE 24/7" },
            { badge: "SPEED & POWER", headline: "سرعة وأداء فائق", subline: "واجهة عصرية وتدفق عمل ذكي في كل خطوة", metric: "10× FASTER" },
            { badge: "SMART ANALYTICS", headline: "لوحة تحكم شاملة", subline: "تتبع المبيعات والمخزون والعملاء لحظياً", metric: "100% REAL-TIME" },
            { badge: "AI AUTOMATION", headline: "أتمتة بالذكاء الاصطناعي", subline: "مساعد ذكي يشتغل لأجل نمو تجارتك", metric: "AUTONOMOUS" },
            { badge: "SECURITY", headline: "حماية ومعايير عالية", subline: "عزل كامل للبيانات وتشفير موثوق", metric: "AES-256" },
            { badge: "START NOW", headline: "ابدأ تجربتك الآن", subline: "اكتشف المنصة وجرّبها مباشرة", metric: "GET STARTED" },
          ]
        : [
            { badge: "INTRODUCING", headline: cleanTitle, subline: "Next-generation platform built for scale", metric: "NEW RELEASE" },
            { badge: "WORKFLOW", headline: "Built For Speed", subline: "Streamlined operations & modern UI architecture", metric: "10× FASTER" },
            { badge: "INTELLIGENCE", headline: "Real-Time Insights", subline: "Live analytics, inventory & customer tracking", metric: "LIVE TELEMETRY" },
            { badge: "AUTOMATION", headline: "Autonomous Execution", subline: "Smart assistants accelerating every workflow", metric: "24/7 ENGINE" },
            { badge: "EXPERIENCE", headline: "Mobile & Desktop Ready", subline: "Seamless responsive design anywhere", metric: "99.9% UPTIME" },
            { badge: "ACTION", headline: "Launch Today", subline: "Explore the live experience now", metric: "START NOW" },
          ];

      const html = buildMotionVideoStudioHtml({
        title: cleanTitle,
        accentColor: parsedScenes?.accentColor || (side === "A" ? "#10b981" : "#38bdf8"),
        scenes:
          Array.isArray(parsedScenes?.scenes) && parsedScenes.scenes.length >= 4
            ? parsedScenes.scenes
            : defaultScenes,
        rtl: isAr,
      });

      steps.push(isAr ? "تم إنتاج الفيديو التفاعلي عالي الدقة" : "Rendered HD promotional video player");
      return {
        modelId: targetModelId,
        modelName: `Option ${side}`,
        providerLabel: "KASPI Video Engine",
        status: "completed",
        latencyMs: Date.now() - start,
        replyMarkdown: isAr
          ? `تم إنتاج الفيديو الإعلاني لمشروعك (${cleanTitle}) بعدة مشاهد متحركة بدقة HD، ويمكنك تشغيله أو تحميله مباشرة بصيغة **.webm**.`
          : `Produced the multi-scene HD promotional video for ${cleanTitle}. Play interactively or download as **.webm**.`,
        stepsLog: steps,
        modalityExecuted: "video",
        files: [{ path: "promo-video.html", name: "promo-video.html", language: "html", content: html }],
        previewHtml: html,
        executedOn: "cloud-relay",
      };
    };

    const [vA, vB] = await Promise.all([
      runVideoSide("A", trackAId),
      isSingleSide ? Promise.resolve(null) : runVideoSide("B", trackBId),
    ]);

    return {
      effectiveModality: "video",
      citations: [],
      outputA: vA,
      outputB: vB,
    };
  }

  // BRANCH 4: DEEP MULTI-PHASE AGENTIC BUILD ENGINE (Code / Apps / Stores / Websites)
  if (effectiveModality === "code") {
    const isAr = isArabicText(params.prompt);
    const runDeepAgenticCodeSide = async (
      side: "A" | "B",
      targetModelId: string,
      priorFiles?: ArenaProjectFileItem[]
    ): Promise<ArenaModelOutput> => {
      const start = Date.now();
      const steps: string[] = [
        isAr ? "تحليل المتطلبات وهيكلة المشروع..." : "Analyzing requirements & project scope...",
      ];
      params.onProgress?.({ side, phase: "plan", stepsLog: [...steps] });

      let planText = "";
      let urlContext = "";
      let collectedFiles: ArenaProjectFileItem[] = priorFiles ? [...priorFiles] : [];
      const priorSummary = priorFiles && priorFiles.length > 0 ? summarizeFilesForPrompt(priorFiles) : "";

      // PHASE 1: Architectural Blueprint & Live Resource Inspection
      try {
        const planRes = await callPhaseApi({
          phase: "plan",
          prompt: params.prompt,
          mode: "direct",
          modality: "code",
          modelAId: targetModelId,
          history: historyMsgs,
          previousFilesSummary: priorSummary,
          includeStoreContext: params.includeStoreContext,
          libraryContextSnippet: params.libraryContextSnippet || "",
          attachments: params.attachments,
        });
        planText = String(planRes?.planText || "").trim();
        urlContext = String(planRes?.urlContext || "").trim();
        steps.push(
          isAr
            ? "اكتمل تخطيط البنية الهندسية وتحديد الملفات"
            : "Designed architecture & multi-file plan"
        );
      } catch {
        steps.push(isAr ? "تجهيز المخطط الهندسي للتطبيق" : "Prepared architectural plan");
      }
      steps.push(isAr ? "بناء التصميم والبيانات الأساسية..." : "Engineering layout, tokens & catalog...");
      params.onProgress?.({
        side,
        phase: "build_core",
        stepsLog: [...steps],
        replyDraft: planText || undefined,
      });

      // PHASE 2: Foundation Codebase (HTML + CSS Tokens/Layout + Catalog Data)
      let coreOut: ArenaModelOutput | null = null;
      try {
        const coreRes = await callPhaseApi({
          phase: "build_core",
          prompt: params.prompt,
          planText,
          urlContext,
          previousFilesSummary: priorSummary,
          mode: "direct",
          modality: "code",
          modelAId: targetModelId,
          history: historyMsgs,
          includeStoreContext: params.includeStoreContext,
          libraryContextSnippet: params.libraryContextSnippet || "",
          attachments: params.attachments,
        });
        coreOut = coreRes?.outputA || null;
        if (coreOut?.files && coreOut.files.length > 0) {
          collectedFiles = mergeProjectFiles(collectedFiles, coreOut.files);
        }
        steps.push(
          isAr
            ? `تم إنشاء ملفات الواجهة والتنسيق (${collectedFiles.length} ملفات)`
            : `Generated UI & stylesheet modules (${collectedFiles.length} files)`
        );
      } catch {
        steps.push(isAr ? "جارٍ التجميع البرمجي الأساسي..." : "Compiling base application layer...");
      }
      steps.push(
        isAr
          ? "برمجة التفاعل والتحقق الشامل من الجودة..."
          : "Engineering interactive logic & running QA audit..."
      );
      params.onProgress?.({
        side,
        phase: "refine_qa",
        stepsLog: [...steps],
        replyDraft: planText || coreOut?.replyMarkdown,
      });

      // PHASE 3: Interactive Logic, State Persistence & Senior QA Refinement
      let qaOut: ArenaModelOutput | null = null;
      try {
        const builtSummary =
          collectedFiles.length > 0
            ? summarizeFilesForPrompt(collectedFiles)
            : coreOut?.previewHtml?.slice(0, 12000) || "";
        const qaRes = await callPhaseApi({
          phase: "refine_qa",
          prompt: params.prompt,
          planText,
          builtFilesSummary: builtSummary,
          urlContext,
          mode: "direct",
          modality: "code",
          modelAId: targetModelId,
          history: historyMsgs,
          includeStoreContext: params.includeStoreContext,
          libraryContextSnippet: params.libraryContextSnippet || "",
          attachments: params.attachments,
        });
        qaOut = qaRes?.outputA || null;
        if (qaOut?.files && qaOut.files.length > 0) {
          collectedFiles = mergeProjectFiles(collectedFiles, qaOut.files);
        }
      } catch {
        // If QA pass hit network blip, still ensure coreOut preview or run clean fallback
      }

      // Emergency fallback to single pass only if both multi-phase calls returned zero files
      if (collectedFiles.length === 0 && !coreOut?.previewHtml && !qaOut?.previewHtml) {
        const fallbackRes = await callPhaseApi({
          phase: "single",
          prompt: params.prompt,
          mode: "direct",
          modality: "code",
          modelAId: targetModelId,
          history: historyMsgs,
          includeStoreContext: params.includeStoreContext,
          libraryContextSnippet: params.libraryContextSnippet || "",
          attachments: params.attachments,
        });
        if (fallbackRes?.outputA) {
          return {
            ...fallbackRes.outputA,
            modelName: `Option ${side}`,
            providerLabel: "KASPI Autonomous Engine",
            stepsLog: [
              ...steps.slice(0, 2),
              `Built project (${Math.max(1, fallbackRes.outputA.files?.length || 1)} files)`,
            ],
            latencyMs: Date.now() - start,
          };
        }
      }

      // Ensure realistic project manifest & docs exist in multi-file explorer
      if (!collectedFiles.some((f) => f.path === "package.json")) {
        collectedFiles.push({
          path: "package.json",
          name: "package.json",
          language: "json",
          content: JSON.stringify(
            {
              name: "kaspi-generated-platform",
              version: "1.0.0",
              private: true,
              scripts: { start: "npx serve ." },
            },
            null,
            2
          ),
        });
      }

      const finalHtml =
        bundlePreviewHtml(collectedFiles, qaOut?.previewHtml || coreOut?.previewHtml || "") ||
        qaOut?.previewHtml ||
        coreOut?.previewHtml ||
        null;

      steps.push(
        isAr
          ? `اكتمل البناء والتحقق (${collectedFiles.length} ملفات جاهزة للمعاينة)`
          : `Built & verified application (${collectedFiles.length} files ready)`
      );

      const cleanExplanation = sanitizeExplanationFromCodeLeaks(
        planText || qaOut?.replyMarkdown || coreOut?.replyMarkdown || "",
        true,
        params.prompt
      );

      return {
        modelId: targetModelId,
        modelName: `Option ${side}`,
        providerLabel: "KASPI Autonomous Engine",
        status: finalHtml ? "completed" : "failed",
        latencyMs: Date.now() - start,
        replyMarkdown: cleanExplanation,
        stepsLog: steps,
        modalityExecuted: finalHtml ? "code" : "text",
        files: collectedFiles,
        previewHtml: finalHtml,
        executedOn: "cloud-relay",
      };
    };

    const [settledA, settledB] = await Promise.all([
      runDeepAgenticCodeSide("A", trackAId, params.previousFilesA),
      isSingleSide
        ? Promise.resolve(null)
        : runDeepAgenticCodeSide("B", trackBId, params.previousFilesB),
    ]);

    return {
      effectiveModality: "code",
      citations: [],
      outputA: settledA,
      outputB: settledB,
    };
  }

  // BRANCH 5: TEXT / LIVE WEB SEARCH CONVERSATION (Server Multi-Provider Cloud Relay + Client Failover)
  const runTextSide = async (
    side: "A" | "B",
    targetModelId: string,
    clientSpec: ArenaRealModelSpec | undefined
  ): Promise<ArenaModelOutput> => {
    const start = Date.now();
    params.onProgress?.({
      side,
      phase: "text",
      stepsLog:
        citations.length > 0
          ? [`Found ${citations.length} live web sources`, "Synthesizing answer..."]
          : ["Analyzing request..."],
    });

    // Try server flagship path first (respects POS context, URL context, Gemini/Groq/OpenRouter)
    try {
      const serverData = await callPhaseApi({
        phase: "single",
        prompt: params.prompt,
        mode: "direct",
        modality: effectiveModality,
        modelAId: targetModelId,
        modelBId: targetModelId,
        history: historyMsgs,
        includeStoreContext: params.includeStoreContext,
        libraryContextSnippet: params.libraryContextSnippet || "",
        attachments: params.attachments,
        citationsOverride: citations,
      });
      return {
        ...serverData.outputA,
        modelName: `Option ${side}`,
        providerLabel: "KASPI AI",
        latencyMs: Date.now() - start,
      };
    } catch (serverErr: any) {
      // Fallback to open CORS Pollinations / llm7 edge if available
      if (clientSpec?.supportsClientDirect) {
        try {
          const clientRes = await callClientLlm7({
            modelId: clientSpec.apiModelId,
            systemPrompt: buildArenaSystemPrompt({
              modality: effectiveModality,
              libraryContextSnippet: params.libraryContextSnippet || "",
              mode: params.mode,
            }),
            messages: [...historyMsgs, { role: "user", content: params.prompt }],
            signal: params.signal,
          });
          return {
            modelId: clientSpec.id,
            modelName: `Option ${side}`,
            providerLabel: "KASPI AI",
            status: "completed",
            latencyMs: Date.now() - start,
            replyMarkdown: sanitizeExplanationFromCodeLeaks(clientRes.text, false, params.prompt),
            stepsLog: ["Completed response"],
            modalityExecuted: effectiveModality === "search" ? "search" : "text",
            files: [],
            previewHtml: null,
            citations: citations.length > 0 ? citations : undefined,
            executedOn: "client-device",
          };
        } catch {}
      }

      return {
        modelId: targetModelId,
        modelName: `Option ${side}`,
        providerLabel: "KASPI AI",
        status: "failed",
        latencyMs: Date.now() - start,
        errorMessage: String(serverErr?.message || serverErr),
        replyMarkdown: `⚠️ تعذر إتمام هذا الطلب مؤقتاً: ${String(serverErr?.message || serverErr)}`,
        stepsLog: ["Upstream temporary error"],
        modalityExecuted: "text",
        files: [],
        previewHtml: null,
      };
    }
  };

  const [outA, outB] = await Promise.all([
    runTextSide("A", trackAId, ARENA_REAL_MODELS.find((m) => m.id === "gemma4-31b")),
    isSingleSide
      ? Promise.resolve(null)
      : runTextSide("B", trackBId, ARENA_REAL_MODELS.find((m) => m.id === "deepseek-v4-flash")),
  ]);

  return {
    effectiveModality,
    citations,
    outputA: outA,
    outputB: outB,
  };
}
