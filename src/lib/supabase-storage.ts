import { supabase, SUPABASE_URL } from "./supabase";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export interface UploadProductImageResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Uploads a product image directly to the Supabase 'product-images' storage bucket.
 * Organizes files by tenantId and timestamp to guarantee uniqueness and tenant isolation.
 *
 * @param file - Browser File object selected by the user
 * @param tenantId - The active tenant/store identifier
 * @returns Public URL of the uploaded image
 */
export async function uploadProductImage(
  file: File,
  tenantId: string = "default"
): Promise<string> {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  // 1. Sanitize filename and prepare storage path
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `${tenantId}/${cleanBaseName}-${uniqueKey}.${extension}`;

  // 2. Upload file to Supabase storage bucket
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    console.error("[Supabase Storage] Upload error:", error.message);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // 3. Resolve public URL for CDN delivery
  const { data: urlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    // Standard Supabase public URL construction fallback
    return `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${data.path}`;
  }

  return urlData.publicUrl;
}

/**
 * Server-side helper to upload an image buffer or Uint8Array using admin privileges.
 */
export async function uploadProductImageServer(
  buffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  tenantId: string = "default"
): Promise<string> {
  const { getSupabaseAdmin } = await import("./supabase");
  const adminClient = getSupabaseAdmin();

  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const cleanBaseName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `${tenantId}/${cleanBaseName}-${uniqueKey}.${extension}`;

  const { data, error } = await adminClient.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });

  if (error) {
    console.error("[Supabase Admin Storage] Server upload error:", error);
    throw new Error(`Admin upload failed: ${error.message}`);
  }

  const { data: urlData } = adminClient.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
