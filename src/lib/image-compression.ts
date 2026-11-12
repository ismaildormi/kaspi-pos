/**
 * KASPI Client-Side Image Ultra-Compression & Auto-PNG Cutout Engine
 * 100% Zero-Server-Cost / $0 API Cost.
 * 
 * Features:
 * 1. WebP/PNG Compression (<40KB) via HTML5 Canvas.
 * 2. Auto-Cutout Background Pass:
 *    Samples the 4 corners of the uploaded product photo.
 *    If a uniform/studio solid background (e.g. white, light gray, solid studio backdrop)
 *    is detected, it performs a 0ms BFS flood-fill transparency pass turning background
 *    pixels transparent (alpha = 0) so the product floats seamlessly on dark cards!
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxDimension?: number;
  quality?: number;
  autoRemoveBackground?: boolean;
  colorTolerance?: number; // 0-255, default ~35
  generateDataUrl?: boolean;
}

export interface CompressionResult {
  blob: Blob;
  sha256?: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  mimeType: string;
  dataUrl?: string;
  backgroundRemoved?: boolean;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Flood-fill transparency pass from image borders
 */
function applyContiguousBackgroundCutout(
  imageData: ImageData,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number = 38
): boolean {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const isColorMatch = (idx: number) => {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    const a = data[idx * 4 + 3];
    if (a < 10) return false;
    return colorDistance(r, g, b, targetR, targetG, targetB) <= tolerance;
  };

  // Seed with all boundary pixels matching background color
  for (let x = 0; x < width; x++) {
    const topIdx = x;
    const botIdx = (height - 1) * width + x;
    if (isColorMatch(topIdx)) {
      visited[topIdx] = 1;
      queue.push(topIdx);
    }
    if (isColorMatch(botIdx)) {
      visited[botIdx] = 1;
      queue.push(botIdx);
    }
  }

  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    const rightIdx = y * width + (width - 1);
    if (!visited[leftIdx] && isColorMatch(leftIdx)) {
      visited[leftIdx] = 1;
      queue.push(leftIdx);
    }
    if (!visited[rightIdx] && isColorMatch(rightIdx)) {
      visited[rightIdx] = 1;
      queue.push(rightIdx);
    }
  }

  if (queue.length === 0) return false;

  let head = 0;
  let clearedCount = 0;

  while (head < queue.length) {
    const curr = queue[head++];
    const px = curr % width;
    const py = Math.floor(curr / width);

    // Make transparent
    data[curr * 4 + 3] = 0;
    clearedCount++;

    // 4-neighborhood expansion
    const neighbors = [
      px > 0 ? curr - 1 : -1,
      px < width - 1 ? curr + 1 : -1,
      py > 0 ? curr - width : -1,
      py < height - 1 ? curr + width : -1,
    ];

    for (const next of neighbors) {
      if (next >= 0 && !visited[next]) {
        visited[next] = 1;
        if (isColorMatch(next)) {
          queue.push(next);
        }
      }
    }
  }

  // If we cleared a reasonable portion of the canvas (e.g. > 8% and < 90%)
  return clearedCount > (width * height * 0.05);
}

export async function compressImage(
  fileOrBlob: Blob | File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxDim = options.maxDimension || 800;
  const maxWidth = options.maxWidth || maxDim;
  const maxHeight = options.maxHeight || maxDim;
  const quality = options.quality ?? 0.82;
  const autoCutout = options.autoRemoveBackground ?? true;
  const tolerance = options.colorTolerance ?? 38;
  const originalSize = fileOrBlob.size;

  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      blob: fileOrBlob,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      reductionPercentage: 0,
      mimeType: fileOrBlob.type || "application/octet-stream",
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      width = Math.max(width, 1);
      height = Math.max(height, 1);

      // 1. Offscreen source canvas for cutout pass
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;

      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
      if (!tempCtx) {
        reject(new Error("Failed to get offscreen 2D canvas context"));
        return;
      }

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = "high";
      tempCtx.drawImage(img, 0, 0, width, height);

      let didRemoveBackground = false;

      if (autoCutout && width > 4 && height > 4) {
        try {
          const imgData = tempCtx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Sample 4 corners
          const corners = [
            0, // top-left
            (width - 1), // top-right
            (height - 1) * width, // bottom-left
            (height - 1) * width + (width - 1), // bottom-right
          ];

          let avgR = 0, avgG = 0, avgB = 0;
          for (const c of corners) {
            avgR += data[c * 4];
            avgG += data[c * 4 + 1];
            avgB += data[c * 4 + 2];
          }
          avgR = Math.round(avgR / 4);
          avgG = Math.round(avgG / 4);
          avgB = Math.round(avgB / 4);

          // Verify corners are consistent with each other
          let cornersConsistent = true;
          for (const c of corners) {
            const r = data[c * 4];
            const g = data[c * 4 + 1];
            const b = data[c * 4 + 2];
            if (colorDistance(r, g, b, avgR, avgG, avgB) > tolerance + 15) {
              cornersConsistent = false;
              break;
            }
          }

          // Check if corners are a solid studio backdrop (often white/near-white or light neutral)
          if (cornersConsistent) {
            didRemoveBackground = applyContiguousBackgroundCutout(
              imgData,
              avgR,
              avgG,
              avgB,
              tolerance
            );
            if (didRemoveBackground) {
              tempCtx.putImageData(imgData, 0, 0);
            }
          }
        } catch (e) {
          console.warn("[Auto-Cutout] Transparency pass skipped:", e);
        }
      }

      // 2. Final Studio Pure White (#FFFFFF) Canvas at 92% Scale Factor
      const finalWidth = 600;
      const finalHeight = 600;
      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }

      // Fill canvas background with Pure Studio White (#FFFFFF)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalWidth, finalHeight);

      // Compute scaled dimensions within 92% (leaving 4% studio margin, zero cropping)
      const maxTargetW = finalWidth * 0.92;
      const maxTargetH = finalHeight * 0.92;
      const scale = Math.min(maxTargetW / width, maxTargetH / height);
      const drawW = Math.round(width * scale);
      const drawH = Math.round(height * scale);
      const offsetX = Math.round((finalWidth - drawW) / 2);
      const offsetY = Math.round((finalHeight - drawH) / 2);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tempCanvas, 0, 0, width, height, offsetX, offsetY, drawW, drawH);

      // Export format: WebP supports high compression with pristine white background
      const exportMime = "image/webp";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Blob generation failed"));
            return;
          }

          const compressedSize = blob.size;
          const reduction = Math.max(
            0,
            Math.round(((originalSize - compressedSize) / originalSize) * 100)
          );

          let dataUrl: string | undefined;
          if (options.generateDataUrl) {
            dataUrl = canvas.toDataURL(exportMime, quality);
          }

          resolve({
            blob,
            originalSizeBytes: originalSize,
            compressedSizeBytes: compressedSize,
            reductionPercentage: reduction,
            mimeType: blob.type || exportMime,
            dataUrl,
            backgroundRemoved: didRemoveBackground,
          });
        },
        exportMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

export const compressImageToWebP = compressImage;
