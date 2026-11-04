import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const filePath = `${folder}/${cleanBaseName}-${uniqueKey}.${extension}`;

    // 1. Try uploading to Supabase Storage via Service Role Client
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin.storage
        .from("product-images")
        .upload(filePath, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
          cacheControl: "31536000",
        });

      if (!error && data?.path) {
        const { data: urlData } = admin.storage
          .from("product-images")
          .getPublicUrl(data.path);

        if (urlData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
          });
        }
      }
      console.warn("[Upload API] Supabase storage upload notice:", error?.message);
    }

    // 2. Safe Guaranteed Fallback: Base64 Data URI
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (err: any) {
    console.error("[Upload API Error]:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
