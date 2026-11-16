/**
 * KASPI POS (كسب) — Multi-Branch Settlement & Reconciliation Engine (`ReconciliationEngine.ts`)
 *
 * Reconciles POS sales, Cash Drawer X/Z reports, TPE terminal batches,
 * and YouCanPay 30% rolling reserve releases per store branch.
 */

export interface BranchSettlementSummary {
  storeId: string;
  storeName: string;
  grossSalesMad: number;
  cashCollectedMad: number;
  cardTpeCollectedMad: number;
  splitTenderCollectedMad: number;
  pendingOfflineConfirmationMad: number;
  pspFeesMad: number;
  rollingReserveHeldMad: number;
  netBankSettlementMad: number;
  isBalanced: boolean;
  discrepancyMad: number;
}

export class ReconciliationEngine {
  static reconcileBranch(params: {
    storeId: string;
    storeName: string;
    cashSalesMad: number;
    cardSalesMad: number;
    splitSalesMad?: number;
    pendingOfflineMad?: number;
    countedCashDrawerMad: number;
    openingFloatMad: number;
    cashMovementsNetMad?: number;
    pspFeePct?: number;
    reservePct?: number;
  }): BranchSettlementSummary {
    const splitSales = params.splitSalesMad || 0;
    const pendingOffline = params.pendingOfflineMad || 0;
    const grossSalesMad =
      Math.round((params.cashSalesMad + params.cardSalesMad + splitSales) * 100) / 100;

    const feePct = params.pspFeePct ?? 2.0;
    const pspFeesMad = Math.round(params.cardSalesMad * feePct) / 100;
    const reservePct = params.reservePct ?? 0;
    const rollingReserveHeldMad =
      Math.round((params.cardSalesMad - pspFeesMad) * reservePct) / 100;
    const netBankSettlementMad =
      Math.round((params.cardSalesMad - pspFeesMad - rollingReserveHeldMad) * 100) / 100;

    const expectedDrawerCash =
      params.openingFloatMad + params.cashSalesMad + (params.cashMovementsNetMad || 0);
    const discrepancyMad =
      Math.round((params.countedCashDrawerMad - expectedDrawerCash) * 100) / 100;

    return {
      storeId: params.storeId,
      storeName: params.storeName,
      grossSalesMad,
      cashCollectedMad: params.cashSalesMad,
      cardTpeCollectedMad: params.cardSalesMad,
      splitTenderCollectedMad: splitSales,
      pendingOfflineConfirmationMad: pendingOffline,
      pspFeesMad,
      rollingReserveHeldMad,
      netBankSettlementMad,
      isBalanced: Math.abs(discrepancyMad) < 0.01,
      discrepancyMad,
    };
  }
}
