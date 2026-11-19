import Dexie, { type Table } from "dexie";
import { isSafePublicHttpUrl } from "@/lib/zebra-x/arsenal-vault";

/**
 * X × Zebra — Universal Auto-Connector & Persistent Capability Registry (v8.5)
 * Parses external OpenAPI / Swagger JSON specs, MCP server descriptors, and
 * webhook bridges (n8n / Activepieces / Zapier) into persistent typed tool
 * definitions without ever violating SSRF boundaries or mutating Kaspi POS core.
 */

export interface DiscoveredConnectorOperation {
  operationId: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  parameterNames: string[];
}

export interface DiscoveredCapabilityRecord {
  id: string;
  kind: "openapi" | "mcp" | "webhook";
  name: string;
  baseUrl: string;
  specUrl: string;
  version: string;
  operations: DiscoveredConnectorOperation[];
  discoveredAt: number;
}

class ZebraConnectorsDexie extends Dexie {
  connectors!: Table<DiscoveredCapabilityRecord, string>;

  constructor() {
    super("kaspi_zebra_x_connectors_v1");
    this.version(1).stores({
      connectors: "id, kind, name, discoveredAt",
    });
  }
}

let db: ZebraConnectorsDexie | null = null;
const serverRegistry = new Map<string, DiscoveredCapabilityRecord>();

function getConnectorDb(): ZebraConnectorsDexie | null {
  if (typeof window === "undefined") return null;
  if (!db) db = new ZebraConnectorsDexie();
  return db;
}

export async function saveDiscoveredCapability(
  record: DiscoveredCapabilityRecord
): Promise<void> {
  const store = getConnectorDb();
  if (store) {
    try {
      await store.connectors.put(record);
      return;
    } catch {}
  }
  serverRegistry.set(record.id, record);
}

export async function listDiscoveredCapabilities(): Promise<DiscoveredCapabilityRecord[]> {
  const store = getConnectorDb();
  if (store) {
    try {
      return await store.connectors.orderBy("discoveredAt").reverse().toArray();
    } catch {}
  }
  return Array.from(serverRegistry.values()).sort(
    (a, b) => b.discoveredAt - a.discoveredAt
  );
}

/**
 * Fetches and parses an external OpenAPI v3 / Swagger v2 JSON document with strict SSRF protection.
 */
export async function discoverOpenApiSpec(specUrl: string): Promise<{
  ok: boolean;
  connector?: DiscoveredCapabilityRecord;
  error?: string;
}> {
  const cleanUrl = String(specUrl || "").trim();
  if (!isSafePublicHttpUrl(cleanUrl)) {
    return {
      ok: false,
      error: "SSRF_BLOCKED: Private, loopback, internal, or non-HTTP OpenAPI URLs are forbidden.",
    };
  }

  try {
    const res = await fetch(cleanUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "XZebra-AutoConnector/8.5",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { ok: false, error: `OpenAPI spec returned HTTP ${res.status}` };
    }

    const spec = (await res.json()) as any;
    const pathsObj = spec?.paths;
    if (!pathsObj || typeof pathsObj !== "object") {
      return { ok: false, error: "Document does not contain valid OpenAPI/Swagger 'paths'." };
    }

    const rawServer =
      spec?.servers?.[0]?.url ||
      (spec?.host ? `https://${spec.host}${spec.basePath || ""}` : new URL(cleanUrl).origin);

    let resolvedBaseUrl = new URL(cleanUrl).origin;
    try {
      const candidate = String(rawServer).startsWith("http")
        ? String(rawServer)
        : new URL(String(rawServer), cleanUrl).toString();
      if (isSafePublicHttpUrl(candidate)) resolvedBaseUrl = candidate.replace(/\/$/, "");
    } catch {}

    const operations: DiscoveredConnectorOperation[] = [];
    const allowedMethods = new Set(["get", "post", "put", "delete", "patch"]);

    for (const [pathKey, methodsObj] of Object.entries(pathsObj)) {
      if (!methodsObj || typeof methodsObj !== "object") continue;
      for (const [methodKey, opDef] of Object.entries(methodsObj as Record<string, any>)) {
        const low = methodKey.toLowerCase();
        if (!allowedMethods.has(low)) continue;
        const params: string[] = Array.isArray(opDef?.parameters)
          ? opDef.parameters
              .map((p: any) => String(p?.name || ""))
              .filter(Boolean)
              .slice(0, 12)
          : [];
        operations.push({
          operationId: String(
            opDef?.operationId || `${low}_${pathKey.replace(/[^a-zA-Z0-9]+/g, "_")}`
          ),
          method: low.toUpperCase() as DiscoveredConnectorOperation["method"],
          path: pathKey,
          summary: String(opDef?.summary || opDef?.description || `${low.toUpperCase()} ${pathKey}`).slice(
            0,
            140
          ),
          parameterNames: params,
        });
        if (operations.length >= 40) break;
      }
      if (operations.length >= 40) break;
    }

    const record: DiscoveredCapabilityRecord = {
      id: `openapi:${new URL(cleanUrl).hostname}:${operations.length}`,
      kind: "openapi",
      name: String(spec?.info?.title || new URL(cleanUrl).hostname).slice(0, 80),
      baseUrl: resolvedBaseUrl,
      specUrl: cleanUrl,
      version: String(spec?.info?.version || spec?.openapi || spec?.swagger || "3.0"),
      operations,
      discoveredAt: Date.now(),
    };

    await saveDiscoveredCapability(record);
    return { ok: true, connector: record };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to parse OpenAPI document" };
  }
}

export async function registerWebhookOrMcpConnector(params: {
  kind: "mcp" | "webhook";
  name: string;
  endpointUrl: string;
  operations?: DiscoveredConnectorOperation[];
}): Promise<{ ok: boolean; connector?: DiscoveredCapabilityRecord; error?: string }> {
  if (!isSafePublicHttpUrl(params.endpointUrl)) {
    return {
      ok: false,
      error: "SSRF_BLOCKED: Endpoint must be a valid public HTTP/HTTPS URL.",
    };
  }

  const record: DiscoveredCapabilityRecord = {
    id: `${params.kind}:${Date.now().toString(36)}`,
    kind: params.kind,
    name: params.name.trim().slice(0, 80) || "Custom Connector",
    baseUrl: params.endpointUrl.trim().replace(/\/$/, ""),
    specUrl: params.endpointUrl.trim(),
    version: "1.0",
    operations: params.operations || [
      {
        operationId: "invoke_bridge",
        method: "POST",
        path: "/",
        summary: `Dispatch payload to ${params.name.trim()} (${params.kind.toUpperCase()})`,
        parameterNames: ["payload"],
      },
    ],
    discoveredAt: Date.now(),
  };

  await saveDiscoveredCapability(record);
  return { ok: true, connector: record };
}
