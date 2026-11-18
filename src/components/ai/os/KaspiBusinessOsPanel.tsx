"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Sparkles,
  Play,
  Globe,
  Workflow,
  Loader2,
  CheckCircle2,
  FlaskConical,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { WorkflowRule } from "@/lib/ai/workflow-automation-engine";
import { getApiUrl } from "@/client/sync-engine";
import { toast } from "sonner";

export const KaspiBusinessOsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Website Uptime Monitor
  const [monitorUrl, setMonitorUrl] = useState("");
  const [checkingSite, setCheckingSite] = useState(false);

  // Workflow Natural Language Builder
  const [wfPrompt, setWfPrompt] = useState("");
  const [savingWf, setSavingWf] = useState(false);

  // Campaign Multi-Step Planner
  const [campaignGoal, setCampaignGoal] = useState("Prepare my store for Black Friday");
  const [campaignSteps, setCampaignSteps] = useState<any[]>([]);
  const [planning, setPlanning] = useState(false);

  // Isolated Optimization Simulator
  const [simScenario, setSimScenario] = useState("checkout_conversion");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const loadTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/business-os"));
      const json = await res.json();
      if (json?.success) setData(json);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  const handleCheckWebsite = async () => {
    if (!monitorUrl.trim()) return;
    setCheckingSite(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/business-os"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "monitor_url", url: monitorUrl.trim() }),
      });
      const json = await res.json();
      if (json?.success) {
        toast.success(
          json.report.online
            ? `Site Online (HTTP ${json.report.statusCode} in ${json.report.latencyMs}ms)`
            : `Site Unreachable: ${json.report.error || json.report.statusCode}`
        );
        loadTelemetry();
      }
    } finally {
      setCheckingSite(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!wfPrompt.trim()) return;
    setSavingWf(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/business-os"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_workflow", naturalLanguage: wfPrompt.trim() }),
      });
      const json = await res.json();
      if (json?.success) {
        setWfPrompt("");
        setData((prev: any) => ({ ...prev, workflows: json.workflows }));
        toast.success(`Compiled workflow "${json.rule.name}"!`);
      }
    } finally {
      setSavingWf(false);
    }
  };

  const handleRunWorkflow = async (workflowId: string, action: "test_workflow" | "run_workflow") => {
    const res = await fetch(getApiUrl("/api/ai/business-os"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, workflowId }),
    });
    const json = await res.json();
    if (json?.success) {
      setData((prev: any) => ({ ...prev, workflows: json.workflows }));
      toast.info(`Workflow ${json.run.mode}: ${json.run.status}`);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    const res = await fetch(getApiUrl("/api/ai/business-os"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_workflow", workflowId }),
    });
    const json = await res.json();
    if (json?.success) setData((prev: any) => ({ ...prev, workflows: json.workflows }));
  };

  const handlePlanCampaign = async () => {
    setPlanning(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/business-os"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "plan_campaign", goal: campaignGoal }),
      });
      const json = await res.json();
      if (json?.success) setCampaignSteps(json.steps || []);
    } finally {
      setPlanning(false);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/business-os"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_simulation",
          scenario: simScenario,
          targetUrl: monitorUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json?.success) setSimulationResult(json.simulation);
    } finally {
      setSimulating(false);
    }
  };

  const metrics = data?.metrics || {};
  const alerts: any[] = data?.alerts || [];
  const workflows: WorkflowRule[] = data?.workflows || [];
  const monitoredUrls: any[] = data?.monitoredUrls || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              KASPI AI Business Manager, Monitoring &amp; Workflows OS
            </h1>
            <p className="text-[11px] text-zinc-400">
              Live POS intelligence, HTTP website monitoring, multi-step campaign planning, natural-language automations &amp; isolated simulations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadTelemetry}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Live Telemetry</span>
        </button>
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Products", val: metrics.activeProducts ?? 0 },
          { label: "7-Day Revenue (MAD)", val: metrics.revenue7dMAD ?? 0 },
          { label: "Completed Orders (7d)", val: metrics.completedOrders7d ?? 0 },
          { label: "Low Stock Alerts", val: metrics.lowStockCount ?? 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10">
            <div className="text-[10px] uppercase text-zinc-400 font-bold">{kpi.label}</div>
            <div className="text-xl font-extrabold text-white mt-1 font-mono">{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Intelligent Alerts */}
      <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-2.5">
        <div className="font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Intelligent Business Alerts &amp; Recommendations</span>
        </div>
        {alerts.length === 0 ? (
          <div className="text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>All monitored POS, API &amp; storefront systems operating normally.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alerts.map((al) => (
              <div
                key={al.id}
                className={`p-3 rounded-xl border space-y-1 ${
                  al.severity === "critical"
                    ? "bg-red-500/10 border-red-500/30"
                    : al.severity === "warning"
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-emerald-500/10 border-emerald-500/30"
                }`}
              >
                <div className="font-bold text-white">{al.title}</div>
                <div className="text-[11px] text-zinc-300">{al.detail}</div>
                <div className="text-[10px] text-emerald-300 font-semibold">{al.suggestedAction}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Website Live Uptime & SEO Probe */}
      <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
        <div className="font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Real Website Uptime, Latency &amp; SEO Health Monitor</span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={monitorUrl}
            onChange={(e) => setMonitorUrl(e.target.value)}
            placeholder="https://yourstore.com or https://kaspi-pos.vercel.app"
            className="flex-1 px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
          />
          <button
            type="button"
            onClick={handleCheckWebsite}
            disabled={checkingSite}
            className="px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer"
          >
            {checkingSite ? "Probing..." : "Run Live Probe"}
          </button>
        </div>
        {monitoredUrls.length > 0 && (
          <div className="space-y-1.5">
            {monitoredUrls.map((u, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#141414] border border-white/10 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${u.online ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="font-mono text-white truncate">{u.url}</span>
                </div>
                <div className="text-zinc-400 font-mono">
                  HTTP {u.statusCode} • {u.latencyMs}ms • Title: {u.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Universal Natural-Language Workflow Automation Builder */}
      <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
        <div className="font-bold text-white flex items-center gap-2">
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span>Universal Workflow Automation Engine</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            dir="auto"
            value={wfPrompt}
            onChange={(e) => setWfPrompt(e.target.value)}
            placeholder='e.g. "When a new customer orders, send WhatsApp notification, update HubSpot CRM, and create an invoice"'
            className="flex-1 px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
          />
          <button
            type="button"
            onClick={handleCreateWorkflow}
            disabled={savingWf}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#10b981] text-black font-bold cursor-pointer"
          >
            {savingWf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Compile Flow</span>
          </button>
        </div>

        {workflows.map((wf) => (
          <div key={wf.id} className="p-3 rounded-xl bg-[#141414] border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold text-white">{wf.name}</div>
                <div className="text-[11px] text-zinc-400">{wf.description}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRunWorkflow(wf.id, "test_workflow")}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] cursor-pointer"
                >
                  Dry-Run Test
                </button>
                <button
                  type="button"
                  onClick={() => handleRunWorkflow(wf.id, "run_workflow")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Execute</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteWorkflow(wf.id)}
                  className="p-1 rounded-lg bg-red-500/10 text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-emerald-300">
                TRIGGER: {wf.trigger}
              </span>
              {wf.actions.map((act) => (
                <span
                  key={act.stepId}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300"
                >
                  {act.order}. {act.title}
                </span>
              ))}
            </div>
            {wf.lastRun && (
              <div className="text-[10px] text-zinc-400 bg-black/30 p-2 rounded-lg space-y-0.5">
                <div className="text-emerald-400 font-bold">
                  Last Run ({wf.lastRun.mode}): {wf.lastRun.status}
                </div>
                {wf.lastRun.stepResults.map((sr) => (
                  <div key={sr.stepId}>
                    • {sr.title}: <span className="text-zinc-200">{sr.outcome}</span> — {sr.detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Multi-Step Autonomous Planner & Staging A/B Optimization Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
          <div className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Multi-Step Agent Planner</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              dir="auto"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
            />
            <button
              type="button"
              onClick={handlePlanCampaign}
              disabled={planning}
              className="px-3.5 py-2 rounded-xl bg-[#10b981] text-black font-bold cursor-pointer"
            >
              {planning ? "Planning..." : "Create Plan"}
            </button>
          </div>
          {campaignSteps.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto kaspi-no-scrollbar">
              {campaignSteps.map((st) => (
                <div key={st.step} className="p-2 rounded-lg bg-[#141414] border border-white/10 flex justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">
                      {st.step}. {st.title}
                    </div>
                    <div className="text-[10px] text-zinc-400">{st.detail}</div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-emerald-300 h-fit shrink-0">
                    {st.permission}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
          <div className="font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span>Optimization &amp; A/B Simulation (Staging Only)</span>
          </div>
          <div className="flex gap-2">
            <select
              value={simScenario}
              onChange={(e) => setSimScenario(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
            >
              <option value="checkout_conversion">Checkout &amp; Conversion Audit</option>
              <option value="seo_audit">SEO &amp; AI Discovery Audit</option>
              <option value="pricing_optimization">Pricing &amp; Cross-Sell Bundle Simulation</option>
            </select>
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={simulating}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold cursor-pointer"
            >
              {simulating ? "Simulating..." : "Simulate"}
            </button>
          </div>
          {simulationResult && (
            <div className="p-3 rounded-xl bg-[#141414] border border-amber-500/30 space-y-1.5 text-[11px]">
              <div className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                {simulationResult.disclaimer}
              </div>
              <div>
                <strong className="text-white">Current:</strong> {simulationResult.currentBaseline}
              </div>
              <div>
                <strong className="text-white">Proposed:</strong> {simulationResult.proposedChange}
              </div>
              <div className="text-emerald-300">
                <strong className="text-emerald-400">Expected:</strong> {simulationResult.expectedBenefit}
              </div>
              <div className="text-zinc-400">{simulationResult.testResult}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
