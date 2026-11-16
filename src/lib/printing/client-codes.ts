/**
 * KASPI POS (كسب) — Zero-Server-Cost Pure Client-Side Barcode & QR Code Engine
 *
 * Implements 100% pure client TypeScript SVG generation for:
 * 1. Code 128 (1D Barcode): Standard B encoding for ticket numbers (e.g. REC-337162)
 * 2. QR Code (2D Matrix): Compact QR matrix for merchant website/booking/Google Maps URL
 *
 * ZERO network requests, ZERO cloud bandwidth, ZERO external dependencies.
 */

// Code 128 Pattern Table (Patterns 0 to 106)
// Each number represents bar/space widths (sum of digits = 11, except stop pattern = 13)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is STOP pattern)
];

const CODE128_START_B = 104;
const CODE128_STOP = 106;

/**
 * Generates an SVG string of a 1D Code 128 barcode for ticket numbers.
 */
export function generateCode128Svg(
  text: string,
  options?: {
    height?: number;
    barWidth?: number;
    showText?: boolean;
    quietZone?: number;
  }
): string {
  const clean = (text || "REC-000000").replace(/[^\x20-\x7E]/g, "");
  const height = options?.height ?? 44;
  const barWidth = options?.barWidth ?? 1.8;
  const showText = options?.showText ?? true;
  const quietZone = options?.quietZone ?? 10;

  const codes: number[] = [CODE128_START_B];
  let checksum = CODE128_START_B;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    codes.push(val);
    checksum += val * (i + 1);
  }

  const checkVal = checksum % 103;
  codes.push(checkVal);
  codes.push(CODE128_STOP);

  // Build bars
  let binaryString = "";
  for (const c of codes) {
    const pat = CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pat.length; j++) {
      const w = parseInt(pat[j], 10);
      binaryString += (isBar ? "1" : "0").repeat(w);
      isBar = !isBar;
    }
  }

  let rects = "";
  let x = quietZone;
  const barH = showText ? height - 14 : height;

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === "1") {
      rects += `<rect x="${(x).toFixed(1)}" y="0" width="${barWidth.toFixed(1)}" height="${barH}" fill="#000000" />`;
    }
    x += barWidth;
  }

  const totalWidth = x + quietZone;
  const textHtml = showText
    ? `<text x="${(totalWidth / 2).toFixed(1)}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#000000">${clean}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(0)} ${height}" width="${totalWidth.toFixed(0)}" height="${height}" style="display:block;margin:0 auto;background:transparent;">${rects}${textHtml}</svg>`;
}

// ---------------------------------------------------------------------------
// Pure Client-Side QR Code Matrix Generator (BCH + Reed-Solomon Byte Mode)
// ---------------------------------------------------------------------------

// GF(256) Log and Exp tables for QR Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], GF_EXP[i]);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsCompute(data: Uint8Array, numEc: number): Uint8Array {
  const gen = rsGeneratorPoly(numEc);
  const res = new Uint8Array(data.length + numEc);
  res.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return res.slice(data.length);
}

/**
 * Builds standard 21x21 (Version 1) or 25x25 (Version 2) QR Code matrix in pure TypeScript.
 */
export function generateQrCodeSvg(
  urlOrText: string,
  options?: { size?: number; margin?: number; title?: string }
): string {
  const content = (urlOrText || "https://kaspi.ma").trim();
  const size = options?.size ?? 110;
  const margin = options?.margin ?? 2;

  // Choose Version 1 (up to 14 bytes) or Version 2 (up to 26 bytes) or Version 3 (up to 42 bytes)
  const utf8Bytes = new TextEncoder().encode(content);
  let version = 1;
  let totalDataBytes = 19;
  let ecBytes = 7;
  let matrixDim = 21;

  if (utf8Bytes.length > 14 && utf8Bytes.length <= 26) {
    version = 2;
    totalDataBytes = 34;
    ecBytes = 10;
    matrixDim = 25;
  } else if (utf8Bytes.length > 26) {
    version = 3;
    totalDataBytes = 55;
    ecBytes = 15;
    matrixDim = 29;
  }

  // Bit buffer for byte mode (mode indicator 0100)
  const bitArr: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitArr.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(utf8Bytes.length, 8); // Character count indicator
  for (let i = 0; i < utf8Bytes.length; i++) {
    pushBits(utf8Bytes[i], 8);
  }
  // Terminator
  pushBits(0, Math.min(4, totalDataBytes * 8 - bitArr.length));
  // Byte align
  while (bitArr.length % 8 !== 0) bitArr.push(0);
  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArr.length < totalDataBytes * 8) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bitArr[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  const ecCode = rsCompute(dataBytes, ecBytes);
  const fullBytes = new Uint8Array(totalDataBytes + ecBytes);
  fullBytes.set(dataBytes, 0);
  fullBytes.set(ecCode, totalDataBytes);

  // Initialize Matrix
  const grid: Array<Array<number | null>> = Array.from({ length: matrixDim }, () =>
    new Array(matrixDim).fill(null)
  );

  // Draw Finder Patterns (7x7) + Separators
  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < matrixDim && col >= 0 && col < matrixDim) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              grid[row][col] = 1;
            } else {
              grid[row][col] = 0;
            }
          } else {
            grid[row][col] = 0;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, matrixDim - 7);
  placeFinder(matrixDim - 7, 0);

  // Alignment Pattern for Version 2 (at 18,18) and Version 3 (at 22,22)
  if (version >= 2) {
    const alignPos = version === 2 ? 18 : 22;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        grid[alignPos + r][alignPos + c] = isBlack ? 1 : 0;
      }
    }
  }

  // Timing Patterns
  for (let i = 8; i < matrixDim - 8; i++) {
    if (grid[6][i] === null) grid[6][i] = i % 2 === 0 ? 1 : 0;
    if (grid[i][6] === null) grid[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Dark module
  grid[matrixDim - 8][8] = 1;

  // Format info mask (Mask 0: (row + col) % 2 === 0)
  // Format bits for L-0: 111011111000100
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  let fIdx = 0;
  for (let c = 0; c <= 8; c++) {
    if (c !== 6) {
      grid[8][c] = formatBits[fIdx++];
    }
  }
  for (let r = 7; r >= 0; r--) {
    if (r !== 6) {
      grid[r][8] = formatBits[fIdx++];
    }
  }

  fIdx = 0;
  for (let r = matrixDim - 1; r >= matrixDim - 7; r--) {
    grid[r][8] = formatBits[fIdx++];
  }
  grid[matrixDim - 8][8] = 1;
  for (let c = matrixDim - 8; c < matrixDim; c++) {
    grid[8][c] = formatBits[fIdx++];
  }

  // Place data bits with Mask 0 ((r+c)%2 === 0)
  let bitPos = 0;
  const totalBits = fullBytes.length * 8;
  let dirUp = true;

  for (let c = matrixDim - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing column
    const rows = dirUp
      ? Array.from({ length: matrixDim }, (_, i) => matrixDim - 1 - i)
      : Array.from({ length: matrixDim }, (_, i) => i);

    for (const r of rows) {
      for (const colOffset of [0, 1]) {
        const col = c - colOffset;
        if (grid[r][col] === null) {
          let bit = 0;
          if (bitPos < totalBits) {
            const byteIndex = bitPos >>> 3;
            const bitIndex = 7 - (bitPos & 7);
            bit = (fullBytes[byteIndex] >>> bitIndex) & 1;
            bitPos++;
          }
          // Invert bit if mask matches
          if ((r + col) % 2 === 0) {
            bit ^= 1;
          }
          grid[r][col] = bit;
        }
      }
    }
    dirUp = !dirUp;
  }

  // Render SVG
  const totalDim = matrixDim + margin * 2;
  const cellSize = 4;
  let rects = "";

  for (let r = 0; r < matrixDim; r++) {
    for (let c = 0; c < matrixDim; c++) {
      if (grid[r][c] === 1) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000" />`;
      }
    }
  }

  const svgDim = totalDim * cellSize;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgDim} ${svgDim}" width="${size}" height="${size}" style="display:block;margin:0 auto;background:#ffffff;">${rects}</svg>`;
}
