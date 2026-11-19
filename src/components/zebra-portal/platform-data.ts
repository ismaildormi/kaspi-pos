export type PortalLocale = "ar" | "fr" | "en";

export interface PlatformModelSpec {
  id: "heyuka-omni" | "heyuka-core" | "heyuka-vision";
  badge: string;
  name: string;
  contextWindow: string;
  latencyTier: string;
  modalities: string[];
  competitorBenchmark: string;
  desc: Record<PortalLocale, string>;
  strengths: Record<PortalLocale, string[]>;
}

export interface ComparisonRow {
  dimension: Record<PortalLocale, string>;
  heyuka: Record<PortalLocale, string>;
  openai: Record<PortalLocale, string>;
  microsoft: Record<PortalLocale, string>;
  googleDeepseek: Record<PortalLocale, string>;
  heyukaEdge: boolean;
}

export const OFFICIAL_API_BASE_URL = "https://kaspi-pos.vercel.app/api/v1";
export const OFFICIAL_ROOT_V1_URL = "https://kaspi-pos.vercel.app/v1";

const DEBUG_KEY_ID_STORAGE = "heyuka_console_active_tracking_id";
let inMemoryConsoleToken = "";

export function saveActiveConsoleKey(secretKey: string, keyId?: string | null) {
  if (secretKey.trim()) {
    inMemoryConsoleToken = secretKey.trim();
  }
  if (typeof window === "undefined") return;
  try {
    if (keyId && keyId.trim()) {
      window.sessionStorage.setItem(DEBUG_KEY_ID_STORAGE, keyId.trim());
    }
  } catch {
    // Ignore restricted storage contexts
  }
}

export function loadActiveConsoleKey(): { secretKey: string; keyId: string } {
  if (typeof window === "undefined") return { secretKey: inMemoryConsoleToken, keyId: "" };
  try {
    return {
      secretKey: inMemoryConsoleToken,
      keyId: window.sessionStorage.getItem(DEBUG_KEY_ID_STORAGE) || "",
    };
  } catch {
    return { secretKey: inMemoryConsoleToken, keyId: "" };
  }
}

export const HEYUKA_MODEL_SPECS: PlatformModelSpec[] = [
  {
    id: "heyuka-omni",
    badge: "Flagship • Multimodal & Agentic",
    name: "HEYUKA Omni",
    contextWindow: "128K Context",
    latencyTier: "Fast + Deep Tooling",
    modalities: ["Text", "Vision", "Code Sandbox", "Live Research", "34 Live Feeds"],
    competitorBenchmark: "Comparable to GPT-4o / Azure GPT-4o / Gemini 2.5 Pro",
    desc: {
      ar: "النموذج الشامل الرائد من KASPI: يجمع بين الاستدلال العميق، البرمجة الكاملة، الفهم البصري، واستدعاء الأدوات الحية في استعلام واحد.",
      fr: "Modèle amiral multimodal et agentique de KASPI : raisonnement profond, génie logiciel, analyse visuelle et exécution d'outils en direct.",
      en: "KASPI's unified flagship multimodal and agentic intelligence combining deep reasoning, full-stack coding, vision, and live tool orchestration.",
    },
    strengths: {
      ar: [
        "متوافق 100% مع OpenAI SDK (`/v1` و `/api/v1`)",
        "يستدعي البحث الحي وتنفيذ الأكواد تلقائياً عند التفعيل",
        "إتقان أصيل للعربية والدارجة والريفية والفرنسية والإنجليزية",
      ],
      fr: [
        "100% compatible SDK OpenAI (`/v1` & `/api/v1`)",
        "Recherche web, sandbox de code et flux temps réel intégrés",
        "Maîtrise native Arabe, Darija, Tarifit, Français et Anglais",
      ],
      en: [
        "100% OpenAI SDK drop-in compatibility (`/v1` & `/api/v1`)",
        "Built-in live research, isolated code sandbox & 34 market feeds",
        "Native Arabic, Moroccan Darija, Tarifit, French & English fluency",
      ],
    },
  },
  {
    id: "heyuka-core",
    badge: "Ultra-Fast Reasoning & Logic",
    name: "HEYUKA Core",
    contextWindow: "128K Context",
    latencyTier: "Low Latency",
    modalities: ["Text", "Structured JSON", "Math & Tax", "Software Engineering"],
    competitorBenchmark: "Comparable to o3-mini / DeepSeek-R1 / Azure Phi-4",
    desc: {
      ar: "نواة سريعة فائقة الدقة للحسابات التجارية، هندسة البرمجيات، القوانين الضريبية، والتحليل متعدد اللغات بزمن استجابة منخفض.",
      fr: "Noyau haute vélocité conçu pour l'ingénierie logicielle, la logique financière, la fiscalité et le traitement multilingue rapide.",
      en: "High-precision low-latency reasoning core tailored for software engineering, financial logic, structured JSON, and multilingual enterprise tasks.",
    },
    strengths: {
      ar: [
        "استدلال برمجي ومحاسبي عالي الدقة",
        "مناسب لواجهات المحادثة الفورية ومساعدي خدمة العملاء",
        "دعم كامل لـ SSE Streaming و JSON منظم",
      ],
      fr: [
        "Raisonnement algorithmique et comptable ultra-précis",
        "Idéal pour assistants temps réel et API backend à fort trafic",
        "Support natif Streaming SSE et sorties structurées JSON",
      ],
      en: [
        "Deterministic software, tax, and structured analysis speed",
        "Built for high-concurrency backends and real-time chat flows",
        "Full Server-Sent Events streaming and tool-calling fidelity",
      ],
    },
  },
  {
    id: "heyuka-vision",
    badge: "Multimodal, Cutout, 3D & Audio",
    name: "HEYUKA Vision",
    contextWindow: "128K Context",
    latencyTier: "Studio Pipeline",
    modalities: ["Vision `image_url`", "Image Gen", "PNG Cutout", "3D Assets", "Audio"],
    competitorBenchmark: "Comparable to GPT Image + Whisper + Azure Vision Studio",
    desc: {
      ar: "استوديو وسائط متكامل لتحليل الصور (`image_url`)، توليد تصاميم المنتجات، تفريغ الخلفيات بدقة PNG، تجهيز أصول 3D، وتفريغ الصوتيات.",
      fr: "Studio créatif unifié : compréhension d'images (`image_url`), génération visuelle, détourage PNG transparent, scènes 3D et transcription audio.",
      en: "Unified multimodal creative studio supporting OpenAI `image_url` perception, visual synthesis, transparent PNG cutouts, 3D assets, and speech APIs.",
    },
    strengths: {
      ar: [
        "يدعم صور `image_url` المباشرة داخل رسائل Chat Completions",
        "نقاط نهاية مستقلة للصور و3D وتفريغ الخلفية والصوتيات",
        "مناسب لمتاجر التجارة الإلكترونية واستوديوهات التصميم",
      ],
      fr: [
        "Accepte directement `image_url` dans Chat Completions",
        "Endpoints dédiés Vision, 3D, détourage PNG et séparation audio",
        "Conçu pour le e-commerce, les studios créatifs et les applications ERP",
      ],
      en: [
        "Accepts OpenAI `image_url` vision inputs natively inside Chat",
        "Dedicated endpoints for PNG cutouts, 3D meshes/assets & audio stems",
        "Ready out-of-the-box for commerce catalogs and media apps",
      ],
    },
  },
];

export const PLATFORM_COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: {
      ar: "تنظيم المنصة (Multi-Page Console)",
      fr: "Architecture Console Multi-Pages",
      en: "Multi-Page Console Structure",
    },
    heyuka: {
      ar: "6 صفحات منظمة بهوية KASPI الزجاجية (نظرة عامة، النماذج، المفاتيح، الملعب، مصحح Debug، التوثيق)",
      fr: "6 pages structurées en verre VisionOS (Aperçu, Modèles, Clés API, Playground, Debugger Live, Docs)",
      en: "6 dedicated Crystal Glass pages (Overview, Models, API Keys, Playground, Live Debugger, Docs)",
    },
    openai: {
      ar: "لوحة متعددة الصفحات (Dashboard / Playground / API Keys / Docs)",
      fr: "Console multi-pages standard (Playground, Clés, Docs)",
      en: "Standard multi-page developer dashboard (Playground, Keys, Docs)",
    },
    microsoft: {
      ar: "بوابة Azure AI Foundry مع كتالوج ومشاريع منفصلة",
      fr: "Portail Azure AI Foundry orienté entreprise",
      en: "Enterprise Azure AI Foundry project workspaces & catalogs",
    },
    googleDeepseek: {
      ar: "Google AI Studio / DeepSeek Platform",
      fr: "Google AI Studio / DeepSeek Platform",
      en: "Google AI Studio / DeepSeek Open Platform",
    },
    heyukaEdge: true,
  },
  {
    dimension: {
      ar: "تشخيص الأخطاء والمصادقة (API Debug UX)",
      fr: "Diagnostic API & Debug en Direct",
      en: "Built-In Live API Debugger",
    },
    heyuka: {
      ar: "أداة فحص حي 7 نقاط (`/zebra-x/debug` و `/api/v1/debug`) + CORS كامل + دعم `/v1` و `api-key` + تلميحات `debug_hint`",
      fr: "Suite diagnostic 7 points (`/zebra-x/debug` & `/api/v1/debug`) + CORS natif + support `/v1` & `api-key` + `debug_hint`",
      en: "7-point Live Debugger (`/zebra-x/debug` & `/api/v1/debug`) + full CORS + `/v1` alias + `debug_hint` envelopes",
    },
    openai: {
      ar: "سجلات طلبات أساسية بدون مصحح تفاعلي مدمج للمفاتيح في الواجهة",
      fr: "Journaux basiques sans testeur multi-endpoints intégré",
      en: "Basic Logs tab without an integrated 7-point key diagnostic suite",
    },
    microsoft: {
      ar: "يتطلب ضبط Azure Monitor / Application Insights منفصلاً",
      fr: "Nécessite la configuration d'Azure Monitor séparément",
      en: "Requires separate Azure Monitor / diagnostic settings setup",
    },
    googleDeepseek: {
      ar: "رموز خطأ JSON عامة بدون تلميحات `debug_hint` موحدة للوسائط المتعددة",
      fr: "Messages d'erreur standards sans guidage unifié",
      en: "Standard JSON errors without unified SDK header/CORS diagnostics",
    },
    heyukaEdge: true,
  },
  {
    dimension: {
      ar: "توافق المكتبات والرؤوس (SDK Headers)",
      fr: "Compatibilité SDK & En-têtes Auth",
      en: "Drop-In SDK & Header Flexibility",
    },
    heyuka: {
      ar: "يدعم `Bearer`, `X-API-Key`, و `api-key` + معرف مستقل `X-API-Key-Id` + مساري `/v1` و `/api/v1`",
      fr: "Supporte `Bearer`, `X-API-Key`, et `api-key` + `X-API-Key-Id` vérifiable + `/v1` & `/api/v1`",
      en: "Accepts `Bearer`, `X-API-Key`, & Azure `api-key` + verifiable `X-API-Key-Id` on both `/v1` & `/api/v1`",
    },
    openai: {
      ar: "OpenAI Bearer Auth فقط على `/v1`",
      fr: "OpenAI Bearer uniquement sur `/v1`",
      en: "Bearer auth only on `/v1`",
    },
    microsoft: {
      ar: "رأس `api-key` خاص بـ Azure مع `api-version` إلزامي",
      fr: "En-tête Azure `api-key` + `api-version` obligatoire",
      en: "Azure-specific `api-key` & mandatory `api-version` query parameter",
    },
    googleDeepseek: {
      ar: "Google يتطلب رأس `x-goog-api-key` وصيغة طلب مختلفة؛ DeepSeek يتبع OpenAI فقط",
      fr: "Format Gemini spécifique sur Google ; format OpenAI sur DeepSeek",
      en: "Custom Gemini schema on Google; OpenAI Bearer only on DeepSeek",
    },
    heyukaEdge: true,
  },
  {
    dimension: {
      ar: "الأدوات الحية المدمجة بدون إعدادات إضافية",
      fr: "Outils Temps Réel Intégrés",
      en: "Zero-Config Built-In Capabilities",
    },
    heyuka: {
      ar: "بحث ويب + تنفيذ كود 7 لغات + 34 مصدر بيانات حية + صور + تفريغ PNG + أصول 3D + صوتيات في نفس المفتاح",
      fr: "Recherche web + sandbox 7 langages + 34 flux live + images + détourage PNG + 3D + audio sur une seule clé",
      en: "Web research + 7-lang code sandbox + 34 live data feeds + studio images + PNG cutout + 3D + audio on 1 key",
    },
    openai: {
      ar: "Code Interpreter والبحث كخدمات إضافية مدفوعة؛ بدون 3D أو تفريغ خلفيات أو صوتيات مدمجة",
      fr: "Outils facturés en plus ; sans endpoints 3D ni détourage PNG natifs",
      en: "Add-on metered tools; no built-in PNG cutout, 3D catalog, or stem separation APIs",
    },
    microsoft: {
      ar: "خدمات منفصلة لكل قدرة (Azure Speech / Vision / AI Search بفواتير متعددة)",
      fr: "Ressources Azure séparées par service (Speech, Vision, Search)",
      en: "Requires provisioning separate Azure Speech, Vision, and Search resources",
    },
    googleDeepseek: {
      ar: "DeepSeek نص وكود فقط؛ Google يتطلب Vertex/Cloud لبقية الخدمات",
      fr: "DeepSeek texte/code seul ; services séparés sur Google Cloud",
      en: "DeepSeek is text/code only; Google splits media workflows across Cloud APIs",
    },
    heyukaEdge: true,
  },
  {
    dimension: {
      ar: "العربية والدارجة المغربية والأمازيغية الريفية",
      fr: "Arabe, Darija & Tarifit + POS/ERP",
      en: "Arabic, Moroccan Darija, Tarifit & FR/EN",
    },
    heyuka: {
      ar: "دعم أصيل للهجة المغربية والعربية الفصحى والريفية والفرنسية والإنجليزية مع ذكاء التجارة والضرائب",
      fr: "Support natif Arabe, Darija marocaine, Tarifit, Français & Anglais adapté au commerce réel",
      en: "First-class native Arabic, Darija, Tarifit, French & English tuned for real commerce workflows",
    },
    openai: {
      ar: "جيد في الفصحى والإنجليزية؛ الدارجة والريفية سطحية وأقل استقراراً",
      fr: "Bon en anglais/arabe standard ; darija limitée",
      en: "Strong English; inconsistent Moroccan Darija & zero Tarifit tuning",
    },
    microsoft: {
      ar: "نماذج عامة بدون ضبط محلي للأسواق المغاربية والعربية",
      fr: "Modèles généralistes sans spécialisation maghrébine",
      en: "General-purpose models without North African vernacular tuning",
    },
    googleDeepseek: {
      ar: "Gemini جيد نسبياً في العربية؛ DeepSeek يركز على الإنجليزية والصينية",
      fr: "Gemini correct en arabe ; DeepSeek axé EN/ZH",
      en: "Gemini supports standard Arabic; DeepSeek focuses on EN/ZH",
    },
    heyukaEdge: true,
  },
  {
    dimension: {
      ar: "إصدار المفاتيح وتجربة البدء الفوري",
      fr: "Provisioning des Clés & Démarrage",
      en: "Key Provisioning & Onboarding Speed",
    },
    heyuka: {
      ar: "إنشاء فوري لمفاتيح مشفرة بـ SHA-256 + Key ID مستقل داخل حساب KASPI في ثوانٍ",
      fr: "Émission instantanée de clés hachées SHA-256 + Key ID unique en quelques secondes",
      en: "Instant SHA-256 hashed Secret Keys + verifiable Key IDs inside your workspace in seconds",
    },
    openai: {
      ar: "يتطلب بطاقة بنكية وتأكيد رقم هاتف قبل تفعيل حصة الإنتاج",
      fr: "Carte bancaire et recharge prépayée obligatoires avant usage API",
      en: "Requires prepaid billing balance before live API quota unlocks",
    },
    microsoft: {
      ar: "يتطلب اشتراك Azure وحجز Resource Group وربط RBAC معقد",
      fr: "Abonnement Azure, Resource Group et déploiements requis",
      en: "Complex Azure subscription, resource group, and RBAC provisioning",
    },
    googleDeepseek: {
      ar: "Google Cloud Billing أو شحن رصيد مسبق على DeepSeek",
      fr: "Facturation Cloud ou prépaiement requis pour lever les limites",
      en: "Cloud billing verification or prepaid balance required for production",
    },
    heyukaEdge: true,
  },
];

export function buildSdkQuickstart(params: {
  lang: "node" | "python" | "curl" | "azure-fetch";
  endpointMode?: "api_v1" | "root_v1";
  secretKey?: string;
  keyId?: string;
  model?: string;
}): string {
  const key = params.secretKey?.trim() || "hk-live-YOUR_UNIQUE_SECRET_KEY";
  const keyId = params.keyId?.trim() || "hk_YOUR_KEY_ID";
  const model = params.model || "heyuka-omni";
  const baseUrl =
    params.endpointMode === "root_v1" ? OFFICIAL_ROOT_V1_URL : OFFICIAL_API_BASE_URL;

  if (params.lang === "curl") {
    return `# Step 1: Verify your key & gateway with the Live Debugger endpoint
curl "${baseUrl}/debug" \\
  -H "Authorization: Bearer ${key}" \\
  -H "X-API-Key-Id: ${keyId}"

# Step 2: Run an OpenAI-compatible Chat Completion
curl -X POST "${baseUrl}/chat/completions" \\
  -H "Authorization: Bearer ${key}" \\
  -H "X-API-Key-Id: ${keyId}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "enableTools": true,
    "messages": [
      { "role": "user", "content": "Compare HEYUKA capabilities for multilingual commerce apps." }
    ]
  }'`;
  }

  if (params.lang === "python") {
    return `from openai import OpenAI

client = OpenAI(
    api_key="${key}",
    base_url="${baseUrl}",
    default_headers={"X-API-Key-Id": "${keyId}"},
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "You are HEYUKA by KASPI."},
        {"role": "user", "content": "Calculate 1500 + 20% VAT cleanly."},
    ],
)

print(response.choices[0].message.content)`;
  }

  if (params.lang === "azure-fetch") {
    return `// Works cleanly with both standard Bearer AND Azure-style \`api-key\` headers
const res = await fetch("${baseUrl}/chat/completions", {
  method: "POST",
  headers: {
    "api-key": "${key}",
    "X-API-Key-Id": "${keyId}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "${model}",
    enableTools: true,
    messages: [{ role: "user", content: "Summarize EUR to MAD rate today." }],
  }),
});

console.log("X-Request-Id:", res.headers.get("X-Request-Id"));
console.log(await res.json());`;
  }

  return `import OpenAI from "openai";

const heyuka = new OpenAI({
  apiKey: "${key}",
  baseURL: "${baseUrl}",
  defaultHeaders: { "X-API-Key-Id": "${keyId}" },
});

const completion = await heyuka.chat.completions.create({
  model: "${model}",
  messages: [
    { role: "user", content: "Generate a clean TypeScript tax utility function." },
  ],
});

console.log(completion.choices[0].message.content);`;
}
