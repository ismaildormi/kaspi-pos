export const PRODUCT_IMAGES_BUCKET = "product-images";

/**
 * Uploads a product image via the /api/upload endpoint.
 * Completely safe for browser/client use — zero server secret exposure.
 *
 * @param file - Selected File object
 * @param folder - Destination folder / tenant prefix
 * @returns Public URL of the uploaded image
 */
export async function uploadProductImage(
  file: File,
  folder: string = "products"
): Promise<string> {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || "Failed to upload image");
  }

  const json = await res.json();
  return json.url;
}
