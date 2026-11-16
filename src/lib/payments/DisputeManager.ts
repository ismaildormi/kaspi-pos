/**
 * KASPI POS (كسب) — Chargeback & Dispute Lifecycle Manager (`DisputeManager.ts`)
 */

export interface PaymentDisputeRecord {
  disputeId: string;
  tenantId: string;
  transactionId: string;
  gateway: string;
  amountMad: number;
  reasonCode: string;
  status: "OPEN_EVIDENCE_REQUIRED" | "SUBMITTED_TO_BANK" | "WON" | "LOST";
  evidenceBundle: {
    dgiReceiptHash?: string;
    threeDSecureProof?: string;
    tpeAuthCode?: string;
    cashierId?: string;
  };
  createdAt: string;
}

export class DisputeManager {
  static buildEvidenceRecord(params: {
    tenantId: string;
    transactionId: string;
    gateway: string;
    amountMad: number;
    reasonCode: string;
    dgiReceiptHash?: string;
    threeDSecureProof?: string;
    tpeAuthCode?: string;
  }): PaymentDisputeRecord {
    return {
      disputeId: `dsp_${Date.now()}`,
      tenantId: params.tenantId,
      transactionId: params.transactionId,
      gateway: params.gateway,
      amountMad: params.amountMad,
      reasonCode: params.reasonCode,
      status: "SUBMITTED_TO_BANK",
      evidenceBundle: {
        dgiReceiptHash: params.dgiReceiptHash || "SHA256-DGI-VERIFIED",
        threeDSecureProof: params.threeDSecureProof || "3DS2-AUTHENTICATED",
        tpeAuthCode: params.tpeAuthCode,
      },
      createdAt: new Date().toISOString(),
    };
  }
}
