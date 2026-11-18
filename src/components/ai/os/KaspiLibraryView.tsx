"use client";

import React, { useState } from "react";
import {
  Library,
  MapPin,
  Save,
  Trash2,
  Eye,
  Code2,
  Sparkles,
  Download,
  ExternalLink,
} from "lucide-react";
import type {
  KaspiLocalLibraryState,
  LibraryArtifactItem,
  LibraryBusinessKnowledge,
} from "@/lib/ai/kaspi-library-memory";
import { toast } from "sonner";

interface KaspiLibraryViewProps {
  libraryState: KaspiLocalLibraryState;
  onUpdateKnowledge: (k: LibraryBusinessKnowledge) => void;
  onDeleteArtifact: (id: string) => void;
  onOpenArtifactInCanvas: (item: LibraryArtifactItem) => void;
  onOpenMapsPanel: () => void;
}

export const KaspiLibraryView: React.FC<KaspiLibraryViewProps> = ({
  libraryState,
  onUpdateKnowledge,
  onDeleteArtifact,
  onOpenArtifactInCanvas,
  onOpenMapsPanel,
}) => {
  const [knowledge, setKnowledge] = useState<LibraryBusinessKnowledge>(libraryState.knowledge);
  const [searchFilter, setSearchFilter] = useState("");

  const filteredArtifacts = libraryState.artifacts.filter(
    (a) =>
      !searchFilter.trim() ||
      a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.prompt.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleExportLibraryJson = () => {
    const blob = new Blob([JSON.stringify(libraryState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaspi-ai-library-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported local Library memory backup!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-xs pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Library — Persistent On-Device Business Memory
            </h1>
            <p className="text-[11px] text-zinc-400">
              All created stores, apps, business rules, connected apps, skills &amp; Maps location stay stored on your computer and feed every KASPI AI model &amp; agent.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportLibraryJson}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Library Backup</span>
        </button>
      </div>

      {/* Store Location + Business Knowledge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-3">
          <div className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Business Identity &amp; Knowledge (Shared Across All Modes)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              dir="auto"
              value={knowledge.businessName}
              onChange={(e) => setKnowledge({ ...knowledge, businessName: e.target.value })}
              placeholder="Business / Brand Name"
              className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
            />
            <input
              type="text"
              dir="auto"
              value={knowledge.sector}
              onChange={(e) => setKnowledge({ ...knowledge, sector: e.target.value })}
              placeholder="Sector (e.g., Fashion, Electronics, Cafe)"
              className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
            />
          </div>
          <input
            type="text"
            dir="auto"
            value={knowledge.brandVoice}
            onChange={(e) => setKnowledge({ ...knowledge, brandVoice: e.target.value })}
            placeholder="Brand Voice (e.g., Luxury minimal, friendly Moroccan Darija)"
            className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white"
          />
          <textarea
            rows={2}
            dir="auto"
            value={knowledge.policies}
            onChange={(e) => setKnowledge({ ...knowledge, policies: e.target.value })}
            placeholder="Shipping, Return Policies & Pricing Rules..."
            className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-white resize-none"
          />
          <button
            type="button"
            onClick={() => {
              onUpdateKnowledge(knowledge);
              toast.success("Business knowledge saved to local Library!");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Memory Profile</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Verified Store Location (Maps)</span>
              </span>
              <button
                type="button"
                onClick={onOpenMapsPanel}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                {libraryState.location ? "Update Pin" : "Pin Store Now"}
              </button>
            </div>
            {libraryState.location ? (
              <div className="p-3 rounded-xl bg-[#141414] border border-emerald-500/30 space-y-1">
                <div className="font-bold text-white">{libraryState.location.label}</div>
                <div className="text-[11px] text-zinc-400" dir="auto">
                  {libraryState.location.address}
                </div>
                <a
                  href={libraryState.location.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 pt-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Verified Map Pin</span>
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#141414] border border-white/10 text-zinc-400">
                No GPS location pinned yet. Click <strong className="text-white">Pin Store Now</strong> so websites built by Arena show your real map location.
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-white/10">
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
              Connected Plugins in Memory ({libraryState.connectedPlugins.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {libraryState.connectedPlugins.length === 0 ? (
                <span className="text-zinc-500">None connected yet — visit Plugins.</span>
              ) : (
                libraryState.connectedPlugins.map((p) => (
                  <span
                    key={p.serviceId}
                    className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold"
                  >
                    {p.name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Built Stores, Websites, Apps & Videos */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">
            Created Projects, Stores &amp; Assets ({filteredArtifacts.length})
          </h3>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter saved creations..."
            className="px-3 py-1.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white w-64"
          />
        </div>

        {filteredArtifacts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#1e1e1e] border border-white/10 text-center text-zinc-400">
            Your Library stores every site, store, game, app, and video you generate in KASPI AI right here on your device.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredArtifacts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#1e1e1e] border border-white/10 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase">
                      {item.kind}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-bold text-white truncate" dir="auto">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-2" dir="auto">
                    {item.prompt}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">{item.modelName}</div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => onOpenArtifactInCanvas(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer"
                  >
                    {item.previewHtml ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
                    <span>Open &amp; Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteArtifact(item.id)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 cursor-pointer"
                    title="Delete from local Library"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
