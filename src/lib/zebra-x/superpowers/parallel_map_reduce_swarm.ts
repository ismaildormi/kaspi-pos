/**
 * Superpower #4 (`v95.0`): Bounded Map-Reduce Self-Cloning Parallel Workers (up to 10 concurrent slots).
 */

export async function runParallelMapReduceSwarm<TInput, TOutput>(params: {
  items: TInput[];
  maxConcurrency?: number;
  workerFn: (item: TInput, workerIndex: number) => Promise<TOutput>;
}): Promise<{
  ok: true;
  superpower: "parallel_map_reduce_swarm_v95";
  workerConcurrency: number;
  totalItems: number;
  succeededCount: number;
  failedCount: number;
  durationMs: number;
  results: Array<{ index: number; ok: boolean; value?: TOutput; error?: string }>;
}> {
  const t0 = performance.now();
  const items = params.items || [];
  const concurrency = Math.min(10, Math.max(1, Math.floor(params.maxConcurrency ?? 6)));
  const results: Array<{ index: number; ok: boolean; value?: TOutput; error?: string }> = new Array(items.length);

  let nextIdx = 0;
  const runWorker = async (workerSlot: number) => {
    while (true) {
      const idx = nextIdx++;
      if (idx >= items.length) break;
      try {
        const value = await params.workerFn(items[idx], workerSlot);
        results[idx] = { index: idx, ok: true, value };
      } catch (err: unknown) {
        results[idx] = {
          index: idx,
          ok: false,
          error: err instanceof Error ? err.message : "Worker execution failed",
        };
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, (_, slot) => runWorker(slot))
  );

  const succeededCount = results.filter((r) => r?.ok).length;
  return {
    ok: true,
    superpower: "parallel_map_reduce_swarm_v95",
    workerConcurrency: concurrency,
    totalItems: items.length,
    succeededCount,
    failedCount: items.length - succeededCount,
    durationMs: Number((performance.now() - t0).toFixed(2)),
    results,
  };
}
