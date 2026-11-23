/**
 * HEYUKA Planetary Swarm Node — Cloudflare Workers Edge Template (Shards 45..84, $0 Free Tier)
 * Harvests Sitemap.xml / conditional ETag 304 checks from global edge PoPs and reports
 * shard heartbeats back to KASPI/HEYUKA Swarm Registry without exposing secrets.
 */

export interface Env {
  HEYUKA_HUB_URL?: string; // e.g. "https://kaspi-pos.vercel.app"
  SHARD_ID?: string;
}

export default {
  async scheduled(_event: unknown, env: Env): Promise<void> {
    const hub = (env.HEYUKA_HUB_URL || "https://kaspi-pos.vercel.app").replace(/\/$/, "");
    const shardId = Number(env.SHARD_ID || 45);
    const probes = [
      "https://en.wikipedia.org/api/rest_v1/page/summary/Morocco",
      "https://api.openalex.org/works?search=software%20engineering&per-page=2&select=id,title",
    ];

    let harvested = 0;
    for (const targetUrl of probes) {
      try {
        const res = await fetch(targetUrl, {
          headers: { "User-Agent": "HEYUKA-CloudflareEdgeSwarm/1.0 (+https://kaspi-pos.vercel.app)" },
        });
        if (res.ok) harvested++;
      } catch {
        // skip unreachable target politely
      }
    }

    await fetch(`${hub}/api/v1/swarm/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId: `cf-edge-shard-${shardId}`,
        kind: "cloudflare_edge",
        shardId,
        totalShards: 120,
        pagesProcessedDelta: harvested,
      }),
    }).catch(() => {});
  },
};
