import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import { generateTextWithRouter } from "@/lib/ai-router";
import {
  decryptVaultSecrets,
  sanitizeOutboundEndpoint,
  type StoredIntegrationRecord,
} from "@/lib/security/integration-vault";

export const dynamic = "force-dynamic";

const RESPONDER_SCOPE = "kaspi_comment_auto_responder_v1";
const RESPONDER_KEY = "rules_and_logs";
const VAULT_SCOPE = "kaspi_integration_vault_v1";
const VAULT_KEY = "tenant_connections";

export interface AutoResponderRule {
  id: string;
  name: string;
  channel: "facebook" | "instagram" | "whatsapp" | "tiktok" | "storefront";
  keywords: string[];
  languageTone: "darija" | "ar" | "fr" | "en";
  includeStoreLink: boolean;
  includeProductPrice: boolean;
  requireApprovalBeforeSend: boolean;
  customInstruction: string;
  webhookTargetServiceId?: string;
  enabled: boolean;
}

export interface AutoResponderEventLog {
  id: string;
  createdAt: string;
  channel: string;
  incomingComment: string;
  matchedProductName?: string;
  replyDraft: string;
  storefrontUrl: string;
  dispatched: boolean;
  dispatchStatus: string;
}

async function resolveTenantId(): Promise<string> {
  const ctx = await getSafeServerContext();
  if (ctx.tenantId && ctx.tenantId !== "00000000-0000-0000-0000-000000000000") {
    return ctx.tenantId;
  }
  const first = await prisma.tenant.findFirst({ select: { id: true } }).catch(() => null);
  return first?.id || "00000000-0000-0000-0000-000000000000";
}

function buildDefaultRules(storeName: string): AutoResponderRule[] {
  return [
    {
      id: "rule-price-link",
      name: `الرد التلقائي على أسئلة الثمن والرابط (${storeName})`,
      channel: "facebook",
      keywords: ["شحال", "تمن", "prix", "price", "link", "الرابط", "بغيت", "command", "متوفر"],
      languageTone: "darija",
      includeStoreLink: true,
      includeProductPrice: true,
      requireApprovalBeforeSend: false,
      customInstruction:
        "جاوب العميل بأدب بالدارجة المغربية، عطيه الثمن بالدرهم واش كاين فالمخزون، وحط ليه الرابط المباشر للطلب.",
      enabled: true,
    },
  ];
}

async function loadState(tenantId: string, storeName: string) {
  if (tenantId === "00000000-0000-0000-0000-000000000000") {
    return { rules: buildDefaultRules(storeName), logs: [] as AutoResponderEventLog[] };
  }
  const row = await prisma.idempotencyRecord
    .findUnique({
      where: {
        tenantId_scope_key: { tenantId, scope: RESPONDER_SCOPE, key: RESPONDER_KEY },
      },
    })
    .catch(() => null);
  const body = (row?.responseBody as any) || {};
  return {
    rules: Array.isArray(body.rules) && body.rules.length > 0 ? body.rules : buildDefaultRules(storeName),
    logs: Array.isArray(body.logs) ? body.logs : [],
  };
}

async function saveState(
  tenantId: string,
  state: { rules: AutoResponderRule[]; logs: AutoResponderEventLog[] }
) {
  if (tenantId === "00000000-0000-0000-0000-000000000000") return;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
  const payload = { rules: state.rules.slice(0, 30), logs: state.logs.slice(-60) };
  await prisma.idempotencyRecord.upsert({
    where: {
      tenantId_scope_key: { tenantId, scope: RESPONDER_SCOPE, key: RESPONDER_KEY },
    },
    create: {
      tenantId,
      scope: RESPONDER_SCOPE,
      key: RESPONDER_KEY,
      requestHash: `ar-${tenantId}`,
      responseStatus: 200,
      responseBody: payload as any,
      expiresAt,
    },
    update: {
      responseBody: payload as any,
      expiresAt,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const locale = req.nextUrl.searchParams.get("locale") || "ar";
    const [tenant, products] = await Promise.all([
      prisma.tenant
        .findUnique({
          where: { id: tenantId },
          select: { id: true, displayName: true, slug: true, currency: true },
        })
        .catch(() => null),
      prisma.product
        .findMany({
          where: { tenantId, isActive: true, deletedAt: null },
          take: 40,
          select: { id: true, name: true, salePrice: true, imageUrl: true },
        })
        .catch(() => []),
    ]);

    const storeName = tenant?.displayName || "KASPI Store";
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "https://kaspi-pos.vercel.app";
    const storeBaseUrl = tenant?.slug ? `${origin}/${locale}/store/${tenant.slug}` : `${origin}/${locale}/store`;
    const state = await loadState(tenantId, storeName);

    return NextResponse.json({
      success: true,
      storeName,
      storeBaseUrl,
      currency: tenant?.currency || "MAD",
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.salePrice),
        link: `${storeBaseUrl}?product=${encodeURIComponent(p.id)}`,
      })),
      rules: state.rules,
      logs: state.logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load auto-responder rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "generate_reply");
    const locale = String(body?.locale || "ar");

    const tenant = await prisma.tenant
      .findUnique({
        where: { id: tenantId },
        select: { id: true, displayName: true, slug: true, currency: true },
      })
      .catch(() => null);

    const storeName = tenant?.displayName || "KASPI Store";
    const state = await loadState(tenantId, storeName);

    if (action === "save_rules" && Array.isArray(body?.rules)) {
      const cleanRules: AutoResponderRule[] = body.rules.slice(0, 25).map((r: any, idx: number) => ({
        id: String(r.id || `rule-${idx + 1}`),
        name: String(r.name || "Auto Reply Rule").slice(0, 120),
        channel: ["facebook", "instagram", "whatsapp", "tiktok", "storefront"].includes(r.channel)
          ? r.channel
          : "facebook",
        keywords: Array.isArray(r.keywords)
          ? r.keywords.map((k: any) => String(k).trim()).filter(Boolean).slice(0, 30)
          : [],
        languageTone: ["darija", "ar", "fr", "en"].includes(r.languageTone) ? r.languageTone : "darija",
        includeStoreLink: r.includeStoreLink !== false,
        includeProductPrice: r.includeProductPrice !== false,
        requireApprovalBeforeSend: Boolean(r.requireApprovalBeforeSend),
        customInstruction: String(r.customInstruction || "").slice(0, 600),
        webhookTargetServiceId: r.webhookTargetServiceId ? String(r.webhookTargetServiceId) : undefined,
        enabled: r.enabled !== false,
      }));
      await saveState(tenantId, { rules: cleanRules, logs: state.logs });
      return NextResponse.json({ success: true, rules: cleanRules });
    }

    const incomingComment = String(body?.comment || "").trim();
    if (!incomingComment) {
      return NextResponse.json({ error: "Incoming comment text is required" }, { status: 400 });
    }

    const products = await prisma.product
      .findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        take: 40,
        select: { id: true, name: true, salePrice: true, description: true },
      })
      .catch(() => []);

    const lowerComment = incomingComment.toLowerCase();
    const matchedProduct =
      products.find((p) => lowerComment.includes(p.name.toLowerCase())) ||
      products.find((p) =>
        p.name
          .toLowerCase()
          .split(/\s+/)
          .some((word) => word.length > 3 && lowerComment.includes(word))
      ) ||
      products[0] ||
      null;

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "https://kaspi-pos.vercel.app";
    const storeBaseUrl = tenant?.slug ? `${origin}/${locale}/store/${tenant.slug}` : `${origin}/${locale}/store`;
    const directProductUrl = matchedProduct
      ? `${storeBaseUrl}?product=${encodeURIComponent(matchedProduct.id)}`
      : storeBaseUrl;

    // Option A: Client-side Local Ollama already generated the reply draft and asks us to log/dispatch
    let replyDraft = String(body?.clientGeneratedReply || "").trim();
    if (!replyDraft) {
      const selectedRule =
        state.rules.find((r: AutoResponderRule) => r.id === body?.ruleId) || state.rules[0];
      const catalogContext = products
        .slice(0, 12)
        .map((p) => `- ${p.name}: ${Number(p.salePrice)} ${tenant?.currency || "MAD"}`)
        .join("\n");

      try {
        const aiRes = await generateTextWithRouter({
          system: `You are ${storeName}'s official Social Comment & Customer Auto-Responder.
Tone: ${selectedRule?.languageTone || "darija"} (Moroccan Darija/Arabic/French/English matching the customer).
Instruction: ${selectedRule?.customInstruction || "Reply politely, give exact catalog price, and include the exact clickable store/product link."}
Real Storefront URL to include verbatim: ${directProductUrl}
Live Products:\n${catalogContext || "(No products synced yet)"}`,
          messages: [{ role: "user", content: incomingComment }],
        });
        replyDraft = aiRes.text.trim();
      } catch (err: any) {
        return NextResponse.json(
          {
            error: "CLOUD_AI_UNAVAILABLE_USE_LOCAL_OLLAMA",
            message:
              err?.message ||
              "Cloud AI gateways unavailable — run reply generation directly through your Local Ollama Qwen model.",
            contextPayload: {
              storeName,
              directProductUrl,
              matchedProduct: matchedProduct
                ? { name: matchedProduct.name, price: Number(matchedProduct.salePrice) }
                : null,
              catalogContext,
            },
          },
          { status: 503 }
        );
      }
    }

    // Optional live outbound webhook dispatch when tenant connected custom_webhook / meta / whatsapp
    let dispatched = false;
    let dispatchStatus = "draft_ready";
    if (body?.dispatchWebhook === true) {
      const vaultRow = await prisma.idempotencyRecord
        .findUnique({
          where: { tenantId_scope_key: { tenantId, scope: VAULT_SCOPE, key: VAULT_KEY } },
        })
        .catch(() => null);
      const conns: StoredIntegrationRecord[] = Array.isArray((vaultRow?.responseBody as any)?.connections)
        ? (vaultRow?.responseBody as any).connections
        : [];
      const webhookConn = conns.find(
        (c) =>
          (c.serviceId === "custom_rest_api" || c.serviceId === "n8n_webhook" || c.serviceId === "make_webhook") &&
          Boolean(c.encryptedSecretsEnvelope)
      );
      if (webhookConn) {
        try {
          const secrets = decryptVaultSecrets(tenantId, webhookConn.encryptedSecretsEnvelope);
          const url = secrets.webhookUrl || secrets.endpointUrl || "";
          if (url) {
            const safeUrl = sanitizeOutboundEndpoint(url);
            const hookRes = await fetch(safeUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: "kaspi_auto_responder",
                channel: body?.channel || "facebook",
                incomingComment,
                replyDraft,
                directProductUrl,
              }),
              signal: AbortSignal.timeout(6000),
            });
            dispatched = hookRes.ok;
            dispatchStatus = hookRes.ok ? `webhook_sent_http_${hookRes.status}` : `webhook_http_${hookRes.status}`;
          }
        } catch (err: any) {
          dispatchStatus = `webhook_error: ${String(err?.message || err)}`;
        }
      } else {
        dispatchStatus = "no_webhook_connected_in_plugins";
      }
    }

    const logItem: AutoResponderEventLog = {
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
      channel: String(body?.channel || "facebook"),
      incomingComment,
      matchedProductName: matchedProduct?.name,
      replyDraft,
      storefrontUrl: directProductUrl,
      dispatched,
      dispatchStatus,
    };

    const nextLogs = [logItem, ...state.logs].slice(0, 60);
    await saveState(tenantId, { rules: state.rules, logs: nextLogs });

    return NextResponse.json({
      success: true,
      log: logItem,
      directProductUrl,
      matchedProduct: matchedProduct
        ? { id: matchedProduct.id, name: matchedProduct.name, price: Number(matchedProduct.salePrice) }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Auto-responder execution failed" },
      { status: 500 }
    );
  }
}
