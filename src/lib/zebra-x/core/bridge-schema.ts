import { z } from "zod";

/**
 * X x Zebra — Unified Bridge & UI Action Contract (Critical Safeguard #4)
 * Strictly validates all messages between Web Browser, Tauri .exe, Owner Sidecar,
 * and interactive in-chat Action Confirmation Cards using Zod + JSON-RPC 2.0.
 */

export const BridgeTargetSchema = z.enum(["browser_wasm", "tauri_desktop", "owner_sidecar"]);
export type BridgeTarget = z.infer<typeof BridgeTargetSchema>;

export const BridgeRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.string().min(1),
  target: BridgeTargetSchema,
  method: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
  requiresConfirmation: z.boolean().default(false),
});
export type BridgeRpcRequest = z.infer<typeof BridgeRpcRequestSchema>;

export const BridgeRpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.string().min(1),
  ok: z.boolean(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number().int(),
      message: z.string(),
    })
    .optional(),
});
export type BridgeRpcResponse = z.infer<typeof BridgeRpcResponseSchema>;

export const ActivityBreadcrumbSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  kind: z.enum(["route", "click", "sale", "customer", "receipt", "ai_tool"]),
  route: z.string().max(180),
  label: z.string().max(160),
  detail: z.string().max(240).optional(),
});
export type ActivityBreadcrumb = z.infer<typeof ActivityBreadcrumbSchema>;

export const ActionConfirmLineSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().nonnegative().default(20),
  discountAmount: z.number().nonnegative().default(0),
});

export const ActionConfirmationPayloadSchema = z.object({
  actionId: z.string().min(1),
  kind: z.enum(["sell_cart_checkout", "apply_discount", "adjust_stock"]),
  title: z.string().min(1),
  summary: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "credit", "transfer"]).default("cash"),
  subtotalMAD: z.number().nonnegative(),
  discountTotalMAD: z.number().nonnegative().default(0),
  taxTotalMAD: z.number().nonnegative().default(0),
  grandTotalMAD: z.number().nonnegative(),
  items: z.array(ActionConfirmLineSchema).default([]),
  productId: z.string().optional(),
  newStockQty: z.number().optional(),
  newPriceMAD: z.number().optional(),
});
export type ActionConfirmationPayload = z.infer<typeof ActionConfirmationPayloadSchema>;

export const PdfReportLineSchema = z.object({
  col1: z.string(),
  col2: z.string(),
  col3: z.string().optional(),
  col4: z.string().optional(),
});

export const PdfReportPayloadSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  locale: z.string().default("ar"),
  shopName: z.string().default("KASPI POS"),
  generatedAt: z.string(),
  columns: z.array(z.string()).min(1).max(4),
  rows: z.array(PdfReportLineSchema).max(120),
  totals: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});
export type PdfReportPayload = z.infer<typeof PdfReportPayloadSchema>;

export const ReceiptTicketPayloadSchema = z.object({
  receiptNumber: z.string(),
  shopName: z.string(),
  storeAddress: z.string().optional(),
  dateIso: z.string(),
  paymentMethod: z.string(),
  customerName: z.string().optional(),
  subtotalMAD: z.string(),
  discountTotalMAD: z.string(),
  taxTotalMAD: z.string(),
  grandTotalMAD: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      unitPrice: z.string(),
      lineTotal: z.string(),
    })
  ),
});
export type ReceiptTicketPayload = z.infer<typeof ReceiptTicketPayloadSchema>;

// ============================================================================
// Phase 2 Contracts: Office Exports, Diagrams/KaTeX, Barcodes, Live Artifacts,
// Text Diffs & Interactive UI Guided Tours
// ============================================================================

export const OfficeExportPayloadSchema = z.object({
  format: z.enum(["docx", "xlsx", "pptx"]),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  locale: z.string().default("ar"),
  columns: z.array(z.string()).max(12).optional(),
  rows: z.array(z.array(z.string())).max(250).optional(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        body: z.string().optional(),
        bullets: z.array(z.string()).optional(),
      })
    )
    .max(25)
    .optional(),
  totals: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});
export type OfficeExportPayload = z.infer<typeof OfficeExportPayloadSchema>;

export const DiagramPayloadSchema = z.object({
  kind: z.enum(["mermaid", "markmap", "katex"]),
  title: z.string().min(1),
  code: z.string().min(1).max(16_000),
});
export type DiagramPayload = z.infer<typeof DiagramPayloadSchema>;

export const BarcodeLabelPayloadSchema = z.object({
  bcid: z.enum(["code128", "ean13", "qrcode", "datamatrix"]).default("code128"),
  text: z.string().min(1).max(512),
  label: z.string().optional(),
  priceMAD: z.string().optional(),
});
export type BarcodeLabelPayload = z.infer<typeof BarcodeLabelPayloadSchema>;

export const LiveHtmlArtifactPayloadSchema = z.object({
  title: z.string().min(1),
  html: z.string().min(1).max(40_000),
  modelUrl: z.string().optional(),
});
export type LiveHtmlArtifactPayload = z.infer<typeof LiveHtmlArtifactPayloadSchema>;

export const TextDiffPayloadSchema = z.object({
  title: z.string().min(1),
  oldLabel: z.string().default("Original"),
  newLabel: z.string().default("Updated"),
  oldText: z.string().max(15_000),
  newText: z.string().max(15_000),
});
export type TextDiffPayload = z.infer<typeof TextDiffPayloadSchema>;

export const UiTourPayloadSchema = z.object({
  title: z.string().min(1),
  steps: z
    .array(
      z.object({
        selector: z.string().optional(),
        title: z.string().min(1),
        description: z.string().min(1),
      })
    )
    .min(1)
    .max(12),
});
export type UiTourPayload = z.infer<typeof UiTourPayloadSchema>;

/**
 * Schema for HEYUKA inline generated/curated image asset cards (`[KASPI_IMAGE:base64]`).
 */
export const ImageAssetPayloadSchema = z.object({
  title: z.string().min(1).max(160),
  imageUrl: z.string().min(1).max(4000),
  proxyUrl: z.string().min(1).max(4000).optional(),
  prompt: z.string().min(1).max(1000).optional(),
  source: z.string().min(1).max(160).optional(),
  width: z.number().int().positive().max(8192).optional(),
  height: z.number().int().positive().max(8192).optional(),
});
export type ImageAssetPayload = z.infer<typeof ImageAssetPayloadSchema>;
