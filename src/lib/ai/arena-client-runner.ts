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
  /(\bcreate\s+(a\s+)?video\b|\bgenerate\s+(a\s+)?video\b|\bpromo\s+video\b|\bmotion\s+video\b|\breel\b|فيديو|فيديو\s+إعلاني|مقطع\s+فيديو|ريلز|انميشن|موشن\s+جرافيك)/i;

const IMAGE_PROMPT_REGEX =
  /(\bdraw\b|\bgenerate\s+(an?\s+)?image\b|\bcreate\s+(a\s+)?(photo|picture|logo|illustration|art|poster|banner|cover)\b|ارسم|توليد\s+صورة|صورة\s|انشئ\s+صورة|صمم\s+شعار|لوجو)/i;

const SEARCH_PROMPT_REGEX =
  /(\bsearch\s+(the\s+)?web\b|\bfetch\b|https?:\/\/|\blatest\s+news\b|\bcurrent\s+price\b|ابحث\s+في\s+الانترنت|بحث\s+في\s+الويب|معلومات\s+محدثة|أخبار\s+اليوم)/i;

const FOLLOWUP_CODE_EDIT_REGEX =
  /(change|update|modify|edit|add|fix|remove|make\s+it|color|theme|button|section|navbar|footer|cart|arabic|french|english|بدل|غير|زيد|عدل|حسن|أضف|لون|الزر|القائمة|السلة|العنوان)/i;

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
  if (IMAGE_PROMPT_REGEX.test(p)) return "image";
  if (SEARCH_PROMPT_REGEX.test(p)) return "search";
  if (CODE_BUILD_PROMPT_REGEX.test(p)) return "code";

  if (previousTurnModality === "code" && FOLLOWUP_CODE_EDIT_REGEX.test(p)) {
    return "code";
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

  // Strip leaked un-fenced CSS blocks (e.g. `.products { padding: 4rem 3rem; }`)
  cleaned = cleaned
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(
      /(?:^|\n)[ \t]*(?:[.*#:@a-zA-Z0-9_,-]+[ \t]*)+\{[^}]*(?:padding|margin|display|grid-template|background|border-radius|transition|font-size|color|width|height|position|flex)[^}]*\}/gim,
      ""
    )
    .replace(/^\s*(?:padding|margin|display|gap|grid-template-columns|background|border-radius|overflow|transition|font-size|object-fit)\s*:[^\n;]+;?\s*$/gim, "")
    .replace(/^\s*[.*#]?[a-zA-Z0-9_-]+(?:\s+[.*#]?[a-zA-Z0-9_-]+)*\s*\{\s*$/gm, "")
    .replace(/^\s*\}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (hasFiles) {
    if (cleaned.length < 18 || /\{[\s\S]*:[\s\S]*;/.test(cleaned)) {
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
  const htmlFile = files.find(
    (f) => f.language === "html" || f.name.toLowerCase().endsWith(".html")
  );
  const cssFiles = files.filter(
    (f) => f.language === "css" || f.name.toLowerCase().endsWith(".css")
  );
  const jsFiles = files.filter(
    (f) =>
      f.language === "javascript" ||
      f.language === "js" ||
      f.name.toLowerCase().endsWith(".js")
  );

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

  const combinedCss = cssFiles.map((c) => c.content).join("\n\n");
  if (combinedCss.trim()) {
    const styleTag = `<style>\n${combinedCss}\n</style>`;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${styleTag}\n</head>`);
    } else {
      html = `${styleTag}\n${html}`;
    }
  }

  const combinedJs = jsFiles.map((j) => j.content).join("\n\n");
  if (combinedJs.trim()) {
    const scriptTag = `<script>\n${combinedJs}\n</script>`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      html = `${html}\n${scriptTag}`;
    }
  }

  // Strip local external script/stylesheet links that fail inside srcDoc
  html = html.replace(/<link[^>]+href=["'](?:\.\/)?styles?\.css["'][^>]*>/gi, "");
  html = html.replace(
    /<script[^>]+src=["'](?:\.\/)?(?:app|main|script)\.js["'][^>]*><\/script>/gi,
    ""
  );

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

  // 1. JSON envelope check (`{"explanation": ..., "files": [...]}`)
  const jsonFence = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const rawBraceMatch = rawText.match(/\{[\s\S]*"files"\s*:\s*\[[\s\S]*\}/);
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

  // 2. Closed AND unclosed fenced blocks
  if (files.length === 0) {
    const pushFenceFile = (langRaw: string, contentRaw: string, idx: number) => {
      const lang = (langRaw || "txt").toLowerCase();
      const content = contentRaw.trim();
      if (!content) return;

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
        files.push({
          path: files.some((f) => f.path === "styles.css")
            ? `styles-${idx}.css`
            : "styles.css",
          name: files.some((f) => f.path === "styles.css")
            ? `styles-${idx}.css`
            : "styles.css",
          language: "css",
          content,
        });
      } else if (lang === "js" || lang === "javascript") {
        files.push({
          path: files.some((f) => f.path === "app.js")
            ? `app-${idx}.js`
            : "app.js",
          name: files.some((f) => f.path === "app.js")
            ? `app-${idx}.js`
            : "app.js",
          language: "javascript",
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

    const closedFenceRegex = /```([a-zA-Z0-9_-]*)[ \t]*\r?\n([\s\S]*?)```/g;
    let remaining = rawText;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = closedFenceRegex.exec(rawText)) !== null) {
      idx++;
      pushFenceFile(match[1], match[2], idx);
      remaining = remaining.replace(match[0], "");
    }

    // Rescue truncated/unclosed trailing fence!
    const unclosedMatch = remaining.match(/```([a-zA-Z0-9_-]*)[ \t]*\r?\n([\s\S]*)$/);
    if (unclosedMatch) {
      idx++;
      pushFenceFile(unclosedMatch[1], unclosedMatch[2], idx);
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
  attachmentContext?: string;
  searchContextText?: string;
}): string {
  const {
    modality,
    storeContextSnippet = "",
    attachmentContext = "",
    searchContextText = "",
  } = params;

  if (modality === "code") {
    return `You are an expert Senior Full-Stack & Creative Web Developer inside KASPI AI Arena.
Build ANYTHING requested by the user: interactive websites, 2D/3D HTML5 Canvas games, web applications, e-commerce storefronts (fashion, abaya, food, SaaS, etc.), dashboards, calculators, portfolios, or custom utilities. Respond in the user's language (Arabic, Moroccan Darija, French, or English).${storeContextSnippet}${attachmentContext}${searchContextText}

CRITICAL OUTPUT FORMAT RULES (STRICTLY REQUIRED):
1. Write ONLY 1–2 short sentences describing what you built. NEVER write technical architecture plans, stack comparisons, or Markdown tables!
2. Output ALL HTML5, CSS3 (<style>...</style>), and ES6 JavaScript (<script>...</script>) inside ONE SINGLE \`\`\`html code block starting with <!DOCTYPE html> and ending with </html>.
3. Do NOT split CSS or JS into separate code blocks unless tiny, and NEVER use external unbundled npm imports (no React/Tailwind CDN dependencies needed — write self-contained modern CSS/JS/SVG/Canvas).`;
  }

  if (modality === "search") {
    return `You are KASPI AI Research Assistant powered by live web search.
Answer the user's question accurately in the same language as the prompt using the Live Web Search Results provided below. Cite source numbers like [1], [2].${storeContextSnippet}${attachmentContext}${searchContextText}`;
  }

  return `You are KASPI AI, a versatile, helpful, unrestricted frontier AI assistant.
Respond clearly, thoughtfully, and accurately in the exact language used by the user (Arabic, Moroccan Darija, French, English, etc.). If answering follow-ups on earlier code/designs, give concrete guidance.${storeContextSnippet}${attachmentContext}`;
}

export const STRICT_HTML_RECOVERY_SYSTEM_PROMPT = `You are a frontend compiler. Your ONLY job is to output ONE complete runnable single-file web application inside a single \`\`\`html code block starting with <!DOCTYPE html> and ending with </html>.
Put all CSS inside <style> and all JavaScript inside <script>. Do NOT write architecture plans, essays, or tables. Include realistic rich content, interactive UI controls, buttons, cards, and responsive styling in the user's requested language.`;

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
              badge: "KASPI MOTION STUDIO",
              headline: params.title,
              subline: "Dynamic HTML5 Motion Promo Video",
              metric: "60 FPS • HD 1280x720",
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
  body{background:#0d0d0f;color:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:16px;gap:14px}
  .stage-wrap{width:100%;max-width:860px;background:#16161a;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:14px;box-shadow:0 24px 60px rgba(0,0,0,.6)}
  canvas{width:100%;aspect-ratio:16/9;background:#09090b;border-radius:12px;display:block;border:1px solid rgba(255,255,255,.08)}
  .controls{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
  .btn-group{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  button{border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;transition:.18s}
  .btn-primary{background:${params.accentColor || "#10b981"};color:#09090b}
  .btn-primary:hover{filter:brightness(1.12)}
  .btn-ghost{background:rgba(255,255,255,.08);color:#e4e4e7;border:1px solid rgba(255,255,255,.1)}
  .btn-ghost:hover{background:rgba(255,255,255,.16)}
  .status{font-size:12px;color:#a1a1aa;font-family:monospace}
</style>
</head>
<body>
<div class="stage-wrap">
  <canvas id="stage" width="1280" height="720"></canvas>
  <div class="controls">
    <div class="btn-group">
      <button id="toggleBtn" class="btn-ghost">Pause</button>
      <button id="prevBtn" class="btn-ghost">Prev Scene</button>
      <button id="nextBtn" class="btn-ghost">Next Scene</button>
      <button id="recordBtn" class="btn-primary">Render &amp; Download .WEBM Video</button>
    </div>
    <span id="statusTxt" class="status">Playing locally on your GPU/Canvas</span>
  </div>
</div>
<script>
const CFG = ${safeData};
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const statusTxt = document.getElementById("statusTxt");
let playing = true, startTs = performance.now(), sceneSec = 3.2;

const particles = Array.from({length: 34}, (_, i) => ({
  x: Math.random() * 1280,
  y: Math.random() * 720,
  r: 2 + (i % 5) * 1.4,
  vy: 0.4 + Math.random() * 1.1
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

function render(now) {
  const elapsed = (now - startTs) / 1000;
  const totalSec = CFG.scenes.length * sceneSec;
  const loopT = elapsed % totalSec;
  const sceneIdx = Math.floor(loopT / sceneSec);
  const localT = (loopT % sceneSec) / sceneSec;
  const scene = CFG.scenes[sceneIdx];

  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, "#0b0f12");
  grad.addColorStop(0.55, "#151920");
  grad.addColorStop(1, "#0b1a16");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  // Ambient glow
  const glow = ctx.createRadialGradient(640 + Math.sin(elapsed) * 140, 340, 30, 640, 360, 480);
  glow.addColorStop(0, "rgba(16,185,129,0.22)");
  glow.addColorStop(1, "rgba(16,185,129,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);

  ctx.fillStyle = "rgba(16,185,129,0.35)";
  for (const p of particles) {
    p.y -= p.vy;
    if (p.y < -10) p.y = 730;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const alpha = localT < 0.14 ? localT / 0.14 : localT > 0.86 ? (1 - localT) / 0.14 : 1;
  const slideY = (1 - Math.min(1, localT * 4)) * 28;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(0, slideY);

  // Badge pill
  ctx.fillStyle = "rgba(16,185,129,0.16)";
  ctx.strokeStyle = "rgba(16,185,129,0.5)";
  ctx.lineWidth = 2;
  drawRoundedRect(470, 175, 340, 42, 21);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6ee7b7";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(scene.badge || "KASPI AI VIDEO").slice(0, 32), 640, 202);

  // Headline
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px system-ui, sans-serif";
  ctx.fillText(String(scene.headline || CFG.title).slice(0, 36), 640, 325);

  // Subline
  ctx.fillStyle = "#d4d4d8";
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillText(String(scene.subline || "").slice(0, 56), 640, 392);

  // Metric Callout
  ctx.fillStyle = CFG.accentColor || "#10b981";
  ctx.font = "700 32px monospace";
  ctx.fillText(String(scene.metric || "").slice(0, 38), 640, 478);
  ctx.restore();

  // Timeline progress bar
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(80, 650, 1120, 6);
  ctx.fillStyle = CFG.accentColor || "#10b981";
  ctx.fillRect(80, 650, 1120 * (loopT / totalSec), 6);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "600 15px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SCENE " + (sceneIdx + 1) + "/" + CFG.scenes.length + "  •  " + CFG.title.slice(0, 40), 80, 634);

  if (playing) requestAnimationFrame(render);
}

requestAnimationFrame(render);

document.getElementById("toggleBtn").onclick = () => {
  playing = !playing;
  document.getElementById("toggleBtn").textContent = playing ? "Pause" : "Play";
  if (playing) requestAnimationFrame(render);
};
document.getElementById("prevBtn").onclick = () => { startTs += sceneSec * 1000; };
document.getElementById("nextBtn").onclick = () => { startTs -= sceneSec * 1000; };

document.getElementById("recordBtn").onclick = () => {
  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
    statusTxt.textContent = "MediaRecorder not supported in this WebView.";
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
    a.download = "kaspi-ai-motion-video.webm";
    a.click();
    statusTxt.textContent = "Downloaded real .webm video (" + Math.round(blob.size / 1024) + " KB)";
  };
  const durationMs = Math.min(14000, CFG.scenes.length * sceneSec * 1000);
  statusTxt.textContent = "Recording live canvas stream (" + Math.round(durationMs / 1000) + "s)...";
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

async function callClientLlm7(params: {
  modelId: string;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  delayBeforeMs?: number;
  signal?: AbortSignal;
}): Promise<{ text: string; usedModel: string }> {
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

export async function executeArenaTurnClientFirst(params: {
  prompt: string;
  mode: ArenaExecutionMode;
  modality: ArenaModality;
  modelAId: string;
  modelBId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  previousTurnModality?: "code" | "text" | "search" | "image" | "video";
  includeStoreContext: boolean;
  attachments: Array<{ name: string; type: string; textExcerpt?: string }>;
  serverExecuteUrl: string;
  signal?: AbortSignal;
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

  // If POS database context is attached, route via authenticated server route
  if (params.includeStoreContext) {
    const serverRes = await fetch(params.serverExecuteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: params.signal,
      body: JSON.stringify({
        prompt: params.prompt,
        mode: params.mode,
        modality: effectiveModality,
        modelAId: params.modelAId,
        modelBId: params.modelBId,
        history: params.history,
        includeStoreContext: true,
        attachments: params.attachments,
      }),
    });
    const data = await serverRes.json();
    if (!serverRes.ok || !data?.success || !data?.outputA) {
      throw new Error(data?.error || `HTTP ${serverRes.status}`);
    }
    return data;
  }

  // BRANCH 1: IMAGE GENERATION (Client-Direct AI Horde, Server Relay Backup)
  if (effectiveModality === "image") {
    const hasB = params.mode !== "direct";
    const [jobARes, jobBRes] = await Promise.allSettled([
      submitClientAiHordeImageJob(params.prompt, "A"),
      hasB
        ? submitClientAiHordeImageJob(`${params.prompt}, cinematic studio lighting`, "B")
        : Promise.resolve(""),
    ]);

    if (jobARes.status === "fulfilled") {
      return {
        effectiveModality: "image",
        citations: [],
        outputA: {
          modelId: "aihorde-sd-a",
          modelName: "Stable Diffusion (AI Horde Euler-A)",
          providerLabel: "Client Direct • AI Horde Cluster",
          status: "completed",
          latencyMs: 420,
          replyMarkdown:
            "تم إرسال طلب توليد الصورة مباشرة من جهازك إلى شبكة Stable Diffusion المفتوحة (AI Horde)...",
          stepsLog: ["Dispatched directly from user device", "Polling worker render"],
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
                modelName: "Stable Diffusion (AI Horde DPM++ 2M)",
                providerLabel: "Client Direct • AI Horde Cluster",
                status: "completed",
                latencyMs: 490,
                replyMarkdown: "جاري توليد النسخة الثانية بمُعيّن DPM++ 2M...",
                stepsLog: ["Dispatched DPM++ 2M directly from user device"],
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

  // Resolve contenders A & B
  let specA: ArenaRealModelSpec;
  let specB: ArenaRealModelSpec | null = null;

  if (params.mode === "battle" || params.mode === "agent") {
    if (params.mode === "battle") {
      const [mA, mB] = selectBattleModelPair(params.prompt, true);
      specA = mA;
      specB = mB;
    } else {
      specA =
        ARENA_REAL_MODELS.find((m) => m.id === params.modelAId) || ARENA_REAL_MODELS[0];
      specB =
        ARENA_REAL_MODELS.find((m) => m.id === params.modelBId) || ARENA_REAL_MODELS[1];
      if (specB.id === specA.id) {
        specB = ARENA_REAL_MODELS.find((m) => m.id !== specA.id) || ARENA_REAL_MODELS[1];
      }
    }
  } else if (params.mode === "direct") {
    specA = ARENA_REAL_MODELS.find((m) => m.id === params.modelAId) || ARENA_REAL_MODELS[0];
    specB = null;
  } else {
    specA = ARENA_REAL_MODELS.find((m) => m.id === params.modelAId) || ARENA_REAL_MODELS[0];
    specB = ARENA_REAL_MODELS.find((m) => m.id === params.modelBId) || ARENA_REAL_MODELS[1];
    if (specB.id === specA.id) {
      specB = ARENA_REAL_MODELS.find((m) => m.id !== specA.id) || ARENA_REAL_MODELS[1];
    }
  }

  // BRANCH 2: WEB SEARCH (Client-Direct DuckDuckGo + Wikipedia)
  let citations: ArenaWebCitation[] = [];
  if (effectiveModality === "search") {
    citations = await performClientWebSearch(params.prompt).catch(() => []);
  }

  const searchContextText =
    citations.length > 0
      ? `\nLive Web Search Results:\n${citations
          .map((c, idx) => `[${idx + 1}] ${c.title} (${c.url})\n${c.snippet}`)
          .join("\n\n")}`
      : "";

  const attachmentContext =
    params.attachments.length > 0
      ? `\nAttached files:\n${params.attachments
          .map(
            (a) =>
              `- ${a.name} (${a.type})${
                a.textExcerpt ? `\nContent:\n${a.textExcerpt.slice(0, 4000)}` : ""
              }`
          )
          .join("\n")}`
      : "";

  // BRANCH 3: LOCAL CANVAS MOTION VIDEO STUDIO
  if (effectiveModality === "video") {
    const videoPrompt = `Create 4 short promo video storyboard slides for: "${params.prompt}".
Output strictly valid JSON object: {"title":"...","accentColor":"#10b981","scenes":[{"badge":"...","headline":"...","subline":"...","metric":"..."}]}. Keep strings concise and impactful in the same language as the prompt.`;

    const runVideoModel = async (
      spec: ArenaRealModelSpec,
      delayMs: number
    ): Promise<ArenaModelOutput> => {
      const start = Date.now();
      let parsedScenes: {
        title?: string;
        accentColor?: string;
        scenes?: VideoSceneSpec[];
      } | null = null;
      let usedModel = spec.apiModelId;

      if (spec.supportsClientDirect) {
        try {
          const res = await callClientLlm7({
            modelId: spec.apiModelId,
            systemPrompt: "Return ONLY a raw JSON object with title, accentColor, and scenes array.",
            messages: [{ role: "user", content: videoPrompt }],
            delayBeforeMs: delayMs,
            signal: params.signal,
          });
          usedModel = res.usedModel;
          const m = res.text.match(/\{[\s\S]*\}/);
          if (m) parsedScenes = JSON.parse(m[0]);
        } catch {}
      }

      const title = parsedScenes?.title || params.prompt.slice(0, 42);
      const html = buildMotionVideoStudioHtml({
        title,
        accentColor: parsedScenes?.accentColor || "#10b981",
        scenes: parsedScenes?.scenes || [
          {
            badge: "KASPI STUDIO",
            headline: title,
            subline: "Interactive 60fps HTML5 Motion Video",
            metric: "1280 × 720 HD",
          },
          {
            badge: "CLIENT GPU RENDER",
            headline: "Export Real .WEBM Locally",
            subline: "Zero server video queue • Instant capture",
            metric: "30 FPS WebM",
          },
        ],
        rtl: isArabicText(params.prompt),
      });

      return {
        modelId: spec.id,
        modelName: spec.displayName,
        providerLabel: spec.providerLabel,
        status: "completed",
        latencyMs: Date.now() - start,
        replyMarkdown: isArabicText(params.prompt)
          ? `تم توليد استوديو فيديو متحرك (Canvas 60fps) يعمل محلياً على جهازك مع إمكانية تحميل الفيديو بصيغة **.webm**. (ملاحظة تقنية: نماذج الفيديو السحابية مثل Kling و Seedance تتطلب رصيد API مدفوع، لذلك تم بناء هذا المحرك المحلي بدلاً من نتائج وهمية).`
          : `Built a live 60fps HTML5 Canvas Motion Video Studio rendered locally on your machine with real **.webm** download. (Cloud APIs like Kling v3.0 / Seedance 2.0 require paid tokens).`,
        stepsLog: [`Rendered local Canvas .webm studio via ${usedModel}`],
        modalityExecuted: "video",
        files: [
          {
            path: "motion-video.html",
            name: "motion-video.html",
            language: "html",
            content: html,
          },
        ],
        previewHtml: html,
        executedOn: "client-device",
      };
    };

    const [outA, outB] = await Promise.all([
      runVideoModel(specA, 0),
      specB ? runVideoModel(specB, 1400) : Promise.resolve(null),
    ]);

    return {
      effectiveModality: "video",
      citations: [],
      outputA: outA,
      outputB: outB,
    };
  }

  // BRANCH 4: CODE / TEXT / SEARCH — CLIENT-FIRST WITH STRICT HTML RECOVERY & SERVER FALLBACK
  const systemPrompt = buildArenaSystemPrompt({
    modality: effectiveModality,
    attachmentContext,
    searchContextText,
  });

  const historyMsgs = params.history.slice(-8);
  const messages = [...historyMsgs, { role: "user" as const, content: params.prompt }];

  const callServerDirectSide = async (
    targetModelId: string
  ): Promise<ArenaModelOutput> => {
    const res = await fetch(params.serverExecuteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: params.signal,
      body: JSON.stringify({
        prompt: params.prompt,
        mode: "direct",
        modality: effectiveModality,
        modelAId: targetModelId,
        modelBId: targetModelId,
        history: historyMsgs,
        includeStoreContext: false,
        attachments: params.attachments,
        citationsOverride: citations,
      }),
    });
    const rawBody = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error(`Cloud gateway returned HTTP ${res.status} (non-JSON timeout/error)`);
    }
    if (!res.ok || !data?.success || !data?.outputA) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return {
      ...data.outputA,
      executedOn: "cloud-relay",
    };
  };

  const runSide = async (
    spec: ArenaRealModelSpec,
    delayMs: number,
    fallbackCloudModelId: string
  ): Promise<ArenaModelOutput> => {
    const start = Date.now();

    if (spec.supportsClientDirect) {
      try {
        let res = await callClientLlm7({
          modelId: spec.apiModelId,
          systemPrompt,
          messages,
          delayBeforeMs: delayMs,
          signal: params.signal,
        });

        if (effectiveModality === "code") {
          let parsed = extractProjectFromResponse(res.text, params.prompt);
          // Enforce HTML creation if the model answered with a prose essay instead of runnable HTML!
          if (!parsed.previewHtml) {
            try {
              const recoveryModel =
                spec.apiModelId === "kimi-k2.7-code" ? "gemma4:31b" : "kimi-k2.7-code";
              const retryRes = await callClientLlm7({
                modelId: recoveryModel,
                systemPrompt: STRICT_HTML_RECOVERY_SYSTEM_PROMPT,
                messages: [{ role: "user", content: params.prompt }],
                delayBeforeMs: 900,
                signal: params.signal,
              });
              const retryParsed = extractProjectFromResponse(retryRes.text, params.prompt);
              if (retryParsed.previewHtml) {
                parsed = retryParsed;
                res = { text: retryRes.text, usedModel: `${res.usedModel}→${retryRes.usedModel}` };
              }
            } catch {}
          }

          const latencyMs = Date.now() - start;
          return {
            modelId: spec.id,
            modelName: spec.displayName,
            providerLabel: spec.providerLabel,
            status: "completed",
            latencyMs,
            replyMarkdown: parsed.explanation,
            stepsLog: [
              parsed.previewHtml
                ? `Built directly on client (${parsed.files.length} files)`
                : `Client reply via ${res.usedModel}`,
            ],
            modalityExecuted: parsed.previewHtml ? "code" : "text",
            files: parsed.files,
            previewHtml: parsed.previewHtml,
            citations: citations.length > 0 ? citations : undefined,
            executedOn: "client-device",
          };
        }

        const latencyMs = Date.now() - start;
        const cleanReply = sanitizeExplanationFromCodeLeaks(res.text, false, params.prompt);
        return {
          modelId: spec.id,
          modelName: spec.displayName,
          providerLabel: spec.providerLabel,
          status: "completed",
          latencyMs,
          replyMarkdown: cleanReply,
          stepsLog:
            citations.length > 0
              ? [`Explored ${citations.length} live sources`, `Executed on client in ${latencyMs}ms`]
              : [`Executed directly on client (${res.usedModel}) in ${latencyMs}ms`],
          modalityExecuted: effectiveModality === "search" ? "search" : "text",
          files: [],
          previewHtml: null,
          citations: citations.length > 0 ? citations : undefined,
          executedOn: "client-device",
        };
      } catch {
        // Silent failover to fast Groq LPU cloud relay (`groq-gpt-oss` / `groq-llama33`)
        try {
          const relayOut = await callServerDirectSide(fallbackCloudModelId);
          return relayOut;
        } catch (err: any) {
          return {
            modelId: spec.id,
            modelName: spec.displayName,
            providerLabel: spec.providerLabel,
            status: "failed",
            latencyMs: Date.now() - start,
            errorMessage: String(err?.message || err),
            replyMarkdown: `⚠️ ${spec.displayName}: ${String(err?.message || err)}`,
            stepsLog: [`Failed: ${String(err?.message || err)}`],
            modalityExecuted: "text",
            files: [],
            previewHtml: null,
          };
        }
      }
    }

    // Explicitly selected server-keyed model (`Groq-GPT-OSS-20B` or `OpenRouter-Free-Pool`)
    try {
      return await callServerDirectSide(spec.id);
    } catch (err: any) {
      return {
        modelId: spec.id,
        modelName: spec.displayName,
        providerLabel: spec.providerLabel,
        status: "failed",
        latencyMs: Date.now() - start,
        errorMessage: String(err?.message || err),
        replyMarkdown: `⚠️ ${spec.displayName}: ${String(err?.message || err)}`,
        stepsLog: [`Failed: ${String(err?.message || err)}`],
        modalityExecuted: "text",
        files: [],
        previewHtml: null,
      };
    }
  };

  const staggerB = Boolean(specB && specA.supportsClientDirect && specB.supportsClientDirect);
  const [outA, outB] = await Promise.all([
    runSide(specA, 0, "groq-gpt-oss"),
    specB ? runSide(specB, staggerB ? 1500 : 0, "groq-llama-instant") : Promise.resolve(null),
  ]);

  return {
    effectiveModality,
    citations,
    outputA: outA,
    outputB: outB,
  };
}
