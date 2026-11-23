import { isSafePublicHttpUrl, runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import { searchStudiedKnowledgeCorpus } from "@/lib/heyuka/training/knowledge-corpus-engine";
import { collectVerifiedHarvestStats } from "@/lib/heyuka/verified-harvest-counter";
import { analyzeRepoAstAndDependencies } from "@/lib/zebra-x/dominance/secret2_software_supremacy";
import { computeInventoryEoqAndSafetyStock } from "@/lib/zebra-x/dominance/secret3_business_dominance";
import { validateMoroccoDgiInvoice } from "@/lib/zebra-x/omega/secret10_hyper_local_grounding";
import { runAutonomousBackgroundAudit } from "@/lib/zebra-x/superpowers/autonomous_daemon_worker";
import { parseLayoutAwareDocAndGraph } from "@/lib/zebra-x/superpowers/deep_doc_graph_rag";
import {
  buildDomainBrainPack,
  exportPortableSovereignSeedCrystal,
  importAndVerifySovereignSeedCrystal,
  type DomainBrainSlug,
} from "@/lib/zebra-x/superpowers/domain_brain_factory";
import { runParallelMapReduceSwarm } from "@/lib/zebra-x/superpowers/parallel_map_reduce_swarm";
import { indexInteractiveElementsSetOfMark } from "@/lib/zebra-x/superpowers/vision_gui_som_operator";
import { executePolyglotCodeSandbox, type SandboxLanguage } from "@/lib/zebra-x/tools/code-sandbox";
import { queryPublicApiHub, type PublicApiCategory } from "@/lib/zebra-x/tools/public-apis-hub";

export type ZeroCostInfraProvider =
  | "vercel"
  | "cloudflare_pages"
  | "hf_spaces"
  | "supabase"
  | "neon"
  | "turso"
  | "resend"
  | "telegram"
  | "ntfy"
  | "pwa";

export interface McpToolSpec {
  id: string;
  category: "ast_code" | "browser_web" | "database_erp" | "superpowers" | "cloud_connectors" | "sovereign_seed";
  requiresConfirmation: boolean;
  description: string;
}

export const UNIVERSAL_MCP_TOOLS: readonly McpToolSpec[] = [
  { id: "filesystem_ast_audit", category: "ast_code", requiresConfirmation: false, description: "AST imports, DOM ID cross-check, Zero-Stub gate & SAST scan across workspace files." },
  { id: "web_browser_research", category: "browser_web", requiresConfirmation: false, description: "SSRF-guarded public web fetch & search reader." },
  { id: "code_sandbox_exec", category: "ast_code", requiresConfirmation: false, description: "Isolated JavaScript/Python sandbox verification." },
  { id: "dgi_invoice_validate", category: "database_erp", requiresConfirmation: false, description: "Morocco CGI Article 145 VAT/Timbre/ICE audit." },
  { id: "eoq_inventory_optimize", category: "database_erp", requiresConfirmation: false, description: "Wilson EOQ, safety stock & reorder trigger solver." },
  { id: "public_api_query", category: "browser_web", requiresConfirmation: false, description: "Query 47 no-key live public APIs (FX, OpenFoodFacts, Open-Meteo, PubMed...)." },
  { id: "knowledge_search", category: "browser_web", requiresConfirmation: false, description: "Search digested Sovereign Vault & Double-Read web corpus." },
  { id: "omniscience_live_stats", category: "browser_web", requiresConfirmation: false, description: "Live 0-MB metadata telemetry across Hugging Face, Common Crawl & GitHub Actions." },
  { id: "som_vision_dom_index", category: "superpowers", requiresConfirmation: false, description: "Set-of-Mark GUI indexer numbering buttons, links & inputs cleanly." },
  { id: "doc_graph_rag_extract", category: "superpowers", requiresConfirmation: false, description: "Layout-aware table/equation parser + LightRAG entity graph builder." },
  { id: "autonomous_daemon_digest", category: "superpowers", requiresConfirmation: false, description: "24/7 Watchdog check over revenue drift, restock triggers & cloud sync." },
  { id: "parallel_swarm_fetch", category: "superpowers", requiresConfirmation: false, description: "Up to 10 parallel workers fetching public URLs with deduplication." },
  { id: "export_domain_brain", category: "superpowers", requiresConfirmation: false, description: "1-Click Domain Brain Crystal export (commerce, agri, coding, legal_dgi)." },
  { id: "export_sovereign_seed", category: "sovereign_seed", requiresConfirmation: false, description: "Grand Seal Portable Sovereign Seed Crystal (.json.gz, 0 secrets)." },
  { id: "import_sovereign_seed", category: "sovereign_seed", requiresConfirmation: false, description: "Verify & restore metadata from an exported Sovereign Seed Crystal." },
  { id: "generate_zero_cost_connector", category: "cloud_connectors", requiresConfirmation: false, description: "Generate $0 setup scaffold for Vercel, Cloudflare, HF Spaces, Supabase, Turso, PWA, Telegram, or ntfy." },
  { id: "public_deploy_confirm", category: "cloud_connectors", requiresConfirmation: true, description: "Zero-Trust Guarded deployment manifest trigger (requires confirmAction: true)." },
];

export function buildZeroCostConnectorScaffold(provider: ZeroCostInfraProvider, projectName = "kaspi-app") {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "kaspi-app";
  const templates: Record<ZeroCostInfraProvider, { title: string; freeTierLimit: string; envVarsNeeded: string[]; snippet: string }> = {
    vercel: {
      title: "Vercel Free Edge Hosting",
      freeTierLimit: "100 GB bandwidth/mo, auto-HTTPS, Instant Previews ($0)",
      envVarsNeeded: ["DATABASE_URL", "HF_TOKEN"],
      snippet: `npx vercel deploy --prod\n# Or connect GitHub repo -> auto deploy on push to main`,
    },
    cloudflare_pages: {
      title: "Cloudflare Pages + Workers Free",
      freeTierLimit: "Unlimited bandwidth + 100k Workers reqs/day ($0)",
      envVarsNeeded: ["CLOUDFLARE_API_TOKEN"],
      snippet: `npx wrangler pages deploy ./dist --project-name=${slug}`,
    },
    hf_spaces: {
      title: "Hugging Face Spaces Free Hosting",
      freeTierLimit: "16GB RAM CPU Basic / ZeroGPU ($0)",
      envVarsNeeded: ["HF_TOKEN"],
      snippet: `# README.md Space Header:\n---\ntitle: ${projectName}\nsdk: docker\napp_port: 7860\n---`,
    },
    supabase: {
      title: "Supabase Free Postgres + Auth",
      freeTierLimit: "500MB Postgres + 50k MAU Auth ($0)",
      envVarsNeeded: ["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
      snippet: `import { createClient } from "@supabase/supabase-js";\nexport const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);`,
    },
    neon: {
      title: "Neon Serverless Postgres Free",
      freeTierLimit: "0.5 GB storage + branching ($0)",
      envVarsNeeded: ["DATABASE_URL"],
      snippet: `DATABASE_URL="postgresql://user:pass@ep-example.eu-central-1.aws.neon.tech/neondb?sslmode=require"`,
    },
    turso: {
      title: "Turso LibSQL Edge Free",
      freeTierLimit: "9 GB total storage, up to 500 DBs ($0)",
      envVarsNeeded: ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"],
      snippet: `import { createClient } from "@libsql/client";\nexport const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });`,
    },
    resend: {
      title: "Resend Transactional Email Free",
      freeTierLimit: "3,000 emails/month ($0)",
      envVarsNeeded: ["RESEND_API_KEY"],
      snippet: `fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: \`Bearer \${process.env.RESEND_API_KEY}\`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "pos@yourdomain.com", to: ["client@example.com"], subject: "Facture KASPI", html: "<p>Merci</p>" }) });`,
    },
    telegram: {
      title: "Telegram Bot Instant Merchant Alerts",
      freeTierLimit: "Unlimited Bot API messages ($0)",
      envVarsNeeded: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"],
      snippet: `fetch(\`https://api.telegram.org/bot\${process.env.TELEGRAM_BOT_TOKEN}/sendMessage\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: "KASPI POS Daily Z-Report" }) });`,
    },
    ntfy: {
      title: "ntfy.sh Push Notifications (Zero Signup)",
      freeTierLimit: "Instant HTTPS pub/sub push to Android/iOS/Desktop ($0)",
      envVarsNeeded: ["NTFY_TOPIC_URL"],
      snippet: `fetch("https://ntfy.sh/kaspi-alerts-private-topic", { method: "POST", body: "Low stock alert triggered cleanly!" });`,
    },
    pwa: {
      title: "Installable PWA Mobile & Desktop Bundle",
      freeTierLimit: "Offline Service Worker + Install Prompt ($0 App Store Fee)",
      envVarsNeeded: [],
      snippet: JSON.stringify({ name: projectName, short_name: slug.slice(0, 12), start_url: "/", display: "standalone", background_color: "#111216", theme_color: "#007ACC" }, null, 2),
    },
  };

  const chosen = templates[provider] || templates.pwa;
  return { ok: true, provider, ...chosen };
}

/**
 * Unified MCP Tool Command Bus Dispatcher with built-in Zero-Trust Guard.
 */
export async function executeUniversalMcpTool(params: {
  toolId: string;
  input?: Record<string, unknown>;
  confirmAction?: boolean;
}) {
  const toolId = String(params.toolId || "").trim();
  const input = params.input || {};
  const spec = UNIVERSAL_MCP_TOOLS.find((t) => t.id === toolId);

  if (!spec) {
    return { ok: false, error: `Unknown MCP tool '${toolId}'.`, statusCode: 404 };
  }

  if (spec.requiresConfirmation && params.confirmAction !== true) {
    return {
      ok: false,
      requiresUserConfirmation: true,
      toolId,
      message: `Zero-Trust Action Guard: '${toolId}' modifies or publishes externally. Re-submit with confirmAction: true to proceed.`,
      statusCode: 403,
    };
  }

  switch (toolId) {
    case "filesystem_ast_audit":
      return {
        statusCode: 200,
        data: analyzeRepoAstAndDependencies(Array.isArray(input.files) ? input.files : []),
      };

    case "web_browser_research":
      return {
        statusCode: 200,
        data: await runUnrestrictedWebResearch({
          query: typeof input.query === "string" ? input.query : undefined,
          url: typeof input.url === "string" ? input.url : undefined,
          lang: typeof input.lang === "string" ? input.lang : "en",
        }),
      };

    case "code_sandbox_exec": {
      const lang = String(input.language || "javascript") as SandboxLanguage;
      return {
        statusCode: 200,
        data: await executePolyglotCodeSandbox({
          language: lang,
          code: String(input.code || ""),
        }),
      };
    }

    case "dgi_invoice_validate":
      return {
        statusCode: 200,
        data: validateMoroccoDgiInvoice({
          invoiceNumber: String(input.invoiceNumber || "INV-2026-001"),
          sellerIce: String(input.sellerIce || ""),
          subtotalHtMad: Number(input.subtotalHtMad || 0),
          vatRatePct: Number(input.vatRatePct ?? 20),
          declaredTtcMad: typeof input.declaredTtcMad === "number" ? input.declaredTtcMad : undefined,
          paymentMethod: input.paymentMethod as "cash" | "card" | "transfer" | "cheque" | undefined,
        }),
      };

    case "eoq_inventory_optimize":
      return {
        statusCode: 200,
        data: {
          ok: true,
          items: computeInventoryEoqAndSafetyStock(Array.isArray(input.items) ? input.items : []),
        },
      };

    case "public_api_query":
      return {
        statusCode: 200,
        data: await queryPublicApiHub({
          category: (typeof input.category === "string" ? input.category : "fx_rates") as PublicApiCategory,
          query: typeof input.query === "string" ? input.query : "Morocco",
        }),
      };

    case "knowledge_search":
      return {
        statusCode: 200,
        data: {
          ok: true,
          ...searchStudiedKnowledgeCorpus({
            query: String(input.query || ""),
            limit: Number(input.limit || 12),
            includeWebFirst: true,
          }),
        },
      };

    case "omniscience_live_stats":
      return {
        statusCode: 200,
        data: await collectVerifiedHarvestStats({ forceRefresh: Boolean(input.forceRefresh) }),
      };

    case "som_vision_dom_index":
      return {
        statusCode: 200,
        data: indexInteractiveElementsSetOfMark(String(input.html || "")),
      };

    case "doc_graph_rag_extract":
      return {
        statusCode: 200,
        data: parseLayoutAwareDocAndGraph(String(input.text || "")),
      };

    case "autonomous_daemon_digest":
      return {
        statusCode: 200,
        data: await runAutonomousBackgroundAudit({
          merchantName: typeof input.merchantName === "string" ? input.merchantName : undefined,
          dailyRevenuesMad: Array.isArray(input.dailyRevenuesMad) ? (input.dailyRevenuesMad as number[]) : undefined,
          lowStockItems: Array.isArray(input.lowStockItems) ? input.lowStockItems : undefined,
          includeRemoteRadar: Boolean(input.includeRemoteRadar),
        }),
      };

    case "parallel_swarm_fetch": {
      const rawUrls = Array.isArray(input.urls) ? input.urls.map(String) : [];
      const safeUrls = rawUrls.filter((u) => isSafePublicHttpUrl(u)).slice(0, 12);
      const swarmRes = await runParallelMapReduceSwarm({
        items: safeUrls,
        maxConcurrency: 10,
        workerFn: async (url) => runUnrestrictedWebResearch({ url, lang: "en" }),
      });
      return { statusCode: 200, data: swarmRes };
    }

    case "export_domain_brain": {
      const domain = String(input.domain || "coding_architect") as DomainBrainSlug;
      return { statusCode: 200, data: buildDomainBrainPack(domain) };
    }

    case "export_sovereign_seed":
      return { statusCode: 200, data: exportPortableSovereignSeedCrystal() };

    case "import_sovereign_seed":
      return {
        statusCode: 200,
        data: importAndVerifySovereignSeedCrystal(String(input.seedPayload || "")),
      };

    case "generate_zero_cost_connector":
      return {
        statusCode: 200,
        data: buildZeroCostConnectorScaffold(
          String(input.provider || "vercel") as ZeroCostInfraProvider,
          String(input.projectName || "kaspi-app")
        ),
      };

    case "public_deploy_confirm": {
      const provider = String(input.provider || "vercel") as ZeroCostInfraProvider;
      return {
        statusCode: 200,
        data: {
          ...buildZeroCostConnectorScaffold(provider, String(input.projectName || "kaspi-app")),
          confirmedDeploymentReady: true,
        },
      };
    }

    default:
      return { ok: false, error: `Unhandled tool '${toolId}'.`, statusCode: 400 };
  }
}
