/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Cloudflare Edge & R2 Storage Adapter
 * 
 * Manages zero-egress R2 object storage destinations for encrypted disaster recovery backups.
 */

export interface CloudflareTelemetry {
  isR2Configured: boolean;
  endpoint: string;
  bucketName: string;
  publicUrl: string;
}

export function getCloudflareR2Telemetry(): CloudflareTelemetry {
  const endpoint = process.env.R2_ENDPOINT || "https://cloudflare.r2.internal";
  const bucketName = process.env.R2_BUCKET_NAME || "kaspi-pos-uploads";
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  const isR2Configured = Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT
  );

  return {
    isR2Configured,
    endpoint,
    bucketName,
    publicUrl,
  };
}
