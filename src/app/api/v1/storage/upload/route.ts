import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";

// Global CAS in-memory store for server runtime deduplication
const globalServerCas = new Map<string, { url: string; size: number }>();

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const sha256 = formData.get("sha256") as string | null;
    const mimeType = (formData.get("mimeType") as string) || "image/webp";

    if (!file || !sha256) {
      return NextResponse.json(
        { error: "Fichier ou empreinte SHA-256 manquante" },
        { status: 400 }
      );
    }

    // Check if asset already exists in CAS pool
    const existing = globalServerCas.get(sha256);
    if (existing) {
      return NextResponse.json({
        url: existing.url,
        deduplicated: true,
        sha256,
        sizeBytes: existing.size,
      });
    }

    // In a production setup, this stores to Cloudflare R2 / Supabase Bucket
    // For universal multi-cloud / zero-overhead runtime, generate the public CAS reference
    const ext = mimeType.includes("webp") ? "webp" : "jpg";
    const publicUrl = `/uploads/cas/${sha256}.${ext}`;

    globalServerCas.set(sha256, {
      url: publicUrl,
      size: file.size,
    });

    return NextResponse.json({
      url: publicUrl,
      deduplicated: false,
      sha256,
      sizeBytes: file.size,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur de téléversement" },
      { status: 500 }
    );
  }
}
