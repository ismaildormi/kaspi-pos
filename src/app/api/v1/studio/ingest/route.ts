import { NextRequest, NextResponse } from "next/server";
import {
  autoDiscoverPublicWebBatch,
  buildFoundationContinualPretrainingKit,
  crawlAndIngestPublicPages,
  ensureFullVaultDigested,
  searchStudiedKnowledgeCorpus,
} from "@/lib/heyuka/training/knowledge-corpus-engine";
import { exportEvolutionChatMlDataset } from "@/lib/heyuka/learning/self-evolution-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Normalizes public seed URLs passed by Studio or CLI callers for crawling.
 */
function extractSeedUrls(body: Record<string, unknown>): string[] {
  const candidates: unknown[] = [];
  if (Array.isArray(body.urls)) candidates.push(...body.urls);
  if (Array.isArray(body.seedUrls)) candidates.push(...body.seedUrls);
  if (typeof body.seedUrl === "string") candidates.push(body.seedUrl);
  if (typeof body.url === "string") candidates.push(body.url);

  return candidates
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
}

/**
 * Inspects digested Sovereign Vault + crawled web corpus statistics,
 * runs an optional corpus query, or exports the GPU continual pretraining kit.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const action = (searchParams.get("action") || "").trim();
    const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
    const limitParam = Number(searchParams.get("limit") || "12");
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 12;

    const digest = ensureFullVaultDigested();
    const evoStats = exportEvolutionChatMlDataset();

    if (action === "export_pretrain_kit") {
      const baseModel = searchParams.get("baseModel") || undefined;
      const includeSampleCorpus = searchParams.get("includeSampleCorpus") !== "false";
      const kit = buildFoundationContinualPretrainingKit({
        baseModel,
        includeSampleCorpus,
      });
      return NextResponse.json({ ok: true, action, ...kit });
    }

    const searchResult = searchStudiedKnowledgeCorpus({
      query,
      limit: query ? limit : 0,
      includeWebFirst: true,
    });

    return NextResponse.json({
      ok: true,
      action: query ? "search" : "status",
      totalDigested: digest.totalDigested,
      totalCorpusUnits: searchResult.totalCorpusUnits,
      webCrawledUnits: searchResult.webCrawledUnits,
      errorLessonsCount: evoStats.errorLessonsCount,
      hits: query ? searchResult.hits : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/**
 * Runs active Vault digestion, robots.txt-compliant public web crawling,
 * corpus search, or external GPU continual pretraining + FineWeb-2 kit export.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const body =
      rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {};

    const seedUrls = extractSeedUrls(body);
    const action =
      typeof body.action === "string" && body.action.trim().length > 0
        ? body.action.trim()
        : seedUrls.length > 0
          ? "crawl"
          : "digest_vault";

    if (action === "digest_vault") {
      const digest = ensureFullVaultDigested();
      const query = typeof body.query === "string" ? body.query.trim() : "";
      const limit =
        typeof body.limit === "number" && body.limit > 0 ? Math.min(body.limit, 100) : 12;
      const searchResult = searchStudiedKnowledgeCorpus({
        query,
        limit: query ? limit : 0,
        includeWebFirst: true,
      });
      const evoStats = exportEvolutionChatMlDataset();

      return NextResponse.json({
        ok: true,
        action,
        totalDigested: digest.totalDigested,
        totalCorpusUnits: searchResult.totalCorpusUnits,
        webCrawledUnits: searchResult.webCrawledUnits,
        errorLessonsCount: evoStats.errorLessonsCount,
        hits: query ? searchResult.hits : [],
      });
    }

    if (action === "auto_discover") {
      const batchSize =
        typeof body.batchSize === "number" && body.batchSize > 0 ? body.batchSize : undefined;
      const lang = typeof body.lang === "string" ? body.lang : undefined;
      const autoRes = await autoDiscoverPublicWebBatch({ batchSize, lang });
      return NextResponse.json({ action, ...autoRes });
    }

    if (action === "crawl") {
      if (seedUrls.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Provide at least one public URL in urls or seedUrl." },
          { status: 400 }
        );
      }
      const maxPages =
        typeof body.maxPages === "number" && body.maxPages > 0 ? body.maxPages : undefined;
      const lang = typeof body.lang === "string" ? body.lang : undefined;
      const crawlResult = await crawlAndIngestPublicPages({
        seedUrls,
        maxPages,
        lang,
      });
      return NextResponse.json(
        { action, ...crawlResult },
        { status: crawlResult.ok ? 200 : 400 }
      );
    }

    if (action === "search") {
      const query = typeof body.query === "string" ? body.query : "";
      const limit =
        typeof body.limit === "number" && body.limit > 0 ? Math.min(body.limit, 100) : 20;
      const includeWebFirst = body.includeWebFirst !== false;
      const result = searchStudiedKnowledgeCorpus({
        query,
        limit,
        includeWebFirst,
      });
      return NextResponse.json({ ok: true, action, ...result });
    }

    if (action === "export_pretrain_kit") {
      const baseModel = typeof body.baseModel === "string" ? body.baseModel : undefined;
      const includeSampleCorpus = body.includeSampleCorpus !== false;
      const kit = buildFoundationContinualPretrainingKit({
        baseModel,
        includeSampleCorpus,
      });
      return NextResponse.json({ ok: true, action, ...kit });
    }

    return NextResponse.json(
      { ok: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
