"use client";

import {
  generateAndDownloadArabicPdf,
  generateAndDownloadExcelXlsx,
} from "@/lib/zebra-x/tools/docs-export-engine";

function sanitizeSlug(title: string, ext: string): string {
  const base = (title || "kaspi-document")
    .trim()
    .replace(/[^\w\u0600-\u06FF-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "kaspi-document"}.${ext}`;
}

export function buildStandaloneHtmlDocument(rawHtml: string, title = "HEYUKA Live Document"): string {
  const trimmed = String(rawHtml || "").trim();
  const hasRtlChars = /[\u0600-\u06FF]/.test(trimmed);
  if (/<!doctype|<html/i.test(trimmed)) {
    return trimmed;
  }
  return `<!doctype html>
<html lang="${hasRtlChars ? "ar" : "en"}" dir="${hasRtlChars ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title.replace(/</g, "&lt;")}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #ffffff;
      color: #111827;
      font-family: "Segoe UI", Tahoma, Arial, system-ui, sans-serif;
      line-height: 1.55;
    }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: start; }
    th { background: #f3f4f6; font-weight: 700; }
  </style>
</head>
<body>${trimmed}</body>
</html>`;
}

/**
 * Exports any HTML invoice/report into a crisp A4 downloadable `.pdf` preserving native Arabic RTL ligatures
 * via high-DPI offscreen SVG-foreignObject canvas rasterization + pdfmake, with instant print fallback.
 */
export async function downloadHtmlAsPdf(rawHtml: string, title = "KASPI_Document"): Promise<void> {
  const fullHtml = buildStandaloneHtmlDocument(rawHtml, title);
  const fileName = sanitizeSlug(title, "pdf");

  try {
    // Strip remote images or unsafe script execution when rasterizing via SVG foreignObject
    const staticHtml = fullHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/http:\/\/[^\s"']+|https:\/\/[^\s"']+/gi, "");

    const width = 794; // A4 width at 96 DPI
    const probe = document.createElement("iframe");
    probe.style.cssText =
      "position:fixed;left:-99999px;top:0;width:794px;height:1200px;visibility:hidden;border:0;";
    probe.srcdoc = staticHtml;
    document.body.appendChild(probe);

    await new Promise<void>((resolve) => {
      probe.onload = () => setTimeout(resolve, 60);
      setTimeout(resolve, 400);
    });

    const docEl = probe.contentDocument?.documentElement;
    const contentHeight = Math.max(
      420,
      Math.min(4800, Number(probe.contentDocument?.body?.scrollHeight || docEl?.scrollHeight || 1122) + 32)
    );
    const serializedBody = new XMLSerializer().serializeToString(probe.contentDocument?.body || document.body);
    const dir = /[\u0600-\u06FF]/.test(rawHtml) ? "rtl" : "ltr";
    const styles = Array.from(probe.contentDocument?.querySelectorAll("style") || [])
      .map((s) => s.textContent || "")
      .join("\n");
    probe.remove();

    const xhtmlSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${contentHeight}">
  <foreignObject x="0" y="0" width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" dir="${dir}" style="width:${width}px;min-height:${contentHeight}px;background:#ffffff;color:#111827;font-family:Tahoma,Arial,sans-serif;">
      <style>${styles.replace(/</g, "&lt;")}</style>
      ${serializedBody}
    </div>
  </foreignObject>
</svg>`;

    const img = new Image();
    const svgBlob = new Blob([xhtmlSvg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const pngDataUrl = await new Promise<string>((resolve, reject) => {
      img.onload = () => {
        try {
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = width * scale;
          canvas.height = contentHeight * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context unavailable");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(svgUrl);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          URL.revokeObjectURL(svgUrl);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error("SVG rasterize failed"));
      };
      img.src = svgUrl;
    });

    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
    const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
    const vfs = (pdfFontsModule as any).default?.pdfMake?.vfs || (pdfFontsModule as any).pdfMake?.vfs;
    if (vfs) pdfMake.vfs = vfs;

    const dd = {
      pageSize: "A4",
      pageMargins: [16, 16, 16, 16],
      content: [
        {
          image: pngDataUrl,
          width: 563,
        },
      ],
    };

    await new Promise<void>((resolve) => {
      pdfMake.createPdf(dd).download(fileName, () => resolve());
      setTimeout(resolve, 900);
    });
  } catch {
    // Crisp isolated print dialog fallback if foreignObject fails on unusual markup
    printHtmlDocument(rawHtml, title);
  }
}

export function printHtmlDocument(rawHtml: string, title = "KASPI_Document"): void {
  const fullHtml = buildStandaloneHtmlDocument(rawHtml, title);
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.srcdoc = fullHtml;
  document.body.appendChild(frame);
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => frame.remove(), 2000);
    }
  };
}

export async function exportMarkdownTableToExcel(
  headers: string[],
  rows: string[][],
  title = "KASPI_Table"
): Promise<void> {
  const locale = headers.some((h) => /[\u0600-\u06FF]/.test(h)) ? "ar" : "en";
  await generateAndDownloadExcelXlsx({
    format: "xlsx",
    title,
    locale,
    columns: headers,
    rows: rows.map((r) => headers.map((_, idx) => String(r[idx] ?? ""))),
  });
}

export async function exportMarkdownTableToPdf(
  headers: string[],
  rows: string[][],
  title = "KASPI_Table"
): Promise<void> {
  const locale = headers.some((h) => /[\u0600-\u06FF]/.test(h)) ? "ar" : "en";
  await generateAndDownloadArabicPdf(
    {
      title,
      locale,
      shopName: "KASPI POS • HEYUKA",
      generatedAt: new Date().toISOString(),
      columns: headers.slice(0, 4),
      rows: rows.slice(0, 120).map((r) => ({
        col1: String(r[0] ?? ""),
        col2: String(r[1] ?? ""),
        col3: headers.length > 2 ? String(r[2] ?? "") : undefined,
        col4: headers.length > 3 ? String(r[3] ?? "") : undefined,
      })),
    },
    locale
  );
}
