/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Neon Database Adapter
 * 
 * Monitors connection health, latency, and storage consumption on the primary Neon database.
 */

import { prisma } from "@/server/db/prisma";

export interface NeonTelemetry {
  isConnected: boolean;
  latencyMs: number;
  activePooler: boolean;
  databaseEngine: string;
  error?: string;
}

export async function checkNeonDatabaseHealth(): Promise<NeonTelemetry> {
  const start = performance.now();
  try {
    const rawResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;
    const dbUrl = process.env.DATABASE_URL || "";
    const activePooler = dbUrl.includes("pgbouncer=true") || dbUrl.includes("-pooler.");

    return {
      isConnected: true,
      latencyMs,
      activePooler,
      databaseEngine: rawResult[0]?.version?.slice(0, 30) || "PostgreSQL 16",
    };
  } catch (err: unknown) {
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;
    const msg = err instanceof Error ? err.message : "Neon query error";
    return {
      isConnected: false,
      latencyMs,
      activePooler: false,
      databaseEngine: "Unknown",
      error: msg,
    };
  }
}
