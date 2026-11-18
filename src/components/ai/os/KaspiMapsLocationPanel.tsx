"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Search, CheckCircle2, ExternalLink, Loader2, Save } from "lucide-react";
import type { StoreMapsLocation } from "@/lib/ai/kaspi-library-memory";
import {
  buildMapUrlsFromCoords,
  detectBrowserRealGpsLocation,
  reverseGeocodeRealCoords,
  searchRealLocationsOsm,
} from "@/lib/ai/store-location-maps";
import { getApiUrl } from "@/client/sync-engine";
import { toast } from "sonner";

interface KaspiMapsLocationPanelProps {
  currentLocation: StoreMapsLocation | null;
  onSaveLocation: (loc: StoreMapsLocation) => void;
}

export const KaspiMapsLocationPanel: React.FC<KaspiMapsLocationPanelProps> = ({
  currentLocation,
  onSaveLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StoreMapsLocation[]>([]);
  const [draftLocation, setDraftLocation] = useState<StoreMapsLocation | null>(currentLocation);
  const [manualLat, setManualLat] = useState(currentLocation ? String(currentLocation.lat) : "");
  const [manualLng, setManualLng] = useState(currentLocation ? String(currentLocation.lng) : "");
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDetectGps = async () => {
    setDetecting(true);
    try {
      const loc = await detectBrowserRealGpsLocation();
      setDraftLocation(loc);
      setManualLat(String(loc.lat));
      setManualLng(String(loc.lng));
      toast.success(`GPS verified: ${loc.label}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not access browser GPS");
    } finally {
      setDetecting(false);
    }
  };

  const handleOsmSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const rows = await searchRealLocationsOsm(searchQuery);
      setSearchResults(rows);
      if (rows.length === 0) {
        toast.info("No matching address found on OpenStreetMap");
      } else {
        setDraftLocation(rows[0]);
        setManualLat(String(rows[0].lat));
        setManualLng(String(rows[0].lng));
      }
    } catch (err: any) {
      toast.error(err?.message || "OpenStreetMap lookup failed");
    } finally {
      setSearching(false);
    }
  };

  const handleApplyCoords = async () => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Please enter valid latitude (-90..90) and longitude (-180..180)");
      return;
    }
    setSearching(true);
    try {
      const loc = await reverseGeocodeRealCoords(lat, lng, "manual_coords");
      setDraftLocation({ ...loc, ...buildMapUrlsFromCoords(lat, lng) });
    } finally {
      setSearching(false);
    }
  };

  const handleCommitLocation = async (loc: StoreMapsLocation) => {
    setSaving(true);
    try {
      onSaveLocation(loc);
      await fetch(getApiUrl("/api/ai/integrations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_location", location: loc }),
      }).catch(() => {});
      toast.success("Store location synced to Local Library & AI Models!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-xs">
      <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Maps — Real Business Geolocation (100% Real GPS &amp; OpenStreetMap)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Pin your store or business location so every Arena AI model, website, and storefront embeds your real address, live map &amp; directions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detecting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer disabled:opacity-50"
          >
            {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span>Detect My Real GPS Location</span>
          </button>
        </div>

        {/* Real OpenStreetMap Search Bar */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141414] border border-white/10">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOsmSearch()}
              placeholder="Search street, district, city (e.g., Maarif Casablanca / Marrakech Gueliz)..."
              className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleOsmSearch}
            disabled={searching}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold cursor-pointer"
          >
            {searching ? "Searching..." : "Search Map"}
          </button>
        </div>

        {/* Direct Coordinates Entry */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            placeholder="Latitude (e.g. 33.5731)"
            className="w-36 px-3 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-white font-mono text-[11px]"
          />
          <input
            type="text"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            placeholder="Longitude (e.g. -7.5898)"
            className="w-36 px-3 py-1.5 rounded-lg bg-[#141414] border border-white/10 text-white font-mono text-[11px]"
          />
          <button
            type="button"
            onClick={handleApplyCoords}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 cursor-pointer"
          >
            Pin Coordinates
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-zinc-400">OpenStreetMap Matches</div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDraftLocation(item);
                  setManualLat(String(item.lat));
                  setManualLng(String(item.lng));
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left cursor-pointer ${
                  draftLocation?.address === item.address
                    ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                    : "bg-[#141414] border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                <span className="truncate pr-2">{item.address}</span>
                <span className="font-mono text-[10px] text-emerald-400 shrink-0">
                  {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {draftLocation && (
        <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-emerald-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {currentLocation?.lat === draftLocation.lat && currentLocation?.lng === draftLocation.lng
                    ? "Active in AI Memory"
                    : "Ready to Link to KASPI AI"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{draftLocation.label}</h3>
              <p className="text-[11px] text-zinc-400" dir="auto">
                {draftLocation.address}
              </p>
              <div className="font-mono text-[10px] text-zinc-400">
                Lat: {draftLocation.lat.toFixed(6)} • Lng: {draftLocation.lng.toFixed(6)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={draftLocation.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Maps</span>
              </a>
              <button
                type="button"
                onClick={() => handleCommitLocation(draftLocation)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black font-bold cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Connect Location to KASPI AI</span>
              </button>
            </div>
          </div>

          <div className="w-full h-72 rounded-xl overflow-hidden border border-white/15 bg-[#121212]">
            <iframe
              src={draftLocation.osmEmbedUrl}
              title="Store Location Map"
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
};
