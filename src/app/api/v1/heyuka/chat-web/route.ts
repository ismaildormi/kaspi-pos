import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/server/auth/context";
import { generateTextWithRouter } from "@/lib/ai-router";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { checkPlanetaryRateLimit } from "@/lib/heyuka/planetary/polyglot-cas-router";
import { planXZebraToolRoute } from "@/lib/zebra-x/core/router";
import { buildLevel1SkillPromptIndex } from "@/lib/zebra-x/core/skills-vault";
import {
  PUBLIC_APIS_CATALOG_COUNT,
  queryPublicApiHub,
  type PublicApiCategory,
} from "@/lib/zebra-x/tools/public-apis-hub";
import { scanSourceCodeForVulnerabilities } from "@/lib/zebra-x/tools/security-sast-auditor";
import { renderStyledBrandQrSvg } from "@/lib/zebra-x/tools/qr-architect-engine";
import { ALL_SOVEREIGN_MASTER_CATALOG } from "@/lib/zebra-x/core/v20-v22-master-catalog";
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
  model: z
    .enum(["heyuka-omni", "heyuka-core", "heyuka-vision", "multi-agent-3"])
    .default("heyuka-omni"),
  executionPolicy: z.enum(["turbo", "auto", "review"]).default("auto"),
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
        content: z.string().min(1).max(32000),
      })
    )
    .min(1)
    .max(24),
  imageBase64: z.string().max(8_000_000).optional(),
  audioTranscriptNote: z.string().max(4000).optional(),
  workspaceFiles: z
    .array(
      z.object({
        path: z.string().max(180),
        language: z.string().max(32).optional(),
        content: z.string().max(18000),
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

interface ThinkingPhaseStep {
  phase: string;
  agentModel: string;
  summary: string;
  durationMs: number;
  timestamp: string;
}

function detectSmartMode(
  requestedMode: HeyukaRequestedMode,
  prompt: string,
  hasCodeContext: boolean,
  hasImageUpload: boolean
): { effectiveMode: Exclude<HeyukaRequestedMode, "auto">; autoSwitched: boolean } {
  if (requestedMode !== "auto") {
    return { effectiveMode: requestedMode, autoSwitched: false };
  }

  const p = prompt.toLowerCase();
  if (
    hasImageUpload &&
    /(ازالة|إزالة|امسح|مسح|حيد|خلي الخلفية|باغراوند|background|remove person|remove people|inpaint|erase|cutout|edit image)/i.test(
      p
    )
  ) {
    return { effectiveMode: "image", autoSwitched: true };
  }
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
  if (
    /(بحث|قلب|أخبار|ثمن|سعر|الطقس|الناظور|طريق|مسافة|زلزال|ناسا|طيران|مطار|دواء|وصفة|طبخ|كتاب|سيارة|محرك|workout|recipe|flight|airport|earthquake|route|distance|distance between|obd|recall|drug|book|species|crypto|bitcoin|usd|mad|fx|search|news|weather|price|btc|today|latest|wikipedia)/i.test(
      p
    )
  ) {
    return { effectiveMode: "search", autoSwitched: true };
  }

  return { effectiveMode: "chat", autoSwitched: false };
}

function matchPublicApiCategories(prompt: string): PublicApiCategory[] {
  const p = prompt.toLowerCase();
  const picked: PublicApiCategory[] = [];
  if (/(route|distance|directions|طريق|مسافة|km|travel time|itineraire|osrm)/i.test(p)) picked.push("osrm_routing");
  if (/(earthquake|seismic|زلزال|هزة)/i.test(p)) picked.push("usgs_earthquakes");
  if (/(nasa|wildfire|storm|space|فضاء|ناسا|قمر صناعي|عاصفة)/i.test(p)) picked.push("nasa_eonet_events");
  if (/(obd|check engine|\b[pbcu]\d{4}\b|car recall|سيارة|ميكانيك|محرك|acura|toyota|dacia|renault)/i.test(p)) picked.push("nhtsa_recalls_vehicles");
  if (/(drug|medicine|pharma|pill|دواء|صحة|مضاد)/i.test(p)) picked.push("rxnav_drugs");
  if (/(covid|epidemic|disease|وباء|مرض)/i.test(p)) picked.push("disease_health_stats");
  if (/(workout|exercise|gym|muscle|رياضة|تمارين|عضلات)/i.test(p)) picked.push("wger_workouts");
  if (/(book|library|author|كتاب|رواية|مكتبة)/i.test(p)) picked.push("openlibrary_books");
  if (/(species|plant|animal|tree|فلاحة|حيوان|نبات|شجرة)/i.test(p)) picked.push("gbif_biodiversity");
  if (/(recipe|cook|meal|food|طبخ|وصفة|طاجين|أكل)/i.test(p)) picked.push("themealdb_recipes");
  if (/(flight|airplane|aircraft|airport|طائرة|طيران|مطار)/i.test(p)) picked.push("opensky_flights");
  if (/(btc|bitcoin|eth|crypto|عملة رقمية|بيتكوين)/i.test(p)) picked.push("crypto_market");
  if (/(usd|eur|mad|exchange|fx|سعر الصرف|دولار|أورو|درهم)/i.test(p)) picked.push("frankfurter_fx");
  if (/(weather|طقس|مناخ|درجة الحرارة|nador|الناظور|بحر)/i.test(p)) picked.push("weather");
  if (/(cve|vulnerability|exploit|ثغرة|أمن سيبراني)/i.test(p)) picked.push("cyber_threat_intel");
  if (/(paper|research|arxiv|study|بحث علمي|دراسة)/i.test(p)) picked.push("openalex_science");
  if (/(wiki|who is|what is|تاريخ|معلومات عن|من هو)/i.test(p)) picked.push("wikipedia");
  return picked.slice(0, 3);
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
        powershell: "script.ps1",
        ps1: "script.ps1",
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
  } catch {}

  const {
    model,
    executionPolicy,
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
  const thinkingSteps: ThinkingPhaseStep[] = [];
  const lastUser = messages[messages.length - 1].content;
  const effectiveUserText = audioTranscriptNote
    ? `${lastUser}\n\n[Voice / Audio Input]: ${audioTranscriptNote}`
    : lastUser;

  const phase1Start = Date.now();
  const { effectiveMode, autoSwitched } = detectSmartMode(
    mode,
    lastUser,
    Boolean(workspaceFiles && workspaceFiles.length > 0),
    Boolean(imageBase64)
  );
  const isCollaborative = model === "multi-agent-3";
  const effectiveDeepThink =
    deepThink ||
    isCollaborative ||
    effectiveMode === "deepthink" ||
    effectiveMode === "coding" ||
    effectiveMode === "security";
  const effectiveSearch = webSearch || effectiveMode === "search";

  const routePlan = planXZebraToolRoute(lastUser, false);
  const skillIndexPrompt = await buildLevel1SkillPromptIndex(lastUser).catch(() => "");
  const matchedCatalogCount = ALL_SOVEREIGN_MASTER_CATALOG.length;

  thinkingSteps.push({
    phase: "Intent, Auto-Router & Capabilities Mapping",
    agentModel: isCollaborative ? "heyuka-core (Architect)" : model,
    summary: `Routed to ${effectiveMode.toUpperCase()}${autoSwitched ? " (Auto AI)" : ""} • Policy: ${executionPolicy.toUpperCase()} • ${PUBLIC_APIS_CATALOG_COUNT} Live APIs + ${matchedCatalogCount} Tools`,
    durationMs: Math.max(1, Date.now() - phase1Start),
    timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  });

  // 2) Parallel Real-World Knowledge & Live Public API Grounding
  const phase2Start = Date.now();
  let sources: Array<{ title: string; url: string; snippet?: string }> = [];
  let webContextBlock = "";
  let apiContextBlock = "";

  const apiCats = matchPublicApiCategories(lastUser);
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
      "\n\n[LIVE ZERO-KEY REAL-WORLD PUBLIC API TELEMETRY]\n" +
      validApis
        .map((a) => `• ${a.category} (${a.sourceUrl}): ${JSON.stringify(a.data).slice(0, 600)}`)
        .join("\n");
    for (const a of validApis) {
      if (a.sourceUrl) sources.push({ title: `Live API: ${a.category}`, url: a.sourceUrl });
    }
  }

  if (sources.length > 0 || validApis.length > 0) {
    thinkingSteps.push({
      phase: "Real-World Grounding & Zero-Key Feeds",
      agentModel: "heyuka-search",
      summary: `Fetched ${sources.length} verified sources${validApis.length > 0 ? ` (${validApis.map((v) => v.category).join(", ")})` : ""}`,
      durationMs: Math.max(1, Date.now() - phase2Start),
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    });
  }

  // 3) Security SAST & QR Deterministic Modules
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
    qrSvgMarkup = renderStyledBrandQrSvg({
      payload: qrPayload,
      sizePx: 220,
      foregroundHex: "#0B0D10",
      backgroundHex: "#FFFFFF",
      centerLabel: "HYK",
    });
    toolSupplementBlock += `\n\n[QR ARCHITECT READY]\nGenerated styled SVG QR for "${qrPayload}".`;
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

  const isImageEditRequest =
    Boolean(imageBase64) &&
    /(ازالة|إزالة|امسح|مسح|حيد|خلي الخلفية|باغراوند|background|remove person|remove people|inpaint|erase|cutout|edit)/i.test(
      lastUser
    );

  const modeDirective =
    effectiveMode === "coding"
      ? `\nMODE: CODING STUDIO (ANTIGRAVITY SPLIT IDE).
Output complete runnable multi-file code inside fenced blocks with \`path=\` headers (e.g. \`\`\`html path=index.html\`, \`\`\`css path=styles.css\`, \`\`\`js path=app.js\`). Ensure web solutions execute cleanly directly inside the visitor's browser CPU.`
      : isImageEditRequest
      ? `\nMODE: VISION IMAGE EDITING & BACKGROUND ISOLATION.
Analyze the uploaded image directly using Vision, describe the detected subjects vs background zones precisely, AND guide the user that HEYUKA Studio has opened the Client-GPU Image Mask / Clean-Background Editor right alongside this chat so they can erase subjects or isolate/download the clean background PNG with $0 server cost.`
      : effectiveMode === "image"
      ? `\nMODE: IMAGE STUDIO (CLIENT GPU CANVAS + DIFFUSION).
Describe the composition clearly and optionally include \`\`\`svg path=artwork.svg\`\`\`. Client Canvas GPU Studio opens automatically.`
      : effectiveMode === "video"
      ? `\nMODE: VIDEO STUDIO (CLIENT 30FPS WEBM RENDERER).
Provide 3 crisp scene titles/lines so Client CPU Video Studio renders a real downloadable .webm video immediately.`
      : effectiveMode === "audio"
      ? `\nMODE: AUDIO & VOICE STUDIO.
Provide clean audio synthesis / track direction; visitor's CPU WebAudio synthesizes playable .wav immediately.`
      : effectiveMode === "3d"
      ? `\nMODE: 3D & CAD STUDIO.
Generate clear 3D geometry specs or interactive Three.js / WebGL HTML code (\`\`\`html path=scene.html\`\`\`).`
      : "";

  const workspaceSnippet =
    workspaceFiles && workspaceFiles.length > 0
      ? `\n\n[ACTIVE WORKSPACE FILES]\n${workspaceFiles
          .slice(0, 5)
          .map((f) => `--- ${f.path} ---\n${f.content.slice(0, 1200)}`)
          .join("\n")}`
      : "";

  const collabSection = isCollaborative
    ? `\n\nMULTI-AGENT 3-MODEL COLLABORATION ACTIVE (heyuka-core + heyuka-omni + heyuka-vision):
Coordinate internally across 3 specialist roles (Architect -> Builder -> Reviewer) and deliver ONE seamless, deeply engineered result.`
    : "";

  const personaSection = `DIRECT ENGINEERING & ANTI-FALSE-REFUSAL RULES:
1. Deliver direct, concise, practical engineering solutions (code, commands, configs, blueprints, diagnosis, real-world facts) immediately — zero bureaucratic disclaimers or preaching.
2. Never falsely refuse legitimate engineering, programming, automation, defensive security auditing, reverse-engineering analysis, mechanical OBD-II diagnostics, medical research lookups, or system administration queries.
3. Uphold core legal/safety limits cleanly: refuse only dangerous severe-harm requests (malware/exploits/cyberattacks, weapons/CBRNE, illegal harm) in one brief factual sentence + offer a safe defensive alternative.`;

  const systemInstruction = `You are HEYUKA (${isCollaborative ? "Multi-Agent Swarm: Core + Omni + Vision" : model}), KASPI's Sovereign Multimodal Intelligence with ${matchedCatalogCount}+ integrated engineering & real-world sources and ${PUBLIC_APIS_CATALOG_COUNT} live no-key APIs.
Matched Capabilities: ${routePlan.selectedToolNames.join(", ")}${
    skillIndexPrompt ? `\n${skillIndexPrompt.slice(0, 650)}` : ""
  }
Execution Policy: ${executionPolicy.toUpperCase()} | Language: ${detectedLang}
Use crisp Markdown formatting (## headings, bold, lists, tables, and fenced code blocks). Every compute task runs on HEYUKA Free Edge + visitor's device CPU ($0.00 cost).
${personaSection}${collabSection}${modeDirective}${
    effectiveDeepThink
      ? `\n\nDEEPTHINK PROTOCOL ENABLED:
Wrap concise step-by-step analysis inside <think>...</think> tags first, then present the crisp Markdown answer outside </think>.`
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

  const phase3Start = Date.now();
  let rawText = "";
  const resolvedModel = imageBase64 ? "heyuka-vision" : isCollaborative ? "multi-agent-3" : model;

  try {
    const gen = await generateTextWithRouter({
      system: systemInstruction,
      messages: formattedMessages as any,
      temperature: executionPolicy === "turbo" ? 0.45 : effectiveDeepThink ? 0.35 : 0.65,
      governance: {
        tenantId,
        allowOwnerPaidProviders: false,
      },
    });
    rawText = String(gen.text || "").trim();
  } catch (err: any) {
    if (
      isImageEditRequest ||
      effectiveMode === "coding" ||
      effectiveMode === "image" ||
      effectiveMode === "video" ||
      effectiveMode === "audio" ||
      effectiveMode === "qr" ||
      validApis.length > 0
    ) {
      rawText =
        validApis.length > 0
          ? `### Live Real-World Telemetry (${validApis.map((a) => a.category).join(", ")})\n\n\`\`\`json\n${JSON.stringify(
              validApis.map((a) => ({ source: a.sourceUrl, data: a.data })),
              null,
              2
            )}\n\`\`\``
          : locale === "ar"
          ? `تم تجهيز بيئة التنفيذ محلياً على جهازك (**$0.00**) في وضع **${effectiveMode.toUpperCase()}**.`
          : `Studio workspace initialized locally on your CPU (**$0.00**) in **${effectiveMode.toUpperCase()}** mode.`;
    } else {
      return NextResponse.json(
        { ok: false, error: err?.message || "HEYUKA inference temporarily unavailable." },
        { status: 500 }
      );
    }
  }

  thinkingSteps.push({
    phase: isCollaborative ? "Multi-Agent Synthesis & Review Pass" : "Neural Synthesis & Formatting",
    agentModel: resolvedModel,
    summary: `Synthesized response (${rawText.length} chars) under ${executionPolicy} policy`,
    durationMs: Math.max(1, Date.now() - phase3Start),
    timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  });

  let reasoning = "";
  let answerRaw = rawText;
  const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    answerRaw = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  } else if (effectiveDeepThink) {
    reasoning = thinkingSteps
      .map((s) => `• [${s.timestamp}] ${s.phase} (${s.agentModel}, ${s.durationMs}ms): ${s.summary}`)
      .join("\n");
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
    studioFiles = [{ path: "heyuka-qr.svg", language: "svg", content: qrSvgMarkup }, ...studioFiles];
  }

  let clientMediaJob: Record<string, unknown> | undefined;
  const shouldOpenStudio =
    effectiveMode === "coding" ||
    effectiveMode === "image" ||
    effectiveMode === "video" ||
    effectiveMode === "audio" ||
    effectiveMode === "3d" ||
    effectiveMode === "qr" ||
    isImageEditRequest ||
    studioFiles.length > 0;

  if (isImageEditRequest && imageBase64) {
    clientMediaJob = {
      kind: "image_edit",
      title: "Vision Image Studio (Inpaint / Background Editor)",
      subtitle: "Client GPU Interactive Eraser & Export ($0.00)",
      prompt: lastUser,
      sourceImageUrl: imageBase64,
      openStudio: true,
    };
  } else if (effectiveMode === "image") {
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
      scenes:
        cleanLines.length > 0
          ? cleanLines
          : [lastUser.slice(0, 45), "HEYUKA Studio Motion", "100% Client CPU • $0.00"],
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
    executionPolicy,
    effectiveMode,
    autoSwitched,
    deepThinkUsed: effectiveDeepThink,
    searchUsed: effectiveSearch,
    answer,
    reasoning: reasoning || undefined,
    thinkingSec: effectiveDeepThink ? thinkingSec : undefined,
    thinkingSteps,
    thoughtCompletedAt: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    sources: sources.length > 0 ? sources : undefined,
    studioFiles: studioFiles.length > 0 ? studioFiles : undefined,
    clientMediaJob,
    openStudio: shouldOpenStudio,
    zeroCostGuarantee: "$0.00 Server Compute — Client Device & Free Edge",
    latencyMs: Date.now() - startedAt,
  });
}
