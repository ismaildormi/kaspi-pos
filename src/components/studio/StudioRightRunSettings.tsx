"use client";

import React, { useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  FileJson2,
  Globe,
  HardDrive,
  Info,
  MapPin,
  Plus,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { KaspiGlassModalPortal } from "@/components/common/KaspiGlassModalPortal";
import {
  buildSchemaJsonFromProperties,
  estimateTokenCount,
  type ContextCacheItem,
  type ElasticScaleMode,
  type FunctionToolDef,
  type RightRunSettings,
  type SafetyBlockLevel,
  type StructuredPropertyDef,
  type StudioBrand,
  type StudioModelId,
} from "./studio-types";

interface StudioRightRunSettingsProps {
  brand: StudioBrand;
  locale: "ar" | "fr" | "en";
  settings: RightRunSettings;
  onChange: (next: RightRunSettings) => void;
  systemInstruction: string;
  historyTokens: number;
  filesTokens: number;
  promptTokens: number;
  contextCaches: ContextCacheItem[];
  onAddCache: (item: ContextCacheItem) => void;
  onRemoveCache: (id: string) => void;
}

const SAFETY_LEVELS: Array<{ value: SafetyBlockLevel; label: string }> = [
  { value: "BLOCK_NONE", label: "Block none" },
  { value: "BLOCK_ONLY_HIGH", label: "Block few" },
  { value: "BLOCK_MEDIUM_AND_ABOVE", label: "Block some" },
  { value: "BLOCK_LOW_AND_ABOVE", label: "Block most" },
];

export function StudioRightRunSettings({
  brand,
  locale,
  settings,
  onChange,
  systemInstruction,
  historyTokens,
  filesTokens,
  promptTokens,
  contextCaches,
  onAddCache,
  onRemoveCache,
}: StudioRightRunSettingsProps) {
  const isAr = locale === "ar";
  const accentText = brand === "kaspi_pos" ? "text-emerald-400" : "text-sky-400";
  const accentBg = brand === "kaspi_pos" ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300" : "bg-sky-500/15 border-sky-500/35 text-sky-300";

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tokenPopoverOpen, setTokenPopoverOpen] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [cacheModalOpen, setCacheModalOpen] = useState(false);
  const [stopTagInput, setStopTagInput] = useState("");
  const [dryRunTokensMsg, setDryRunTokensMsg] = useState<string | null>(null);

  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState<StructuredPropertyDef["type"]>("string");
  const [newPropDesc, setNewPropDesc] = useState("");

  const [newFnName, setNewFnName] = useState("");
  const [newFnDesc, setNewFnDesc] = useState("");
  const [newFnParams, setNewFnParams] = useState('{\n  "type": "object",\n  "properties": { "query": { "type": "string" } }\n}');

  const [cacheLabel, setCacheLabel] = useState("");
  const [cacheBody, setCacheBody] = useState("");
  const [cacheTtl, setCacheTtl] = useState(24);

  const sysTokens = estimateTokenCount(systemInstruction);
  const cachedTokens = contextCaches.reduce((s, c) => s + c.tokensEstimate, 0);
  const totalTokens = sysTokens + historyTokens + filesTokens + promptTokens + cachedTokens;
  const maxContext = 1_048_576;
  const pct = Math.min(100, Math.max(0.2, (totalTokens / maxContext) * 100));

  const patch = <K extends keyof RightRunSettings>(key: K, val: RightRunSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };

  const addStopTag = () => {
    const t = stopTagInput.trim();
    if (!t || settings.stopSequences.includes(t)) return;
    patch("stopSequences", [...settings.stopSequences, t]);
    setStopTagInput("");
  };

  const addSchemaProp = () => {
    if (!newPropName.trim()) return;
    const nextProp: StructuredPropertyDef = {
      id: `prop_${Date.now()}`,
      name: newPropName.trim(),
      type: newPropType,
      required: true,
      description: newPropDesc.trim(),
    };
    patch("structuredProperties", [...settings.structuredProperties, nextProp]);
    patch("structuredOutputsEnabled", true);
    patch("responseMimeType", "application/json");
    setNewPropName("");
    setNewPropDesc("");
  };

  const addFunctionTool = () => {
    if (!newFnName.trim()) return;
    const nextFn: FunctionToolDef = {
      id: `fn_${Date.now()}`,
      name: newFnName.trim(),
      description: newFnDesc.trim() || "Custom domain tool",
      parametersJson: newFnParams,
      enabled: true,
    };
    patch("functionTools", [...settings.functionTools, nextFn]);
    patch("functionCallingEnabled", true);
    setNewFnName("");
    setNewFnDesc("");
  };

  return (
    <aside className="h-full overflow-y-auto kaspi-no-scrollbar p-3.5 space-y-4 text-xs">
      {/* Header & Runtime Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-[var(--kaspi-text-primary)]">
          <SlidersHorizontal className={`w-3.5 h-3.5 ${accentText}`} />
          <span>{isAr ? "إعدادات التشغيل (Run Settings)" : "Run Settings"}</span>
        </div>
        <button
          type="button"
          onClick={() => patch("runtimeTarget", settings.runtimeTarget === "cloud" ? "local_ollama" : "cloud")}
          className={`px-2 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer ${
            settings.runtimeTarget === "local_ollama"
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : accentBg
          }`}
          title="Switch between Cloud Edge and Local Ollama (localhost:11434)"
        >
          {settings.runtimeTarget === "local_ollama" ? "Local Ollama" : "Cloud Unlimited"}
        </button>
      </div>

      {settings.runtimeTarget === "local_ollama" && (
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
          <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Ollama Local Endpoint</span>
          </div>
          <input
            type="text"
            value={settings.localOllamaUrl}
            onChange={(e) => patch("localOllamaUrl", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-mono text-[var(--kaspi-text-primary)]"
            placeholder="http://127.0.0.1:11434/v1"
          />
          <input
            type="text"
            value={settings.localOllamaModel}
            onChange={(e) => patch("localOllamaModel", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] font-mono text-[var(--kaspi-text-primary)]"
            placeholder="llama3"
          />
        </div>
      )}

      {/* Model Selector Card */}
      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--kaspi-text-muted)]">
            {isAr ? "النموذج (Model)" : "Model"}
          </span>
          <span className="text-[10px] font-mono text-[var(--kaspi-text-muted)]">1M Context</span>
        </div>
        <select
          value={settings.model}
          onChange={(e) => patch("model", e.target.value as StudioModelId)}
          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.07] border border-white/15 text-xs font-semibold text-[var(--kaspi-text-primary)]"
        >
          <option value="heyuka-omni">heyuka-omni (Flagship Multimodal)</option>
          <option value="heyuka-core">heyuka-core (DeepThink & Code)</option>
          <option value="heyuka-vision">heyuka-vision (3D, Image & Screen)</option>
          <option value="multi-agent-3">multi-agent-3 (Tri-Brain Council)</option>
          <option value="kaspi-pos-analyst">kaspi-pos-analyst (Retail & DGI)</option>
        </select>

        {/* Elastic Scaling Selector 3 -> 6 -> 12 */}
        <div className="pt-1 space-y-1">
          <span className="text-[10px] font-semibold text-[var(--kaspi-text-muted)] flex items-center gap-1">
            <BrainCircuit className={`w-3 h-3 ${accentText}`} />
            <span>{isAr ? "سرب العقول المرن (3 -> 6 -> 12)" : "Elastic Swarm Scale"}</span>
          </span>
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                { id: "auto", label: "Auto" },
                { id: "3x_fast", label: "3x" },
                { id: "6x_pro", label: "6x" },
                { id: "12x_titan", label: "12x" },
              ] as Array<{ id: ElasticScaleMode; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => patch("elasticScale", opt.id)}
                className={`py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                  settings.elasticScale === opt.id
                    ? accentBg
                    : "bg-white/[0.04] border-white/10 text-[var(--kaspi-text-secondary)] hover:bg-white/[0.08]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Token Counter + Breakdown */}
      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setTokenPopoverOpen((p) => !p)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[var(--kaspi-text-primary)] cursor-pointer"
          >
            <span>Token count</span>
            <Info className="w-3 h-3 text-[var(--kaspi-text-muted)]" />
          </button>
          <span className="font-mono text-[11px] text-[var(--kaspi-text-secondary)]">
            {totalTokens.toLocaleString()} / 1,048,576
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full ${brand === "kaspi_pos" ? "bg-emerald-400" : "bg-sky-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {tokenPopoverOpen && (
          <div className="pt-1.5 border-t border-white/10 space-y-1 text-[10px] text-[var(--kaspi-text-secondary)] font-mono">
            <div className="flex justify-between"><span>System:</span><span>{sysTokens}</span></div>
            <div className="flex justify-between"><span>History:</span><span>{historyTokens}</span></div>
            <div className="flex justify-between"><span>Files:</span><span>{filesTokens}</span></div>
            <div className="flex justify-between"><span>Cached:</span><span>{cachedTokens}</span></div>
            <div className="flex justify-between"><span>Composer:</span><span>{promptTokens}</span></div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setDryRunTokensMsg(`Exact dry-run: ${totalTokens} input tokens ($0.00 cost)`)}
          className="w-full py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-[10px] font-semibold text-[var(--kaspi-text-secondary)] cursor-pointer"
        >
          {isAr ? "حساب التوكنز قبل الإرسال" : "Count Tokens (Dry Run)"}
        </button>
        {dryRunTokensMsg && <p className="text-[10px] font-mono text-emerald-400">{dryRunTokensMsg}</p>}
      </div>

      {/* Temperature & Thinking Budget */}
      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[var(--kaspi-text-primary)]">Temperature</span>
            <span className="font-mono text-[var(--kaspi-text-secondary)]">{settings.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => patch("temperature", Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        <div className="pt-2 border-t border-white/10 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-[11px] text-[var(--kaspi-text-primary)] flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
              <span>Thinking Mode</span>
            </span>
            <input
              type="checkbox"
              checked={settings.thinkingEnabled}
              onChange={(e) => patch("thinkingEnabled", e.target.checked)}
              className="accent-sky-400 cursor-pointer"
            />
          </label>
          {settings.thinkingEnabled && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--kaspi-text-muted)]">
                <span>Thinking budget</span>
                <span className="font-mono">{settings.thinkingBudget.toLocaleString()} tok</span>
              </div>
              <input
                type="range"
                min={0}
                max={32768}
                step={512}
                value={settings.thinkingBudget}
                onChange={(e) => patch("thinkingBudget", Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tools & Grounding */}
      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2.5">
        <div className="font-bold text-[11px] text-[var(--kaspi-text-primary)]">
          {isAr ? "الأدوات والتحقق الحي (Tools & Grounding)" : "Tools"}
        </div>

        {/* Structured Outputs */}
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.structuredOutputsEnabled}
              onChange={(e) => {
                patch("structuredOutputsEnabled", e.target.checked);
                if (e.target.checked) patch("responseMimeType", "application/json");
              }}
            />
            <span className="text-[11px] text-[var(--kaspi-text-secondary)]">Structured output</span>
          </label>
          <button
            type="button"
            onClick={() => setSchemaModalOpen(true)}
            className="px-2 py-0.5 rounded bg-white/[0.07] hover:bg-white/[0.12] text-[10px] font-semibold cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Function Calling */}
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.functionCallingEnabled}
              onChange={(e) => patch("functionCallingEnabled", e.target.checked)}
            />
            <span className="text-[11px] text-[var(--kaspi-text-secondary)]">
              Function calling ({settings.functionTools.filter((t) => t.enabled).length})
            </span>
          </label>
          <button
            type="button"
            onClick={() => setToolsModalOpen(true)}
            className="px-2 py-0.5 rounded bg-white/[0.07] hover:bg-white/[0.12] text-[10px] font-semibold cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Code Execution */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[11px] text-[var(--kaspi-text-secondary)] flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            <span>Code execution</span>
          </span>
          <input
            type="checkbox"
            checked={settings.codeExecutionEnabled}
            onChange={(e) => patch("codeExecutionEnabled", e.target.checked)}
          />
        </label>

        {/* Grounding with Search + Threshold */}
        <div className="space-y-1">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] text-[var(--kaspi-text-secondary)] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Grounding with Live Search</span>
            </span>
            <input
              type="checkbox"
              checked={settings.groundingSearchEnabled}
              onChange={(e) => patch("groundingSearchEnabled", e.target.checked)}
            />
          </label>
          {settings.groundingSearchEnabled && (
            <div className="pl-5 space-y-0.5">
              <div className="flex justify-between text-[10px] text-[var(--kaspi-text-muted)]">
                <span>Threshold</span>
                <span className="font-mono">{settings.groundingThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.groundingThreshold}
                onChange={(e) => patch("groundingThreshold", Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Grounding with Maps */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[11px] text-[var(--kaspi-text-secondary)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Grounding with Maps (OSM)</span>
          </span>
          <input
            type="checkbox"
            checked={settings.groundingMapsEnabled}
            onChange={(e) => patch("groundingMapsEnabled", e.target.checked)}
          />
        </label>

        {/* URL Context */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[11px] text-[var(--kaspi-text-secondary)]">URL Context Auto-Fetch</span>
          <input
            type="checkbox"
            checked={settings.urlContextEnabled}
            onChange={(e) => patch("urlContextEnabled", e.target.checked)}
          />
        </label>
      </div>

      {/* Advanced Settings Accordion */}
      <div className="rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((p) => !p)}
          className="w-full px-3 py-2.5 flex items-center justify-between font-semibold text-[11px] text-[var(--kaspi-text-primary)] cursor-pointer hover:bg-white/[0.04]"
        >
          <span>{isAr ? "إعدادات متقدمة (Advanced Settings)" : "Advanced settings"}</span>
          {advancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {advancedOpen && (
          <div className="p-3 pt-0 space-y-3 border-t border-white/10">
            {/* Safety & Context Caching Triggers */}
            <div className="grid grid-cols-2 gap-1.5 pt-2.5">
              <button
                type="button"
                onClick={() => setSafetyModalOpen(true)}
                className="px-2 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Shield className="w-3 h-3" />
                <span>Safety Settings</span>
              </button>
              <button
                type="button"
                onClick={() => setCacheModalOpen(true)}
                className="px-2 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Database className="w-3 h-3" />
                <span>Cache ({contextCaches.length})</span>
              </button>
            </div>

            {/* Media Resolution */}
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--kaspi-text-muted)]">Media resolution</span>
              <select
                value={settings.mediaResolution}
                onChange={(e) => patch("mediaResolution", e.target.value as RightRunSettings["mediaResolution"])}
                className="w-full px-2 py-1.5 rounded-lg bg-white/[0.07] border border-white/15 text-[11px]"
              >
                <option value="low">Low (Fast tokens)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Document OCR)</option>
                <option value="ultra">Ultra 4K Detail</option>
              </select>
            </div>

            {/* Output MIME Type */}
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--kaspi-text-muted)]">Response MIME type</span>
              <select
                value={settings.responseMimeType}
                onChange={(e) => patch("responseMimeType", e.target.value as RightRunSettings["responseMimeType"])}
                className="w-full px-2 py-1.5 rounded-lg bg-white/[0.07] border border-white/15 text-[11px]"
              >
                <option value="text/plain">text/plain</option>
                <option value="application/json">application/json</option>
                <option value="text/x.enum">text/x.enum</option>
              </select>
            </div>

            {/* Top-P */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--kaspi-text-muted)]">Top-P</span>
                <span className="font-mono">{settings.topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.topP}
                onChange={(e) => patch("topP", Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--kaspi-text-muted)]">Output length</span>
                <span className="font-mono">{settings.maxOutputTokens}</span>
              </div>
              <input
                type="range"
                min={256}
                max={65536}
                step={256}
                value={settings.maxOutputTokens}
                onChange={(e) => patch("maxOutputTokens", Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Penalties & Seed */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[var(--kaspi-text-muted)]">Freq penalty</span>
                <input
                  type="number"
                  step={0.1}
                  min={-2}
                  max={2}
                  value={settings.frequencyPenalty}
                  onChange={(e) => patch("frequencyPenalty", Number(e.target.value))}
                  className="w-full mt-0.5 px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-[11px] font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-[var(--kaspi-text-muted)]">Seed (Optional)</span>
                <input
                  type="text"
                  value={settings.seed}
                  onChange={(e) => patch("seed", e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full mt-0.5 px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-[11px] font-mono"
                />
              </div>
            </div>

            {/* Stop Sequences */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[var(--kaspi-text-muted)]">Stop sequences</span>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={stopTagInput}
                  onChange={(e) => setStopTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStopTag())}
                  placeholder="Add stop tag..."
                  className="flex-1 px-2 py-1 rounded bg-white/[0.06] border border-white/10 text-[11px]"
                />
                <button
                  type="button"
                  onClick={addStopTag}
                  className="px-2 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-[10px] font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
              {settings.stopSequences.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {settings.stopSequences.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => patch("stopSequences", settings.stopSequences.filter((x) => x !== tag))}
                        className="hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visual JSON Schema Builder Modal */}
      <KaspiGlassModalPortal isOpen={schemaModalOpen} onClose={() => setSchemaModalOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-2xl w-full rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <FileJson2 className={`w-4 h-4 ${accentText}`} />
              <span>Visual Structured Output Schema Builder</span>
            </div>
            <button type="button" onClick={() => setSchemaModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {settings.structuredProperties.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs">
                <span className="font-mono font-bold text-sky-400">{p.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">{p.type}</span>
                <span className="text-[var(--kaspi-text-muted)] truncate flex-1">{p.description}</span>
                <button
                  type="button"
                  onClick={() => patch("structuredProperties", settings.structuredProperties.filter((x) => x.id !== p.id))}
                  className="text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newPropName}
              onChange={(e) => setNewPropName(e.target.value)}
              placeholder="Field name (e.g. price)"
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
            />
            <select
              value={newPropType}
              onChange={(e) => setNewPropType(e.target.value as StructuredPropertyDef["type"])}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="array">array</option>
              <option value="object">object</option>
            </select>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newPropDesc}
                onChange={(e) => setNewPropDesc(e.target.value)}
                placeholder="Description"
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
              />
              <button
                type="button"
                onClick={addSchemaProp}
                className="px-3 py-1.5 rounded-lg kaspi-primary-cta-btn text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <pre className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-mono overflow-x-auto max-h-40">
            {buildSchemaJsonFromProperties(settings.structuredProperties)}
          </pre>
        </div>
      </KaspiGlassModalPortal>

      {/* Function Calling Editor Modal */}
      <KaspiGlassModalPortal isOpen={toolsModalOpen} onClose={() => setToolsModalOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-2xl w-full rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Wrench className={`w-4 h-4 ${accentText}`} />
              <span>Function Calling & OpenAPI Tools Declaration</span>
            </div>
            <button type="button" onClick={() => setToolsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {settings.functionTools.map((fn) => (
              <div key={fn.id} className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={fn.enabled}
                    onChange={(e) =>
                      patch(
                        "functionTools",
                        settings.functionTools.map((x) => (x.id === fn.id ? { ...x, enabled: e.target.checked } : x))
                      )
                    }
                  />
                  <span className="font-mono font-bold text-emerald-400">{fn.name}</span>
                  <span className="text-[var(--kaspi-text-muted)] truncate">{fn.description}</span>
                </label>
                <button
                  type="button"
                  onClick={() => patch("functionTools", settings.functionTools.filter((x) => x.id !== fn.id))}
                  className="text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newFnName}
                onChange={(e) => setNewFnName(e.target.value)}
                placeholder="Function name (e.g. create_invoice_pdf)"
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs font-mono"
              />
              <input
                type="text"
                value={newFnDesc}
                onChange={(e) => setNewFnDesc(e.target.value)}
                placeholder="Description"
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
              />
            </div>
            <textarea
              rows={3}
              value={newFnParams}
              onChange={(e) => setNewFnParams(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-[11px] font-mono"
            />
            <button
              type="button"
              onClick={addFunctionTool}
              className="px-4 py-1.5 rounded-lg kaspi-primary-cta-btn text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Function Declaration</span>
            </button>
          </div>
        </div>
      </KaspiGlassModalPortal>

      {/* Safety Settings 4-Category Modal */}
      <KaspiGlassModalPortal isOpen={safetyModalOpen} onClose={() => setSafetyModalOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-lg w-full rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>Run Safety Settings (4 Granular Levels)</span>
            </div>
            <button type="button" onClick={() => setSafetyModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {(
            [
              { key: "harassment", label: "Harassment" },
              { key: "hateSpeech", label: "Hate Speech" },
              { key: "sexuallyExplicit", label: "Sexually Explicit" },
              { key: "dangerousContent", label: "Dangerous Content" },
            ] as Array<{ key: keyof RightRunSettings["safetySettings"]; label: string }>
          ).map((cat) => (
            <div key={cat.key} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span>{cat.label}</span>
                <span className="font-mono text-[11px] text-sky-400">{settings.safetySettings[cat.key]}</span>
              </div>
              <select
                value={settings.safetySettings[cat.key]}
                onChange={(e) =>
                  patch("safetySettings", {
                    ...settings.safetySettings,
                    [cat.key]: e.target.value as SafetyBlockLevel,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
              >
                {SAFETY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label} ({l.value})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </KaspiGlassModalPortal>

      {/* Context Caching TTL Manager */}
      <KaspiGlassModalPortal isOpen={cacheModalOpen} onClose={() => setCacheModalOpen(false)}>
        <div className="kaspi-opaque-glass-modal max-w-xl w-full rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Context Caching Manager (Local + TTL)</span>
            </div>
            <button type="button" onClick={() => setCacheModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {contextCaches.map((c) => (
              <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold">{c.label}</div>
                  <div className="text-[10px] font-mono text-[var(--kaspi-text-muted)]">
                    ~{c.tokensEstimate} tok • TTL {c.ttlHours === 0 ? "Forever" : `${c.ttlHours}h`}
                  </div>
                </div>
                <button type="button" onClick={() => onRemoveCache(c.id)} className="text-rose-400 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {contextCaches.length === 0 && (
              <p className="text-xs text-[var(--kaspi-text-muted)]">No pinned context caches yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={cacheLabel}
                onChange={(e) => setCacheLabel(e.target.value)}
                placeholder="Cache label (e.g. Store Inventory CSV)"
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
              />
              <select
                value={cacheTtl}
                onChange={(e) => setCacheTtl(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
              >
                <option value={1}>TTL 1 Hour</option>
                <option value={24}>TTL 24 Hours</option>
                <option value={0}>Forever</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={cacheBody}
              onChange={(e) => setCacheBody(e.target.value)}
              placeholder="Paste large reference document, schema, or codebase context..."
              className="w-full p-2.5 rounded-lg bg-white/[0.06] border border-white/15 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!cacheLabel.trim() || !cacheBody.trim()) return;
                onAddCache({
                  id: `cache_${Date.now()}`,
                  label: cacheLabel.trim(),
                  content: cacheBody,
                  ttlHours: cacheTtl,
                  tokensEstimate: estimateTokenCount(cacheBody),
                  createdAt: new Date().toISOString(),
                });
                setCacheLabel("");
                setCacheBody("");
              }}
              className="px-4 py-1.5 rounded-lg kaspi-primary-cta-btn text-xs font-bold cursor-pointer"
            >
              Pin to Context Cache
            </button>
          </div>
        </div>
      </KaspiGlassModalPortal>
    </aside>
  );
}
