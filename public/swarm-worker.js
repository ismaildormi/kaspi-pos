/* HEYUKA P2P Browser Micro-Worker (Zero-UI-Lag Background Shard Node, Shards 110..119) */
let running = false;
let timerId = null;
let pagesProcessed = 0;
let shardId = 110;
let hubOrigin = "";
let nodeId = "browser-p2p-" + Math.random().toString(36).slice(2, 10);

const GOLDEN_CORS_SEEDS = [
  "https://en.wikipedia.org/api/rest_v1/page/summary/Morocco",
  "https://ar.wikipedia.org/api/rest_v1/page/summary/%D8%B0%D9%83%D8%A7%D8%A1_%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A",
  "https://fr.wikipedia.org/api/rest_v1/page/summary/Maroc",
  "https://api.openalex.org/works?search=open%20source%20software&per-page=2&select=id,title,publication_year",
  "https://api.worldbank.org/v2/country/MA/indicator/NY.GDP.MKTP.CD?format=json&per_page=2",
];

let cursor = 0;

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

async function runSinglePulse() {
  if (!running) return;
  const idx = (shardId + cursor) % GOLDEN_CORS_SEEDS.length;
  cursor++;
  const url = GOLDEN_CORS_SEEDS[idx];

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const text = await res.text();
      if (text.length >= 60) {
        const hash = await sha256Hex(text);
        pagesProcessed++;
        if (hubOrigin) {
          await fetch(`${hubOrigin}/api/v1/swarm/nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nodeId,
              kind: "browser_p2p",
              shardId,
              totalShards: 120,
              pagesProcessedDelta: 1,
              lastDigest: hash,
            }),
          }).catch(() => {});
        }
        self.postMessage({ type: "pulse", nodeId, shardId, url, bytes: text.length, hash, pagesProcessed });
      }
    }
  } catch (err) {
    self.postMessage({ type: "error", message: String(err) });
  }

  if (running) {
    timerId = setTimeout(runSinglePulse, 18000);
  }
}

self.onmessage = function (ev) {
  const msg = ev.data || {};
  if (msg.action === "start") {
    hubOrigin = String(msg.hubOrigin || "");
    shardId = typeof msg.shardId === "number" ? msg.shardId : 110 + (Math.floor(Math.random() * 10) % 10);
    if (!running) {
      running = true;
      void runSinglePulse();
    }
  } else if (msg.action === "stop") {
    running = false;
    if (timerId !== null) clearTimeout(timerId);
    timerId = null;
    self.postMessage({ type: "stopped", nodeId, pagesProcessed });
  }
};
