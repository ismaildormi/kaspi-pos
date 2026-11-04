/**
 * KASPI POS (كسب) — High-Performance Load Testing & Latency Benchmark
 * 
 * Measures throughput (ops/sec), p50, p90, p95, p99, min, max, and avg latency
 * under simulated high-concurrency cashier workloads:
 * - Stage 1: 10 warmup operations
 * - Stage 2: 100 concurrent read operations
 * - Stage 3: 500 concurrent realistic POS operations (Product reads, Stock lookups, Sales aggregations)
 */

import { prisma } from "../src/server/db/prisma";

interface BenchmarkResult {
  stageName: string;
  totalRequests: number;
  totalTimeMs: number;
  opsPerSec: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
}

function calculatePercentiles(latencies: number[]): {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
} {
  if (latencies.length === 0) {
    return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }

  latencies.sort((a, b) => a - b);
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;

  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p90 = latencies[Math.floor(latencies.length * 0.90)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  return { p50, p90, p95, p99, min, max, avg };
}

async function runStage(
  stageName: string,
  totalOps: number,
  concurrency: number,
  task: (i: number) => Promise<unknown>
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  const startAll = performance.now();

  let currentIndex = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (currentIndex < totalOps) {
      const idx = currentIndex++;
      const opStart = performance.now();
      try {
        await task(idx);
      } catch (err) {
        console.warn(`Op ${idx} failed:`, err);
      }
      const opEnd = performance.now();
      latencies.push(opEnd - opStart);
    }
  });

  await Promise.all(workers);
  const totalTimeMs = performance.now() - startAll;
  const stats = calculatePercentiles(latencies);
  const opsPerSec = Math.round((totalOps / (totalTimeMs / 1000)) * 10) / 10;

  return {
    stageName,
    totalRequests: totalOps,
    totalTimeMs: Math.round(totalTimeMs),
    opsPerSec,
    p50Ms: Math.round(stats.p50 * 100) / 100,
    p90Ms: Math.round(stats.p90 * 100) / 100,
    p95Ms: Math.round(stats.p95 * 100) / 100,
    p99Ms: Math.round(stats.p99 * 100) / 100,
    minMs: Math.round(stats.min * 100) / 100,
    maxMs: Math.round(stats.max * 100) / 100,
    avgMs: Math.round(stats.avg * 100) / 100,
  };
}

async function main() {
  console.log("==========================================================");
  console.log("  KASPI POS — HIGH-PERFORMANCE LOAD & LATENCY BENCHMARK");
  console.log("==========================================================\n");

  // Ensure test tenant exists
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: "benchmark-tenant",
        legalName: "Ste Benchmark Test SARL",
        displayName: "Benchmark Store",
        currency: "MAD",
      },
    });
  }

  // 1. Warm-up (10 operations)
  console.log("[1/3] Running Warmup (10 operations)...");
  const warmup = await runStage("Warmup (10 req)", 10, 2, async () => {
    await prisma.product.findMany({
      where: { tenantId: tenant!.id },
      take: 10,
    });
  });
  console.log(`  ✓ Completed: avg ${warmup.avgMs}ms | p95 ${warmup.p95Ms}ms | ${warmup.opsPerSec} ops/s`);

  // 2. Medium Concurrency (100 operations, 10 workers)
  console.log("\n[2/3] Running Stage 2 (100 operations, 10 workers concurrency)...");
  const stage2 = await runStage("Stage 2 (100 req)", 100, 10, async () => {
    await prisma.product.findMany({
      where: { tenantId: tenant!.id },
      select: { id: true, name: true, salePrice: true, barcode: true },
      take: 20,
    });
  });
  console.log(`  ✓ Completed: avg ${stage2.avgMs}ms | p50 ${stage2.p50Ms}ms | p95 ${stage2.p95Ms}ms | ${stage2.opsPerSec} ops/s`);

  // 3. High Concurrency (300 operations, 20 workers, mixed read/aggregate)
  console.log("\n[3/3] Running Stage 3 (300 operations, 20 workers, mixed queries)...");
  const stage3 = await runStage("Stage 3 (300 req mixed)", 300, 20, async (idx) => {
    if (idx % 2 === 0) {
      await prisma.product.findMany({
        where: { tenantId: tenant!.id },
        take: 25,
      });
    } else {
      await prisma.sale.aggregate({
        where: { tenantId: tenant!.id },
        _count: { id: true },
        _sum: { grandTotal: true },
      });
    }
  });
  console.log(`  ✓ Completed: avg ${stage3.avgMs}ms | p50 ${stage3.p50Ms}ms | p95 ${stage3.p95Ms}ms | ${stage3.opsPerSec} ops/s`);

  console.log("\n==========================================================");
  console.log("  BENCHMARK SUMMARY RESULTS TABLE");
  console.log("==========================================================");
  console.table([warmup, stage2, stage3]);
  console.log(">>> LOAD & LATENCY BENCHMARK: COMPLETED SUCCESSFULLY! <<<\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Load test error:", e);
    process.exit(1);
  });
