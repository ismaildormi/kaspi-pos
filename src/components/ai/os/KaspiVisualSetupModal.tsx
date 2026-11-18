"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Loader2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  MousePointerClick,
  Monitor,
  KeyRound,
  X,
} from "lucide-react";
import type { IntegrationCatalogEntry } from "@/lib/ai/integrations-registry";
import type { VisualSetupAnalysisResult } from "@/app/api/ai/visual-setup/route";
import { getApiUrl } from "@/client/sync-engine";
import { toast } from "sonner";

interface KaspiVisualSetupModalProps {
  targetService?: IntegrationCatalogEntry | null;
  onClose?: () => void;
  onQuickConnectCredentials?: (serviceId: string, fields: Record<string, string>) => Promise<void>;
}

export const KaspiVisualSetupModal: React.FC<KaspiVisualSetupModalProps> = ({
  targetService,
  onClose,
  onQuickConnectCredentials,
}) => {
  const [assistanceLevel, setAssistanceLevel] = useState<
    "level_1_screenshot" | "level_2_live_screen" | "level_3_authorized_assist"
  >("level_1_screenshot");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState(
    targetService
      ? `Guide me step-by-step to connect ${targetService.name} and find the required credentials.`
      : "Identify what screen this is and tell me the exact next step to get my API key or OAuth setup."
  );
  const [preferredLanguage, setPreferredLanguage] = useState("Arabic / Darija / Auto");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VisualSetupAnalysisResult | null>(null);
  const [activeShotIdx, setActiveShotIdx] = useState(0);

  // Quick credential completion inside Visual Assistant
  const [quickFields, setQuickFields] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadScreenshots = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = String(ev.target?.result || "");
        if (url) setScreenshots((prev) => [...prev, url].slice(0, 4));
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const handleCaptureLiveScreen = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast.info("Use Upload Screenshot button on this runtime.");
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((t) => t.stop());
      const url = canvas.toDataURL("image/png");
      setScreenshots((prev) => [url, ...prev].slice(0, 4));
      setActiveShotIdx(0);
      toast.success("Captured live screen frame for AI visual inspection!");
    } catch {
      toast.info("Screen capture canceled.");
    }
  };

  const handleAnalyzeScreenshots = async () => {
    if (screenshots.length === 0) {
      toast.error("Please upload or capture at least 1 screenshot first.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch(getApiUrl("/api/ai/visual-setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: screenshots,
          goal: goalInput,
          serviceId: targetService?.id,
          preferredLanguage,
          assistanceLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.analysis) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setAnalysis(data.analysis);
      toast.success(`Analyzed via ${data.modelUsed}`);
    } catch (err: any) {
      toast.error(err?.message || "Screenshot analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCompleteIntegration = async () => {
    if (!targetService || !onQuickConnectCredentials) return;
    setConnecting(true);
    try {
      await onQuickConnectCredentials(targetService.id, quickFields);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/15 space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MousePointerClick className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Visual AI Setup Assistant {targetService ? `— ${targetService.name}` : ""}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Upload screenshots from any developer console — AI highlights exact buttons, explains every field &amp; diagnoses errors.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Three Visual Assistance Levels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          {
            id: "level_1_screenshot" as const,
            title: "Level 1 — Screenshot Guidance",
            desc: "Upload 1–4 screenshots for numbered visual pins & steps",
            Icon: Upload,
          },
          {
            id: "level_2_live_screen" as const,
            title: "Level 2 — Live Screen Assistance",
            desc: "Capture live app window frame with contextual guidance",
            Icon: Monitor,
          },
          {
            id: "level_3_authorized_assist" as const,
            title: "Level 3 — Authorized Guided Connect",
            desc: "Open portal, verify credentials & request explicit approval",
            Icon: KeyRound,
          },
        ].map(({ id, title, desc, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setAssistanceLevel(id)}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              assistanceLevel === id
                ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                : "bg-[#141414] border-white/10 text-zinc-300 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{title}</span>
            </div>
            <div className="text-[10px] text-zinc-400">{desc}</div>
          </button>
        ))}
      </div>

      {/* Official Developer Portal Launch + Screenshot Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {targetService?.devDocsUrl && (
          <a
            href={targetService.devDocsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-emerald-300 font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open {targetService.name} Developer Console</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Screenshots</span>
        </button>
        <button
          type="button"
          onClick={handleCaptureLiveScreen}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 font-semibold cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span>Capture Screen Window</span>
        </button>

        <select
          value={preferredLanguage}
          onChange={(e) => setPreferredLanguage(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white text-xs"
        >
          <option value="Arabic / Darija / Auto">Moroccan Darija / العربية</option>
          <option value="English">English</option>
          <option value="French">Français</option>
          <option value="Spanish">Español</option>
          <option value="German">Deutsch</option>
          <option value="Portuguese">Português</option>
        </select>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleUploadScreenshots}
          className="hidden"
        />
      </div>

      {/* Question / Goal Box */}
      <div className="flex gap-2">
        <input
          type="text"
          dir="auto"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="Ask about any page/error in your screenshot..."
          className="flex-1 px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={handleAnalyzeScreenshots}
          disabled={analyzing || screenshots.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer disabled:opacity-40"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Analyze &amp; Annotate</span>
        </button>
      </div>

      {/* Interactive Annotated Screenshot Viewer + Numbered Highlight Markers */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/40">
              <img
                src={screenshots[activeShotIdx] || screenshots[0]}
                alt="Uploaded setup screen"
                className="w-full h-auto block"
              />
              {analysis?.markers?.map((m, i) => (
                <div
                  key={i}
                  style={{ left: `${m.xPct}%`, top: `${m.yPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 pointer-events-none"
                >
                  <span className="w-6 h-6 rounded-full bg-[#10b981] text-black font-extrabold text-[11px] flex items-center justify-center shadow-xl ring-2 ring-white animate-pulse">
                    {m.number}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/85 border border-emerald-400/60 text-[10px] font-bold text-white whitespace-nowrap shadow-lg">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            {screenshots.length > 1 && (
              <div className="flex gap-2">
                {screenshots.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveShotIdx(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border cursor-pointer ${
                      activeShotIdx === idx ? "border-emerald-400" : "border-white/15 opacity-70"
                    }`}
                  >
                    <img src={s} alt={`Shot ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {analysis ? (
              <>
                <div className="p-3 rounded-xl bg-[#141414] border border-emerald-500/30 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">
                    Detected: {analysis.detectedApp} • {analysis.detectedPage}
                  </div>
                  <div dir="auto" className="text-zinc-200 leading-relaxed">
                    {analysis.currentStepSummary}
                  </div>
                  <div dir="auto" className="pt-1 font-bold text-emerald-300">
                    Next Action: {analysis.nextAction}
                  </div>
                </div>

                {analysis.clickByClickSteps.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#141414] border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">
                      Click-by-Click Instructions
                    </div>
                    {analysis.clickByClickSteps.map((st, idx) => (
                      <div key={idx} dir="auto" className="flex gap-2 text-zinc-200">
                        <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                )}

                {analysis.requiredFieldsHelp.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">
                      Values Needed
                    </div>
                    {analysis.requiredFieldsHelp.map((f, idx) => (
                      <div key={idx} dir="auto" className="text-zinc-300">
                        <strong className="text-white">{f.field}:</strong> {f.whatToEnter}
                      </div>
                    ))}
                  </div>
                )}

                {analysis.missingCredentialsOrErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Diagnostics &amp; Missing Credentials</span>
                    </div>
                    {analysis.missingCredentialsOrErrors.map((err, idx) => (
                      <div key={idx} dir="auto" className="text-amber-200 text-[11px]">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 text-zinc-400">
                Click <strong className="text-emerald-400">Analyze &amp; Annotate</strong> to inspect the screenshot and paint numbered action markers directly on the UI.
              </div>
            )}

            {/* Direct Credential Save & Live Verification */}
            {targetService && targetService.credentialFields.length > 0 && onQuickConnectCredentials && (
              <div className="p-3 rounded-xl bg-[#141414] border border-white/15 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Paste Retrieved Credentials to Connect {targetService.name}</span>
                </div>
                {targetService.credentialFields.map((field) => (
                  <input
                    key={field.key}
                    type={field.secret ? "password" : "text"}
                    value={quickFields[field.key] || ""}
                    onChange={(e) =>
                      setQuickFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#1e1e1e] border border-white/10 text-white text-xs"
                  />
                ))}
                <button
                  type="button"
                  onClick={handleCompleteIntegration}
                  disabled={connecting}
                  className="w-full py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer"
                >
                  {connecting ? "Verifying Live Connection..." : `Verify & Connect ${targetService.name}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
