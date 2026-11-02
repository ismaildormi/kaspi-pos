import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";
import { jsonOk, handleApiError, AppError } from "@/server/http/response";
import { toDecimal, toPrismaDecimal, roundMoney } from "@/domain/money";
import { generateNextInvoiceNumber } from "@/server/services/dgi-sequence";

const InvoiceLineSchema = z.object({
  name: z.string().min(1, "Product name required"),
  quantity: z.union([z.string(), z.number()]),
  unitPrice: z.union([z.string(), z.number()]),
  taxRate: z.union([z.string(), z.number()]).optional().default(20.00),
});

const CreateInvoiceSchema = z.object({
  storeId: z.string().uuid("Invalid store ID"),
  customerId: z.string().uuid("Invalid customer ID").optional(),
  kind: z.enum(["invoice", "quote", "credit_note"]).default("invoice"),
  saleId: z.string().uuid().optional(),
  dueDate: z.string().optional(), // YYYY-MM-DD
  paymentMethod: z.enum(["cash", "card", "transfer", "split", "credit"]).default("cash"),
  lines: z.array(InvoiceLineSchema).min(1, "Invoice must have at least one line"),
  idempotencyKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind");
    const customerId = searchParams.get("customerId");

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(kind ? { kind: kind as any } : {}),
        ...(customerId ? { customerId } : {}),
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, ice: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ invoices });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0].message, 422, parsed.error.format());
    }

    const { storeId, customerId, kind, saleId, dueDate, paymentMethod, lines, idempotencyKey } = parsed.data;

    // Fetch tenant details for seller snapshot
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
    });
    if (!tenant) throw new AppError("TENANT_NOT_FOUND", "Tenant not found", 404);

    // Fetch customer details if provided
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id: customerId } },
      });
      if (!customer) throw new AppError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    }

    // Calculate line items, subtotal, taxTotal, and Moroccan tax breakdown
    let subtotal = toDecimal(0);
    let taxTotal = toDecimal(0);
    const taxBuckets: Record<string, { base: string; tax: string }> = {};

    const computedLines = lines.map((line) => {
      const qty = toDecimal(line.quantity);
      const price = toDecimal(line.unitPrice);
      const rate = toDecimal(line.taxRate);

      const net = roundMoney(qty.times(price));
      const tax = roundMoney(net.times(rate).dividedBy(100));
      const total = roundMoney(net.plus(tax));

      subtotal = subtotal.plus(net);
      taxTotal = taxTotal.plus(tax);

      const rateKey = `${rate.toFixed(0)}%`;
      if (!taxBuckets[rateKey]) {
        taxBuckets[rateKey] = { base: net.toFixed(2), tax: tax.toFixed(2) };
      } else {
        const curBase = toDecimal(taxBuckets[rateKey].base).plus(net);
        const curTax = toDecimal(taxBuckets[rateKey].tax).plus(tax);
        taxBuckets[rateKey] = { base: curBase.toFixed(2), tax: curTax.toFixed(2) };
      }

      return {
        name: line.name,
        quantity: qty.toFixed(3),
        unitPrice: price.toFixed(2),
        taxRate: rate.toFixed(2),
        netAmount: net.toFixed(2),
        taxAmount: tax.toFixed(2),
        lineTotal: total.toFixed(2),
      };
    });

    const grandTotal = roundMoney(subtotal.plus(taxTotal));

    // DGI-compliant gap-less sequential numbering (SELECT ... FOR UPDATE).
    // Sequence increment and invoice insert share ONE transaction, so a failed
    // insert rolls back the counter too — no gaps in the official series.
    const prefix = kind === "quote" ? "DEV" : kind === "credit_note" ? "AVR" : "FAC";

    const invoice = await prisma.$transaction(async (tx) => {
      const { invoiceNumber } = await generateNextInvoiceNumber(ctx.tenantId, {
        prefix,
        tx,
      });

      return tx.invoice.create({
      data: {
        tenantId: ctx.tenantId,
        storeId,
        customerId: customerId || null,
        saleId: saleId || null,
        invoiceNumber,
        kind,
        status: kind === "quote" ? "draft" : "issued",
        issuedAt: new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal: toPrismaDecimal(subtotal),
        taxTotal: toPrismaDecimal(taxTotal),
        grandTotal: toPrismaDecimal(grandTotal),
        paymentMethod,
        currency: tenant.currency || "MAD",
        sellerSnapshot: {
          legalName: tenant.legalName,
          displayName: tenant.displayName,
          ice: tenant.ice || "N/A",
          taxId: tenant.taxId || "N/A",
          rcNumber: tenant.rcNumber || "N/A",
          address: tenant.address || "",
          city: tenant.city || "",
        },
        buyerSnapshot: customer
          ? {
              name: customer.name,
              phone: customer.phone,
              ice: customer.ice,
              taxIdentifier: customer.taxIdentifier,
              address: customer.address,
            }
          : Prisma.JsonNull,
        linesSnapshot: computedLines,
        taxBreakdown: taxBuckets,
        idempotencyKey: idempotencyKey || null,
      },
      include: {
        customer: true,
        store: true,
      },
      });
    });

    return jsonOk({ invoice }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
