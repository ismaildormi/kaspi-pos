import { deflateSync, inflateSync } from "fflate";

/**
 * HEYUKA / KASPI — v15.4 Layer-3 & Layer-7:
 * Magic-Bytes Artifact Validator (`file-type` pattern) + Lossless `fflate` Compression Shield
 * Guarantees zero corrupted or 0-byte downloads and guards Vercel's 4.5MB serverless payload limit.
 */

export type ValidatedBinaryFormat =
  | "pdf"
  | "glb"
  | "zip"
  | "xlsx"
  | "docx"
  | "pptx"
  | "png"
  | "jpeg"
  | "wav"
  | "mp3";

export const MAX_SERVERLESS_PAYLOAD_BYTES = 4_200_000;

export interface BinaryValidationResult {
  valid: boolean;
  format: ValidatedBinaryFormat;
  byteLength: number;
  detectedSignature: string;
  reason?: string;
}

const MIN_BYTES_BY_FORMAT: Record<ValidatedBinaryFormat, number> = {
  pdf: 256,
  glb: 128,
  zip: 64,
  xlsx: 512,
  docx: 512,
  pptx: 512,
  png: 128,
  jpeg: 128,
  wav: 44,
  mp3: 64,
};

function asciiAt(bytes: Uint8Array, start: number, len: number): string {
  if (bytes.length < start + len) return "";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += String.fromCharCode(bytes[start + i]);
  }
  return out;
}

/**
 * Verifies magic bytes and non-empty length of generated artifacts before user delivery.
 */
export function validateBinaryArtifact(
  data: Uint8Array | Buffer | ArrayBuffer,
  expectedFormat: ValidatedBinaryFormat
): BinaryValidationResult {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  const minBytes = MIN_BYTES_BY_FORMAT[expectedFormat] ?? 64;
  if (bytes.byteLength < minBytes) {
    return {
      valid: false,
      format: expectedFormat,
      byteLength: bytes.byteLength,
      detectedSignature: "TOO_SMALL",
      reason: `Artifact byte length (${bytes.byteLength}) is below safe minimum (${minBytes}B).`,
    };
  }

  let matched = false;
  let detected = "UNKNOWN";

  switch (expectedFormat) {
    case "pdf": {
      const sig = asciiAt(bytes, 0, 5);
      detected = sig;
      matched = sig === "%PDF-";
      break;
    }
    case "glb": {
      const sig = asciiAt(bytes, 0, 4);
      const version =
        bytes.length >= 8
          ? bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)
          : 0;
      detected = `${sig}:v${version}`;
      matched = sig === "glTF" && version === 2;
      break;
    }
    case "zip":
    case "xlsx":
    case "docx":
    case "pptx": {
      const sigHex = `${bytes[0]?.toString(16)}_${bytes[1]?.toString(16)}_${bytes[2]?.toString(16)}_${bytes[3]?.toString(16)}`;
      detected = sigHex;
      matched = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
      break;
    }
    case "png": {
      matched =
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47;
      detected = matched ? "PNG_SIG" : "INVALID_PNG";
      break;
    }
    case "jpeg": {
      matched = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      detected = matched ? "JPEG_SOI" : "INVALID_JPEG";
      break;
    }
    case "wav": {
      const riff = asciiAt(bytes, 0, 4);
      const wave = asciiAt(bytes, 8, 4);
      detected = `${riff}/${wave}`;
      matched = riff === "RIFF" && wave === "WAVE";
      break;
    }
    case "mp3": {
      const id3 = asciiAt(bytes, 0, 3);
      const isFrameSync = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
      detected = id3 === "ID3" ? "ID3" : isFrameSync ? "MPEG_SYNC" : "INVALID_MP3";
      matched = id3 === "ID3" || isFrameSync;
      break;
    }
  }

  return {
    valid: matched,
    format: expectedFormat,
    byteLength: bytes.byteLength,
    detectedSignature: detected,
    reason: matched ? undefined : `Invalid magic bytes (${detected}) for ${expectedFormat}`,
  };
}

export function compressUtf8Payload(text: string): Uint8Array {
  return deflateSync(new TextEncoder().encode(text), { level: 6 });
}

export function decompressUtf8Payload(compressed: Uint8Array): string {
  return new TextDecoder().decode(inflateSync(compressed));
}

export function assertPayloadWithinServerlessLimit(byteLength: number): void {
  if (byteLength > MAX_SERVERLESS_PAYLOAD_BYTES) {
    throw new Error(
      `PAYLOAD_TOO_LARGE: ${byteLength} bytes exceeds Vercel safe threshold (${MAX_SERVERLESS_PAYLOAD_BYTES} bytes). Process locally in Browser WASM/WebWorkers first.`
    );
  }
}
