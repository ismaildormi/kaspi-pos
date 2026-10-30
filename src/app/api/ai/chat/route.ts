import { NextRequest } from "next/server";
import { tool } from "ai";
import { z } from "zod";
import { streamTextWithRouter } from "@/lib/ai-router";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

// Reusable Database Stats Fetchers (Strict Tenant Isolation)
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], sessionId: requestedSessionId } = body;

    // 1. Resolve Authenticated Tenant Context
    let tenantId: string;
    let userId: string;

    try {
      const ctx = await getRequestContext();
      tenantId = ctx.tenantId;
      userId = ctx.userId;
    } catch {
      // In guest / dev mode fallback to the first active tenant or system default
      const defaultTenant = await prisma.tenant.findFirst({
        where: { status: "active" },
        include: { memberships: true },
      });

      if (!defaultTenant) {
        return new Response(JSON.stringify({ error: "No active tenant found." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      tenantId = defaultTenant.id;
      userId = defaultTenant.memberships[0]?.userId || defaultTenant.id;
    }

    // 2. Resolve or Create Persistent AI Chat Session
    let chatSession = requestedSessionId
      ? await prisma.aIChatSession.findUnique({
          where: { id: requestedSessionId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    if (!chatSession) {
      chatSession = await prisma.aIChatSession.create({
        data: {
          tenantId,
          userId,
          title: "KASPI AI Business Chat",
        },
        include: { messages: true },
      });
    }

    // 3. Extract and Persist the Latest User Message
    const incomingUserMsg = messages[messages.length - 1];
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

    if (userPrompt) {
      await prisma.aIChatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "user",
          content: userPrompt,
        },
      });
    }

    // 4. Load Complete Chat History for Deep Context
    const historicalMessages = await prisma.aIChatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedHistory = historicalMessages.map((m) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    }));

    // 5. Define Real-Time Database Tools (Function Calling with Strict Tenant Isolation)
    const tools = {
      getTodaySales: tool({
        description: "Returns today's completed sales count, gross revenue in MAD, and tax collected for the authenticated shop.",
        inputSchema: z.object({}),
        execute: async () => fetchTodaySales(tenantId),
      }),

      getLowStockProducts: tool({
        description: "Returns list of products whose stock level is critically low (< 5 units) for the authenticated shop.",
        inputSchema: z.object({
          threshold: z.number().optional().default(5),
        }),
        execute: async ({ threshold }: { threshold?: number }) =>
          fetchLowStockProducts(tenantId, threshold ?? 5),
      }),

      getTopSellingProducts: tool({
        description: "Returns top 3 best-selling products by quantity sold over the last 7 days for the authenticated shop.",
        inputSchema: z.object({
          limit: z.number().optional().default(3),
        }),
        execute: async ({ limit }: { limit?: number }) =>
          fetchTopSellingProducts(tenantId, limit ?? 3),
      }),
    };

    // 6. System Instructions (Morocco Business Context & Multi-language)
    const systemPrompt = `You are KASPI AI (كسب AI), the intelligent bilingual business advisor and system analyst for KASPI POS in Morocco.
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
      system: systemPrompt,
      messages: formattedHistory.length > 0 ? formattedHistory : [{ role: "user" as const, content: userPrompt }],
      tools,
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

    // 7. Multi-Gateway Key Rotation & Failover Execution (OpenRouter -> Gemini 1/2 -> Groq 1/2)
    try {
      const { streamResult, candidate } = streamTextWithRouter(commonConfig as any);

      return streamResult.toUIMessageStreamResponse({
        headers: {
          "x-kaspi-ai-session-id": chatSession.id,
          "x-kaspi-ai-provider": candidate.providerName,
          "x-kaspi-ai-key-index": String(candidate.keyIndex),
          "x-kaspi-ai-model": candidate.modelId,
        },
      });
    } catch (routerErr: any) {
      console.error("[KASPI AI] All Multi-Gateway router candidates exhausted:", routerErr);

      // Resilient Mock/Fallback Generator (prevents UI crash in offline/dev without live API keys)
      const sales = await fetchTodaySales(tenantId);
      const lowStock = await fetchLowStockProducts(tenantId, 5);

      const fallbackReply = `مرحباً بك! أنا مساعد كسب الذكي (KASPI AI). 
📊 **مبيعات اليوم**: ${sales.completedSalesCount} مبيعات بمجموع ${sales.totalRevenueMAD} درهم.
⚠️ **المنتجات المنخفضة في المخزون**: ${lowStock.length > 0 ? lowStock.map((p) => p.name + ` (${p.currentQuantity} متبقية)`).join("، ") : "المخزون ممتاز، لا توجد نواقص."}
💡 **نصيحة اليوم**: احرص على مراجعة النواقص قبل بداية فترة الذروة لضمان استمرارية المبيعات.`;

      await prisma.aIChatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "assistant",
          content: fallbackReply,
        },
      });

      return new Response(
        `data: {"type":"text-delta","textDelta":${JSON.stringify(fallbackReply)}}\n\ndata: [DONE]\n\n`,
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
    return new Response(JSON.stringify({ error: err?.message || "Internal AI service error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
