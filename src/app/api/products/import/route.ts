import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import Papa from "papaparse";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { auth } from "@/auth";
import {
  executeCsvImportChunked,
  MAX_CSV_ROWS,
  type ImportCsvTaskPayload,
} from "@/trigger/import-csv";

export interface RawCSVRow {
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

export interface ParsedProductRow {
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

function normalizeCsvRow(
  raw: RawCSVRow,
  rowNumber: number
): { row: ParsedProductRow; errors: string[] } {
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
    errors.push("Le nom du produit est obligatoire.");
  }

  const rawPrice =
    raw.price ??
    raw.sale_price ??
    raw.prix ??
    raw.prix_vente ??
    raw["السعر"];
  const parsedPrice = parseFloat(String(rawPrice || "0").replace(",", "."));
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.push("Prix de vente invalide ou manquant (doit être > 0 MAD).");
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
      isValid: errors.length === 0,
      errors,
    },
    errors,
  };
}

async function resolveTenantAndUser(): Promise<{
  tenantId: string;
  userId?: string;
}> {
  try {
    const ctx = await getRequestContext();
    return { tenantId: ctx.tenantId, userId: ctx.userId };
  } catch {
    const session = await auth();
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { memberships: { where: { status: "active" }, take: 1 } },
      });
      const tenantId =
        dbUser?.defaultTenantId || dbUser?.memberships[0]?.tenantId;
      if (tenantId) return { tenantId, userId: session.user.id };
    }
    const fallbackTenant = await prisma.tenant.findFirst({
      select: { id: true },
    });
    if (fallbackTenant?.id) {
      return { tenantId: fallbackTenant.id };
    }
    throw new Error("Unauthorized: No active tenant context");
  }
}

/**
 * GET /api/products/import?jobId={id}
 * Polls the status of a ProductImportJob.
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await resolveTenantAndUser();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId")?.trim();

    if (!jobId) {
      return NextResponse.json(
        { error: "Parameter 'jobId' is required" },
        { status: 400 }
      );
    }

    const job = await prisma.productImportJob.findFirst({
      where: {
        id: jobId,
        tenantId,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Import job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      totalRows: job.totalRows,
      validRows: job.validRows,
      errorRows: job.errorRows,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to check import job status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/import
 * Dispatches background CSV imports via Trigger.dev (`tasks.trigger("import-csv", { fileUrl, tenantId })`)
 * and returns `202 Accepted` immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId } = await resolveTenantAndUser();
    const contentType = req.headers.get("content-type") || "";

    let csvText = "";
    let fileUrl = "";
    let fileName = "catalog-import.csv";
    let action: "preview" | "commit" = "commit";
    let rowsToCommit: ParsedProductRow[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      action =
        ((formData.get("action") as "preview" | "commit") || "preview");

      if (!file) {
        return NextResponse.json(
          { error: "Aucun fichier CSV fourni." },
          { status: 400 }
        );
      }
      fileName = file.name || fileName;
      csvText = await file.text();
      fileUrl = `data:text/csv;base64,${Buffer.from(csvText, "utf-8").toString(
        "base64"
      )}`;
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      action = json.action || "commit";
      csvText = json.csvContent || "";
      fileUrl =
        json.fileUrl ||
        (csvText
          ? `data:text/csv;base64,${Buffer.from(csvText, "utf-8").toString(
              "base64"
            )}`
          : "");
      fileName = json.fileName || fileName;
      if (json.rows && Array.isArray(json.rows)) {
        rowsToCommit = json.rows.slice(0, MAX_CSV_ROWS);
      }
    }

    // 1. Trigger.dev Background Job Dispatch (202 Accepted)
    if (
      action === "commit" &&
      (rowsToCommit.length > 0 || csvText.trim() || fileUrl)
    ) {
      // CASH FLOW PROTECTION & ANTI-ABUSE: Enforce 3 CSV imports/month per tenant (Pillar 4)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const tenantRecord = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          displayName: true,
          csvImportsUsedThisMonth: true,
          lastCsvImportMonth: true,
        },
      });

      let currentImports = tenantRecord?.csvImportsUsedThisMonth ?? 0;
      if (tenantRecord?.lastCsvImportMonth !== currentMonth) {
        currentImports = 0;
        await prisma.tenant
          .update({
            where: { id: tenantId },
            data: {
              csvImportsUsedThisMonth: 0,
              lastCsvImportMonth: currentMonth,
            },
          })
          .catch(() => {});
      }

      const MAX_MONTHLY_CSV_IMPORTS = 3;
      if (currentImports >= MAX_MONTHLY_CSV_IMPORTS) {
        return NextResponse.json(
          {
            error: `تم تجاوز الحد الأقصى لاستيراد ملفات CSV لهذا الشهر (${MAX_MONTHLY_CSV_IMPORTS}/3 استيرادات). لحماية سعة الخادم، يُرجى الانتظار للشهر القادم أو الترقية.`,
            code: "CSV_IMPORT_QUOTA_EXCEEDED",
            limit: MAX_MONTHLY_CSV_IMPORTS,
            used: currentImports,
          },
          { status: 429 }
        );
      }

      const estimatedTotal = Math.min(
        MAX_CSV_ROWS,
        rowsToCommit.length > 0
          ? rowsToCommit.length
          : Math.max(0, csvText.trim().split(/\r?\n/).length - 1)
      );

      const importJob = await prisma.productImportJob.create({
        data: {
          tenantId,
          status: "previewing",
          fileRef: fileName,
          totalRows: estimatedTotal,
          validRows: 0,
          createdBy: userId || null,
        },
      });

      const taskPayload: ImportCsvTaskPayload = {
        jobId: importJob.id,
        tenantId,
        fileUrl,
        csvContent: csvText || undefined,
        rows: rowsToCommit.length > 0 ? rowsToCommit : undefined,
      };

      let triggerRunId = `local_${importJob.id}`;
      const isTriggerConfigured =
        Boolean(process.env.TRIGGER_SECRET_KEY) &&
        process.env.TRIGGER_SECRET_KEY !== "tr_dev_your_secret_key";

      if (isTriggerConfigured) {
        const handle = await tasks.trigger<typeof import("@/trigger/import-csv").importCsvTask>(
          "import-csv",
          taskPayload
        );
        triggerRunId = handle.id;
      } else {
        // Non-blocking background execution when running locally without Trigger.dev Cloud key
        executeCsvImportChunked(taskPayload).catch((err) => {
          console.error("[Trigger.dev Local Fallback] Error:", err);
        });
      }

      return NextResponse.json(
        {
          success: true,
          status: "accepted",
          action: "commit",
          jobId: importJob.id,
          triggerRunId,
          message:
            "Your file is being processed in the background. You can continue working.",
        },
        { status: 202 }
      );
    }

    if (!csvText.trim()) {
      return NextResponse.json(
        { error: "Le contenu du fichier CSV est vide." },
        { status: 400 }
      );
    }

    // 2. Fast Preview Validation (Capped at MAX_CSV_ROWS = 10,000)
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

    const cappedRows = parseResult.data.slice(0, MAX_CSV_ROWS);

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

    const validRows: ParsedProductRow[] = [];
    const invalidRows: ParsedProductRow[] = [];
    const seenFileSkus = new Set<string>();

    cappedRows.forEach((raw, idx) => {
      const rowNum = idx + 2;
      const { row, errors } = normalizeCsvRow(raw, rowNum);

      if (row.sku) {
        const skuLower = row.sku.toLowerCase();
        if (seenFileSkus.has(skuLower)) {
          errors.push(
            `Doublon dans le fichier : la référence SKU "${row.sku}" apparaît plusieurs fois.`
          );
        } else {
          seenFileSkus.add(skuLower);
        }

        if (existingSkus.has(skuLower)) {
          errors.push(
            `La référence SKU "${row.sku}" existe déjà dans votre catalogue.`
          );
        }
      }

      if (row.barcode) {
        const barLower = row.barcode.toLowerCase();
        if (existingBarcodes.has(barLower)) {
          errors.push(
            `Le code-barres "${row.barcode}" est déjà attribué à un autre produit.`
          );
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

    return NextResponse.json({
      success: true,
      action: "preview",
      summary: {
        totalRows: cappedRows.length,
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
