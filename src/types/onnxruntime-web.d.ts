declare module "onnxruntime-web" {
  export const env: Record<string, unknown>;
  export const InferenceSession: {
    create(pathOrBuffer: string | Uint8Array | ArrayBuffer, options?: Record<string, unknown>): Promise<unknown>;
  };
}
