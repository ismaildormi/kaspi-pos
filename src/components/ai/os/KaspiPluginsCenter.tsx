"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Shield,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Trash2,
  RefreshCw,
  Copy,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  APPROVAL_POLICIES_LIST,
  BUSINESS_FUNCTION_FILTERS,
  GRANULAR_PERMISSIONS_LIST,
  INTEGRATION_CATEGORY_TABS,
  PERMISSION_PRESETS,
  UNIVERSAL_INTEGRATIONS_CATALOG,
  type ApprovalPolicyKey,
  type BusinessFunctionCategory,
  type GranularPermissionKey,
  type IntegrationCatalogEntry,
  type IntegrationDomainCategory,
  type PermissionPresetId,
} from "@/lib/ai/integrations-registry";
import type {
  ConnectedPluginPublicSummary,
  KaspiLocalLibraryState,
} from "@/lib/ai/kaspi-library-memory";
import { KaspiVisualSetupModal } from "./KaspiVisualSetupModal";
import { getApiUrl } from "@/client/sync-engine";
import { toast } from "sonner";

export interface VaultConnectionItem {
  serviceId: string;
  customLabel?: string;
  connectedAt: string;
  updatedAt: string;
  lastVerifiedAt?: string;
  verificationStatus: "verified_live" | "configured_awaiting_test" | "verification_failed" | "native_active";
  verificationMessage: string;
  verifiedIdentity?: string;
  permissionPreset: PermissionPresetId;
  granularPermissions: GranularPermissionKey[];
  approvalPolicy: ApprovalPolicyKey;
  maskedFields: Record<string, string>;
}

interface KaspiPluginsCenterProps {
  connections: VaultConnectionItem[];
  libraryState: KaspiLocalLibraryState;
  initialFocusServiceId?: string | null;
  initialOpenVisualSetup?: boolean;
  onConnectionsUpdated: (next: VaultConnectionItem[]) => void;
  onSaveSkill: (skill: { name: string; description: string; instructionPrompt: string; category: string }) => void;
  onOpenMapsPanel: () => void;
}

const CLASSIFICATION_LABELS: Record<IntegrationCatalogEntry["classification"], { label: string; cls: string }> = {
  native_kaspi: { label: "Native KASPI", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  official_api: { label: "Official API", cls: "bg-white/10 text-zinc-200 border-white/15" },
  oauth_app: { label: "OAuth", cls: "bg-white/10 text-zinc-200 border-white/15" },
  third_party_connector: { label: "Connector", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  custom_api: { label: "Custom API", cls: "bg-emerald-500/10 text-emerald-200 border-emerald-500/25" },
  unsupported_direct: { label: "Manual Bridge", cls: "bg-zinc-700/40 text-zinc-400 border-white/10" },
};

export const KaspiPluginsCenter: React.FC<KaspiPluginsCenterProps> = ({
  connections,
  libraryState,
  initialFocusServiceId,
  initialOpenVisualSetup,
  onConnectionsUpdated,
  onSaveSkill,
  onOpenMapsPanel,
}) => {
  const [subTab, setSubTab] = useState<"plugins" | "skills">("plugins");
  const [visibilityFilter, setVisibilityFilter] = useState<"public" | "personal">("public");
  const [searchQuery, setSearchQuery] = useState("");
  const [domainCat, setDomainCat] = useState<IntegrationDomainCategory | "all">("all");
  const [bizFunc, setBizFunc] = useState<BusinessFunctionCategory | "all">("all");

  const [selectedService, setSelectedService] = useState<IntegrationCatalogEntry | null>(() =>
    initialFocusServiceId
      ? UNIVERSAL_INTEGRATIONS_CATALOG.find((c) => c.id === initialFocusServiceId) || null
      : null
  );
  const [showVisualAssistant, setShowVisualAssistant] = useState(Boolean(initialOpenVisualSetup));
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [preset, setPreset] = useState<PermissionPresetId>("customer_support");
  const [granular, setGranular] = useState<GranularPermissionKey[]>(["read", "search", "reply", "send"]);
  const [approval, setApproval] = useState<ApprovalPolicyKey>("approve_before_sending");
  const [submitting, setSubmitting] = useState(false);

  // Skill creator
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillPrompt, setSkillPrompt] = useState("");

  const connectedMap = useMemo(() => {
    const map = new Map<string, VaultConnectionItem>();
    for (const c of connections) map.set(c.serviceId, c);
    return map;
  }, [connections]);

  const installedCatalogItems = useMemo(() => {
    const items = UNIVERSAL_INTEGRATIONS_CATALOG.filter(
      (c) => connectedMap.has(c.id) || (c.id === "kaspi_native_store") || (c.id === "maps_location" && Boolean(libraryState.location))
    );
    return items;
  }, [connectedMap, libraryState.location]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return UNIVERSAL_INTEGRATIONS_CATALOG.filter((item) => {
      if (visibilityFilter === "personal" && !connectedMap.has(item.id) && item.classification !== "custom_api") {
        return false;
      }
      if (domainCat !== "all" && item.category !== domainCat) return false;
      if (bizFunc !== "all" && item.businessFunction !== bizFunc) return false;
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.shortDesc.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [visibilityFilter, domainCat, bizFunc, searchQuery, connectedMap]);

  const popularItems = useMemo(
    () => filteredCatalog.filter((item) => item.popular),
    [filteredCatalog]
  );

  const openConfigurator = (item: IntegrationCatalogEntry, openVisual = false) => {
    if (item.id === "maps_location" && !openVisual) {
      onOpenMapsPanel();
      return;
    }
    const existing = connectedMap.get(item.id);
    setSelectedService(item);
    setShowVisualAssistant(openVisual);
    setFieldValues({});
    if (existing) {
      setPreset(existing.permissionPreset);
      setGranular(existing.granularPermissions);
      setApproval(existing.approvalPolicy);
    } else {
      const def = PERMISSION_PRESETS[2];
      setPreset(def.id);
      setGranular([...def.defaultGranular]);
      setApproval(def.defaultApproval);
    }
  };

  const handleApplyPreset = (nextPreset: PermissionPresetId) => {
    setPreset(nextPreset);
    const p = PERMISSION_PRESETS.find((x) => x.id === nextPreset);
    if (p) {
      setGranular([...p.defaultGranular]);
      setApproval(p.defaultApproval);
    }
  };

  const handleConnectSubmit = async (
    targetId = selectedService?.id,
    overrideFields?: Record<string, string>
  ) => {
    if (!targetId) return;
    setSubmitting(true);
    try {
      const fields = overrideFields || fieldValues;
      const res = await fetch(getApiUrl("/api/ai/integrations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          serviceId: targetId,
          fields,
          permissionPreset: preset,
          granularPermissions: granular,
          approvalPolicy: approval,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      // If guest/fallback tenant returned a single connection, merge cleanly client-side too
      const nextList: VaultConnectionItem[] =
        Array.isArray(data.connections) && data.connections.length > 0
          ? data.connections
          : [data.connection, ...connections.filter((c) => c.serviceId !== targetId)];
      onConnectionsUpdated(nextList);

      const status = data.connection?.verificationStatus;
      if (status === "verified_live" || status === "native_active") {
        toast.success(data.connection.verificationMessage);
      } else if (status === "verification_failed") {
        toast.warning(data.connection.verificationMessage);
      } else {
        toast.info(data.connection?.verificationMessage || "Saved in encrypted Vault.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Connection request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestExisting = async (serviceId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/integrations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection", serviceId }),
      });
      const data = await res.json();
      if (Array.isArray(data.connections)) onConnectionsUpdated(data.connections);
      if (data?.probe?.status === "verified_live") {
        toast.success(data.probe.message);
      } else {
        toast.info(data?.probe?.message || data?.error || "Probe completed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePermissions = async (serviceId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/integrations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_permissions",
          serviceId,
          permissionPreset: preset,
          granularPermissions: granular,
          approvalPolicy: approval,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.connections) && data.connections.length > 0) {
        onConnectionsUpdated(data.connections);
      } else {
        onConnectionsUpdated(
          connections.map((c) =>
            c.serviceId === serviceId
              ? { ...c, permissionPreset: preset, granularPermissions: granular, approvalPolicy: approval }
              : c
          )
        );
      }
      toast.success("Integration permissions & human approval policy updated!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (serviceId: string) => {
    await fetch(getApiUrl("/api/ai/integrations"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect", serviceId }),
    }).catch(() => {});
    onConnectionsUpdated(connections.filter((c) => c.serviceId !== serviceId));
    toast.info(`Disconnected & revoked ${serviceId}`);
  };

  const apiBaseOrigin = typeof window !== "undefined" ? window.location.origin : "https://kaspi-pos.vercel.app";

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs pb-12">
      {/* Top Bar matching ChatGPT Plugins Style */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#222] border border-white/10">
          <button
            type="button"
            onClick={() => setSubTab("plugins")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              subTab === "plugins" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Plugins
          </button>
          <button
            type="button"
            onClick={() => setSubTab("skills")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              subTab === "skills" ? "bg-white/15 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Skills ({libraryState.skills.length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#222] border border-white/10 w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins (Instagram, WhatsApp, Stripe, GitHub, Odoo...)"
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const custom = UNIVERSAL_INTEGRATIONS_CATALOG.find((c) => c.id === "custom_rest_api");
              if (custom) openConfigurator(custom);
            }}
            className="px-3.5 py-2 rounded-full bg-[#10b981] hover:bg-emerald-400 text-black font-bold whitespace-nowrap cursor-pointer"
          >
            + Custom API
          </button>
        </div>
      </div>

      {subTab === "skills" ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Create Reusable AI Skill (Stored in Local Library)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                dir="auto"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="Skill Name (e.g., Darija WhatsApp Sales Closer)"
                className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
              />
              <input
                type="text"
                dir="auto"
                value={skillDesc}
                onChange={(e) => setSkillDesc(e.target.value)}
                placeholder="Short description..."
                className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
              />
            </div>
            <textarea
              rows={3}
              dir="auto"
              value={skillPrompt}
              onChange={(e) => setSkillPrompt(e.target.value)}
              placeholder="System instructions / reusable business rule for all Arena models..."
              className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white resize-none"
            />
            <button
              type="button"
              onClick={() => {
                if (!skillName.trim() || !skillPrompt.trim()) {
                  toast.error("Skill name & instruction prompt are required");
                  return;
                }
                onSaveSkill({
                  name: skillName.trim(),
                  description: skillDesc.trim(),
                  instructionPrompt: skillPrompt.trim(),
                  category: "custom",
                });
                setSkillName("");
                setSkillDesc("");
                setSkillPrompt("");
                toast.success("Skill saved locally to KASPI Library & available to all AI models!");
              }}
              className="px-4 py-2 rounded-xl bg-[#10b981] text-black font-bold cursor-pointer"
            >
              Save Skill to Memory
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {libraryState.skills.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-[#1e1e1e] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{s.name}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">ACTIVE SKILL</span>
                </div>
                {s.description && <p className="text-[11px] text-zinc-400">{s.description}</p>}
                <p className="text-[11px] text-zinc-300 bg-[#141414] p-2 rounded-lg border border-white/5">
                  {s.instructionPrompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Heading + Installed Horizontal Icon Dock (Matches Screenshot 1!) */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Plugins</h1>
              <p className="text-xs text-zinc-400">
                Connect external apps, social networks, payment gateways, hosting &amp; AI shopping channels to KASPI AI Arena.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Installed</span>
                <span className="text-zinc-500">&gt;</span>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 kaspi-no-scrollbar">
                {installedCatalogItems.map((item) => {
                  const conn = connectedMap.get(item.id);
                  const isVerified =
                    item.classification === "native_kaspi" ||
                    conn?.verificationStatus === "verified_live";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openConfigurator(item)}
                      title={`${item.name} (${conn ? conn.verificationMessage : "Active"})`}
                      className="group relative flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <div
                        style={{ backgroundColor: item.brandColor }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform"
                      >
                        {item.monogram}
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-[#141414] ${
                          isVerified ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      <span className="text-[10px] text-zinc-400 group-hover:text-white max-w-[54px] truncate">
                        {item.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Public / Personal + Business Function Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVisibilityFilter("public")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    visibilityFilter === "public"
                      ? "bg-[#2a2a2a] text-white border border-white/15"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Public Directory ({UNIVERSAL_INTEGRATIONS_CATALOG.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibilityFilter("personal")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                    visibilityFilter === "personal"
                      ? "bg-[#2a2a2a] text-white border border-white/15"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Connected &amp; Custom ({connections.length})
                </button>
              </div>

              <select
                value={bizFunc}
                onChange={(e) => setBizFunc(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-[#222] border border-white/10 text-zinc-200 text-xs"
              >
                {BUSINESS_FUNCTION_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Domain Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 kaspi-no-scrollbar">
              {INTEGRATION_CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDomainCat(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap cursor-pointer border transition-colors ${
                    domainCat === tab.id
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-[#1c1c1c] border-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Configuration + Permission + Visual Screenshot Drawer */}
          {selectedService && (
            <div className="p-5 rounded-2xl bg-[#1b1b1b] border border-emerald-500/40 shadow-2xl space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: selectedService.brandColor }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg"
                  >
                    {selectedService.monogram}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{selectedService.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          CLASSIFICATION_LABELS[selectedService.classification].cls
                        }`}
                      >
                        {CLASSIFICATION_LABELS[selectedService.classification].label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{selectedService.shortDesc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVisualAssistant(!showVisualAssistant)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold cursor-pointer"
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>{showVisualAssistant ? "Hide Visual Setup" : "Guide Me with Screenshots"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {showVisualAssistant && (
                <KaspiVisualSetupModal
                  targetService={selectedService}
                  onClose={() => setShowVisualAssistant(false)}
                  onQuickConnectCredentials={(id, fields) => handleConnectSubmit(id, fields)}
                />
              )}

              {/* Setup Guide + Encrypted Credentials Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-3 p-4 rounded-xl bg-[#141414] border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Credentials &amp; Live Verification</span>
                    </span>
                    <a
                      href={selectedService.devDocsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                    >
                      <span>Open Developer Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-zinc-400">
                    {selectedService.setupSteps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>

                  {connectedMap.has(selectedService.id) && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">
                          Status: {connectedMap.get(selectedService.id)?.verificationStatus}
                        </span>
                        <span className="text-zinc-400">
                          {connectedMap.get(selectedService.id)?.verifiedIdentity || ""}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300">
                        {connectedMap.get(selectedService.id)?.verificationMessage}
                      </div>
                      {Object.entries(connectedMap.get(selectedService.id)?.maskedFields || {}).map(
                        ([k, val]) => (
                          <div key={k} className="font-mono text-[10px] text-zinc-400">
                            {k}: {val}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Agentic Channel OpenAPI / MCP URLs for ChatGPT / Claude / Copilot */}
                  {selectedService.category === "external_ai_channels" && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                      <div className="font-bold text-emerald-300 text-[11px]">
                        Live KASPI AI Channel Endpoint
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-200 bg-black/40 px-2.5 py-1.5 rounded">
                        <span className="truncate flex-1">
                          {`${apiBaseOrigin}${selectedService.devDocsUrl}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(`${apiBaseOrigin}${selectedService.devDocsUrl}`);
                            toast.success("Copied AI Commerce Discovery URL!");
                          }}
                          className="text-emerald-400 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedService.credentialFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                        {field.label}
                      </label>
                      <input
                        type={field.secret ? "password" : "text"}
                        value={fieldValues[field.key] || ""}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleConnectSubmit()}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>
                        {connectedMap.has(selectedService.id) ? "Save & Re-Verify" : `Connect ${selectedService.name}`}
                      </span>
                    </button>

                    {connectedMap.has(selectedService.id) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTestExisting(selectedService.id)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Test Health</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(selectedService.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Universal Permission Center (8 Presets + 13 Granular + 7 Approvals) */}
                <div className="space-y-3 p-4 rounded-xl bg-[#141414] border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Universal Permission Center</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">AES-256-GCM Scoped</span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                      Permission Level (8 Presets)
                    </label>
                    <select
                      value={preset}
                      onChange={(e) => handleApplyPreset(e.target.value as PermissionPresetId)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/10 text-white text-xs"
                    >
                      {PERMISSION_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label} — {p.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1.5">
                      Granular Scopes (13 Actions)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {GRANULAR_PERMISSIONS_LIST.map((g) => {
                        const checked = granular.includes(g.key);
                        return (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() =>
                              setGranular((prev) =>
                                prev.includes(g.key)
                                  ? prev.filter((x) => x !== g.key)
                                  : [...prev, g.key]
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                              checked
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                : "bg-[#1e1e1e] border-white/10 text-zinc-500"
                            }`}
                          >
                            {g.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-400 font-bold mb-1">
                      Human Approval Gate (7 Policies)
                    </label>
                    <select
                      value={approval}
                      onChange={(e) => setApproval(e.target.value as ApprovalPolicyKey)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1e1e] border border-white/10 text-white text-xs"
                    >
                      {APPROVAL_POLICIES_LIST.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {connectedMap.has(selectedService.id) && (
                    <button
                      type="button"
                      onClick={() => handleSavePermissions(selectedService.id)}
                      disabled={submitting}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold cursor-pointer"
                    >
                      Update Permissions Only
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Popular Section matching ChatGPT Plugins Two-Column Cards */}
          {popularItems.length > 0 && domainCat === "all" && !searchQuery.trim() && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Popular</span>
                <span className="text-zinc-500">&gt;</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {popularItems.map((item) => {
                  const isConnected =
                    connectedMap.has(item.id) ||
                    (item.id === "maps_location" && Boolean(libraryState.location)) ||
                    item.id === "kaspi_native_store";
                  return (
                    <div
                      key={item.id}
                      onClick={() => openConfigurator(item)}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#242424] border border-white/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          style={{ backgroundColor: item.brandColor }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow"
                        >
                          {item.monogram}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{item.name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                CLASSIFICATION_LABELS[item.classification].cls
                              }`}
                            >
                              {CLASSIFICATION_LABELS[item.classification].label}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">{item.shortDesc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfigurator(item);
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                        title={isConnected ? "Manage connection" : "Connect"}
                      >
                        {isConnected ? <MoreHorizontal className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Directory Grid */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>All Integrations ({filteredCatalog.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCatalog.map((item) => {
                const conn = connectedMap.get(item.id);
                const isConnected =
                  Boolean(conn) ||
                  (item.id === "maps_location" && Boolean(libraryState.location)) ||
                  item.id === "kaspi_native_store";
                return (
                  <div
                    key={item.id}
                    onClick={() => openConfigurator(item)}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#1a1a1a] hover:bg-[#222] border border-white/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        style={{ backgroundColor: item.brandColor }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-[11px] shrink-0"
                      >
                        {item.monogram}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{item.name}</span>
                          {conn?.verificationStatus === "verified_live" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{item.shortDesc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfigurator(item);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                    >
                      {isConnected ? <MoreHorizontal className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
