/**
 * ============================================================================
 * KASPI POS — CLIENT MEDIA TOOLS ENGINE
 * Real background removal (@imgly/background-removal WASM/WebGPU + edge fallback),
 * web product photo lookup, and AI studio image generation.
 * ============================================================================
 */

export interface BackgroundRemovalResult {
  dataUrl: string;
  method: "imgly_onnx" | "canvas_border_chroma";
  width: number;
  height: number;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed reading processed PNG blob"));
    reader.readAsDataURL(blob);
  });
}

async function canvasSmartBorderBackgroundRemoval(
  sourceUrl: string
): Promise<BackgroundRemovalResult> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed loading image onto canvas"));
    img.src = sourceUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 512;
  canvas.height = img.naturalHeight || 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imgData;

  // Sample average border background color from 4 corners
  const corners = [
    0,
    (width - 1) * 4,
    ((height - 1) * width) * 4,
    ((height - 1) * width + (width - 1)) * 4,
  ];
  let br = 0;
  let bg = 0;
  let bb = 0;
  for (const idx of corners) {
    br += data[idx];
    bg += data[idx + 1];
    bb += data[idx + 2];
  }
  br /= 4;
  bg /= 4;
  bb /= 4;

  // Edge-connected BFS flood-fill transparency so interior highlights of the product remain untouched
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const isBgLike = (p: number) => {
    const idx = p * 4;
    const dr = Math.abs(data[idx] - br);
    const dg = Math.abs(data[idx + 1] - bg);
    const db = Math.abs(data[idx + 2] - bb);
    return dr + dg + db < 78;
  };

  for (let x = 0; x < width; x++) {
    const top = x;
    const bot = (height - 1) * width + x;
    if (isBgLike(top) && !visited[top]) {
      visited[top] = 1;
      queue[tail++] = top;
    }
    if (isBgLike(bot) && !visited[bot]) {
      visited[bot] = 1;
      queue[tail++] = bot;
    }
  }
  for (let y = 0; y < height; y++) {
    const left = y * width;
    const right = y * width + (width - 1);
    if (isBgLike(left) && !visited[left]) {
      visited[left] = 1;
      queue[tail++] = left;
    }
    if (isBgLike(right) && !visited[right]) {
      visited[right] = 1;
      queue[tail++] = right;
    }
  }

  while (head < tail) {
    const p = queue[head++];
    data[p * 4 + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0 && !visited[p - 1] && isBgLike(p - 1)) {
      visited[p - 1] = 1;
      queue[tail++] = p - 1;
    }
    if (x + 1 < width && !visited[p + 1] && isBgLike(p + 1)) {
      visited[p + 1] = 1;
      queue[tail++] = p + 1;
    }
    if (y > 0 && !visited[p - width] && isBgLike(p - width)) {
      visited[p - width] = 1;
      queue[tail++] = p - width;
    }
    if (y + 1 < height && !visited[p + width] && isBgLike(p + width)) {
      visited[p + width] = 1;
      queue[tail++] = p + width;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/png"),
    method: "canvas_border_chroma",
    width,
    height,
  };
}

/**
 * Removes image background locally in the browser with zero server API keys.
 * Uses ONNX neural segmentation (@imgly/background-removal) first, with a smart
 * edge-connected flood-fill transparent PNG fallback if ONNX WASM assets are offline.
 */
export async function removeImageBackgroundLocal(
  input: Blob | string
): Promise<BackgroundRemovalResult> {
  const safeUrl =
    typeof input === "string"
      ? input.startsWith("http") && !input.startsWith(window.location.origin)
        ? `/api/ai/media-tools?action=image_proxy&url=${encodeURIComponent(input)}`
        : input
      : URL.createObjectURL(input);

  try {
    const mod = await import("@imgly/background-removal");
    const resultBlob = await mod.removeBackground(safeUrl, {
      output: { format: "image/png" },
    });
    const dataUrl = await blobToDataUrl(resultBlob);
    const dims = await new Promise<{ w: number; h: number }>((res) => {
      const i = new Image();
      i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight });
      i.onerror = () => res({ w: 512, h: 512 });
      i.src = dataUrl;
    });
    return {
      dataUrl,
      method: "imgly_onnx",
      width: dims.w,
      height: dims.h,
    };
  } catch {
    return await canvasSmartBorderBackgroundRemoval(safeUrl);
  } finally {
    if (typeof input !== "string" && safeUrl.startsWith("blob:")) {
      URL.revokeObjectURL(safeUrl);
    }
  }
}
