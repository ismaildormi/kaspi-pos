import { NextRequest } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse, stepCountIs, tool } from "ai";
import { z } from "zod";
import { streamUiResponseWithRouter } from "@/lib/ai-router";
import {
  buildFullCapabilitiesAndSourcesMarkdown,
  buildPatentBlueprintAndPdfMarker,
  classifyCognitiveIntentAndSources,
  isCapabilitiesOrSourcesTableRequest,
  isPatentOrInventionRequest,
} from "@/lib/zebra-x/core/cognitive-brain-registry";
import {
  buildStructuredDiscourseDirective,
  detectUniversalWorldLanguage,
  isLocalApiOrSdkRequest,
  runLocalOnDeviceHeyukaBrain,
} from "@/lib/heyuka/local-sovereign-brain";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import { toDecimal, roundMoney } from "@/domain/money";
import { generateProductImageUrl } from "@/lib/pollinations";
import { runPreReplyReflectionGate } from "@/lib/zebra-x/core/reflection-gate";
import {
  planXZebraToolRoute,
  selectMaskedActiveTools,
} from "@/lib/zebra-x/core/router";
import {
  authorSkillFromSuccess,
  buildLevel1SkillPromptIndex,
  importExternalSkillRepoCatalog,
  loadSkillInstructionsOnDemand,
} from "@/lib/zebra-x/core/skills-vault";
import {
  compactConversationMessages,
  loadHierarchicalYukaContext,
  spawnParallelSubAgents,
} from "@/lib/zebra-x/core/cowork-session";
import {
  autonomousToolHunt,
  fetchBigTechOrgRepos,
} from "@/lib/zebra-x/core/catalog-hunter";
import {
  refinePromptWithPhase3,
  scoreSelfCheckConsistency,
} from "@/lib/zebra-x/core/prompt-refiner";
import { runUnrestrictedWebResearch } from "@/lib/zebra-x/arsenal-vault";
import {
  BarcodeLabelPayloadSchema,
  DiagramPayloadSchema,
  ImageAssetPayloadSchema,
  LiveHtmlArtifactPayloadSchema,
  OfficeExportPayloadSchema,
  TextDiffPayloadSchema,
  UiTourPayloadSchema,
} from "@/lib/zebra-x/core/bridge-schema";
import { scrubTraceText } from "@/lib/zebra-x/learning-trace";
import { queryPublicApiHub } from "@/lib/zebra-x/tools/public-apis-hub";
import { executePolyglotCodeSandbox } from "@/lib/zebra-x/tools/code-sandbox";
import {
  computeExactRetailFinance,
  evaluateMathOrAlgebra,
  getHijriAndSolarAstronomy,
  inspectCronExpression,
  planParallelDagWaves,
  validatePhoneNumberSafe,
} from "@/lib/zebra-x/tools/math-logic-engine";
import {
  buildPdfReportToolResult,
  fetchLastCustomer,
  fetchLastReceiptTicket,
  fetchStockDemandForecast,
  preparePosSaleConfirmation,
  prepareProductAdjustmentConfirmation,
} from "@/lib/zebra-x/tools/pos-live-tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ============================================================================
// STANDARD MERCHANT TOOLS (Strict Tenant Isolation)
// ============================================================================

async function fetchTodaySales(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      completedAt: { gte: startOfDay },
      status: "completed",
    },
    select: {
      grandTotal: true,
      subtotal: true,
      taxTotal: true,
    },
  });

  const count = sales.length;
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.grandTotal), 0);
  const totalTax = sales.reduce((acc, s) => acc + Number(s.taxTotal), 0);

  return {
    date: startOfDay.toISOString().split("T")[0],
    completedSalesCount: count,
    totalRevenueMAD: totalRevenue.toFixed(2),
    totalTaxMAD: totalTax.toFixed(2),
  };
}

async function fetchLowStockProducts(tenantId: string, threshold = 5) {
  const lowStockLevels = await prisma.stockLevel.findMany({
    where: {
      tenantId,
      quantity: { lt: threshold },
    },
    take: 10,
  });

  const productIds = lowStockLevels.map((lvl) => lvl.productId);
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      salePrice: true,
    },
  });

  return lowStockLevels.map((lvl) => {
    const prod = products.find((p) => p.id === lvl.productId);
    return {
      productId: lvl.productId,
      name: prod?.name ?? "Unknown Product",
      sku: prod?.sku,
      barcode: prod?.barcode,
      currentQuantity: Number(lvl.quantity),
      salePriceMAD: Number(prod?.salePrice ?? 0).toFixed(2),
    };
  });
}

async function fetchTopSellingProducts(tenantId: string, limit = 3) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const topItems = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      tenantId,
      createdAt: { gte: sevenDaysAgo },
    },
    _sum: {
      quantity: true,
      lineTotal: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const productIds = topItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  const products = await prisma.product.findMany({
    where: {
      tenantId,
      id: { in: productIds },
    },
    select: { id: true, name: true, sku: true },
  });

  return topItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      productName: prod?.name ?? "Unknown Product",
      sku: prod?.sku,
      totalQuantitySold: Number(item._sum.quantity ?? 0),
      totalRevenueMAD: Number(item._sum.lineTotal ?? 0).toFixed(2),
    };
  });
}

// ============================================================================
// SUPER ADMIN PLATFORM-WIDE TOOLS (Chief Data Officer)
// ============================================================================

async function fetchPlatformStats() {
  const [totalTenants, totalUsers, activeSubscriptions, totalSalesCount] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.sale.count({ where: { status: "completed" } }),
    ]);

  return {
    totalTenants,
    totalUsers,
    activeSubscriptions,
    totalCompletedSalesPlatformWide: totalSalesCount,
  };
}

async function fetchPlatformRevenue() {
  const [activeSubs, recentPayments, gmvAgg] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: true, tenant: { select: { displayName: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        tenant: { select: { displayName: true, slug: true } },
      },
    }),
    prisma.sale.aggregate({
      where: { status: "completed" },
      _sum: { grandTotal: true },
    }),
  ]);

  let mrrUsd = toDecimal(0);
  for (const sub of activeSubs) {
    if (sub.plan) {
      const price = toDecimal(sub.plan.price);
      mrrUsd =
        sub.billingInterval === "yearly"
          ? mrrUsd.plus(price.dividedBy(12))
          : mrrUsd.plus(price);
    } else {
      mrrUsd = mrrUsd.plus(10);
    }
  }

  const mrrUsdFormatted = roundMoney(mrrUsd).toFixed(2);
  const mrrMadFormatted = roundMoney(mrrUsd.times(10)).toFixed(2);
  const totalPlatformGmvMad = toDecimal(gmvAgg._sum.grandTotal || 0).toFixed(2);

  return {
    mrrUSD: mrrUsdFormatted,
    mrrMAD: mrrMadFormatted,
    activeSubscriptionsCount: activeSubs.length,
    totalPlatformGmvMAD: totalPlatformGmvMad,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      tenantName: p.tenant.displayName,
      provider: p.provider,
      amount: Number(p.amount).toFixed(2),
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString() : p.createdAt.toISOString(),
    })),
  };
}

async function fetchAllTenantsList() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          stores: true,
          memberships: true,
          products: true,
          sales: true,
        },
      },
    },
  });

  return tenants.map((t) => ({
    tenantId: t.id,
    displayName: t.displayName,
    legalName: t.legalName,
    slug: t.slug,
    city: t.city || "Maroc",
    ice: t.ice,
    status: t.status,
    subscriptionStatus: t.subscriptions[0]?.status || "free",
    storesCount: t._count.stores,
    usersCount: t._count.memberships,
    productsCount: t._count.products,
    salesCount: t._count.sales,
    createdAt: t.createdAt.toISOString(),
  }));
}

async function fetchTenantDetails(tenantIdOrName: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        ...(z.string().uuid().safeParse(tenantIdOrName).success
          ? [{ id: tenantIdOrName }]
          : []),
        { slug: { contains: tenantIdOrName, mode: "insensitive" } },
        { displayName: { contains: tenantIdOrName, mode: "insensitive" } },
        { legalName: { contains: tenantIdOrName, mode: "insensitive" } },
      ],
    },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              lastLoginAt: true,
            },
          },
        },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          sales: true,
          products: true,
          customers: true,
          stores: true,
        },
      },
    },
  });

  if (!tenant) {
    return { error: `No tenant found matching "${tenantIdOrName}".` };
  }

  const salesRevenue = await prisma.sale.aggregate({
    where: { tenantId: tenant.id, status: "completed" },
    _sum: { grandTotal: true },
  });

  const lastLogins = tenant.memberships
    .map((m) => m.user.lastLoginAt)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime());

  return {
    tenantId: tenant.id,
    displayName: tenant.displayName,
    legalName: tenant.legalName,
    slug: tenant.slug,
    status: tenant.status,
    city: tenant.city,
    ice: tenant.ice,
    salesCount: tenant._count.sales,
    totalSalesRevenueMAD: toDecimal(salesRevenue._sum.grandTotal || 0).toFixed(2),
    productsCount: tenant._count.products,
    customersCount: tenant._count.customers,
    storesCount: tenant._count.stores,
    lastLoginAt: lastLogins[0] ? lastLogins[0].toISOString() : null,
    ownerEmail: tenant.memberships[0]?.user.email || null,
    subscriptionStatus: tenant.subscriptions[0]?.status || "free",
    createdAt: tenant.createdAt.toISOString(),
  };
}

async function fetchAIUsageStats() {
  const [totalSessions, totalMessages, userMessages, assistantMessages, recentSessions] =
    await Promise.all([
      prisma.aIChatSession.count(),
      prisma.aIChatMessage.count(),
      prisma.aIChatMessage.count({ where: { role: "user" } }),
      prisma.aIChatMessage.count({ where: { role: "assistant" } }),
      prisma.aIChatSession.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          tenant: { select: { displayName: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

  return {
    totalChatSessions: totalSessions,
    totalMessagesConsumed: totalMessages,
    userPromptsCount: userMessages,
    assistantResponsesCount: assistantMessages,
    recentActiveTenantSessions: recentSessions.map((s) => ({
      sessionId: s.id,
      tenantName: s.tenant?.displayName ?? "Master Admin",
      messagesCount: s._count.messages,
      lastUpdatedAt: s.updatedAt.toISOString(),
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      sessionId: requestedSessionId,
      locale: requestLocale,
      activityContext = "",
      recalledMemoryContext = "",
    } = body;
    const headerLocale = req.headers.get("x-app-locale") || req.cookies.get("NEXT_LOCALE")?.value;
    const clientLocale = (requestLocale || headerLocale || "ar").toLowerCase();
    const isEnLocale = clientLocale.startsWith("en");
    const isFrLocale = clientLocale.startsWith("fr");
    const targetLanguageName = isEnLocale ? "English" : isFrLocale ? "French" : "Arabic";
    const expectedShortLocale: "ar" | "fr" | "en" = isEnLocale ? "en" : isFrLocale ? "fr" : "ar";
    const clientActivityLog = typeof activityContext === "string" ? scrubTraceText(activityContext, 2400) : "";
    const clientMemoryContext =
      typeof recalledMemoryContext === "string" ? scrubTraceText(recalledMemoryContext, 1800) : "";

    // 1. Resolve Authenticated User & Super Admin Status
    let tenantId: string | undefined;
    let userId: string | undefined;
    let isSuperAdmin = false;

    try {
      const ctx = await getRequestContext();
      tenantId = ctx.tenantId;
      userId = ctx.userId;
      const dbUser = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { isSuperAdmin: true },
      });
      isSuperAdmin = Boolean(dbUser?.isSuperAdmin);
    } catch {
      // Check NextAuth session fallback
      try {
        const nextAuthSession = await auth();
        if (nextAuthSession?.user?.id) {
          userId = nextAuthSession.user.id;
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { memberships: { where: { status: "active" }, take: 1 } },
          });
          isSuperAdmin = Boolean(
            dbUser?.isSuperAdmin || (nextAuthSession.user as any)?.isSuperAdmin
          );
          tenantId = dbUser?.defaultTenantId || dbUser?.memberships[0]?.tenantId;
        }
      } catch {
        // Ignore NextAuth lookup error
      }
    }

    // Fallback to first active tenant in dev/guest mode if needed
    if (!tenantId || !userId) {
      const defaultTenant = await prisma.tenant.findFirst({
        OrderBy: undefined,
        include: {
          memberships: {
            include: { user: true },
          },
        },
      } as any);

      if (!defaultTenant) {
        return new Response(
          JSON.stringify({ error: "No active tenant found in database." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      tenantId = tenantId || defaultTenant.id;
      userId =
        userId ||
        (defaultTenant as any).memberships?.[0]?.userId ||
        defaultTenant.id;
    }

    // 1.1 CASH FLOW PROTECTION & ANTI-ABUSE: Enforce 30 AI messages/day per merchant (Pillar 4)
    if (!isSuperAdmin && tenantId) {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayDate = new Date(todayStr);

      const tenantRecord = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          displayName: true,
          aiMessagesUsedToday: true,
          lastAiMessageDate: true,
        },
      });

      let currentUsage = tenantRecord?.aiMessagesUsedToday ?? 0;
      const lastRecordedDate = tenantRecord?.lastAiMessageDate
        ? new Date(tenantRecord.lastAiMessageDate).toISOString().split("T")[0]
        : null;

      // Unlimited Zero-Owner-Cost telemetry tracking (no blocking 429 cutoff)
      if (lastRecordedDate !== todayStr) {
        currentUsage = 0;
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            aiMessagesUsedToday: 0,
            lastAiMessageDate: todayDate,
          },
        });
      }
    }

    // 2. Resolve or Create Persistent AI Chat Session
    const existingSession = requestedSessionId
      ? await prisma.aIChatSession.findUnique({
          where: { id: requestedSessionId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    const chatSession =
      existingSession ??
      (await prisma.aIChatSession.create({
        data: {
          tenantId: tenantId!,
          userId: userId!,
          title: isSuperAdmin
            ? "HEYUKA Sovereign • Chief Data Officer"
            : "HEYUKA Business Chat",
        },
        include: { messages: true },
      }));

    // 3. Extract and Persist the Latest User Message & Multimodal Attachments
    const incomingUserMsg = messages[messages.length - 1];
    const extractMsgPartsAttachments = (msg: any): Array<{ name?: string; contentType?: string; url: string }> => {
      const fromExp = msg?.experimental_attachments || msg?.attachments || [];
      const fromParts = Array.isArray(msg?.parts)
        ? msg.parts
            .filter((p: any) => p?.type === "file" && typeof p?.url === "string")
            .map((p: any) => ({
              name: p.filename || p.name,
              contentType: p.mediaType || p.mimeType || "",
              url: p.url,
            }))
        : [];
      return [...fromExp, ...fromParts];
    };

    const incomingAttachments = extractMsgPartsAttachments(incomingUserMsg);

    const extractTextFromMsg = (msg: any): string =>
      typeof msg?.content === "string"
        ? msg.content
        : Array.isArray(msg?.parts)
        ? msg.parts
            .filter((p: any) => p?.type === "text")
            .map((p: any) => p?.text || "")
            .join(" ")
        : msg?.content
        ? JSON.stringify(msg.content)
        : "";

    const userPrompt = extractTextFromMsg(incomingUserMsg);

    const firstImageAtt = incomingAttachments.find(
      (a) =>
        a.contentType?.startsWith("image/") || a.url?.startsWith("data:image/")
    );
    const firstDocAtt = incomingAttachments.find(
      (a) =>
        !(a.contentType?.startsWith("image/") || a.url?.startsWith("data:image/")) &&
        Boolean(a.url)
    );

    if (userPrompt || incomingAttachments.length > 0) {
      await prisma.aIChatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "user",
          content: userPrompt || "(Uploaded attachment)",
          imageUrl: firstImageAtt?.url || null,
          documentUrl: firstDocAtt?.url || null,
        },
      });
    }

    // 3.5 Merchant AI Studio & Universal Retail Intelligence (Unrestricted)
    // Allows full business, code, website building, document generation, and multilingual queries.

    // 4. Load Complete Chat History (merge persisted DB messages OR full client UIMessage[] multi-turn history)
    const historicalMessages = await prisma.aIChatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedHistory =
      messages.length > historicalMessages.length
        ? messages
            .slice(-14)
            .filter((m: any) => m?.role === "user" || m?.role === "assistant")
            .map((m: any, idx: number, arr: any[]) => {
              const txt = extractTextFromMsg(m);
              const isLatest = idx === arr.length - 1;
              if (!isLatest) {
                return {
                  role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                  content: txt || "...",
                };
              }
              const atts = extractMsgPartsAttachments(m);
              const parts: any[] = [{ type: "text", text: txt || "Analyze attachment" }];
              for (const att of atts) {
                const mime = att.contentType || "";
                if (mime.startsWith("image/") || att.url?.startsWith("data:image/")) {
                  parts.push({ type: "image", image: att.url });
                } else if (att.url?.startsWith("data:application/pdf") || mime === "application/pdf") {
                  parts.push({ type: "file", data: att.url, mimeType: "application/pdf" });
                } else if (att.url?.startsWith("data:")) {
                  const mm = att.url.match(/^data:([^;]+);base64,(.+)$/);
                  if (mm?.[2] && (mm[1].startsWith("text/") || /json|xml|javascript|csv/i.test(mm[1]))) {
                    try {
                      const decoded = Buffer.from(mm[2], "base64").toString("utf8").slice(0, 12000);
                      parts.push({ type: "text", text: `\n[Attached Document Content]:\n${decoded}` });
                    } catch {}
                  }
                }
              }
              return {
                role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
                content: parts.length > 1 ? parts : txt,
              };
            })
        : historicalMessages.map((m) => {
            const parts: any[] = [{ type: "text", text: m.content }];
            if (m.imageUrl) {
              parts.push({ type: "image", image: m.imageUrl });
            }
            if (m.documentUrl) {
              const mimeMatch = m.documentUrl.match(/^data:([^;]+);base64,(.+)$/);
              const mime = mimeMatch?.[1] || "application/pdf";
              if (mime === "application/pdf" || m.documentUrl.endsWith(".pdf")) {
                parts.push({
                  type: "file",
                  data: m.documentUrl,
                  mimeType: "application/pdf",
                });
              } else if (mimeMatch?.[2] && (mime.startsWith("text/") || /json|xml|javascript|csv/i.test(mime))) {
                try {
                  const decodedDoc = Buffer.from(mimeMatch[2], "base64").toString("utf8").slice(0, 12000);
                  parts.push({ type: "text", text: `\n[Attached Document Content]:\n${decodedDoc}` });
                } catch {
                  parts.push({ type: "file", data: m.documentUrl, mimeType: mime });
                }
              } else {
                parts.push({ type: "file", data: m.documentUrl, mimeType: mime });
              }
            }

            return {
              role: (m.role === "user" ? "user" : "assistant") as
                | "user"
                | "assistant",
              content: parts.length > 1 ? parts : m.content,
            };
          });

    // 5. Define Tools Based on Privilege (Super Admin vs Standard Tenant)
    const tenantTools = {
      getTodaySales: tool({
        description:
          "Returns today's completed sales count, gross revenue in MAD, and tax collected for the authenticated shop.",
        inputSchema: z.object({}),
        execute: async () => fetchTodaySales(tenantId!),
      }),

      getLowStockProducts: tool({
        description:
          "Returns list of products whose stock level is critically low (< 5 units) for the authenticated shop.",
        inputSchema: z.object({
          threshold: z.number().optional().default(5),
        }),
        execute: async ({ threshold }: { threshold?: number }) =>
          fetchLowStockProducts(tenantId!, threshold ?? 5),
      }),

      getTopSellingProducts: tool({
        description:
          "Returns top 3 best-selling products by quantity sold over the last 7 days for the authenticated shop.",
        inputSchema: z.object({
          limit: z.number().optional().default(3),
        }),
        execute: async ({ limit }: { limit?: number }) =>
          fetchTopSellingProducts(tenantId!, limit ?? 3),
      }),

      getLastCustomer: tool({
        description:
          "Returns details of the last served or recently recorded customer in the shop (name, phone, last order receipt, amount in MAD, credit balance).",
        inputSchema: z.object({}),
        execute: async () => fetchLastCustomer(tenantId!),
      }),

      getLastReceiptTicket: tool({
        description:
          "Fetches the last completed thermal sale receipt (or specific receipt number) with all items, taxes, customer, and emits an inline [KASPI_RECEIPT_TICKET:...] card marker for PNG preview & PDF export.",
        inputSchema: z.object({
          receiptNumber: z.string().optional(),
        }),
        execute: async ({ receiptNumber }: { receiptNumber?: string }) =>
          fetchLastReceiptTicket(tenantId!, receiptNumber),
      }),

      getUserActivityLog: tool({
        description:
          "Returns the merchant's recent local UI navigation and click breadcrumbs recorded silently on their device (zero server overhead).",
        inputSchema: z.object({}),
        execute: async () => ({
          hasLocalBreadcrumbs: Boolean(clientActivityLog),
          breadcrumbs:
            clientActivityLog || "No recent clicks recorded yet in this browser tab.",
        }),
      }),

      predictStockDemand: tool({
        description:
          "Predicts which products will run out soon based on 14-day sales velocity and recommends reorder quantities.",
        inputSchema: z.object({
          limit: z.number().optional().default(8),
        }),
        execute: async ({ limit }: { limit?: number }) =>
          fetchStockDemandForecast(tenantId!, limit ?? 8),
      }),

      generatePdfReport: tool({
        description:
          "Generates a real downloadable Arabic/French/English PDF document directly in the merchant's browser. ALWAYS call this when the user asks for a PDF, table PDF, invoice PDF, or printable report, and include the returned inlineMarker verbatim in your reply.",
        inputSchema: z.object({
          title: z.string().min(1),
          subtitle: z.string().optional(),
          columns: z.array(z.string()).min(1).max(4),
          rows: z
            .array(
              z.object({
                col1: z.string(),
                col2: z.string(),
                col3: z.string().optional(),
                col4: z.string().optional(),
              })
            )
            .min(1)
            .max(100),
          totals: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
              })
            )
            .optional(),
        }),
        execute: async (input) =>
          buildPdfReportToolResult({
            ...input,
            locale: expectedShortLocale,
            shopName: "KASPI POS",
            generatedAt: new Date().toISOString(),
          }),
      }),

      preparePosActionConfirmation: tool({
        description:
          "Prepares an interactive Action Confirmation Card inside the chat for creating a POS sale checkout, applying a product discount/price update, or adjusting stock quantity. ALWAYS include the returned inlineMarker verbatim so the merchant can click Confirm.",
        inputSchema: z.object({
          kind: z.enum(["sell_cart_checkout", "apply_discount", "adjust_stock"]),
          items: z
            .array(
              z.object({
                productQuery: z.string().min(1),
                quantity: z.number().positive().default(1),
                discountPercent: z.number().min(0).max(90).optional(),
              })
            )
            .optional(),
          customerQuery: z.string().optional(),
          paymentMethod: z.enum(["cash", "card", "credit", "transfer"]).optional(),
          productQuery: z.string().optional(),
          newPriceMAD: z.number().nonnegative().optional(),
          discountPercent: z.number().min(0).max(95).optional(),
          newStockQty: z.number().nonnegative().optional(),
        }),
        execute: async (input) => {
          if (input.kind === "sell_cart_checkout") {
            return preparePosSaleConfirmation({
              tenantId: tenantId!,
              items: input.items || [],
              customerQuery: input.customerQuery,
              paymentMethod: input.paymentMethod,
              locale: expectedShortLocale,
            });
          }
          return prepareProductAdjustmentConfirmation({
            tenantId: tenantId!,
            productQuery: input.productQuery || input.items?.[0]?.productQuery || "",
            kind: input.kind,
            newPriceMAD: input.newPriceMAD,
            discountPercent: input.discountPercent,
            newStockQty: input.newStockQty,
            locale: expectedShortLocale,
          });
        },
      }),

      generateProductImage: tool({
        description:
          "Generates ANY high-resolution image, product photo, poster, logo concept, or illustration using Pollinations.ai and returns a live inline card marker ([KASPI_IMAGE:...]). ALWAYS output the returned inlineMarker verbatim on its own line.",
        inputSchema: z.object({
          productPrompt: z.string().min(2),
          title: z.string().optional(),
        }),
        execute: async ({ productPrompt, title }: { productPrompt: string; title?: string }) => {
          const imageUrl = generateProductImageUrl(productPrompt);
          const proxyUrl = `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(imageUrl)}`;
          const payload = ImageAssetPayloadSchema.parse({
            title: (title || productPrompt).slice(0, 140),
            imageUrl,
            proxyUrl,
            prompt: productPrompt.slice(0, 900),
            source: "HEYUKA Studio Diffusion",
          });
          const b64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
          return {
            imageUrl,
            proxyUrl,
            inlineMarker: `[KASPI_IMAGE:${b64}]`,
            note: "Output inlineMarker verbatim on its own line so HEYUKA renders the image, PNG download, and cutout card.",
          };
        },
      }),

      searchWebImages: tool({
        description:
          "Searches Wikipedia & Wikimedia Commons for clean photographs/images from the web and returns live inline preview markers ([KASPI_IMAGE:...]). ALWAYS include desired inlineMarker verbatim on its own line.",
        inputSchema: z.object({
          query: z.string().min(2),
        }),
        execute: async ({ query }: { query: string }) => {
          try {
            const wRes = await fetch(
              `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
                query
              )}&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json`,
              {
                headers: { "User-Agent": "KaspiPOS-HEYUKA/3.0 (https://kaspi-pos.vercel.app)" },
                signal: AbortSignal.timeout(5000),
              }
            );
            const wJson = wRes.ok ? await wRes.json().catch(() => null) : null;
            const pages = wJson?.query?.pages ? Object.values(wJson.query.pages) : [];
            const images = (pages as any[])
              .map((p) => {
                const rawUrl = String(p?.imageinfo?.[0]?.url || "");
                const thumbUrl = String(p?.imageinfo?.[0]?.thumburl || rawUrl);
                const label = String(p?.title || query).replace(/^File:/i, "");
                if (!rawUrl) return null;
                const payload = ImageAssetPayloadSchema.parse({
                  title: label.slice(0, 140),
                  imageUrl: rawUrl,
                  proxyUrl: `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(thumbUrl)}`,
                  source: "Wikimedia Commons",
                });
                const b64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
                return {
                  title: label,
                  url: rawUrl,
                  thumbnail: thumbUrl,
                  inlineMarker: `[KASPI_IMAGE:${b64}]`,
                };
              })
              .filter(Boolean);
            return { query, images };
          } catch {
            return { query, images: [] };
          }
        },
      }),

      queryPublicApi: tool({
        description:
          "Queries 32 live No-Key public web APIs with caching: products (openfoodfacts, openbeautyfacts, openproductfacts), live 200+ world/crypto FX rates (fx_rates, crypto_market), weather, geocoding (geocode), B2B suppliers/factories near city (b2b_overpass, e.g. 'bakery|Casablanca'), company registry (gleif_company), countries (country_info), encyclopedias (wikipedia, wikidata_sparql, duckduckgo), economy & papers (world_bank, openalex_science, nobel_prize, patents_inventor), health (openfda_drug, pubmed_papers), agriculture (soilgrids_agri, nasa_power_agri), evolution/fossils (paleobiology_fossils, open_tree_of_life), tech trends/remote jobs (hacker_news, remote_jobs), vector logos (iconify_logos), Search-First visual references & 3D assets (openverse_media, met_museum, polyhaven_3d), and Smart City transit/POI/air quality (transit_stops, smart_city_poi, air_quality).",
        inputSchema: z.object({
          category: z.enum([
            "openfoodfacts",
            "openbeautyfacts",
            "openproductfacts",
            "fx_rates",
            "crypto_market",
            "weather",
            "geocode",
            "b2b_overpass",
            "gleif_company",
            "country_info",
            "wikipedia",
            "wikidata_sparql",
            "duckduckgo",
            "world_bank",
            "openalex_science",
            "openfda_drug",
            "pubmed_papers",
            "soilgrids_agri",
            "nasa_power_agri",
            "paleobiology_fossils",
            "open_tree_of_life",
            "patents_inventor",
            "nobel_prize",
            "hacker_news",
            "remote_jobs",
            "iconify_logos",
            "openverse_media",
            "met_museum",
            "polyhaven_3d",
            "transit_stops",
            "smart_city_poi",
            "air_quality",
            "nador_marine_weather",
            "cyber_threat_intel",
            "osrm_routing",
            "usgs_earthquakes",
            "nasa_eonet_events",
            "nhtsa_recalls_vehicles",
            "disease_health_stats",
            "rxnav_drugs",
            "wger_workouts",
            "openlibrary_books",
            "gbif_biodiversity",
            "frankfurter_fx",
            "themealdb_recipes",
            "opensky_flights",
            "google_patents",
          ]),
          query: z.string().min(1),
          base: z.string().optional().describe("Base currency for fx_rates (e.g. MAD, USD, EUR)"),
          limit: z.number().optional().default(6),
        }),
        execute: async (input) => {
          const res = await queryPublicApiHub({
            category: input.category,
            query: input.query,
            base: input.base,
            lang: expectedShortLocale,
            limit: input.limit,
          });
          if (input.category === "google_patents" && res.ok) {
            const patList = Array.isArray((res.data as any)?.patents) ? (res.data as any).patents : [];
            const bp = buildPatentBlueprintAndPdfMarker({
              query: input.query,
              patentRecords: patList,
              locale: expectedShortLocale,
            });
            return { ...res, inlineMarker: bp.pdfMarker, patentTableMarkdown: bp.markdownSupplement };
          }
          return res;
        },
      }),

      evaluateMathAndFinance: tool({
        description:
          "Evaluates arithmetic, symbolic algebra/equations/calculus (nerdamer + mathjs + KaTeX), exact VAT/margin/currency math (Dinero + Decimal), OR parallel project DAG planning (Graphlib). Returns exact values and optional interactive LaTeX/Mermaid inlineMarker.",
        inputSchema: z.object({
          mode: z.enum(["math_algebra", "retail_finance", "dag_plan"]),
          expression: z.string().optional(),
          preferAlgebra: z.boolean().optional(),
          unitPrice: z.number().optional(),
          quantity: z.number().optional(),
          vatPercent: z.number().optional(),
          discountPercent: z.number().optional(),
          currencyCode: z.enum(["MAD", "USD", "EUR", "GBP", "SAR", "AED"]).optional(),
          fxToMadRate: z.number().optional(),
          dagTasks: z
            .array(
              z.object({
                id: z.string(),
                label: z.string().optional(),
                dependsOn: z.array(z.string()).optional(),
              })
            )
            .optional(),
        }),
        execute: async (input) => {
          if (input.mode === "retail_finance") {
            return computeExactRetailFinance({
              unitPrice: input.unitPrice ?? 0,
              quantity: input.quantity,
              vatPercent: input.vatPercent,
              discountPercent: input.discountPercent,
              currencyCode: input.currencyCode,
              fxToMadRate: input.fxToMadRate,
            });
          }
          if (input.mode === "dag_plan") {
            const dag = await planParallelDagWaves(input.dagTasks || []);
            const b64 = Buffer.from(
              JSON.stringify(
                DiagramPayloadSchema.parse({
                  kind: "mermaid",
                  title: "Parallel Execution Plan",
                  code: dag.mermaidDiagram,
                })
              ),
              "utf-8"
            ).toString("base64");
            return { ...dag, inlineMarker: `[KASPI_DIAGRAM:${b64}]` };
          }
          return evaluateMathOrAlgebra(input.expression || "0", input.preferAlgebra);
        },
      }),

      createRichArtifactOrExport: tool({
        description:
          "Builds downloadable Word (.docx), Excel (.xlsx), or PowerPoint (.pptx) files; interactive Mermaid/Markmap/KaTeX diagrams; Live HTML/CSS/JS interactive sandboxes or 3D .glb viewers; side-by-side Text Diffs; printable Product Barcode/QR labels; or interactive on-screen UI Spotlight Tours. ALWAYS include returned inlineMarker verbatim.",
        inputSchema: z.object({
          artifactType: z.enum([
            "office_export",
            "diagram",
            "barcode_label",
            "live_html",
            "text_diff",
            "ui_tour",
          ]),
          payload: z.record(z.string(), z.unknown()),
        }),
        execute: async ({ artifactType, payload }) => {
          const toB64 = (obj: unknown) => Buffer.from(JSON.stringify(obj), "utf-8").toString("base64");
          if (artifactType === "office_export") {
            const validated = OfficeExportPayloadSchema.parse({
              locale: expectedShortLocale,
              ...payload,
            });
            return { ok: true, inlineMarker: `[KASPI_OFFICE_EXPORT:${toB64(validated)}]` };
          }
          if (artifactType === "diagram") {
            const validated = DiagramPayloadSchema.parse(payload);
            return { ok: true, inlineMarker: `[KASPI_DIAGRAM:${toB64(validated)}]` };
          }
          if (artifactType === "barcode_label") {
            const validated = BarcodeLabelPayloadSchema.parse(payload);
            return { ok: true, inlineMarker: `[KASPI_BARCODE_LABEL:${toB64(validated)}]` };
          }
          if (artifactType === "live_html") {
            const validated = LiveHtmlArtifactPayloadSchema.parse(payload);
            return { ok: true, inlineMarker: `[KASPI_LIVE_ARTIFACT:${toB64(validated)}]` };
          }
          if (artifactType === "text_diff") {
            const validated = TextDiffPayloadSchema.parse(payload);
            return { ok: true, inlineMarker: `[KASPI_TEXT_DIFF:${toB64(validated)}]` };
          }
          const validated = UiTourPayloadSchema.parse(payload);
          return { ok: true, inlineMarker: `[KASPI_UI_TOUR:${toB64(validated)}]` };
        },
      }),

      checkPhoneCalendarOrCron: tool({
        description:
          "Validates international/Moroccan phone numbers (libphonenumber-js) to catch invalid COD orders, computes Umm al-Qura Hijri date + Sunrise/Sunset/Moon times (SunCalc), or predicts next runs of cron schedules.",
        inputSchema: z.object({
          mode: z.enum(["phone", "hijri_sun", "cron"]),
          phone: z.string().optional(),
          defaultCountry: z.string().optional().default("MA"),
          dateIso: z.string().optional(),
          lat: z.number().optional(),
          lon: z.number().optional(),
          cronExpr: z.string().optional(),
        }),
        execute: async (input) => {
          if (input.mode === "phone") {
            return validatePhoneNumberSafe(input.phone || "", input.defaultCountry || "MA");
          }
          if (input.mode === "cron") {
            return inspectCronExpression(input.cronExpr || "0 22 * * *", 5);
          }
          return getHijriAndSolarAstronomy({
            dateIso: input.dateIso,
            lat: input.lat,
            lon: input.lon,
          });
        },
      }),

      unrestrictedWebSearch: tool({
        description:
          "Searches the open web (SearXNG public meta-search + DuckDuckGo + Wikipedia) or safely extracts readable content from a public external URL (Jina Reader Markdown + fallback) across ANY subject worldwide.",
        inputSchema: z.object({
          query: z.string().optional().describe("Open web search query for any topic"),
          url: z.string().optional().describe("Optional public HTTP/HTTPS external URL to inspect"),
        }),
        execute: async (input) =>
          runUnrestrictedWebResearch({
            query: input.query,
            url: input.url,
            lang: expectedShortLocale,
          }),
      }),

      executeCodeSandbox: tool({
        description:
          "Safely executes isolated Python, JavaScript, TypeScript, Bash, PHP, C++, or Go scripts in a zero-key remote Judge0 CE / Godbolt / V8 sandbox to test algorithms, crunch data, or validate code snippets.",
        inputSchema: z.object({
          language: z.enum(["python", "javascript", "typescript", "bash", "php", "go", "c++"]),
          code: z.string().min(1).max(16000),
          stdin: z.string().optional(),
        }),
        execute: async ({ language, code, stdin }) =>
          executePolyglotCodeSandbox({ language, code, stdin }),
      }),

      lookupSkillOrAuthor: tool({
        description:
          "Progressive Agent Skills engine (SKILL.md): loads Level-2 instructions for a named skill on-demand, indexes official skill repos (anthropics/skills, awesome-agent-skills, Fabric, cursorrules), or authors a new reusable skill after solving a complex workflow.",
        inputSchema: z.object({
          action: z.enum(["load", "author", "import_repo"]),
          skillIdOrName: z.string().optional(),
          domain: z
            .enum([
              "commerce",
              "creative-suite",
              "3d",
              "web",
              "science",
              "document-factory",
              "engineering",
            ])
            .optional(),
          description: z.string().optional(),
          steps: z.array(z.string()).optional(),
          repoSlug: z.string().optional(),
        }),
        execute: async (input) => {
          if (input.action === "import_repo") {
            return importExternalSkillRepoCatalog(input.repoSlug || "anthropics/skills");
          }
          if (input.action === "author" && input.skillIdOrName && input.description) {
            return authorSkillFromSuccess({
              name: input.skillIdOrName,
              domain: input.domain || "engineering",
              description: input.description,
              steps: input.steps || [input.description],
              toolNames: ["lookupSkillOrAuthor"],
              tags: [input.domain || "engineering", "auto-authored"],
            });
          }
          const loaded = await loadSkillInstructionsOnDemand(input.skillIdOrName || "code-sandbox-audit");
          return loaded || { found: false, message: "No matching SKILL.md found." };
        },
      }),

      discoverOpenSourceTool: tool({
        description:
          "Autonomous zero-key open-source tool hunter & Big-Tech catalog indexer (Microsoft, Google, Meta, Anthropic, xAI, NVIDIA, Cloudflare, HuggingFace, GitHub, NPM): finds top libraries for unfamiliar needs or fetches org repos.",
        inputSchema: z.object({
          mode: z.enum(["hunt_tool", "big_tech_org"]),
          queryOrOrg: z.string().min(2),
          verifyWithSandbox: z.boolean().optional(),
        }),
        execute: async ({ mode, queryOrOrg, verifyWithSandbox }) => {
          if (mode === "big_tech_org") {
            return fetchBigTechOrgRepos(queryOrOrg, 8);
          }
          return autonomousToolHunt({
            needQuery: queryOrOrg,
            verifyWithSandbox: Boolean(verifyWithSandbox),
            saveAsSkillDomain: "engineering",
          });
        },
      }),

      runCoworkSubAgents: tool({
        description:
          "Spawns isolated parallel research sub-agents (web queries & checks) and returns clean concise summaries without cluttering main chat context.",
        inputSchema: z.object({
          tasks: z
            .array(
              z.object({
                id: z.string().min(1),
                role: z.enum(["research", "analysis", "verify"]),
                query: z.string().min(2),
              })
            )
            .min(1)
            .max(4),
        }),
        execute: async ({ tasks }) => {
          const workerResults = await spawnParallelSubAgents(
            tasks.map((t) => ({ id: t.id, role: t.role, payload: t.query })),
            async (q) => runUnrestrictedWebResearch({ query: q, lang: expectedShortLocale }),
            3
          );
          return { ok: true, subAgentSummaries: workerResults };
        },
      }),

      runKaspiStudioSwarmCouncil: tool({
        description:
          "Plans and executes an Elastic 3 -> 6 -> 12 Cooperating Model Swarm for KASPI POS Studio (reports, receipts, retail automation, code/apps, offline sync, and worker bots) while keeping POS_CORE_LOCK=true intact.",
        inputSchema: z.object({
          prompt: z.string().min(2),
          scale: z.enum(["auto", "3x_fast", "6x_pro", "12x_titan"]).optional(),
          brand: z.enum(["kaspi_pos", "heyuka"]).optional(),
        }),
        execute: async ({ prompt, scale, brand }) => {
          const { planAndRunElasticCouncilSwarm } = await import(
            "@/lib/heyuka/studio/studio-orchestrator-v55-v60"
          );
          const swarm = planAndRunElasticCouncilSwarm({
            prompt,
            scale: scale || "auto",
            brand: brand || "kaspi_pos",
            locale: expectedShortLocale,
          });
          return {
            ok: true,
            openInStudioUrl: `/${expectedShortLocale}/studio?brand=${brand || "kaspi_pos"}&mode=council&q=${encodeURIComponent(prompt.slice(0, 140))}`,
            swarm,
          };
        },
      }),

      inspectSovereignVaultAndCapabilities: tool({
        description:
          "Searches the unified 2,426+ open-source HEYUKA/KASPI Sovereign Vault across all 18 cognitive clusters (v30-v60) including Virtual Desktop Bot Farm, OS Shell & File Surgeon, Elastic Swarm, Browser Factory, and Air-Gapped Offline kits.",
        inputSchema: z.object({
          query: z.string().min(1),
          limit: z.number().int().min(1).max(20).optional(),
        }),
        execute: async ({ query, limit }) => {
          const [{ resolveStrictCategoryDisambiguation, getTotalIntegratedCapabilitiesCount }, { searchSovereignVault }] =
            await Promise.all([
              import("@/lib/zebra-x/core/cognitive-brain-registry"),
              import("@/lib/heyuka/vault/sovereign-permanent-vault"),
            ]);
          return {
            ok: true,
            strictDisambiguation: resolveStrictCategoryDisambiguation(query),
            totals: getTotalIntegratedCapabilitiesCount(),
            vaultMatches: searchSovereignVault({ query, limit: limit || 8 }),
          };
        },
      }),
    };

    const superAdminTools = {
      ...tenantTools,

      getPlatformStats: tool({
        description:
          "Returns total number of tenants, total users, total active subscriptions, and total completed sales across the entire KASPI POS platform.",
        inputSchema: z.object({}),
        execute: async () => fetchPlatformStats(),
      }),

      getPlatformRevenue: tool({
        description:
          "Returns the total MRR (Monthly Recurring Revenue in USD and MAD), platform GMV in MAD, and recent subscription payments.",
        inputSchema: z.object({}),
        execute: async () => fetchPlatformRevenue(),
      }),

      getAllTenantsList: tool({
        description:
          "Returns a list of all registered shops/tenants on the platform (name, status, subscription status, creation date, stores count, sales count).",
        inputSchema: z.object({}),
        execute: async () => fetchAllTenantsList(),
      }),

      getTenantDetails: tool({
        description:
          "Returns detailed information about a specific shop/tenant by ID, slug, or shop name (sales count, total revenue, products count, last login).",
        inputSchema: z.object({
          tenantId: z
            .string()
            .describe("The tenant UUID, slug, or shop display name to inspect"),
        }),
        execute: async ({ tenantId: targetId }: { tenantId: string }) =>
          fetchTenantDetails(targetId),
      }),

      getAIUsageStats: tool({
        description:
          "Returns how many AI chat sessions and AI messages have been consumed platform-wide across all tenants.",
        inputSchema: z.object({}),
        execute: async () => fetchAIUsageStats(),
      }),
    };

    const fullTools = isSuperAdmin ? superAdminTools : tenantTools;
    const detectedWorldLang = detectUniversalWorldLanguage(userPrompt, expectedShortLocale);
    const cognitiveRoute = classifyCognitiveIntentAndSources(userPrompt, detectedWorldLang.shortLocale);
    const {
      resolveStrictCategoryDisambiguation,
      getTotalIntegratedCapabilitiesCount: getTotalsV60,
    } = await import("@/lib/zebra-x/core/cognitive-brain-registry");
    const strictDisambiguation = resolveStrictCategoryDisambiguation(userPrompt);
    const v60Totals = getTotalsV60();

    // Instant deterministic Master Capabilities & 800+ Open-Source Table / Local API SDK + Downloadable PDF Report
    if (isCapabilitiesOrSourcesTableRequest(userPrompt) || isLocalApiOrSdkRequest(userPrompt)) {
      const capabilitiesMarkdown = isCapabilitiesOrSourcesTableRequest(userPrompt)
        ? buildFullCapabilitiesAndSourcesMarkdown(detectedWorldLang.shortLocale)
        : runLocalOnDeviceHeyukaBrain({
            prompt: userPrompt,
            locale: detectedWorldLang.shortLocale,
          }).answer;
      await prisma.aIChatMessage
        .create({
          data: {
            sessionId: chatSession.id,
            role: "assistant",
            content: capabilitiesMarkdown,
          },
        })
        .catch(() => {});
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          const msgId = `cap-${Date.now()}`;
          writer.write({ type: "start" } as any);
          writer.write({ type: "start-step" } as any);
          writer.write({ type: "text-start", id: msgId } as any);
          writer.write({ type: "text-delta", id: msgId, delta: capabilitiesMarkdown } as any);
          writer.write({ type: "text-end", id: msgId } as any);
          writer.write({ type: "finish-step" } as any);
          writer.write({ type: "finish" } as any);
        },
      });
      return createUIMessageStreamResponse({
        stream,
        headers: {
          "x-kaspi-ai-session-id": chatSession.id,
          "x-kaspi-ai-provider": "HEYUKA Cognitive Brain",
          "x-kaspi-ai-model": "heyuka-unified",
        },
      });
    }

    // Live Google Patents (150M+) & Scholar Pre-Grounding when user asks about patents/inventions
    let patentPromptBlock = "";
    if (isPatentOrInventionRequest(userPrompt)) {
      const patRes = await queryPublicApiHub({
        category: "google_patents",
        query: userPrompt.slice(0, 140),
        lang: expectedShortLocale,
        limit: 5,
      }).catch(() => null);
      const patList = Array.isArray((patRes?.data as any)?.patents) ? (patRes?.data as any).patents : [];
      const bp = buildPatentBlueprintAndPdfMarker({
        query: userPrompt.slice(0, 80),
        patentRecords: patList,
        locale: expectedShortLocale,
      });
      patentPromptBlock = `\n\n[GOOGLE PATENTS 150M+ LIVE TELEMETRY & PDF BLUEPRINT]\nInclude the following verified Google Patents table and the exact [KASPI_PDF_REPORT:...] line verbatim in your response:\n${bp.markdownSupplement}\n`;
    }

    const phase3Refinement = refinePromptWithPhase3(userPrompt, expectedShortLocale);
    const routePlan = planXZebraToolRoute(
      phase3Refinement.normalization.normalizedQuery,
      isSuperAdmin
    );
    const activeTools = selectMaskedActiveTools(fullTools, routePlan, userPrompt);
    const [level1SkillsIndex, compactedHistoryRes] = await Promise.all([
      buildLevel1SkillPromptIndex(userPrompt).catch(() => ""),
      Promise.resolve(compactConversationMessages(formattedHistory)),
    ]);
    const hierarchicalDomainHint = loadHierarchicalYukaContext(
      routePlan.intents.includes("pos_metrics") || routePlan.intents.includes("pos_sale_action")
        ? "commerce"
        : routePlan.intents.includes("media_and_vision")
        ? "creative-suite"
        : routePlan.intents.includes("public_apis") || routePlan.intents.includes("universal_web_research")
        ? "web"
        : "engineering"
    );

    // 6. System Instructions (HEYUKA Sovereign Core by KASPI — Unified Connected Capabilities & Full Completion)
    const closedLoopMasterDirective = `
UNIFIED EXECUTION CONSTITUTION (HEYUKA by KASPI):
1. SOLE IDENTITY: You are HEYUKA, the unified sovereign intelligence by KASPI. Respond seamlessly in the user's exact language without internal monologue, <think> tags, or third-party model branding.
2. UNRESTRICTED CONNECTED CAPABILITIES: Every model and chat turn has unified access to ALL tools (POS store metrics, receipts, live web search, public APIs, Python/JS/Bash code sandbox, math/finance, Office/PDF/Mermaid/HTML artifacts, image tools, swarm council, sovereign vault, and persistent user memory). Never artificially limit topics or refuse legitimate software development, automation/Playwright scripting, debugging, architecture, security defense, or retail requests.
3. MANDATORY FULL COMPLETION (ZERO PREMATURE STOPS): Always complete the user's entire request cleanly from the first section to the final step (all tables, complete runnable code files, error handling, and CLI commands) without truncating, looping, or telling the user to rephrase.
4. COMBINED VISUAL + CODE DISCIPLINE: Only invoke image generation when explicitly requested; when a task requires both text/code and media/diagrams/exports, deliver the full text/code alongside clean inlineMarkers ([KASPI_IMAGE:...], [KASPI_PDF_REPORT:...], [KASPI_OFFICE_EXPORT:...], [KASPI_LIVE_ARTIFACT:...]).
5. FACTUAL ACCURACY: Execute database/web tools cleanly for live figures and never fabricate MAD totals or receipt numbers.
${phase3Refinement.systemDirectiveSnippet}`;

    const memoryPromptSnippet = clientMemoryContext
      ? `\nRECALLED EVOLVING HEYUKA MEMORY & SKILLS (Local Persistent Brain):\n${clientMemoryContext}\n`
      : "";

    const progressiveSkillsSnippet = level1SkillsIndex
      ? `\n${cognitiveRoute.cognitiveRoutingNote}\nSOVEREIGN BRAIN STATUS (v60.0): 18 Cognitive Clusters • ${v60Totals.grandTotalSources}+ Integrated Open-Source Tools • Strict Route: ${strictDisambiguation.categoryCode} (${strictDisambiguation.targetEndpoint}) • Full Google-Style Dual Studio URL: /${expectedShortLocale}/studio?brand=kaspi_pos\nPROGRESSIVE SKILL INDEX (Level-1 Metadata Only — call lookupSkillOrAuthor(load) strictly when needed):\n${level1SkillsIndex}\n${hierarchicalDomainHint}${patentPromptBlock}\n`
      : `\n${cognitiveRoute.cognitiveRoutingNote}\nSOVEREIGN BRAIN STATUS (v60.0): 18 Cognitive Clusters • ${v60Totals.grandTotalSources}+ Integrated Open-Source Tools • Strict Route: ${strictDisambiguation.categoryCode} (${strictDisambiguation.targetEndpoint}) • Full Google-Style Dual Studio URL: /${expectedShortLocale}/studio?brand=kaspi_pos\n${hierarchicalDomainHint}${patentPromptBlock}\n`;

    const activityPromptSnippet = clientActivityLog
      ? `\nCURRENT DEVICE ACTIVITY BREADCRUMBS (Local Ring Buffer):\n${clientActivityLog}\n`
      : "";

    const languageDirective = `\n${buildStructuredDiscourseDirective(detectedWorldLang)}\nMANDATORY RESPONSE LANGUAGE: Respond fluently in the user's exact detected language (${detectedWorldLang.name} / ${detectedWorldLang.nativeName}), defaulting to ${targetLanguageName} when neutral. Never reply in raw English meta-text to an Arabic/Darija prompt.`;

    const superAdminSystemPrompt = `You are HEYUKA Sovereign Executive, owned by KASPI. You have full access to the platform database and store operations.
Available Super Admin & Store Tools:
- Platform: getPlatformStats, getPlatformRevenue, getAllTenantsList, getTenantDetails, getAIUsageStats
- Store & Actions: getTodaySales, getLowStockProducts, getTopSellingProducts, predictStockDemand, getLastCustomer, getLastReceiptTicket, getUserActivityLog, generatePdfReport, preparePosActionConfirmation, generateProductImage, searchWebImages, runKaspiStudioSwarmCouncil, inspectSovereignVaultAndCapabilities
- Universal Web, Code Sandbox, Cyber, Math, Office & Vision Tools: unrestrictedWebSearch, executeCodeSandbox, queryPublicApi (34 live open APIs incl. CISA/OSV cyber intel & Nador marine), evaluateMathAndFinance, createRichArtifactOrExport, checkPhoneCalendarOrCron
${closedLoopMasterDirective}${progressiveSkillsSnippet}${memoryPromptSnippet}${activityPromptSnippet}${languageDirective}`;

    const merchantSystemPrompt = `You are HEYUKA by KASPI, the versatile, unrestricted intelligence companion & business advisor inside KASPI POS.
Available Store & Universal Arsenal Tools:
- Metrics & Awareness (Read-Only): getTodaySales, getLowStockProducts, getTopSellingProducts, predictStockDemand, getLastCustomer, getLastReceiptTicket, getUserActivityLog
- Real Exports & Explicit Action Cards: generatePdfReport, preparePosActionConfirmation
- Universal Web, Code Sandbox, Cyber, Science, Office & Vision Tools: unrestrictedWebSearch, executeCodeSandbox, queryPublicApi (34 No-Key APIs incl. Cyber Defense & Smart City), evaluateMathAndFinance, createRichArtifactOrExport, checkPhoneCalendarOrCron
- Skills, Self-Discovery, Studio Swarm & Cowork: lookupSkillOrAuthor, discoverOpenSourceTool, runCoworkSubAgents, runKaspiStudioSwarmCouncil, inspectSovereignVaultAndCapabilities
- Media & Images: generateProductImage, searchWebImages

DOMAIN & HARDWARE EXPERTISE:
- Thermal Printers (80mm/58mm ESC/POS USB/Bluetooth/Network), EAN-13 HID scanners, Electronic Scales (PLU/KG), CSV/Excel import, Moroccan TVA/DGI/ICE retail workflows.
- Prices and revenues MUST be stated clearly in MAD (درهم).
${closedLoopMasterDirective}${progressiveSkillsSnippet}${memoryPromptSnippet}${activityPromptSnippet}${languageDirective}`;

    // 7. Multi-Gateway Key Rotation & True Stream-Level Failover Execution
    try {
      const sanitizedMessages =
        compactedHistoryRes.compacted.length > 0
          ? compactedHistoryRes.compacted
          : [{ role: "user" as const, content: userPrompt }];
      return await streamUiResponseWithRouter(
        {
          system: isSuperAdmin ? superAdminSystemPrompt : merchantSystemPrompt,
          messages: sanitizedMessages,
          tools: activeTools,
          stopWhen: stepCountIs(6),
          onCompletedText: async (text: string) => {
            if (!text) return;
            const audited = runPreReplyReflectionGate({
              draftText: String(text),
              expectedLocale: expectedShortLocale,
            });
            const selfCheck = scoreSelfCheckConsistency({
              draftText: audited.cleanedText,
              expectedLocale: expectedShortLocale,
            });
            if (!selfCheck.consistent) {
              console.warn("[HEYUKA SelfCheckGPT]", selfCheck);
            }
            await prisma.aIChatMessage.create({
              data: {
                sessionId: chatSession.id,
                role: "assistant",
                content: audited.cleanedText,
              },
            });
            await prisma.aIChatSession.update({
              where: { id: chatSession.id },
              data: { updatedAt: new Date() },
            });

            if (!isSuperAdmin && tenantId) {
              await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                  aiMessagesUsedToday: { increment: 1 },
                },
              });
            }
          },
        } as any,
        {
          "x-kaspi-ai-session-id": chatSession.id,
          "x-kaspi-ai-provider": "HEYUKA Core (KASPI)",
          "x-kaspi-ai-model": "heyuka-unified",
          "x-kaspi-ai-role": isSuperAdmin ? "super-admin" : "merchant",
        }
      );
    } catch {
      const localFallback = runLocalOnDeviceHeyukaBrain({
        prompt: userPrompt,
        locale: detectedWorldLang.shortLocale,
      });
      await prisma.aIChatMessage
        .create({
          data: {
            sessionId: chatSession.id,
            role: "assistant",
            content: localFallback.answer,
          },
        })
        .catch(() => {});
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          const msgId = `local-${Date.now()}`;
          writer.write({ type: "start" } as any);
          writer.write({ type: "start-step" } as any);
          writer.write({ type: "text-start", id: msgId } as any);
          writer.write({ type: "text-delta", id: msgId, delta: localFallback.answer } as any);
          writer.write({ type: "text-end", id: msgId } as any);
          writer.write({ type: "finish-step" } as any);
          writer.write({ type: "finish" } as any);
        },
      });
      return createUIMessageStreamResponse({
        stream,
        headers: {
          "x-kaspi-ai-session-id": chatSession.id,
          "x-kaspi-ai-provider": "HEYUKA Local Sovereign Brain",
          "x-kaspi-ai-model": "heyuka-local-omni",
        },
      });
    }
  } catch (err: any) {
    console.error("[HEYUKA] Unexpected chat route error, recovering with local sovereign engine:", err);
    const rescue = runLocalOnDeviceHeyukaBrain({ prompt: "Assist cleanly", locale: "ar" });
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const msgId = `rescue-${Date.now()}`;
        writer.write({ type: "start" } as any);
        writer.write({ type: "start-step" } as any);
        writer.write({ type: "text-start", id: msgId } as any);
        writer.write({ type: "text-delta", id: msgId, delta: rescue.answer } as any);
        writer.write({ type: "text-end", id: msgId } as any);
        writer.write({ type: "finish-step" } as any);
        writer.write({ type: "finish" } as any);
      },
    });
    return createUIMessageStreamResponse({ stream });
  }
}
