/**
 * HEYUKA (KASPI Sovereign AI) — Official Lightweight TypeScript Client SDK
 * Compatible with Node.js, Next.js, Edge runtimes, and modern browsers.
 * Supports Key ID (`X-API-Key-Id`) pairing + `hk-live-...` / `zx-live-...` API keys.
 */

export interface XZebraClientOptions {
  apiKey: string;
  keyId?: string;
  baseUrl?: string;
}

export class XZebraClient {
  private readonly apiKey: string;
  private readonly keyId?: string;
  private readonly baseUrl: string;

  constructor(options: XZebraClientOptions) {
    if (!options?.apiKey || !options.apiKey.trim()) {
      throw new Error("XZebraClient requires a valid HEYUKA API key (hk-live-... or zx-live-...).");
    }
    this.apiKey = options.apiKey.trim();
    this.keyId = options.keyId?.trim() || undefined;
    this.baseUrl = (options.baseUrl || "https://kaspi-pos.vercel.app").replace(/\/$/, "");
  }

  private async request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    if (this.keyId) headers.set("X-API-Key-Id", this.keyId);
    if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error?.message || payload?.error || `HEYUKA API HTTP ${res.status}`);
    }
    return payload as T;
  }

  readonly chat = {
    completions: (params: {
      model?: "heyuka-core" | "heyuka-vision" | "heyuka-omni";
      messages: Array<{ role: "system" | "user" | "assistant"; content: any }>;
      enableTools?: boolean;
      stream?: boolean;
    }) =>
      this.request("/api/v1/chat/completions", {
        method: "POST",
        body: JSON.stringify({ model: "heyuka-omni", ...params }),
      }),
    listModels: () => this.request("/api/v1/models", { method: "GET" }),
  };

  readonly publicApis = {
    query: (params: { category: string; query: string; base?: string; lang?: string; limit?: number }) =>
      this.request("/api/v1/public-apis", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    getUniverseCatalog: () => this.request("/api/v1/public-apis?catalog=universe", { method: "GET" }),
  };

  readonly images = {
    generate: (prompt: string) =>
      this.request("/api/v1/images/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, action: "generate" }),
      }),
    searchWeb: (prompt: string) =>
      this.request("/api/v1/images/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, action: "web_images" }),
      }),
  };

  readonly sandbox = {
    execute: (params: {
      language: "python" | "javascript" | "typescript" | "bash" | "php" | "go" | "c++";
      code: string;
      stdin?: string;
    }) =>
      this.request("/api/v1/sandbox/execute", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  };

  readonly web = {
    research: (params: { query?: string; url?: string; lang?: string }) =>
      this.request("/api/v1/web/research", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  };

  readonly vision = {
    removeBackground: (params: {
      imageUrl?: string;
      imageBase64?: string;
      model?: "rmbg-1.4" | "birefnet" | "imgly-webgpu";
    }) =>
      this.request("/api/v1/vision/remove-bg", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  };

  readonly threeD = {
    listAssets: (params: { q?: string; type?: "models" | "textures" | "hdris"; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set("q", params.q);
      if (params.type) qs.set("type", params.type);
      if (params.limit) qs.set("limit", String(params.limit));
      return this.request(`/api/v1/3d/assets?${qs.toString()}`, { method: "GET" });
    },
    generate: (params: { prompt?: string; imageUrl?: string; format?: "glb" | "fbx" | "blend" }) =>
      this.request("/api/v1/3d/generate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  };

  readonly audio = {
    transcribeUrl: (params: { mediaUrl: string; language?: string }) =>
      this.request("/api/v1/audio/transcribe", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    separate: (params: { mediaUrl: string; stems?: "2stems" | "4stems" }) =>
      this.request("/api/v1/audio/separate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  };

  readonly connector = {
    discoverOpenApi: (specUrl: string) =>
      this.request("/api/v1/zebra-x/auto-connect", {
        method: "POST",
        body: JSON.stringify({ specUrl }),
      }),
  };

  readonly nodeMesh = {
    getClusterManifest: () =>
      this.request("/api/v1/zebra-x/openapi", {
        method: "GET",
      }),
  };
}

export { XZebraClient as HeyukaClient };
export default XZebraClient;
