/**
 * KASPI GLOBAL BACKUP FABRIC (كسب) — Types & Manifest Specifications
 */

export interface BackupEncryptionHeader {
  algorithm: "AES-256-GCM";
  iv: string; // Hex-encoded 96-bit initialization vector
  authTag: string; // Hex-encoded 128-bit authentication tag
  keyId: string; // Identifier of tenant encryption key
}

export interface BackupDestination {
  provider: "supabase" | "cloudflare-r2" | "local-disk" | "secondary-s3";
  bucketOrPath: string;
  region: string;
  isPrimary: boolean;
  status: "ONLINE" | "DEGRADED" | "STANDBY";
}

export interface BackupManifest {
  manifestId: string;
  tenantId: string;
  timestamp: string;
  backupType: "FULL_SNAPSHOT" | "INCREMENTAL_WAL" | "AUDIT_RECOVERY";
  totalRecords: number;
  plainBytes: number;
  cipherBytes: number;
  sha256Checksum: string;
  encryption: BackupEncryptionHeader;
  destinations: BackupDestination[];
  verifiedAt?: string;
  status: "CREATED" | "ENCRYPTED" | "REPLICATED" | "VERIFIED" | "CORRUPTED";
}

export interface RestoreVerificationResult {
  manifestId: string;
  isChecksumValid: boolean;
  isDecryptionSuccessful: boolean;
  recordsVerified: number;
  durationMs: number;
  status: "VERIFIED_OK" | "CHECKSUM_MISMATCH" | "DECRYPTION_FAILED";
  error?: string;
}
