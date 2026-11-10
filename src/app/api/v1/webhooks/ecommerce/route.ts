import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") || "youcan"; // youcan or shopify
    const body = await req.json();

    console.log(`[E-Commerce Sync Webhook] Received ${platform} event:`, {
      type: body.event || body.topic || "order.created",
    });

    // 1. Process Shopify or YouCan order or product update
    if (body.line_items || body.items) {
      const items = body.line_items || body.items;

      for (const item of items) {
        const sku = item.sku;
        const barcode = item.barcode;
        const qtySold = Number(item.quantity) || 1;

        if (sku || barcode) {
          const product = await prisma.product.findFirst({
            where: {
              OR: [
                ...(sku ? [{ sku }] : []),
                ...(barcode ? [{ barcode }] : []),
              ],
            },
          });

          if (product && product.trackStock) {
            // Decrement stock in store
            const stockLevel = await prisma.stockLevel.findFirst({
              where: { productId: product.id },
            });

            if (stockLevel) {
              await prisma.stockLevel.update({
                where: { id: stockLevel.id },
                data: {
                  quantity: { decrement: qtySold },
                },
              });
              console.log(`[E-Commerce Sync] Decremented stock for ${product.name} by ${qtySold}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[E-Commerce Webhook Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook handling failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    supportedPlatforms: ["youcan", "shopify"],
    documentation: "Send POST webhook payloads from Shopify or YouCan store admin",
  });
}
