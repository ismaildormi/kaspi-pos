import { task, logger } from "@trigger.dev/sdk/v3";
import Papa from "papaparse";
import { prisma } from "@/server/db/prisma";

export const MAX_CSV_ROWS = 10_000;
export const CHUNK_SIZE = 500;

export interface ImportCsvTaskPayload {
  jobId?: string;
  tenantId: string;
  fileUrl?: string;
  csvContent?: string;
  rows?: Array<{
    rowNumber: number;
    name: string;
    sku: string;
    barcode: string | null;
    category: string;
    salePrice: number;
    costPrice: number | null;
    stockQuantity: number;
    taxRate: number;
  }>;
}

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
  if (!name) {
    errors.push("Missing product name");
  }

  const rawPrice =
    raw.price ??
    raw.sale_price ??
    raw.prix ??
    raw.prix_vente ??
    raw["السعر"];
  const parsedPrice = parseFloat(String(rawPrice || "0").replace(",", "."));
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.push("Invalid sale price (must be > 0 MAD)");
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

export async function executeCsvImportChunked(payload: ImportCsvTaskPayload) {
  const { jobId, tenantId, fileUrl, csvContent } = payload;

  try {
    let rawCsvText = csvContent || "";

    // If fileUrl was provided (e.g. data: URL or remote R2/HTTP URL), fetch its text
    if (!rawCsvText && fileUrl) {
      if (fileUrl.startsWith("data:")) {
        const base64Part = fileUrl.split(",")[1] || "";
        rawCsvText = Buffer.from(base64Part, "base64").toString("utf-8");
      } else if (fileUrl.startsWith("http")) {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to download CSV from ${fileUrl}`);
        }
        rawCsvText = await response.text();
      }
    }

    let validRows = (payload.rows || []).slice(0, MAX_CSV_ROWS);
    const errorDetails: Array<{ rowNumber: number; errors: string[] }> = [];

    if (validRows.length === 0 && rawCsvText) {
      const parsed = Papa.parse<RawCSVRow>(rawCsvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      });

      const cappedData = parsed.data.slice(0, MAX_CSV_ROWS);

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

      cappedData.forEach((raw, idx) => {
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

    // Resolve Categories & Default Store once before chunking
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

    // Process up to 10,000 rows in chunks of 500 rows using Prisma transactions
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

    if (jobId) {
      await prisma.productImportJob.update({
        where: { id: jobId },
        data: {
          status: "committed",
          totalRows: validRows.length + errorDetails.length,
          validRows: committedCount,
          errorRows: errorDetails.length > 0 ? errorDetails : undefined,
        },
      });
    }

    return {
      success: true,
      jobId,
      tenantId,
      committedCount,
      skippedCount: errorDetails.length,
    };
  } catch (err: any) {
    if (jobId) {
      await prisma.productImportJob
        .update({
          where: { id: jobId },
          data: {
            status: "failed",
            errorRows: [{ error: err?.message || "Trigger.dev task failed" }],
          },
        })
        .catch(() => {});
    }
    throw err;
  }
}

export const importCsvTask = task({
  id: "import-csv",
  maxDuration: 300,
  run: async (payload: ImportCsvTaskPayload) => {
    logger.info("Starting Trigger.dev CSV import job", {
      jobId: payload.jobId,
      tenantId: payload.tenantId,
      maxRows: MAX_CSV_ROWS,
      chunkSize: CHUNK_SIZE,
    });

    const result = await executeCsvImportChunked(payload);

    logger.info("Completed Trigger.dev CSV import job", result);
    return result;
  },
});
