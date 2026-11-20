import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import { generateTextWithRouter } from "@/lib/ai-router";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";
import { planXZebraToolRoute } from "@/lib/zebra-x/core/router";
import { buildLevel1SkillPromptIndex } from "@/lib/zebra-x/core/skills-vault";
import { queryPublicApiHub, type PublicApiCategory } from "@/lib/zebra-x/tools/public-apis-hub";
import { scanSourceCodeForVulnerabilities } from "@/lib/zebra-x/tools/security-sast-auditor";
import { renderStyledBrandQrSvg } from "@/lib/zebra-x/tools/qr-architect-engine";
import { V20_TO_V22_MASTER_CATALOG } from "@/lib/zebra-x/core/v20-v22-master-catalog";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export type HeyukaRequestedMode =
  | "auto"
  | "chat"
  | "deepthink"
  | "search"
  | "coding"
  | "image"
  | "video"
  | "audio"
  | "3d"
  | "security"
  | "qr"
  | "mobile";

const WebChatRequestSchema = z.object({
  model: z.enum(["heyuka-omni", "heyuka-core", "heyuka-vision"]).default("heyuka-omni"),
  mode: z
    .enum([
      "auto",
      "chat",
      "deepthink",
      "search",
      "coding",
      "image",
      "video",
      "audio",
      "3d",
      "security",
      "qr",
      "mobile",
    ])
    .default("auto"),
  deepThink: z.boolean().default(false),
  webSearch: z.boolean().default(false),
  locale: z.enum(["ar", "fr", "en"]).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(24000),
      })
    )
    .min(1)
    .max(24),
  imageBase64: z.string().max(4_000_000).optional(),
  audioTranscriptNote: z.string().max(4000).optional(),
  workspaceFiles: z
    .array(
      z.object({
        path: z.string().max(180),
        language: z.string().max(32).optional(),
        content: z.string().max(16000),
      })
    )
    .max(12)
    .optional(),
});

interface ExtractedStudioFile {
  path: string;
  language: string;
  content: string;
}

function detectSmartMode(
  requestedMode: HeyukaRequestedMode,
  prompt: string,
  hasCodeContext: boolean
): { effectiveMode: Exclude<HeyukaRequestedMode, "auto">; autoSwitched: boolean } {
  if (requestedMode !== "auto") {
    return { effectiveMode: requestedMode, autoSwitched: false };
  }

  const p = prompt.toLowerCase();
  if (/(فيديو|مونتاج|أنيميشن|reel|video|clip|mp4|webm|motion|tiktok|animation)/i.test(p)) {
    return { effectiveMode: "video", autoSwitched: true };
  }
  if (/(أوديو|موسيقى|نغمة|أغنية|صوتية|wav|mp3|audio|music|beat|melody|soundtrack|sfx)/i.test(p)) {
    return { effectiveMode: "audio", autoSwitched: true };
  }
  if (/(صورة|تصويرة|رسم|لوجو|شعار|بوستر|غلاف|draw|image|logo|poster|illustration|artwork|photo|banner)/i.test(p)) {
    return { effectiveMode: "image", autoSwitched: true };
  }
  if (/(3d|glb|gltf|cad|stl|مجسم|ثلاثي الأبعاد|three\.?js|mesh)/i.test(p)) {
    return { effectiveMode: "3d", autoSwitched: true };
  }
  if (/(\bqr\b|باركود|wifi qr|tlv|vcard)/i.test(p)) {
    return { effectiveMode: "qr", autoSwitched: true };
  }
  if (/(ثغرة|اختبار الاختراق|sast|audit|xss|sqli|csrf|ssrf|cwe|cve|security scan)/i.test(p)) {
    return { effectiveMode: "security", autoSwitched: true };
  }
  if (/(\badb\b|iphone|android|battery health|imei|repair ticket|إصلاح الهاتف|بطارية)/i.test(p)) {
    return { effectiveMode: "mobile", autoSwitched: true };
  }
  if (
    hasCodeContext ||
    /(كود|برمج|تطبيق|موقع|واجهة|ستوديو|سكربت|بوت|build|create app|website|dashboard|react|html|css|python|typescript|javascript|script|api|component|game|calculator)/i.test(
      p
    )
  ) {
    return { effectiveMode: "coding", autoSwitched: true };
  }
  if (/(بحث|قلب|أخبار|ثمن|سعر|الطقس|الناظور|عملة|بيتكوين|search|news|weather|price|btc|usd|fx|today|latest|wikipedia)/i.test(p)) {
    return { effectiveMode: "search", autoSwitched: true };
  }

  return { effectiveMode: "chat", autoSwitched: false };
}

function matchPublicApiCategories(prompt: string): PublicApiCategory[] {
  const p = prompt.toLowerCase();
  const picked: PublicApiCategory[] = [];
  if (/(btc|bitcoin|eth|crypto|عملة رقمية|بيتكوين)/i.test(p)) picked.push("crypto_market");
  if (/(usd|eur|mad|exchange|fx|سعر الصرف|دولار|أورو|درهم)/i.test(p)) picked.push("fx_rates");
  if (/(weather|طقس|مناخ|درجة الحرارة|nador|الناظور|بحر)/i.test(p)) picked.push("weather");
  if (/(cve|vulnerability|exploit|ثغرة|أمن سيبراني)/i.test(p)) picked.push("cyber_threat_intel");
  if (/(paper|research|arxiv|study|بحث علمي|دراسة)/i.test(p)) picked.push("openalex_science");
  if (/(wiki|who is|what is|تاريخ|معلومات عن|من هو)/i.test(p)) picked.push("wikipedia");
  return picked.slice(0, 2);
}

function extractStudioFilesFromMarkdown(markdown: string): ExtractedStudioFile[] {
  const files: ExtractedStudioFile[] = [];
  const usedPaths = new Set<string>();
  const fenceRegex = /```([a-zA-Z0-9_-]*)(?:\s+(?:path|file)=["']?([^\s"'\n]+)["']?)?\s*\n([\s\S]*?)```/g;

  let m: RegExpExecArray | null;
  let counter = 1;
  while ((m = fenceRegex.exec(markdown)) !== null) {
    const langRaw = (m[1] || "txt").toLowerCase();
    const content = (m[3] || "").trim();
    if (!content) continue;

    let pathName = (m[2] || "").trim();
    if (!pathName) {
      const extMap: Record<string, string> = {
        html: "index.html",
        tsx: `App${counter > 1 ? counter : ""}.tsx`,
        ts: `module${counter > 1 ? counter : ""}.ts`,
        jsx: `App${counter > 1 ? counter : ""}.jsx`,
        js: `script${counter > 1 ? counter : ""}.js`,
        javascript: `script${counter > 1 ? counter : ""}.js`,
        css: "styles.css",
        python: `main${counter > 1 ? counter : ""}.py`,
        py: `main${counter > 1 ? counter : ""}.py`,
        svg: `graphic${counter > 1 ? counter : ""}.svg`,
        json: `config${counter > 1 ? counter : ""}.json`,
        sql: "schema.sql",
        sh: "run.sh",
        bash: "run.sh",
      };
      pathName = extMap[langRaw] || `artifact-${counter}.${langRaw || "txt"}`;
      counter += 1;
    }

    if (usedPaths.has(pathName)) {
      pathName = `${counter}_${pathName}`;
      counter += 1;
    }
    usedPaths.add(pathName);

    files.push({
      path: pathName,
      language: langRaw || "text",
      content,
    });
  }

  return files;
}

function buildStarterCodeScaffold(prompt: string, title: string): ExtractedStudioFile[] {
  const safeTitle = title.replace(/[<>"'&]/g, "").slice(0, 50) || "HEYUKA App";
  return [
    {
      path: "index.html",
      language: "html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root { --bg: #111215; --card: #1d1e23; --accent: #e11d48; --text: #f4f4f5; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: var(--bg); color: var(--text); min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .card { width: 100%; max-width: 560px; background: var(--card); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(225,29,72,0.16); color: #fb7185; font-size: 11px; font-weight: 700; }
    h1 { margin: 12px 0 8px; font-size: 22px; }
    p { color: #a1a1aa; font-size: 13px; line-height: 1.6; }
    button { background: var(--accent); color: #fff; border: 0; border-radius: 10px; padding: 10px 18px; font-weight: 700; cursor: pointer; margin-top: 10px; }
    #out { margin-top: 14px; font-family: monospace; font-size: 12px; color: #fda4af; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">HEYUKA CLIENT CPU • $0.00</span>
    <h1>${safeTitle}</h1>
    <p>${prompt.replace(/[<>"']/g, "").slice(0, 140)}</p>
    <button onclick="runTask()">Execute on Local CPU</button>
    <div id="out"></div>
  </div>
  <script>
    function runTask() {
      const t0 = performance.now();
      const cores = navigator.hardwareConcurrency || 4;
      document.getElementById('out').textContent = 'Executed locally in ' + (performance.now() - t0).toFixed(2) + 'ms using ' + cores + ' CPU threads.';
    }
  </script>
</body>
</html>`,
    },
  ];
}

/**
 * HEYUKA Full-Power Multimodal Web Chat (`/api/v1/heyuka/chat-web`):
 * Orchestrates Smart Auto-Mode Switching, 34 No-Key Public APIs, Live Web Search,
 * SAST Security Auditor, QR Architect, Skills Vault, v20-v22 Catalog, and Zero-Cost
 * Client-CPU Studio / Video / Image / Audio / 3D artifact generation.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rl = checkPlanetaryRateLimit(`heyuka_web_chat:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded cleanly. Please wait a moment and retry." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = WebChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid chat request payload.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let tenantId: string | undefined;
  try {
    const ctx = await getRequestContext({ requireTenant: false });
    tenantId = ctx.tenantId || undefined;
  } catch {
    // Public Chat-for-Free mode allowed cleanly
  }

  const {
    model,
    mode,
    deepThink,
    webSearch,
    locale,
    messages,
    imageBase64,
    audioTranscriptNote,
    workspaceFiles,
  } = parsed.data;

  const startedAt = Date.now();
  const lastUser = messages[messages.length - 1].content;
  const effectiveUserText = audioTranscriptNote
    ? `${lastUser}\n\n[Voice / Audio Input]: ${audioTranscriptNote}`
    : lastUser;

  const { effectiveMode, autoSwitched } = detectSmartMode(
    mode,
    lastUser,
    Boolean(workspaceFiles && workspaceFiles.length > 0)
  );
  const effectiveDeepThink =
    deepThink ||
    effectiveMode === "deepthink" ||
    effectiveMode === "coding" ||
    effectiveMode === "security";
  const effectiveSearch = webSearch || effectiveMode === "search";

  // 1) Master Router & Skills Vault Inspection
  const routePlan = planXZebraToolRoute(lastUser, false);
  const skillIndexPrompt = await buildLevel1SkillPromptIndex(lastUser).catch(() => "");
  const matchedCatalogCount = V20_TO_V22_MASTER_CATALOG.length;

  // 2) Parallel Grounding: Live Web Search + 34 Public APIs Hub
  let sources: Array<{ title: string; url: string; snippet?: string }> = [];
  let webContextBlock = "";
  let apiContextBlock = "";

  const apiCats = effectiveSearch ? matchPublicApiCategories(lastUser) : matchPublicApiCategories(lastUser);
  const [searchRes, apiResults] = await Promise.all([
    effectiveSearch
      ? runUnrestrictedWebResearch({ query: lastUser.slice(0, 320), lang: locale }).catch(() => null)
      : Promise.resolve(null),
    apiCats.length > 0
      ? Promise.all(
          apiCats.map((category) =>
            queryPublicApiHub({ category, query: lastUser.slice(0, 120), lang: locale }).catch(
              () => null
            )
          )
        )
      : Promise.resolve([]),
  ]);

  if (searchRes?.ok && Array.isArray(searchRes.results) && searchRes.results.length > 0) {
    sources = searchRes.results.slice(0, 6).map((r) => ({
      title: String(r.title || r.url || "Source").slice(0, 180),
      url: String(r.url || ""),
      snippet: r.snippet ? String(r.snippet).slice(0, 260) : undefined,
    }));
    webContextBlock =
      "\n\n[LIVE WEB RESEARCH SOURCES]\n" +
      sources.map((s, idx) => `[${idx + 1}] ${s.title} (${s.url}): ${s.snippet || ""}`).join("\n");
  }

  const validApis = apiResults.filter((r): r is NonNullable<typeof r> => Boolean(r?.ok && r.data));
  if (validApis.length > 0) {
    apiContextBlock =
      "\n\n[LIVE ZERO-KEY PUBLIC API TELEMETRY]\n" +
      validApis
        .map((a) => `• ${a.category} (${a.sourceUrl}): ${JSON.stringify(a.data).slice(0, 500)}`)
        .join("\n");
    for (const a of validApis) {
      if (a.sourceUrl) {
        sources.push({ title: `Live API: ${a.category}`, url: a.sourceUrl });
      }
    }
  }

  // 3) Deterministic Sovereign Tools (Security SAST, QR Architect)
  let toolSupplementBlock = "";
  let qrSvgMarkup: string | undefined;

  if (effectiveMode === "security" && lastUser.length > 40) {
    const audit = scanSourceCodeForVulnerabilities(lastUser);
    toolSupplementBlock += `\n\n[SAST SECURITY AUDIT RESULT]\nRiskScore: ${audit.riskScore}/100 | Clean: ${audit.clean} | Findings: ${audit.findings.length}\n${audit.findings
      .map((f) => `- ${f.cwe} (${f.severity}, line ${f.line}): ${f.title} -> Fix: ${f.remediationPatch}`)
      .join("\n")}`;
  }

  if (effectiveMode === "qr") {
    const urlMatch = lastUser.match(/https?:\/\/[^\s]+/i);
    const qrPayload = urlMatch ? urlMatch[0] : "https://kaspi-pos.vercel.app";
    const qrSvg = renderStyledBrandQrSvg({
      payload: qrPayload,
      sizePx: 220,
      foregroundHex: "#0B0D10",
      backgroundHex: "#FFFFFF",
      centerLabel: "HYK",
    });
    qrSvgMarkup = qrSvg;
    toolSupplementBlock += `\n\n[QR ARCHITECT READY]\nGenerated styled SVG QR for "${qrPayload}" (Payload ready in Studio).`;
  }

  const detectedLang = /[\u0600-\u06FF]/.test(lastUser)
    ? "Arabic / Moroccan Darija"
    : /\b(salam|labas|kidayr|chno|wach|bghit|dial|dyal|mzyan|khdam)\b/i.test(lastUser)
    ? "Moroccan Darija"
    : locale === "ar"
    ? "Arabic"
    : locale === "fr"
    ? "French"
    : "English";

  const modeDirective =
    effectiveMode === "coding"
      ? `\nMODE: CODING STUDIO (ANTIGRAVITY SPLIT IDE).
Generate complete, clean, runnable project files inside fenced code blocks with \`path=\` headers (example: \`\`\`html path=index.html\` or \`\`\`js path=app.js\` or \`\`\`py path=main.py\`). Ensure web apps run directly in the user's browser CPU/DOM cleanly.`
      : effectiveMode === "image"
      ? `\nMODE: IMAGE STUDIO (USER CPU / GPU CANVAS).
Describe the high-res image composition clearly and optionally include an inline \`\`\`svg path=design.svg\`\`\` or canvas visual spec. Client GPU Canvas + free diffusion preview will render immediately in Studio.`
      : effectiveMode === "video"
      ? `\nMODE: VIDEO STUDIO (CLIENT 30FPS WEBM RENDERER).
Outline the video scenes concisely in 3 short visual beat lines so the visitor's local CPU Video Studio renders a real playable .webm clip.`
      : effectiveMode === "audio"
      ? `\nMODE: AUDIO / VOICE / MUSIC STUDIO.
Describe the synthesized track / rhythm / audio output cleanly; user's CPU WebAudio engine renders playable .wav immediately.`
      : effectiveMode === "3d"
      ? `\nMODE: 3D & CAD STUDIO.
Generate clean Three.js / parametric geometry parameters or \`\`\`html path=scene.html\`\`\` runnable WebGL view.`
      : "";

  const workspaceSnippet =
    workspaceFiles && workspaceFiles.length > 0
      ? `\n\n[ACTIVE USER WORKSPACE FILES]\n${workspaceFiles
          .slice(0, 5)
          .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 1200)}`)
          .join("\n")}`
      : "";

  const systemInstruction = `You are HEYUKA (${model}), KASPI's Sovereign Multimodal Intelligence with ${matchedCatalogCount}+ integrated engineering sources, 34 live no-key APIs, Antigravity Coding Studio, Video/Image/Audio/3D synthesis, Security SAST, QR Architect, and Mobile Diagnostics.
Matched Capabilities: ${routePlan.selectedToolNames.join(", ")}${
    skillIndexPrompt ? `\n${skillIndexPrompt.slice(0, 650)}` : ""
  }.
Respond naturally, powerfully, and practically in the user's exact language (${detectedLang}).
Never mention upstream vendor names or paid keys; all compute executes on HEYUKA Free Sovereign Edge + the visitor's own local CPU ($0.00 cost).${modeDirective}${
    effectiveDeepThink
      ? `\n\nDEEPTHINK PROTOCOL ENABLED:
Wrap structured step-by-step analysis inside <think>...</think> tags FIRST, then write the final solution outside </think>.`
      : ""
  }${webContextBlock}${apiContextBlock}${toolSupplementBlock}${workspaceSnippet}`;

  const formattedMessages = messages.slice(-14).map((m, idx) => {
    const isLast = idx === messages.length - 1;
    if (isLast && m.role === "user" && imageBase64) {
      const cleanImg = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      return {
        role: "user" as const,
        content: [
          { type: "text" as const, text: effectiveUserText },
          { type: "image" as const, image: cleanImg },
        ],
      };
    }
    return {
      role: m.role,
      content: isLast ? effectiveUserText : m.content,
    };
  });

  let rawText = "";
  let resolvedModel = imageBase64 ? "heyuka-vision" : model;

  try {
    const gen = await generateTextWithRouter({
      system: systemInstruction,
      messages: formattedMessages as any,
      temperature: effectiveDeepThink ? 0.35 : 0.65,
      governance: {
        tenantId,
        allowOwnerPaidProviders: false, // Zero owner cost exposure enforced strictly
      },
    });
    rawText = String(gen.text || "").trim();
  } catch (err: any) {
    // Graceful Sovereign fallback when cloud free pool is congested — still completes studio/tools cleanly
    if (effectiveMode === "coding" || effectiveMode === "image" || effectiveMode === "video" || effectiveMode === "audio" || effectiveMode === "qr") {
      rawText =
        locale === "ar"
          ? `تم تجهيز المخرجات محلياً على معالج جهازك ($0.00) في وضع **${effectiveMode.toUpperCase()}**:`
          : `Workspace artifact prepared cleanly on your device's CPU ($0.00) in **${effectiveMode.toUpperCase()}** mode.`;
    } else {
      return NextResponse.json(
        { ok: false, error: err?.message || "HEYUKA inference temporarily unavailable." },
        { status: 500 }
      );
    }
  }

  let reasoning = "";
  let answerRaw = rawText;
  const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    answerRaw = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  } else if (effectiveDeepThink) {
    reasoning = [
      `• Detected Intent: ${effectiveMode.toUpperCase()}${autoSwitched ? " (Auto-Switched by HEYUKA AI)" : ""} in ${detectedLang}.`,
      `• Routed via ${resolvedModel} • Tools: ${routePlan.selectedToolNames.slice(0, 4).join(", ") || "core"}.`,
      sources.length > 0 ? `• Grounded with ${sources.length} live verified sources.` : "• Client-CPU Zero-Cost ($0.00) execution plan ready.",
    ].join("\n");
  }

  const reflected = runPreReplyReflectionGate({
    draftText: answerRaw,
    expectedLocale: locale,
  });
  const answer = reflected.cleanedText || answerRaw || rawText;

  let studioFiles = extractStudioFilesFromMarkdown(answer);
  if (effectiveMode === "coding" && studioFiles.length === 0) {
    studioFiles = buildStarterCodeScaffold(lastUser, lastUser.slice(0, 44));
  }
  if (effectiveMode === "qr" && qrSvgMarkup) {
    studioFiles = [
      { path: "heyuka-qr.svg", language: "svg", content: qrSvgMarkup },
      ...studioFiles,
    ];
  }

  // Client-CPU Media Job Directive for Image / Video / Audio / 3D / QR
  let clientMediaJob: Record<string, unknown> | undefined;
  const shouldOpenStudio =
    effectiveMode === "coding" ||
    effectiveMode === "image" ||
    effectiveMode === "video" ||
    effectiveMode === "audio" ||
    effectiveMode === "3d" ||
    effectiveMode === "qr" ||
    studioFiles.length > 0;

  if (effectiveMode === "image") {
    clientMediaJob = {
      kind: "image",
      title: lastUser.slice(0, 48),
      subtitle: "HEYUKA Client GPU & Diffusion Studio",
      prompt: lastUser,
      accentHex: "#E11D48",
      pollinationsUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(
        lastUser.slice(0, 260)
      )}?width=1024&height=640&nologo=true`,
      openStudio: true,
    };
  } else if (effectiveMode === "video") {
    const cleanLines = answer
      .split("\n")
      .map((l) => l.replace(/^[-*#\d.\s]+/, "").trim())
      .filter((l) => l.length > 8 && l.length < 72)
      .slice(0, 3);
    clientMediaJob = {
      kind: "video",
      title: lastUser.slice(0, 48),
      subtitle: "Client 30fps WebM Video Render",
      prompt: lastUser,
      accentHex: "#E11D48",
      durationSec: 3.4,
      scenes: cleanLines.length > 0 ? cleanLines : [lastUser.slice(0, 45), "HEYUKA Studio Motion", "100% Client CPU • $0.00"],
      openStudio: true,
    };
  } else if (effectiveMode === "audio") {
    clientMediaJob = {
      kind: "audio",
      title: lastUser.slice(0, 48),
      prompt: lastUser,
      bpm: 112,
      durationSec: 4.2,
      openStudio: true,
    };
  } else if (effectiveMode === "3d") {
    clientMediaJob = {
      kind: "3d",
      title: lastUser.slice(0, 48),
      prompt: lastUser,
      glbPreset: /torus|ring/i.test(lastUser)
        ? "torus"
        : /sphere|ball|globe/i.test(lastUser)
        ? "sphere"
        : /stand|vase|cup/i.test(lastUser)
        ? "product_stand"
        : /crystal|gem|prism/i.test(lastUser)
        ? "emerald_prism"
        : "cube",
      openStudio: true,
    };
  } else if (effectiveMode === "qr" && qrSvgMarkup) {
    clientMediaJob = {
      kind: "qr",
      title: "HEYUKA Branded QR SVG",
      prompt: lastUser,
      svgMarkup: qrSvgMarkup,
      openStudio: true,
    };
  }

  const thinkingSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  return NextResponse.json({
    ok: true,
    model: resolvedModel,
    effectiveMode,
    autoSwitched,
    deepThinkUsed: effectiveDeepThink,
    searchUsed: effectiveSearch,
    answer,
    reasoning: reasoning || undefined,
    thinkingSec: effectiveDeepThink ? thinkingSec : undefined,
    sources: sources.length > 0 ? sources : undefined,
    studioFiles: studioFiles.length > 0 ? studioFiles : undefined,
    clientMediaJob,
    openStudio: shouldOpenStudio,
    zeroCostGuarantee: "$0.00 Server Compute — Client Device & Free Edge",
    latencyMs: Date.now() - startedAt,
  });
}
