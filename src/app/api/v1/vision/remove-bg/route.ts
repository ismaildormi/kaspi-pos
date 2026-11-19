import { NextRequest, NextResponse } from "next/server";
import { authenticateXZebraRequest } from "@/lib/zebra-x/api-auth";
import { executeRemoveBgTask } from "@/lib/zebra-x/sidecar-bridge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await authenticateXZebraRequest(req, "vision:remove-bg");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const contentType = req.headers.get("content-type") || "";
  let imageUrl: string | undefined;
  let imageBase64: string | undefined;
  let model: "rmbg-1.4" | "birefnet" | "imgly-webgpu" | undefined;

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    const file = (fd?.get("file") || fd?.get("image")) as Blob | null;
    if (file) {
      const buf = Buffer.from(await file.arrayBuffer());
      imageBase64 = `data:${file.type || "image/png"};base64,${buf.toString("base64")}`;
    }
    const rawModel = String(fd?.get("model") || "");
    if (rawModel === "rmbg-1.4" || rawModel === "birefnet" || rawModel === "imgly-webgpu") {
      model = rawModel;
    }
  } else {
    const body = await req.json().catch(() => ({}));
    imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : undefined;
    imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : undefined;
    if (body?.model === "rmbg-1.4" || body?.model === "birefnet" || body?.model === "imgly-webgpu") {
      model = body.model;
    }
  }

  if (!imageUrl && !imageBase64) {
    return NextResponse.json(
      { error: "Provide an uploaded 'file'/'image' or JSON 'imageUrl'/'imageBase64'." },
      { status: 400 }
    );
  }

  const result = await executeRemoveBgTask({ imageUrl, imageBase64, model });
  return NextResponse.json(
    {
      ...result,
      authMode: auth.authMode,
    },
    { status: result.ok ? 200 : 400 }
  );
}
