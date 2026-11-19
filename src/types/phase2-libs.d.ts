declare module "mammoth" {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer }): Promise<{
    value: string;
    messages: Array<{ type: string; message: string }>;
  }>;
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer }): Promise<{
    value: string;
    messages: Array<{ type: string; message: string }>;
  }>;
}

declare module "bwip-js" {
  export interface BwipRenderOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: "offleft" | "left" | "center" | "right" | "offright" | "justify";
    backgroundcolor?: string;
    barcolor?: string;
    [key: string]: unknown;
  }
  export function toCanvas(
    canvas: string | HTMLCanvasElement | OffscreenCanvas,
    opts: BwipRenderOptions
  ): HTMLCanvasElement | OffscreenCanvas;
  export function toSVG(opts: BwipRenderOptions): string;
}
