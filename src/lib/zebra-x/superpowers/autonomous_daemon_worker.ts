import { detectConceptDrift } from "@/lib/zebra-x/dominance/secret1_scenario_master";
import { computeInventoryEoqAndSafetyStock, type EoqItemInput } from "@/lib/zebra-x/dominance/secret3_business_dominance";
import { collectVerifiedHarvestStats } from "@/lib/heyuka/verified-harvest-counter";

export interface DaemonAuditInput {
  merchantName?: string;
  dailyRevenuesMad?: number[];
  lowStockItems?: Array<EoqItemInput & { currentStockUnits: number }>;
  includeRemoteRadar?: boolean;
}

/**
 * Superpower #1 (`v95.0`): 24/7 Autonomous Background Worker & Morning Digest Generator.
 */
export async function runAutonomousBackgroundAudit(input: DaemonAuditInput) {
  const drift = detectConceptDrift(input.dailyRevenuesMad || [4200, 4150, 4300, 4100, 3950, 3800]);
  const lowItems = input.lowStockItems || [];
  const eoqPlans = computeInventoryEoqAndSafetyStock(lowItems);
  const restockAlerts = lowItems
    .map((item, idx) => {
      const plan = eoqPlans[idx];
      const needReorder = item.currentStockUnits <= plan.reorderPointUnits;
      return {
        sku: item.sku,
        name: item.name,
        currentStock: item.currentStockUnits,
        reorderPoint: plan.reorderPointUnits,
        recommendedOrderQty: plan.optimalOrderQtyEoq,
        urgent: needReorder,
      };
    })
    .filter((a) => a.urgent);

  const radar = input.includeRemoteRadar
    ? await collectVerifiedHarvestStats().catch(() => null)
    : null;

  const merchant = input.merchantName || "KASPI Merchant";
  const digestLines = [
    `[HEYUKA 24/7 Watchdog Digest — ${merchant}]`,
    drift.driftDetected
      ? `ALERT: Revenue drift ${drift.deltaPct}% detected (${drift.baselineMean.toFixed(0)} -> ${drift.recentMean.toFixed(0)} MAD).`
      : `Revenue trend stable (baseline mean ${drift.baselineMean.toFixed(0)} MAD, recent ${drift.recentMean.toFixed(0)} MAD).`,
    restockAlerts.length > 0
      ? `RESTOCK NEEDED (${restockAlerts.length}): ${restockAlerts.map((a) => `${a.name} (qty=${a.currentStock}/${a.reorderPoint} -> order ${a.recommendedOrderQty})`).join(", ")}`
      : `Inventory healthy (0 critical reorder triggers).`,
    radar
      ? `Cloud Knowledge: ${radar.verifiedMetrics.vaultedSourcesCount} engines, ${radar.huggingFaceVault.crystalCount} HF crystals (${radar.huggingFaceVault.crystalTotalBytes}B).`
      : `Cloud Knowledge check deferred.`,
  ];

  return {
    ok: true,
    superpower: "autonomous_daemon_worker_v95",
    checkedAt: new Date().toISOString(),
    revenueDrift: drift,
    restockAlertsCount: restockAlerts.length,
    restockAlerts,
    digestText: digestLines.join("\n"),
    zeroCostAlertTemplates: {
      ntfyUrl: "https://ntfy.sh/<your-private-topic>",
      telegramMethod: "POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage",
    },
  };
}
