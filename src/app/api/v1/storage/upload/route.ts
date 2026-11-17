import { NextRequest, NextResponse } from "next/server";
import { getSafeServerContext } from "@/server/auth/context";
import {
  assertSafeOrigin,
  validateImageMagicBytes,
  maskErrorForProduction,
} from "@/server/security/kaspi-ironclad-guard";

// Global CAS in-memory store for server runtime deduplication
const globalServerCas = new Map<string, { url: string; size: number }>();

export async function POST(req: NextRequest) {
  try {
    if (!assertSafeOrigin(req)) {
      return NextResponse.json(
        { error: "CSRF check failed: invalid origin" },
        { status: 403 }
      );
    }

    const ctx = await getSafeServerContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const sha256 = formData.get("sha256") as string | null;

    if (!file || !sha256) {
      return NextResponse.json(
        { error: "Fichier ou empreinte SHA-256 manquante" },
        { status: 400 }
      );
    }

    // Binary Magic-Byte Upload Verifier (CWE-434)
    const arrayBuffer = await file.arrayBuffer();
    const fileBuf = Buffer.from(arrayBuffer);
    const verifiedMime = validateImageMagicBytes(fileBuf);

    if (!verifiedMime) {
      return NextResponse.json(
        {
          error:
            "Format de fichier binaire non sécurisé ou invalide (PNG, JPEG, WebP autorisés uniquement)",
        },
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
    const ext = verifiedMime === "image/webp" ? "webp" : verifiedMime === "image/png" ? "png" : "jpg";
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
    const isProd = process.env.NODE_ENV === "production";
    const errorDetails = isProd
      ? maskErrorForProduction(err)
      : { error: err?.message || "Erreur de téléversement", code: "UPLOAD_ERR" };
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
