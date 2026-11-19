/**
 * @x-zebra/sdk — Official Lightweight TypeScript Client for X × Zebra Platform APIs
 * Works across Node.js, Next.js, Edge runtimes, and modern browsers.
 * Zero external runtime dependencies.
 */

export interface XZebraClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export class XZebraClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: XZebraClientOptions) {
    if (!options?.apiKey || !options.apiKey.trim()) {
      throw new Error("XZebraClient requires a valid X × Zebra API key (zx-live-...).");
    }
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || "https://kaspi-pos.vercel.app").replace(/\/$/, "");
  }

  private async request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error?.message || payload?.error || `X-Zebra API HTTP ${res.status}`);
    }
    return payload as T;
  }

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

export default XZebraClient;
