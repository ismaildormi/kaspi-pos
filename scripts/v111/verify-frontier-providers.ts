/**
 * HEYUKA v111.0 — Phase 2: Real Frontier Provider Verification Harness
 *
 * Runs live tests against every discoverable model endpoint and writes evidence to
 * `benchmarks/v111/provider-verification.json`. Secrets are never written.
 *
 * Tests per model:
 *   1. text      — "17 * 19" exact-answer check
 *   2. json      — structured JSON output check ({"answer": 323})
 *   3. tools     — function/tool call emission check
 *   4. stream    — real SSE streaming (chunks + time-to-first-token)
 *   5. vision    — only for models whose catalog declares image input: solid-red PNG, expects "red"
 *
 * Usage: node node_modules/tsx/dist/cli.mjs scripts/v111/verify-frontier-providers.ts
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import {
  invokeFrontierProviderAdapter,
  resolveProviderCredential,
  streamFrontierProviderAdapter,
  type FrontierProviderId,
} from "../../src/lib/heyuka/frontier/frontier-provider-adapters";

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** Solid-color RGB PNG generated in-process (verifiable ground truth for vision tests). */
function solidPngDataUrl(w: number, h: number, rgb: [number, number, number]): string {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) row.set(rgb, 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

interface CatalogModel {
  provider: FrontierProviderId;
  modelId: string;
  contextLength: number | null;
  inputModalities: string[];
  catalogSource: string;
  pricingPromptPer1M: number | null;
  pricingCompletionPer1M: number | null;
}

async function discoverCatalog(): Promise<{ models: CatalogModel[]; notes: string[] }> {
  const models: CatalogModel[] = [];
  const notes: string[] = [];

  const groq = resolveProviderCredential("groq");
  if (groq.configured) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${groq.apiKey}` },
      });
      const j = (await r.json()) as { data: Array<Record<string, any>> };
      for (const m of j.data || []) {
        const id = String(m.id);
        if (/whisper|orpheus|prompt-guard/i.test(id)) continue; // audio / classifier models: not chat LLMs
        models.push({
          provider: "groq",
          modelId: id,
          contextLength: Number(m.context_window) || null,
          inputModalities: ["text"],
          catalogSource: "https://api.groq.com/openai/v1/models",
          pricingPromptPer1M: null,
          pricingCompletionPer1M: null,
        });
      }
      notes.push(`Groq catalog: ${j.data?.length || 0} models listed.`);
    } catch (e) {
      notes.push(`Groq catalog fetch failed: ${(e as Error).message}`);
    }
  } else notes.push("Groq: STANDBY_UNCONFIGURED");

  const or = resolveProviderCredential("openrouter");
  if (or.configured) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${or.apiKey}` },
      });
      const j = (await r.json()) as { data: Array<Record<string, any>> };
      const free = (j.data || []).filter(
        (m) => String(m.id).endsWith(":free") || m.id === "openrouter/free"
      );
      for (const m of free) {
        const inMods: string[] = m.architecture?.input_modalities || [];
        const outMods: string[] = m.architecture?.output_modalities || ["text"];
        if (!outMods.includes("text") || outMods.includes("audio")) continue;
        models.push({
          provider: "openrouter",
          modelId: String(m.id),
          contextLength: Number(m.context_length) || null,
          inputModalities: inMods.length ? inMods : ["text"],
          catalogSource: "https://openrouter.ai/api/v1/models",
          pricingPromptPer1M: Number(m.pricing?.prompt || 0) * 1_000_000,
          pricingCompletionPer1M: Number(m.pricing?.completion || 0) * 1_000_000,
        });
      }
      notes.push(`OpenRouter catalog: ${j.data?.length || 0} models listed, ${free.length} zero-price.`);
    } catch (e) {
      notes.push(`OpenRouter catalog fetch failed: ${(e as Error).message}`);
    }
  } else notes.push("OpenRouter: STANDBY_UNCONFIGURED");

  const hf = resolveProviderCredential("huggingface");
  if (hf.configured) {
    for (const id of ["Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen2.5-VL-72B-Instruct"]) {
      models.push({
        provider: "huggingface",
        modelId: id,
        contextLength: 131072,
        inputModalities: id.includes("VL") ? ["text", "image"] : ["text"],
        catalogSource: "https://router.huggingface.co/v1 (Inference Providers)",
        pricingPromptPer1M: null,
        pricingCompletionPer1M: null,
      });
    }
  }
  return { models, notes };
}

async function main() {
  const startedAt = new Date().toISOString();
  const { models, notes } = await discoverCatalog();
  const redPng = solidPngDataUrl(32, 32, [220, 20, 20]);
  const results: Array<Record<string, unknown>> = [];

  for (const m of models) {
    const gap = m.provider === "openrouter" ? 3500 : 400;
    const rec: Record<string, any> = { ...m, tests: {} };

    const text = await invokeFrontierProviderAdapter({
      provider: m.provider,
      modelId: m.modelId,
      prompt: "What is 17 * 19? Reply with only the number.",
      maxOutputTokens: 256,
      temperature: 0,
    });
    rec.tests.text = {
      pass: text.ok && /\b323\b/.test(text.text),
      http: text.httpStatus,
      status: text.connectionStatus,
      error: text.normalizedErrorCode,
      latencyMs: text.latencyMs,
      executedModelId: text.executedModelId,
      tokens: text.usage.totalTokens,
      sample: text.text.slice(0, 60),
      errorDetail: text.errorMessage?.slice(0, 160),
    };
    rec.connectionStatus = text.connectionStatus;
    await sleep(gap);

    if (text.connectionStatus === "ACTIVE") {
      const js = await invokeFrontierProviderAdapter({
        provider: m.provider,
        modelId: m.modelId,
        prompt: 'Return ONLY a JSON object of the form {"answer": N} where N = 17 * 19.',
        jsonMode: true,
        maxOutputTokens: 256,
        temperature: 0,
      });
      let parsedOk = false;
      try {
        const raw = js.text.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, "$1");
        parsedOk = Number(JSON.parse(raw).answer) === 323;
      } catch {
        parsedOk = false;
      }
      rec.tests.json = { pass: parsedOk, http: js.httpStatus, error: js.normalizedErrorCode, sample: js.text.slice(0, 80) };
      await sleep(gap);

      const tool = await invokeFrontierProviderAdapter({
        provider: m.provider,
        modelId: m.modelId,
        prompt: "Compute the Moroccan VAT for an invoice of 6000 MAD HT. You must call the tool.",
        tools: [
          {
            name: "compute_vat",
            description: "Computes Moroccan TVA for an HT amount in MAD.",
            parametersJsonSchema: {
              type: "object",
              properties: { amount_ht: { type: "number" }, rate: { type: "number" } },
              required: ["amount_ht"],
            },
          },
        ],
        maxOutputTokens: 256,
        temperature: 0,
      });
      rec.tests.tools = {
        pass: Boolean(tool.toolCalls?.some((t) => t.name === "compute_vat")),
        http: tool.httpStatus,
        error: tool.normalizedErrorCode,
        toolCall: tool.toolCalls?.[0] ? `${tool.toolCalls[0].name}(${tool.toolCalls[0].argumentsJson.slice(0, 60)})` : null,
      };
      await sleep(gap);

      const st = await streamFrontierProviderAdapter({
        provider: m.provider,
        modelId: m.modelId,
        prompt: "Count from 1 to 5 separated by spaces.",
        maxOutputTokens: 200,
        temperature: 0,
      });
      rec.tests.stream = {
        pass: st.ok && st.chunkCount >= 2,
        http: st.httpStatus,
        chunks: st.chunkCount,
        ttftMs: st.timeToFirstTokenMs,
        totalMs: st.totalLatencyMs,
      };
      await sleep(gap);

      if (m.inputModalities.includes("image")) {
        const vis = await invokeFrontierProviderAdapter({
          provider: m.provider,
          modelId: m.modelId,
          prompt: "What single color fills this entire image? Answer with one English word.",
          imageDataUrl: redPng,
          maxOutputTokens: 256,
          temperature: 0,
        });
        rec.tests.vision = {
          pass: vis.ok && /\bred\b/i.test(vis.text),
          http: vis.httpStatus,
          error: vis.normalizedErrorCode,
          sample: vis.text.slice(0, 60),
        };
        await sleep(gap);
      }
    }
    results.push(rec);
    console.log(
      `[${m.provider}] ${m.modelId}: ${rec.connectionStatus} | ` +
        Object.entries(rec.tests)
          .map(([k, v]: [string, any]) => `${k}=${v.pass ? "PASS" : "FAIL"}`)
          .join(" ")
    );
  }

  const unconfigured = (["openai", "anthropic", "gemini", "deepseek", "mistral", "cerebras", "sambanova", "github", "ollama"] as FrontierProviderId[])
    .filter((p) => !resolveProviderCredential(p).configured);

  const out = {
    version: "111.0.0",
    startedAt,
    finishedAt: new Date().toISOString(),
    catalogNotes: notes,
    standbyUnconfiguredProviders: unconfigured,
    frontierReferenceModels: {
      note:
        "GPT-6.2 Astra/Sol, Claude Fable 5.2 / Opus 5.5 / Sonnet 5.5, Gemini 4 Argon/Hydrogen/Neon are display names. " +
        "No OpenAI, Anthropic or Gemini credentials are configured in this environment, so their wire model IDs could not be " +
        "retrieved from the providers' /models catalogs and no comparison calls were made.",
      status: "STANDBY_UNCONFIGURED",
    },
    results,
  };
  const dir = path.join(process.cwd(), "benchmarks", "v111");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "provider-verification.json"), JSON.stringify(out, null, 2));
  console.log(`\nWrote benchmarks/v111/provider-verification.json (${results.length} models).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
