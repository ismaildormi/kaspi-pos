import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import {
  computeInvoiceHash,
  generateFiscalSealCode,
  INVOICE_GENESIS_HASH,
  verifyInvoiceHashChain,
} from "@/lib/security/invoice-hash-chain";
import { recordForensicAudit } from "@/lib/security/forensic-audit";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const limitParam = Number(req.nextUrl.searchParams.get("limit") || "100");
    const limit = Math.min(Math.max(limitParam, 1), 500);

    const sales = await prisma.sale.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        storeId: true,
        receiptNumber: true,
        grandTotal: true,
        createdAt: true,
        cashierUserId: true,
        status: true,
      },
    });

    let previousHash = INVOICE_GENESIS_HASH;
    const chained = sales.map((s) => {
      const createdAtIso = s.createdAt.toISOString();
      const totalAmountMad = Number(s.grandTotal).toFixed(2);
      const currentInvoiceHash = computeInvoiceHash({
        previousInvoiceHash: previousHash,
        storeId: s.storeId,
        invoiceNumber: s.receiptNumber,
        totalAmountMad,
        createdAtIso,
        cashierId: s.cashierUserId,
      });
      const sealCode = generateFiscalSealCode(currentInvoiceHash);
      const item = {
        previousInvoiceHash: previousHash,
        storeId: s.storeId,
        invoiceNumber: s.receiptNumber,
        totalAmountMad,
        createdAtIso,
        cashierId: s.cashierUserId,
        currentInvoiceHash,
        sealCode,
      };
      previousHash = currentInvoiceHash;
      return item;
    });

    const verification = verifyInvoiceHashChain(chained, ctx.tenantId);

    return NextResponse.json({
      success: true,
      tenantId: ctx.tenantId,
      verification,
      latestSealCode: chained.length > 0 ? chained[chained.length - 1].sealCode : null,
      latestHash: chained.length > 0 ? chained[chained.length - 1].currentInvoiceHash : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unauthorized" },
      { status: err?.status || 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    const invoices = Array.isArray(body?.invoices) ? body.invoices : null;

    if (!invoices) {
      return NextResponse.json(
        { error: "invoices array is required" },
        { status: 400 }
      );
    }

    const verification = verifyInvoiceHashChain(invoices, ctx.tenantId);

    if (!verification.valid) {
      await recordForensicAudit({
        eventType: "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN",
        tenantId: ctx.tenantId,
        storeId: ctx.storeIds?.[0] || null,
        actorId: ctx.userId,
        entityType: "invoice_hash_chain",
        reason: verification.details || verification.reason,
        afterState: { verification },
        headers: req.headers,
      });
    }

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Verification failed" },
      { status: err?.status || 401 }
    );
  }
}
