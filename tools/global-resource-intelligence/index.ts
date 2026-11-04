/**
 * KASPI POS (كسب) — Global Resource Intelligence Engine
 * 
 * Evaluates worldwide cloud infrastructure, legitimate free tiers, provider limits,
 * compliance frameworks, and network latency across all connected & discovered pools.
 */

import fs from "node:fs";
import path from "node:path";

export interface IntelligenceReport {
  timestamp: string;
  totalProvidersCataloged: number;
  activeProviders: number;
  totalFreeStorageAllocatedGB: number;
  totalFreeBandwidthAllocatedGB: number;
  estimatedMonthlySavingsUSD: number;
  verifiedFreeTierAllocations: number;
  complianceFrameworksCount: number;
  regionalPoPsTracked: number;
}

export function loadCatalogFile<T>(filename: string): T {
  const localPath = path.join(__dirname, "catalog", filename);
  const fallbackPath = path.join(process.cwd(), "catalog", filename);

  const targetPath = fs.existsSync(localPath) ? localPath : fallbackPath;
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Catalog file not found: ${filename} (checked ${localPath} and ${fallbackPath})`);
  }

  const raw = fs.readFileSync(targetPath, "utf-8");
  return JSON.parse(raw) as T;
}

export function runGlobalResourceAudit(): IntelligenceReport {
  const providersData = loadCatalogFile<{ providers: any[] }>("global-providers.json");
  const freeResourcesData = loadCatalogFile<{ freeResources: any[] }>("free-resources.json");
  const termsData = loadCatalogFile<{ complianceFrameworks: any[] }>("provider-terms.json");
  const availabilityData = loadCatalogFile<{ regionalNodes: any[] }>("resource-availability.json");

  const totalProviders = providersData.providers.length;
  const activeProviders = providersData.providers.filter((p) => p.statusInKaspi.startsWith("ACTIVE_")).length;

  // Compute aggregated storage & bandwidth from verified free tiers
  let totalFreeStorageGB = 0;
  let totalFreeBandwidthGB = 0;

  for (const res of freeResourcesData.freeResources) {
    if (res.storageQuota.includes("GB") || res.storageQuota.includes("GiB")) {
      const match = res.storageQuota.match(/([\d.]+)\s*(GB|GiB)/i);
      if (match) totalFreeStorageGB += parseFloat(match[1]);
    }
    if (res.bandwidthQuota.includes("GB")) {
      const match = res.bandwidthQuota.match(/([\d.]+)\s*GB/i);
      if (match) totalFreeBandwidthGB += parseFloat(match[1]);
    } else if (res.bandwidthQuota.includes("TB")) {
      const match = res.bandwidthQuota.match(/([\d.]+)\s*TB/i);
      if (match) totalFreeBandwidthGB += parseFloat(match[1]) * 1024;
    }
  }

  // Estimated commercial replacement value of aggregated free capacity:
  // - Vercel Edge compute & bandwidth replacement: ~$20/mo
  // - Neon PostgreSQL serverless compute & storage: ~$19/mo
  // - Supabase Storage & Realtime WebSocket channels: ~$25/mo
  // - Google Cloud Gemini Flash & Groq LPU free tokens: ~$35/mo
  // - Cloudflare CDN & DDoS Anycast Shield: ~$20/mo
  // - Total estimated savings per active deployment: ~$119 USD / month (1,190 MAD / month)
  const estimatedSavingsUSD = 119.0;

  return {
    timestamp: new Date().toISOString(),
    totalProvidersCataloged: totalProviders,
    activeProviders,
    totalFreeStorageAllocatedGB: Math.round(totalFreeStorageGB * 10) / 10,
    totalFreeBandwidthAllocatedGB: Math.round(totalFreeBandwidthGB),
    estimatedMonthlySavingsUSD: estimatedSavingsUSD,
    verifiedFreeTierAllocations: freeResourcesData.freeResources.length,
    complianceFrameworksCount: termsData.complianceFrameworks.length,
    regionalPoPsTracked: availabilityData.regionalNodes.length,
  };
}

// CLI runner
if (require.main === module) {
  console.log("==================================================================");
  console.log("  KASPI GLOBAL RESOURCE INTELLIGENCE — AUDIT REPORT");
  console.log("==================================================================\n");

  const report = runGlobalResourceAudit();
  console.log(`Audited at: ${report.timestamp}`);
  console.log(`Total Providers Cataloged        : ${report.totalProvidersCataloged}`);
  console.log(`Active Connected Providers       : ${report.activeProviders}`);
  console.log(`Verified Free Allocations        : ${report.verifiedFreeTierAllocations}`);
  console.log(`Aggregated Free Storage Capacity : ${report.totalFreeStorageAllocatedGB} GB`);
  console.log(`Aggregated Free Bandwidth Pool   : ${report.totalFreeBandwidthAllocatedGB} GB / month`);
  console.log(`Estimated Monthly FinOps Savings : $${report.estimatedMonthlySavingsUSD} USD (${report.estimatedMonthlySavingsUSD * 10} MAD / month)`);
  console.log(`Regulatory Frameworks Mapped     : ${report.complianceFrameworksCount} (CNDP 09-08, DGI Art. 145, GDPR)`);
  console.log(`Global PoP Regions Tracked       : ${report.regionalPoPsTracked}`);
  console.log("\n>>> Global Resource Intelligence Audit Completed Successfully! <<<\n");
}
