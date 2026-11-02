import { NextRequest } from "next/server";
import { tool } from "ai";
import { z } from "zod";
import { streamTextWithRouter } from "@/lib/ai-router";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import { toDecimal, roundMoney } from "@/domain/money";

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
    const { messages = [], sessionId: requestedSessionId } = body;

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
            ? "Master AI • Chief Data Officer"
            : "KASPI AI Business Chat",
        },
        include: { messages: true },
      }));

    // 3. Extract and Persist the Latest User Message & Multimodal Attachments
    const incomingUserMsg = messages[messages.length - 1];
    const incomingAttachments: Array<{
      name?: string;
      contentType?: string;
      url: string;
    }> =
      incomingUserMsg?.experimental_attachments ||
      (incomingUserMsg as any)?.attachments ||
      [];

    const userPrompt =
      typeof incomingUserMsg?.content === "string"
        ? incomingUserMsg.content
        : Array.isArray(incomingUserMsg?.parts)
        ? incomingUserMsg.parts
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join(" ")
        : incomingUserMsg?.content
        ? JSON.stringify(incomingUserMsg.content)
        : "";

    const firstImageAtt = incomingAttachments.find(
      (a) =>
        a.contentType?.startsWith("image/") || a.url?.startsWith("data:image/")
    );
    const firstDocAtt = incomingAttachments.find(
      (a) =>
        a.contentType === "application/pdf" ||
        a.url?.startsWith("data:application/pdf") ||
        a.url?.endsWith(".pdf")
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

    // 4. Load Complete Chat History for Deep Context
    const historicalMessages = await prisma.aIChatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedHistory = historicalMessages.map((m) => {
      const parts: any[] = [{ type: "text", text: m.content }];
      if (m.imageUrl) {
        parts.push({ type: "image", image: m.imageUrl });
      }
      if (m.documentUrl) {
        parts.push({
          type: "file",
          data: m.documentUrl,
          mimeType: "application/pdf",
        });
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

    const activeTools = isSuperAdmin ? superAdminTools : tenantTools;

    // 6. System Instructions (Super Admin Chief Data Officer vs Standard Merchant)
    const superAdminSystemPrompt = `You are the Chief Data Officer for KASPI POS. You have full access to the platform's database. Answer the owner's questions with precise data, business insights, and strategic advice. You can see all shops, all revenue, and all AI usage. If the user asks for revenue, use the getPlatformRevenue tool.

Available Super Admin Tools:
- getPlatformStats: Total tenants, total users, and total active subscriptions.
- getPlatformRevenue: Total MRR (USD & MAD), platform GMV, and recent subscription payments.
- getAllTenantsList: List of all registered shops (name, status, creation date, sales count).
- getTenantDetails(tenantId): Detailed metrics for any specific shop (sales count, products count, last login).
- getAIUsageStats: Platform-wide AI message and session consumption.
- Plus store-level tools (getTodaySales, getLowStockProducts, getTopSellingProducts).

Always respond in the language used by the owner (Arabic, Moroccan Darija, French, or English) with executive precision.`;

    const merchantSystemPrompt = `You are KASPI AI (كسب AI), the intelligent bilingual business advisor and system analyst for KASPI POS in Morocco.
You assist retail shop owners, grocery stores (Epiceries / Hanout), cafes, and restaurants.
You have direct access to live database tools for the merchant:
- getTodaySales: checks today's transactions and revenue in Moroccan Dirhams (MAD).
- getLowStockProducts: alerts to inventory items running out (< 5 units).
- getTopSellingProducts: highlights the top 3 best-selling items this week.

Rules:
1. Always give concise, actionable business recommendations.
2. Prices and revenue MUST always be in Moroccan Dirhams (MAD / درهم).
3. Seamlessly reply in the user's language: Moroccan Darija / Arabic, French, or English.
4. When asked about sales, revenue, stock, or products, invoke the corresponding tool first.`;

    const commonConfig = {
      system: isSuperAdmin ? superAdminSystemPrompt : merchantSystemPrompt,
      messages:
        formattedHistory.length > 0
          ? formattedHistory
          : [{ role: "user" as const, content: userPrompt }],
      tools: activeTools,
      onFinish: async (event: any) => {
        if (event.text) {
          await prisma.aIChatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: "assistant",
              content: event.text,
            },
          });
          await prisma.aIChatSession.update({
            where: { id: chatSession.id },
            data: { updatedAt: new Date() },
          });
        }
      },
    };

    // 7. Multi-Gateway Key Rotation & Failover Execution
    try {
      const { streamResult, candidate } = await streamTextWithRouter(
        commonConfig as any
      );

      return streamResult.toUIMessageStreamResponse({
        headers: {
          "x-kaspi-ai-session-id": chatSession.id,
          "x-kaspi-ai-provider": candidate.providerName,
          "x-kaspi-ai-key-index": String(candidate.keyIndex),
          "x-kaspi-ai-model": candidate.modelId,
          "x-kaspi-ai-role": isSuperAdmin ? "super-admin" : "merchant",
        },
      });
    } catch (routerErr: any) {
      console.error(
        "[KASPI AI] All Multi-Gateway router candidates exhausted:",
        routerErr
      );

      let fallbackReply: string;
      if (isSuperAdmin) {
        const [pStats, pRev, aiUsage] = await Promise.all([
          fetchPlatformStats(),
          fetchPlatformRevenue(),
          fetchAIUsageStats(),
        ]);
        fallbackReply = `👑 **Master AI • Chief Data Officer (KASPI POS)**
📊 **إحصائيات المنصة الشاملة**:
• إجمالي المتاجر المسجلة (Tenants): **${pStats.totalTenants}**
• إجمالي المستخدمين: **${pStats.totalUsers}**
• الاشتراكات النشطة: **${pStats.activeSubscriptions}**
💰 **الإيرادات الشهرية المتكررة (MRR)**: **$${pRev.mrrUSD}** (≈ **${pRev.mrrMAD} MAD**) | إجمالي مبيعات المنصة (GMV): **${pRev.totalPlatformGmvMAD} MAD**
🤖 **استهلاك الذكاء الاصطناعي**: **${aiUsage.totalMessagesConsumed}** رسالة عبر **${aiUsage.totalChatSessions}** جلسة.`;
      } else {
        const sales = await fetchTodaySales(tenantId!);
        const lowStock = await fetchLowStockProducts(tenantId!, 5);
        fallbackReply = `مرحباً بك! أنا مساعد كسب الذكي (KASPI AI). 
📊 **مبيعات اليوم**: ${sales.completedSalesCount} مبيعات بمجموع ${sales.totalRevenueMAD} درهم.
⚠️ **المنتجات المنخفضة في المخزون**: ${
          lowStock.length > 0
            ? lowStock
                .map((p) => p.name + ` (${p.currentQuantity} متبقية)`)
                .join("، ")
            : "المخزون ممتاز، لا توجد نواقص."
        }`;
      }

      await prisma.aIChatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "assistant",
          content: fallbackReply,
        },
      });

      return new Response(
        `data: {"type":"text-delta","textDelta":${JSON.stringify(
          fallbackReply
        )}}\n\ndata: [DONE]\n\n`,
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "x-kaspi-ai-session-id": chatSession.id,
            "x-kaspi-ai-model": "local-fallback",
          },
        }
      );
    }
  } catch (err: any) {
    console.error("[KASPI AI] Unexpected chat route error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal AI service error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
