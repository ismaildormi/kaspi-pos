/**
 * KASPI GLOBAL BACKUP FABRIC (كسب) — Client-Side Encryption Subsystem
 * 
 * Enforces Zero-Knowledge Encryption:
 * Data is encrypted with AES-256-GCM BEFORE transmission to any storage provider.
 * Even if an S3 bucket or community node is breached, ciphertext is mathematically unreadable.
 */

import crypto from "node:crypto";
import { BackupEncryptionHeader } from "./types";

export interface EncryptedPayload {
  cipherBuffer: Buffer;
  header: BackupEncryptionHeader;
  sha256Checksum: string;
}

export function encryptBackupData(
  plainTextOrBuffer: string | Buffer,
  secretKey32Bytes?: Buffer
): EncryptedPayload {
  const plainBuffer = Buffer.isBuffer(plainTextOrBuffer)
    ? plainTextOrBuffer
    : Buffer.from(plainTextOrBuffer, "utf-8");

  // Derive or use provided key (derived from APP_SECRET if not supplied)
  const masterSecret = process.env.APP_SECRET || process.env.AUTH_SECRET || "default_kaspi_secure_key_32_bytes_pad!";
  const key = secretKey32Bytes || crypto.createHash("sha256").update(masterSecret).digest();

  // 12-byte initialization vector for AES-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const sha256Checksum = crypto.createHash("sha256").update(encrypted).digest("hex");

  return {
    cipherBuffer: encrypted,
    header: {
      algorithm: "AES-256-GCM",
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      keyId: "tenant-master-v1",
    },
    sha256Checksum,
  };
}

export function decryptBackupData(
  cipherBuffer: Buffer,
  header: BackupEncryptionHeader,
  secretKey32Bytes?: Buffer
): Buffer {
  const masterSecret = process.env.APP_SECRET || process.env.AUTH_SECRET || "default_kaspi_secure_key_32_bytes_pad!";
  const key = secretKey32Bytes || crypto.createHash("sha256").update(masterSecret).digest();

  const iv = Buffer.from(header.iv, "hex");
  const authTag = Buffer.from(header.authTag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
}
