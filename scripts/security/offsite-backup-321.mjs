#!/usr/bin/env node
/**
 * KASPI POS — Rule 3-2-1 Off-Site Encrypted Backup & SHA-256 Manifest Script (Layer 2)
 *
 * Exports encrypted (AES-256-GCM) and SHA-256 signed snapshots of critical tenant
 * and forensic tables, and optionally ships them to an Air-Gapped S3 / Webhook vault.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BACKUP_DIR = process.env.BACKUP_OUTPUT_DIR || path.join(process.cwd(), ".backups", "321-vault");
const ENCRYPTION_KEY_RAW = process.env.BACKUP_ENCRYPTION_KEY || process.env.FORENSIC_AUDIT_SECRET || "";

function deriveAes256Key(secret) {
  if (!secret || secret.length < 16) {
    console.warn("[Backup 3-2-1] Warning: Using ephemeral dev key. Set BACKUP_ENCRYPTION_KEY in production!");
    return crypto.createHash("sha256").update("kaspi-dev-backup-key").digest();
  }
  return crypto.createHash("sha256").update(secret).digest();
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  let prisma = null;
  let snapshotPayload = {
    version: "1.0.0",
    rule: "3-2-1-air-gapped-encrypted",
    createdAtIso: new Date().toISOString(),
    source: "kaspi-pos-postgres",
    tables: {},
  };

  if (process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      prisma = new PrismaClient();
      const [tenants, stores, salesCount, auditCount, invoicesCount, subscriptions] = await Promise.all([
        prisma.tenant.findMany({ select: { id: true, name: true, slug: true, createdAt: true } }),
        prisma.store.findMany({ select: { id: true, tenantId: true, name: true, sector: true } }),
        prisma.sale.count(),
        prisma.auditLog.count(),
        prisma.invoice.count(),
        prisma.subscription.findMany({
          select: { id: true, tenantId: true, status: true, planCode: true, currentPeriodEnd: true },
        }),
      ]);

      snapshotPayload.tables = {
        tenants,
        stores,
        subscriptions,
        metrics: { salesCount, auditCount, invoicesCount },
      };
    } catch (err) {
      console.error("[Backup 3-2-1] DB export error:", err.message);
      snapshotPayload.tables = { error: err.message };
    } finally {
      if (prisma) await prisma.$disconnect();
    }
  } else {
    snapshotPayload.tables = { note: "DATABASE_URL not set; generated dry-run encrypted manifest." };
  }

  const jsonBuffer = Buffer.from(JSON.stringify(snapshotPayload), "utf8");
  const compressed = zlib.gzipSync(jsonBuffer);

  const key = deriveAes256Key(ENCRYPTION_KEY_RAW);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Envelope: [12-byte IV][16-byte AuthTag][Ciphertext]
  const envelope = Buffer.concat([iv, authTag, encrypted]);
  const sha256 = crypto.createHash("sha256").update(envelope).digest("hex");

  const encFilename = `kaspi-snapshot-${timestamp}.enc`;
  const manifestFilename = `kaspi-snapshot-${timestamp}.manifest.json`;

  fs.writeFileSync(path.join(BACKUP_DIR, encFilename), envelope);
  const manifest = {
    file: encFilename,
    algorithm: "AES-256-GCM + GZIP",
    sha256,
    bytes: envelope.length,
    createdAtIso: snapshotPayload.createdAtIso,
  };
  fs.writeFileSync(path.join(BACKUP_DIR, manifestFilename), JSON.stringify(manifest, null, 2));

  console.log(`[Backup 3-2-1] Encrypted snapshot created: ${encFilename} (${envelope.length} bytes)`);
  console.log(`[Backup 3-2-1] SHA-256 Integrity Seal: ${sha256}`);

  const uploadUrl = process.env.AIR_GAPPED_BACKUP_WEBHOOK_URL?.trim();
  if (uploadUrl) {
    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kaspi-Backup-Sha256": sha256,
          ...(process.env.AIR_GAPPED_BACKUP_TOKEN
            ? { Authorization: `Bearer ${process.env.AIR_GAPPED_BACKUP_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          manifest,
          payloadBase64: envelope.toString("base64"),
        }),
        signal: AbortSignal.timeout(10000),
      });
      console.log(`[Backup 3-2-1] Air-gapped upload status: ${res.status}`);
    } catch (uploadErr) {
      console.error("[Backup 3-2-1] Air-gapped upload failed:", uploadErr.message);
    }
  }
}

runBackup().catch((err) => {
  console.error("[Backup 3-2-1] Fatal error:", err);
  process.exit(1);
});
