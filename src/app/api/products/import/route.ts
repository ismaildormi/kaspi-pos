import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

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

interface ParsedProductRow {
  rowNumber: number;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  salePrice: number;
  costPrice: number | null;
  stockQuantity: number;
  taxRate: number;
  isValid: boolean;
  errors: string[];
}

function normalizeRow(raw: RawCSVRow, rowNumber: number): { row: ParsedProductRow; errors: string[] } {
  const errors: string[] = [];

  // Extract Name
  const name = (raw.name || raw.nom || raw.produit || raw.article || raw["الاسم"] || "").toString().trim();
  if (!name) {
    errors.push("Le nom du produit est obligatoire.");
  }

  // Extract Sale Price
  const rawPrice = raw.price ?? raw.sale_price ?? raw.prix ?? raw.prix_vente ?? raw["السعر"];
  const parsedPrice = parseFloat(String(rawPrice || "0").replace(",", "."));
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.push("Prix de vente invalide ou manquant (doit être > 0 MAD).");
  }

  // Extract Cost Price
  const rawCost = raw.cost_price ?? raw.prix_achat ?? raw.cout;
  const parsedCost = rawCost ? parseFloat(String(rawCost).replace(",", ".")) : null;

  // Extract SKU
  let sku = (raw.sku || raw.reference || raw.code || "").toString().trim();
  if (!sku && name) {
    // Generate fallback SKU if not supplied
    sku = `SKU-${name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Extract Barcode
  const barcode = (raw.barcode || raw.ean || raw.code_barre || raw["باركود"] || "").toString().trim() || null;

  // Extract Category
  const category = (raw.category || raw.categorie || raw.famille || raw["التصنيف"] || "").toString().trim() || "Épicerie Générale";

  // Extract Stock Quantity
  const rawStock = raw.stock ?? raw.quantity ?? raw.quantite ?? raw["المخزون"];
  const parsedStock = rawStock ? parseFloat(String(rawStock).replace(",", ".")) : 0;

  // Extract Tax Rate
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
      costPrice: isNaN(Number(parsedCost)) ? null : parsedCost,
      stockQuantity: isNaN(parsedStock) ? 0 : parsedStock,
      taxRate: parsedTax,
      isValid: errors.length === 0,
      errors,
    },
    errors,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const contentType = req.headers.get("content-type") || "";

    let csvText = "";
    let action: "preview" | "commit" = "preview";
    let rowsToCommit: ParsedProductRow[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      action = (formData.get("action") as "preview" | "commit") || "preview";

      if (!file) {
        return NextResponse.json({ error: "Aucun fichier CSV fourni." }, { status: 400 });
      }
      csvText = await file.text();
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      action = json.action || "preview";
      csvText = json.csvContent || "";
      if (json.rows && Array.isArray(json.rows)) {
        rowsToCommit = json.rows;
      }
    }

    // If direct commit with pre-validated rows from client
    if (action === "commit" && rowsToCommit.length > 0) {
      const imported = await commitRows(ctx.tenantId, rowsToCommit);
      return NextResponse.json({
        success: true,
        action: "commit",
        importedCount: imported.length,
      });
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "Le contenu du fichier CSV est vide." }, { status: 400 });
    }

    // Parse CSV with PapaParse
    const parseResult = Papa.parse<RawCSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        { error: "Format CSV invalide : " + parseResult.errors[0].message },
        { status: 400 }
      );
    }

    // Existing products in DB for tenant to prevent duplicate SKUs
    const existingProducts = await prisma.product.findMany({
      where: { tenantId: ctx.tenantId },
      select: { sku: true, barcode: true },
    });
    const existingSkus = new Set(existingProducts.map((p) => p.sku.toLowerCase()));
    const existingBarcodes = new Set(
      existingProducts.filter((p) => p.barcode).map((p) => p.barcode!.toLowerCase())
    );

    const validRows: ParsedProductRow[] = [];
    const invalidRows: ParsedProductRow[] = [];
    const seenFileSkus = new Set<string>();

    parseResult.data.forEach((raw, idx) => {
      const rowNum = idx + 2; // +1 for 0-index, +1 for CSV header row
      const { row, errors } = normalizeRow(raw, rowNum);

      // Check duplicates within file
      if (row.sku) {
        const skuLower = row.sku.toLowerCase();
        if (seenFileSkus.has(skuLower)) {
          errors.push(`Doublon dans le fichier : la référence SKU "${row.sku}" apparaît plusieurs fois.`);
        } else {
          seenFileSkus.add(skuLower);
        }

        // Check duplicates against existing database
        if (existingSkus.has(skuLower)) {
          errors.push(`La référence SKU "${row.sku}" existe déjà dans votre catalogue.`);
        }
      }

      // Check barcode conflict if present
      if (row.barcode) {
        const barLower = row.barcode.toLowerCase();
        if (existingBarcodes.has(barLower)) {
          errors.push(`Le code-barres "${row.barcode}" est déjà attribué à un autre produit.`);
        }
      }

      row.isValid = errors.length === 0;
      row.errors = errors;

      if (row.isValid) {
        validRows.push(row);
      } else {
        invalidRows.push(row);
      }
    });

    // If commit action was requested in the same call
    if (action === "commit") {
      const imported = await commitRows(ctx.tenantId, validRows);
      return NextResponse.json({
        success: true,
        action: "commit",
        importedCount: imported.length,
        skippedCount: invalidRows.length,
      });
    }

    // Return Preview
    return NextResponse.json({
      success: true,
      action: "preview",
      summary: {
        totalRows: parseResult.data.length,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
      },
      validRows,
      invalidRows,
    });
  } catch (err: any) {
    console.error("[CSV Import Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur lors du traitement du fichier CSV." },
      { status: 500 }
    );
  }
}

async function commitRows(tenantId: string, rows: ParsedProductRow[]) {
  return await prisma.$transaction(async (tx) => {
    // 1. Resolve and create missing categories
    const categoryNames = Array.from(new Set(rows.map((r) => r.category)));
    const existingCats = await tx.category.findMany({
      where: { tenantId, name: { in: categoryNames } },
    });
    const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase(), c.id]));

    for (const catName of categoryNames) {
      if (!catMap.has(catName.toLowerCase())) {
        const createdCat = await tx.category.create({
          data: { tenantId, name: catName },
        });
        catMap.set(catName.toLowerCase(), createdCat.id);
      }
    }

    // 2. Fetch default store for stock level seeding
    const defaultStore = await tx.store.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });

    const createdProducts = [];

    // 3. Insert products and stock levels
    for (const r of rows) {
      const categoryId = catMap.get(r.category.toLowerCase()) || null;
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

      // Seed initial stock if specified and store exists
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

      createdProducts.push(product);
    }

    return createdProducts;
  });
}
