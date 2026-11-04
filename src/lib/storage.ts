/**
 * Unified Multi-Cloud Storage Gateway for KASPI POS
 * 
 * Aggregates free-tier storage providers to guarantee 100% free hosting of product images,
 * receipts, and exports with automated failover:
 * 1. Cloudflare R2 (10 GB free, 0 egress fees)
 * 2. Cloudinary Free Tier (25 GB free storage)
 * 3. Supabase Storage Free Tier (1 GB free storage)
 * 4. Local Base64 / Data URL fallback (Zero failure guarantee)
 */

export interface UploadOptions {
  fileName: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  tenantId: string;
}

export interface UploadResult {
  url: string;
  provider: "cloudflare-r2" | "cloudinary" | "supabase" | "data-url";
  sizeBytes: number;
}

/**
 * Uploads an asset through the priority storage chain.
 */
export async function uploadAsset(options: UploadOptions): Promise<UploadResult> {
  const { fileName, buffer, contentType, tenantId } = options;
  const sizeBytes = buffer.length;

  // 1. Priority 1: Cloudflare R2 (S3-compatible, Zero Egress Fees)
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  ) {
    try {
      const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const key = `${tenantId}/${Date.now()}-${fileName}`;
      const publicBase =
        process.env.R2_PUBLIC_URL ||
        `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

      const response = await fetch(`${endpoint}/${process.env.R2_BUCKET_NAME}/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        },
        body: buffer as any,
      });

      if (response.ok) {
        return {
          url: `${publicBase}/${key}`,
          provider: "cloudflare-r2",
          sizeBytes,
        };
      }
    } catch (r2Err) {
      console.warn("[Storage] Cloudflare R2 upload failed, failing over to next provider:", r2Err);
    }
  }

  // 2. Priority 2: Cloudinary Free Tier (25 GB free credits)
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const base64Data = Buffer.from(buffer).toString("base64");
      const dataUri = `data:${contentType};base64,${base64Data}`;

      const formData = new URLSearchParams();
      formData.append("file", dataUri);
      formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default");
      formData.append("folder", `kaspi/${tenantId}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res.json();
      if (res.ok && json.secure_url) {
        return {
          url: json.secure_url,
          provider: "cloudinary",
          sizeBytes,
        };
      }
    } catch (cloudErr) {
      console.warn("[Storage] Cloudinary upload failed, failing over to next provider:", cloudErr);
    }
  }

  // 3. Priority 3: Supabase Storage Free Tier (1 GB)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "products";
      const path = `${tenantId}/${Date.now()}-${fileName}`;

      const res = await fetch(
        `${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": contentType,
          },
          body: buffer as any,
        }
      );

      if (res.ok) {
        const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
        return {
          url: publicUrl,
          provider: "supabase",
          sizeBytes,
        };
      }
    } catch (supaErr) {
      console.warn("[Storage] Supabase Storage failed, using inline Data URI fallback:", supaErr);
    }
  }

  // 4. Safe Guaranteed Fallback: Inline Base64 Data URI
  const base64 = Buffer.from(buffer).toString("base64");
  return {
    url: `data:${contentType};base64,${base64}`,
    provider: "data-url",
    sizeBytes,
  };
}
