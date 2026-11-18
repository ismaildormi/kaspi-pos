/**
 * ============================================================================
 * KASPI AI — PERSISTENT CLIENT-LOCAL BUSINESS MEMORY ("LIBRARY")
 * Stores generated stores, websites, apps, business identity, products/brand
 * voice, operational policies, verified Maps location, connected integrations
 * metadata (NO plaintext API secrets), reusable AI skills, and execution logs
 * right on the user's computer/browser, shared across ALL KASPI AI modes & models.
 * ============================================================================
 */

export interface LibraryProjectFileItem {
  name: string;
  path: string;
  language: string;
  content: string;
}

export interface StoreMapsLocation {
  label: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  osmEmbedUrl: string;
  googleMapsUrl: string;
  source: "browser_gps" | "osm_search" | "manual_coords";
  verifiedAt: string;
}

export interface LibraryArtifactItem {
  id: string;
  kind: "store" | "website" | "app" | "game" | "image" | "video" | "document" | "workflow";
  title: string;
  prompt: string;
  modelName: string;
  createdAt: string;
  previewHtml?: string | null;
  imageUrl?: string | null;
  files?: LibraryProjectFileItem[];
  notes?: string;
}

export interface LibraryBusinessKnowledge {
  businessName: string;
  sector: string;
  brandVoice: string;
  pricingRules: string;
  policies: string;
  targetAudience: string;
  preferredLanguage: string;
  monitoredUrls: string[];
}

export interface LibraryCustomSkill {
  id: string;
  name: string;
  description: string;
  instructionPrompt: string;
  category: string;
  createdAt: string;
}

export interface ConnectedPluginPublicSummary {
  serviceId: string;
  name: string;
  verificationStatus: string;
  permissionPreset: string;
  approvalPolicy: string;
  verifiedIdentity?: string;
  updatedAt: string;
}

export interface KaspiLocalLibraryState {
  version: 1;
  updatedAt: string;
  knowledge: LibraryBusinessKnowledge;
  location: StoreMapsLocation | null;
  artifacts: LibraryArtifactItem[];
  skills: LibraryCustomSkill[];
  connectedPlugins: ConnectedPluginPublicSummary[];
}

const LIBRARY_STORAGE_PREFIX = "kaspi_ai_os_library_v1_";

const DEFAULT_KNOWLEDGE: LibraryBusinessKnowledge = {
  businessName: "",
  sector: "",
  brandVoice: "Professional, trustworthy, modern",
  pricingRules: "",
  policies: "",
  targetAudience: "",
  preferredLanguage: "auto",
  monitoredUrls: [],
};

export function loadKaspiLibrary(scopeKey: string): KaspiLocalLibraryState {
  const empty: KaspiLocalLibraryState = {
    version: 1,
    updatedAt: new Date().toISOString(),
    knowledge: { ...DEFAULT_KNOWLEDGE },
    location: null,
    artifacts: [],
    skills: [],
    connectedPlugins: [],
  };

  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(`${LIBRARY_STORAGE_PREFIX}${scopeKey}`);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      updatedAt: parsed.updatedAt || empty.updatedAt,
      knowledge: { ...DEFAULT_KNOWLEDGE, ...(parsed.knowledge || {}) },
      location: parsed.location || null,
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      connectedPlugins: Array.isArray(parsed.connectedPlugins) ? parsed.connectedPlugins : [],
    };
  } catch {
    return empty;
  }
}

export function saveKaspiLibrary(scopeKey: string, state: KaspiLocalLibraryState): void {
  if (typeof window === "undefined") return;
  try {
    const next: KaspiLocalLibraryState = {
      ...state,
      updatedAt: new Date().toISOString(),
      artifacts: state.artifacts.slice(0, 80),
      skills: state.skills.slice(0, 60),
    };
    window.localStorage.setItem(`${LIBRARY_STORAGE_PREFIX}${scopeKey}`, JSON.stringify(next));
  } catch {}
}

export function appendArtifactToLibrary(
  scopeKey: string,
  item: Omit<LibraryArtifactItem, "id" | "createdAt">
): KaspiLocalLibraryState {
  const cur = loadKaspiLibrary(scopeKey);
  const newItem: LibraryArtifactItem = {
    ...item,
    id: `lib-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const next: KaspiLocalLibraryState = {
    ...cur,
    artifacts: [newItem, ...cur.artifacts].slice(0, 80),
  };
  saveKaspiLibrary(scopeKey, next);
  return next;
}

export function saveLocationToLibrary(
  scopeKey: string,
  loc: StoreMapsLocation
): KaspiLocalLibraryState {
  const cur = loadKaspiLibrary(scopeKey);
  const next: KaspiLocalLibraryState = { ...cur, location: loc };
  saveKaspiLibrary(scopeKey, next);
  return next;
}

export function syncConnectedPluginsToLibrary(
  scopeKey: string,
  plugins: ConnectedPluginPublicSummary[]
): KaspiLocalLibraryState {
  const cur = loadKaspiLibrary(scopeKey);
  const next: KaspiLocalLibraryState = { ...cur, connectedPlugins: plugins };
  saveKaspiLibrary(scopeKey, next);
  return next;
}

export function saveSkillToLibrary(
  scopeKey: string,
  skill: Omit<LibraryCustomSkill, "id" | "createdAt">
): KaspiLocalLibraryState {
  const cur = loadKaspiLibrary(scopeKey);
  const entry: LibraryCustomSkill = {
    ...skill,
    id: `skill-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  const next: KaspiLocalLibraryState = { ...cur, skills: [entry, ...cur.skills] };
  saveKaspiLibrary(scopeKey, next);
  return next;
}

/**
 * Formats safe, zero-secret persistent business memory so ANY Arena/Direct/Agent
 * model knows the user's real store location (Maps), connected apps, brand voice,
 * skills, and prior built projects.
 */
export function buildUnifiedLibraryContextSummary(scopeKey: string): string {
  const lib = loadKaspiLibrary(scopeKey);
  const lines: string[] = [];

  if (lib.knowledge.businessName || lib.knowledge.sector || lib.knowledge.brandVoice) {
    lines.push(
      `[Business Identity] Name: ${lib.knowledge.businessName || "Custom Business"} | Sector: ${
        lib.knowledge.sector || "General"
      } | Voice: ${lib.knowledge.brandVoice}${
        lib.knowledge.pricingRules ? ` | Pricing Rules: ${lib.knowledge.pricingRules}` : ""
      }${lib.knowledge.policies ? ` | Policies: ${lib.knowledge.policies}` : ""}`
    );
  }

  if (lib.location) {
    lines.push(
      `[Verified Real Store Location (Maps)] Label: ${lib.location.label} | Address: ${lib.location.address} | City: ${lib.location.city}, ${lib.location.country} | Coordinates: ${lib.location.lat}, ${lib.location.lng} | Map Pin URL: ${lib.location.googleMapsUrl} | Embed Map Iframe URL: ${lib.location.osmEmbedUrl}`
    );
  }

  if (lib.connectedPlugins.length > 0) {
    lines.push(
      `[Connected External Apps (Permission-Scoped)] ${lib.connectedPlugins
        .map((p) => `${p.name} (${p.permissionPreset}, ${p.approvalPolicy})`)
        .join("; ")}`
    );
  }

  if (lib.artifacts.length > 0) {
    lines.push(
      `[Recent Projects in User Library (${lib.artifacts.length} saved locally)] ${lib.artifacts
        .slice(0, 5)
        .map((a) => `"${a.title}" (${a.kind})`)
        .join(", ")}`
    );
  }

  if (lib.skills.length > 0) {
    lines.push(
      `[User Reusable AI Skills] ${lib.skills
        .slice(0, 4)
        .map((s) => `${s.name}: ${s.instructionPrompt.slice(0, 90)}`)
        .join(" | ")}`
    );
  }

  return lines.length > 0 ? `\n\nKASPI LOCAL LIBRARY MEMORY:\n${lines.join("\n")}` : "";
}
