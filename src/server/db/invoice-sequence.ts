import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

export type PrismaTransactionClient =
  | Prisma.TransactionClient
  | PrismaClient;

export interface NextInvoiceNumberResult {
  invoiceNumber: string;
  sequenceNumber: number;
  year: number;
  prefix: string;
}

/**
 * Generates a Moroccan DGI-compliant (Article 145 CGI) gap-less sequential
 * invoice number using PostgreSQL row-level locking (`SELECT ... FOR UPDATE`).
 *
 * Guaranteed atomic sequence generation:
 * 1. Checks or seeds the tenant's sequence row for the fiscal year & prefix.
 * 2. Locks the row with `SELECT ... FOR UPDATE`.
 * 3. Increments and persists the new sequence counter within the active transaction scope.
 * 4. Formats into `{PREFIX}-{YEAR}-{6_DIGIT_NUMBER}` (e.g., `FAC-2026-000001`).
 */
export async function generateNextInvoiceNumber(
  tenantId: string,
  options?: {
    prefix?: "FAC" | "DEV" | "AVR" | string;
    year?: number;
    tx?: PrismaTransactionClient;
  }
): Promise<NextInvoiceNumberResult> {
  const prefix = (options?.prefix || "FAC").toUpperCase();
  const year = options?.year || new Date().getFullYear();

  const executeLockAndIncrement = async (
    client: PrismaTransactionClient
  ): Promise<NextInvoiceNumberResult> => {
    // 1. Ensure the sequence row exists for (tenantId, year, prefix)
    await client.$executeRaw`
      INSERT INTO "invoice_sequences" ("id", "tenant_id", "year", "prefix", "last_number", "updated_at")
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${year}::int, ${prefix}, 0, NOW())
      ON CONFLICT ("tenant_id", "year", "prefix") DO NOTHING
    `;

    // 2. Acquire an exclusive pessimistic row-level lock (SELECT ... FOR UPDATE)
    const lockedRows = await client.$queryRaw<
      Array<{ id: string; last_number: number }>
    >`
      SELECT "id", "last_number"
      FROM "invoice_sequences"
      WHERE "tenant_id" = ${tenantId}::uuid
        AND "year" = ${year}::int
        AND "prefix" = ${prefix}
      FOR UPDATE
    `;

    const currentLast = Number(lockedRows[0]?.last_number ?? 0);
    const nextNumber = currentLast + 1;

    // 3. Persist the incremented counter within the locked transaction
    await client.$executeRaw`
      UPDATE "invoice_sequences"
      SET "last_number" = ${nextNumber}::int,
          "updated_at" = NOW()
      WHERE "tenant_id" = ${tenantId}::uuid
        AND "year" = ${year}::int
        AND "prefix" = ${prefix}
    `;

    const formattedSeq = String(nextNumber).padStart(6, "0");
    const invoiceNumber = `${prefix}-${year}-${formattedSeq}`;

    return {
      invoiceNumber,
      sequenceNumber: nextNumber,
      year,
      prefix,
    };
  };

  if (options?.tx) {
    return executeLockAndIncrement(options.tx);
  }

  return prisma.$transaction((tx) => executeLockAndIncrement(tx), {
    maxWait: 15000,
    timeout: 30000,
  });
}
