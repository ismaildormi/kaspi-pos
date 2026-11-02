import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/server/db/prisma";
import {
  verifyQStashOrInternalSignature,
  type CsvImportWorkerPayload,
} from "@/lib/qstash";

interface RawCSVRow {
  name?: string;
  nom?: string;
  produit?: string;
  article?: string;
  sku?: string;
  reference?: string;
  code?: string;
  barcode?: string;
  ean?: string;
  code_barre?: string;
  category?: string;
  categorie?: string;
  famille?: string;
  price?: string | number;
  sale_price?: string | number;
  prix?: string | number;
  prix_vente?: string | number;
  cost_price?: string | number;
  prix_achat?: string | number;
  stock?: string | number;
  quantity?: string | number;
  quantite?: string | number;
  tax_rate?: string | number;
  tva?: string | number;
  [key: string]: any;
}

function normalizeCsvRow(raw: RawCSVRow, rowNumber: number) {
  const errors: string[] = [];
  const name = (
    raw.name ||
    raw.nom ||
    raw.produit ||
    raw.article ||
    raw["الاسم"] ||
    ""
  )
    .toString()
    .trim();
  if (!name) errors.push("Missing product name");

  const rawPrice =
    raw.price ??
    raw.sale_price ??
    raw.prix ??
    raw.prix_vente ??
    raw["السعر"];
  const parsedPrice = parseFloat(String(rawPrice || "0").replace(",", "."));
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.push("Invalid sale price");
  }

  const rawCost = raw.cost_price ?? raw.prix_achat ?? raw.cout;
  const parsedCost = rawCost
    ? parseFloat(String(rawCost).replace(",", "."))
    : null;

  let sku = (raw.sku || raw.reference || raw.code || "").toString().trim();
  if (!sku && name) {
    sku = `SKU-${name
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "X")}-${rowNumber}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }

  const barcode =
    (raw.barcode || raw.ean || raw.code_barre || raw["باركود"] || "")
      .toString()
      .trim() || null;

  const category =
    (raw.category || raw.categorie || raw.famille || raw["التصنيف"] || "")
      .toString()
      .trim() || "Épicerie Générale";

  const rawStock =
    raw.stock ?? raw.quantity ?? raw.quantite ?? raw["المخزون"];
  const parsedStock = rawStock
    ? parseFloat(String(rawStock).replace(",", "."))
    : 0;

  const rawTax = raw.tax_rate ?? raw.tva ?? "20";
  const parsedTax = parseFloat(String(rawTax).replace(",", ".")) || 20;

  return {
    row: {
      rowNumber,
      name,
      sku,
      barcode,
      category,
      salePrice: parsedPrice,
      costPrice: Number.isNaN(Number(parsedCost)) ? null : parsedCost,
      stockQuantity: Number.isNaN(parsedStock) ? 0 : parsedStock,
      taxRate: parsedTax,
    },
    errors,
  };
}

const CHUNK_SIZE = 500;

export async function POST(req: NextRequest) {
  let jobId: string | undefined;

  try {
    const rawBody = await req.text();
    const qstashSignature =
      req.headers.get("upstash-signature") ||
      req.headers.get("Upstash-Signature");
    const internalSignature = req.headers.get("x-kaspi-worker-signature");

    // 1. Verify QStash Signature (or internal HMAC fallback)
    const isAuthorized = await verifyQStashOrInternalSignature(
      qstashSignature,
      internalSignature,
      rawBody,
      req.url
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid QStash signature" },
        { status: 401 }
      );
    }

    const payload: CsvImportWorkerPayload = JSON.parse(rawBody);
    jobId = payload.jobId;
    const { tenantId } = payload;

    if (!jobId || !tenantId) {
      return NextResponse.json(
        { error: "Missing jobId or tenantId in worker payload" },
        { status: 400 }
      );
    }

    // 2. Resolve rows to process (either pre-validated rows or raw CSV content)
    let validRows = payload.rows || [];
    const errorDetails: Array<{ rowNumber: number; errors: string[] }> = [];

    if (validRows.length === 0 && payload.csvContent) {
      const parsed = Papa.parse<RawCSVRow>(payload.csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      });

      const existingProducts = await prisma.product.findMany({
        where: { tenantId },
        select: { sku: true, barcode: true },
      });
      const existingSkus = new Set(
        existingProducts.map((p) => p.sku.toLowerCase())
      );
      const existingBarcodes = new Set(
        existingProducts
          .filter((p) => p.barcode)
          .map((p) => p.barcode!.toLowerCase())
      );
      const seenFileSkus = new Set<string>();

      parsed.data.forEach((raw, idx) => {
        const rowNum = idx + 2;
        const { row, errors } = normalizeCsvRow(raw, rowNum);

        if (row.sku) {
          const skuLower = row.sku.toLowerCase();
          if (seenFileSkus.has(skuLower) || existingSkus.has(skuLower)) {
            errors.push(`Duplicate SKU "${row.sku}"`);
          } else {
            seenFileSkus.add(skuLower);
          }
        }

        if (row.barcode && existingBarcodes.has(row.barcode.toLowerCase())) {
          errors.push(`Duplicate barcode "${row.barcode}"`);
        }

        if (errors.length === 0) {
          validRows.push(row);
        } else {
          errorDetails.push({ rowNumber: rowNum, errors });
        }
      });
    }

    // 3. Resolve Categories & Default Store once before chunking
    const categoryNames = Array.from(
      new Set(validRows.map((r) => r.category || "Épicerie Générale"))
    );
    const existingCats = await prisma.category.findMany({
      where: { tenantId, name: { in: categoryNames } },
    });
    const catMap = new Map(
      existingCats.map((c) => [c.name.toLowerCase(), c.id])
    );

    for (const catName of categoryNames) {
      if (!catMap.has(catName.toLowerCase())) {
        const createdCat = await prisma.category.create({
          data: { tenantId, name: catName },
        });
        catMap.set(catName.toLowerCase(), createdCat.id);
      }
    }

    const defaultStore = await prisma.store.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });

    // 4. Process CSV rows in chunks of 500 rows at a time using Prisma transactions
    let committedCount = 0;

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);

      await prisma.$transaction(async (tx) => {
        for (const r of chunk) {
          const categoryId =
            catMap.get((r.category || "Épicerie Générale").toLowerCase()) ||
            null;

          const product = await tx.product.create({
            data: {
              tenantId,
              name: r.name,
              sku: r.sku,
              barcode: r.barcode,
              categoryId,
              salePrice: r.salePrice,
              costPrice: r.costPrice,
              taxRate: r.taxRate,
              trackStock: true,
            },
          });

          if (defaultStore && r.stockQuantity > 0) {
            await tx.stockLevel.upsert({
              where: {
                tenantId_storeId_productId: {
                  tenantId,
                  storeId: defaultStore.id,
                  productId: product.id,
                },
              },
              create: {
                tenantId,
                storeId: defaultStore.id,
                productId: product.id,
                quantity: r.stockQuantity,
              },
              update: {
                quantity: { increment: r.stockQuantity },
              },
            });
          }

          committedCount++;
        }
      });
    }

    // 5. Update ProductImportJob status to 'committed'
    await prisma.productImportJob.update({
      where: { id: jobId },
      data: {
        status: "committed",
        totalRows: validRows.length + errorDetails.length,
        validRows: committedCount,
        errorRows: errorDetails.length > 0 ? errorDetails : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: "committed",
      committedCount,
    });
  } catch (err: any) {
    console.error("[QStash CSV Import Worker] Error:", err);

    if (jobId) {
      await prisma.productImportJob
        .update({
          where: { id: jobId },
          data: {
            status: "failed",
            errorRows: [{ error: err?.message || "Worker execution failed" }],
          },
        })
        .catch(() => {});
    }

    return NextResponse.json(
      { error: err?.message || "CSV Import Worker failed" },
      { status: 500 }
    );
  }
}
