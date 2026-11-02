/**
 * Free AI Product Image Generation Utility (Pollinations.ai)
 * Zero API keys required — 100% free tier.
 */
export function generateProductImageUrl(productName: string): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    productName + " product photography, white background, high quality"
  )}?width=512&height=512&nologo=true`;
}
