import crypto from "crypto";
import { dispatchP0CriticalAlert } from "@/lib/automation/smart-critical-alerter";

/**
 * KASPI POS — SHA-256 Invoice & Fiscal Receipt Hash Chaining (Layer 3)
 *
 * Links every POS sale/invoice in an unbroken cryptographic chain:
 *   currentInvoiceHash = SHA256(previousInvoiceHash + "|" + storeId + "|" + invoiceNumber + "|" + totalAmountMad + "|" + createdAtIso + "|" + cashierId)
 * Generates an 8-character Fiscal Verification Seal (`KSP-XXXX-XXXX`) for 80mm/58mm receipts and Z-Reports.
 */

export const INVOICE_GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

export interface InvoiceChainInput {
  previousInvoiceHash?: string;
  storeId: string;
  invoiceNumber: string;
  totalAmountMad: number | string;
  createdAtIso: string;
  cashierId: string;
}

export interface ChainedInvoiceRecord extends InvoiceChainInput {
  previousInvoiceHash: string;
  currentInvoiceHash: string;
  sealCode: string;
}

export interface InvoiceChainVerificationResult {
  valid: boolean;
  totalChecked: number;
  brokenAtInvoiceNumber?: string;
  reason?: "PREVIOUS_HASH_MISMATCH" | "HASH_TAMPERING_DETECTED";
  details?: string;
}

export function normalizeAmountMad(amount: number | string): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

export function computeInvoiceHash(input: InvoiceChainInput): string {
  const prev = input.previousInvoiceHash || INVOICE_GENESIS_HASH;
  const canonical = [
    prev,
    input.storeId.trim(),
    input.invoiceNumber.trim(),
    normalizeAmountMad(input.totalAmountMad),
    input.createdAtIso.trim(),
    input.cashierId.trim(),
  ].join("|");

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/**
 * Generates an 8-character uppercase Fiscal Verification Seal (`KSP-XXXX-XXXX`)
 * for display on thermal receipts (80mm/58mm) and daily Z-Reports.
 */
export function generateFiscalSealCode(currentInvoiceHash: string): string {
  const clean = currentInvoiceHash.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  const part1 = clean.slice(0, 4).padEnd(4, "0");
  const part2 = clean.slice(4, 8).padEnd(4, "0");
  return `KSP-${part1}-${part2}`;
}

export function createChainedInvoiceRecord(
  input: InvoiceChainInput
): ChainedInvoiceRecord {
  const previousInvoiceHash = input.previousInvoiceHash || INVOICE_GENESIS_HASH;
  const currentInvoiceHash = computeInvoiceHash({
    ...input,
    previousInvoiceHash,
  });
  const sealCode = generateFiscalSealCode(currentInvoiceHash);

  return {
    ...input,
    previousInvoiceHash,
    currentInvoiceHash,
    sealCode,
  };
}

/**
 * Verifies an ordered array of invoices from oldest to newest.
 * Detects deleted, backdated, or tampered invoices and dispatches a P0 alert if broken.
 */
export function verifyInvoiceHashChain(
  invoices: Array<
    InvoiceChainInput & {
      currentInvoiceHash: string;
      sealCode?: string;
    }
  >,
  tenantId?: string | null
): InvoiceChainVerificationResult {
  if (!invoices || invoices.length === 0) {
    return { valid: true, totalChecked: 0 };
  }

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];

    if (i > 0) {
      const expectedPrev = invoices[i - 1].currentInvoiceHash;
      if (inv.previousInvoiceHash !== expectedPrev) {
        void dispatchP0CriticalAlert({
          type: "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN",
          tenantId: tenantId || inv.storeId,
          summary: `Invoice hash chain broken before invoice ${inv.invoiceNumber}`,
          details: {
            invoiceNumber: inv.invoiceNumber,
            expectedPreviousHash: expectedPrev,
            actualPreviousHash: inv.previousInvoiceHash,
          },
        });
        return {
          valid: false,
          totalChecked: i + 1,
          brokenAtInvoiceNumber: inv.invoiceNumber,
          reason: "PREVIOUS_HASH_MISMATCH",
          details: `Broken link before invoice ${inv.invoiceNumber}: possible deletion or gap.`,
        };
      }
    }

    const expectedHash = computeInvoiceHash(inv);
    if (expectedHash !== inv.currentInvoiceHash) {
      void dispatchP0CriticalAlert({
        type: "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN",
        tenantId: tenantId || inv.storeId,
        summary: `Invoice content tampering detected at ${inv.invoiceNumber}`,
        details: {
          invoiceNumber: inv.invoiceNumber,
          expectedHash,
          storedHash: inv.currentInvoiceHash,
        },
      });
      return {
        valid: false,
        totalChecked: i + 1,
        brokenAtInvoiceNumber: inv.invoiceNumber,
        reason: "HASH_TAMPERING_DETECTED",
        details: `Hash mismatch at invoice ${inv.invoiceNumber}: amount, timestamp, or cashier modified.`,
      };
    }
  }

  return { valid: true, totalChecked: invoices.length };
}
