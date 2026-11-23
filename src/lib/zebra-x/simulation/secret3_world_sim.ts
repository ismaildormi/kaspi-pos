import Decimal from "decimal.js";
import { executePolyglotCodeSandbox, type SandboxExecutionResult } from "@/lib/zebra-x/tools/code-sandbox";

export interface PhysicsBodySpec {
  id: string;
  widthM: number;
  heightM: number;
  depthM: number;
  massKg: number;
  positionM?: [number, number, number];
  velocityMs?: [number, number, number];
  frictionMu?: number;
  lateralForceN?: number;
}

export interface PhysicsSimulationResult {
  ok: true;
  domain: "physics_3d";
  bodiesAudited: number;
  collisionPairs: Array<[string, string]>;
  bodyVerdicts: Array<{
    id: string;
    stable: boolean;
    verdict: "stable" | "topple_risk" | "slip_risk" | "collision_risk";
    kineticEnergyJ: number;
    staticSafetyFactor: number;
    freeFallTimeSec: number;
  }>;
  overallStable: boolean;
  durationMs: number;
}

/**
 * Computes rigid-body gravity stability, topple resistance, friction slip safety, kinetic energy,
 * and pairwise AABB collisions for 3D scene objects before rendering/fabrication.
 */
export function simulate3dPhysicsStability(bodies: PhysicsBodySpec[]): PhysicsSimulationResult {
  const t0 = performance.now();
  const g = 9.80665;
  const list = bodies.length > 0 ? bodies : [{ id: "default_cube", widthM: 1, heightM: 1, depthM: 1, massKg: 10 }];

  const boxes = list.map((b) => {
    const [cx, cy, cz] = b.positionM || [0, b.heightM / 2, 0];
    return {
      id: b.id,
      minX: cx - b.widthM / 2,
      maxX: cx + b.widthM / 2,
      minY: cy - b.heightM / 2,
      maxY: cy + b.heightM / 2,
      minZ: cz - b.depthM / 2,
      maxZ: cz + b.depthM / 2,
    };
  });

  const collisionPairs: Array<[string, string]> = [];
  const collidingSet = new Set<string>();
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap =
        a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY && a.minZ < b.maxZ && a.maxZ > b.minZ;
      if (overlap) {
        collisionPairs.push([a.id, b.id]);
        collidingSet.add(a.id);
        collidingSet.add(b.id);
      }
    }
  }

  const bodyVerdicts = list.map((b) => {
    const [vx, vy, vz] = b.velocityMs || [0, 0, 0];
    const speedSq = vx * vx + vy * vy + vz * vz;
    const ke = Number((0.5 * Math.max(0.01, b.massKg) * speedSq).toFixed(3));
    const baseRadius = Math.min(b.widthM, b.depthM) / 2;
    const weightN = Math.max(0.01, b.massKg) * g;
    const lateralN = Math.abs(b.lateralForceN ?? 0);
    const mu = Math.max(0.05, b.frictionMu ?? 0.45);
    const slipThresholdN = weightN * mu;
    const restoringTorque = weightN * baseRadius;
    const overturningTorque = lateralN * (b.heightM / 2);
    const safetyFactor =
      overturningTorque > 0
        ? Number((restoringTorque / overturningTorque).toFixed(2))
        : Number(((baseRadius * 2) / Math.max(0.05, b.heightM) + mu).toFixed(2));
    const comY = Math.max(0, (b.positionM?.[1] ?? b.heightM / 2) - b.heightM / 2);
    const freeFallTimeSec = Number(Math.sqrt((2 * comY) / g).toFixed(3));

    const slipRisk = lateralN > slipThresholdN;
    const toppleRisk = overturningTorque > restoringTorque || b.heightM > Math.min(b.widthM, b.depthM) * 6;
    const colRisk = collidingSet.has(b.id);
    const verdict = colRisk ? "collision_risk" : toppleRisk ? "topple_risk" : slipRisk ? "slip_risk" : "stable";

    return {
      id: b.id,
      stable: verdict === "stable",
      verdict: verdict as "stable" | "topple_risk" | "slip_risk" | "collision_risk",
      kineticEnergyJ: ke,
      staticSafetyFactor: safetyFactor,
      freeFallTimeSec,
    };
  });

  return {
    ok: true,
    domain: "physics_3d",
    bodiesAudited: list.length,
    collisionPairs,
    bodyVerdicts,
    overallStable: bodyVerdicts.every((v) => v.stable),
    durationMs: Number((performance.now() - t0).toFixed(2)),
  };
}

export interface KaspiMarketSimInput {
  days?: number;
  dailyCustomers?: number;
  avgBasketMad?: number;
  grossMarginPct?: number;
  fixedDailyCostMad?: number;
  cashierLanes?: number;
  avgCheckoutSec?: number;
  initialStockUnits?: number;
  unitsPerCustomer?: number;
  restockThreshold?: number;
  restockQuantity?: number;
  restockLeadDays?: number;
  priceElasticity?: number;
}

export interface KaspiMarketSimResult {
  ok: true;
  domain: "kaspi_market_sim";
  daysSimulated: number;
  totalShoppersServed: number;
  lostShoppersDueToStockout: number;
  stockoutDays: number;
  avgWaitMinutes: number;
  projectedRevenueMad: number;
  projectedNetProfitMad: number;
  recommendedCashierLanes: number;
  priceSweepComparison: Array<{
    priceDeltaPct: number;
    projectedRevenueMad: number;
    projectedNetProfitMad: number;
  }>;
  durationMs: number;
}

/**
 * Discrete-event multi-day queue & supply-chain simulation for KASPI POS merchants.
 * Models checkout waiting time across open cashier lanes, inventory depletion/restock lead time,
 * lost demand on stockouts, and price-elasticity margin sweeps in Decimal centime-clean math.
 */
export function simulateKaspiMarketWorld(input?: KaspiMarketSimInput): KaspiMarketSimResult {
  const t0 = performance.now();
  const days = Math.min(90, Math.max(7, input?.days ?? 30));
  const dailyCustomers = Math.min(2000, Math.max(10, input?.dailyCustomers ?? 120));
  const avgBasket = new Decimal(Math.max(5, input?.avgBasketMad ?? 95));
  const marginRate = new Decimal(Math.min(95, Math.max(5, input?.grossMarginPct ?? 26))).div(100);
  const fixedDaily = new Decimal(Math.max(0, input?.fixedDailyCostMad ?? 450));
  const lanes = Math.min(12, Math.max(1, input?.cashierLanes ?? 2));
  const checkoutSec = Math.min(300, Math.max(15, input?.avgCheckoutSec ?? 55));
  let stock = Math.max(10, input?.initialStockUnits ?? 800);
  const unitsPerCust = Math.max(1, input?.unitsPerCustomer ?? 2);
  const restockThresh = Math.max(20, input?.restockThreshold ?? 220);
  const restockQty = Math.max(50, input?.restockQuantity ?? 600);
  const leadDays = Math.max(1, Math.min(7, input?.restockLeadDays ?? 2));
  const elasticity = input?.priceElasticity ?? -1.15;

  let served = 0;
  let lost = 0;
  let stockoutDays = 0;
  let totalWaitSec = 0;
  let pendingRestockDay = -1;

  // Store hours open: 10 hours = 36,000 seconds; deterministic rush pattern
  const openSecPerDay = 36000;
  for (let d = 0; d < days; d++) {
    if (d === pendingRestockDay) {
      stock += restockQty;
      pendingRestockDay = -1;
    }

    const weekendBoost = d % 7 === 5 || d % 7 === 6 ? 1.25 : 1.0;
    const arrivalsToday = Math.round(dailyCustomers * weekendBoost);
    const laneBusyUntil = new Array<number>(lanes).fill(0);
    let missedToday = 0;

    for (let c = 0; c < arrivalsToday; c++) {
      if (stock < unitsPerCust) {
        lost++;
        missedToday++;
        continue;
      }
      stock -= unitsPerCust;
      served++;

      // Peak-concentrated arrival across 10h shift
      const arrivalSec = Math.round((c / Math.max(1, arrivalsToday)) * openSecPerDay);
      let earliestLane = 0;
      for (let l = 1; l < lanes; l++) {
        if (laneBusyUntil[l] < laneBusyUntil[earliestLane]) earliestLane = l;
      }
      const startService = Math.max(arrivalSec, laneBusyUntil[earliestLane]);
      totalWaitSec += startService - arrivalSec;
      laneBusyUntil[earliestLane] = startService + checkoutSec;
    }

    if (missedToday > 0) stockoutDays++;
    if (stock <= restockThresh && pendingRestockDay === -1) {
      pendingRestockDay = d + leadDays;
    }
  }

  const avgWaitMinutes = Number((totalWaitSec / Math.max(1, served) / 60).toFixed(2));
  const projectedRevenue = avgBasket.mul(served);
  const projectedNetProfit = projectedRevenue.mul(marginRate).minus(fixedDaily.mul(days));

  // Find optimal lane count ensuring wait < 2.0 min
  let optimalLanes = lanes;
  if (avgWaitMinutes > 2.0) {
    optimalLanes = Math.min(12, Math.ceil((lanes * avgWaitMinutes) / 1.8));
  }

  const priceSweepComparison = [-10, 0, 10].map((deltaPct) => {
    const newPriceFactor = 1 + deltaPct / 100;
    const demandMultiplier = Math.max(0.4, 1 + elasticity * (deltaPct / 100));
    const adjServed = Math.round(served * demandMultiplier);
    const rev = avgBasket.mul(newPriceFactor).mul(adjServed);
    const cogs = avgBasket.mul(new Decimal(1).minus(marginRate)).mul(adjServed);
    const profit = rev.minus(cogs).minus(fixedDaily.mul(days));
    return {
      priceDeltaPct: deltaPct,
      projectedRevenueMad: Number(rev.toFixed(2)),
      projectedNetProfitMad: Number(profit.toFixed(2)),
    };
  });

  return {
    ok: true,
    domain: "kaspi_market_sim",
    daysSimulated: days,
    totalShoppersServed: served,
    lostShoppersDueToStockout: lost,
    stockoutDays,
    avgWaitMinutes,
    projectedRevenueMad: Number(projectedRevenue.toFixed(2)),
    projectedNetProfitMad: Number(projectedNetProfit.toFixed(2)),
    recommendedCashierLanes: optimalLanes,
    priceSweepComparison,
    durationMs: Number((performance.now() - t0).toFixed(2)),
  };
}

/**
 * Embodied execution check: verifies runnable JS in isolated V8 VM or audits HTML app structure.
 */
export async function runEmbodiedCodeVerification(params: {
  mode: "javascript" | "html";
  code: string;
}): Promise<{
  ok: boolean;
  sandboxExec?: SandboxExecutionResult;
  htmlIssues: string[];
}> {
  if (params.mode === "javascript") {
    const sandboxExec = await executePolyglotCodeSandbox({
      language: "javascript",
      code: params.code,
      preferFastVm: true,
    });
    return { ok: sandboxExec.ok, sandboxExec, htmlIssues: [] };
  }

  const html = String(params.code || "");
  const htmlIssues: string[] = [];
  if (!/<html[\s>]|<body[\s>]|<!doctype/i.test(html)) {
    htmlIssues.push("Missing document structural root tags (<!doctype>/<html>/<body>)");
  }
  const scriptOpen = (html.match(/<script\b/gi) || []).length;
  const scriptClose = (html.match(/<\/script>/gi) || []).length;
  if (scriptOpen !== scriptClose) {
    htmlIssues.push(`Unbalanced <script> tags (${scriptOpen} open vs ${scriptClose} close)`);
  }
  if (/\beval\s*\(|document\.write\s*\(/i.test(html)) {
    htmlIssues.push("Unsafe dynamic execution pattern detected (eval/document.write)");
  }
  if (/[\u0600-\u06FF]/.test(html) && !/dir\s*=\s*["'](?:rtl|auto)["']/i.test(html)) {
    htmlIssues.push("Arabic content detected without RTL dir=\"rtl\" or dir=\"auto\" attribute");
  }
  return { ok: htmlIssues.length === 0, htmlIssues };
}
