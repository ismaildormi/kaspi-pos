/**
 * ============================================================================
 * KASPI AI — REAL GEOLOCATION & OPENSTREETMAP ("EXPLORE -> MAPS") ENGINE
 * 100% Real GPS (navigator.geolocation) + Real OpenStreetMap Nominatim
 * forward & reverse geocoding + real interactive embeddable OSM map URLs.
 * Zero fake/placeholder coordinates.
 * ============================================================================
 */

import type { StoreMapsLocation } from "./kaspi-library-memory";

export function buildMapUrlsFromCoords(lat: number, lng: number): {
  osmEmbedUrl: string;
  googleMapsUrl: string;
} {
  const delta = 0.008;
  const bbox = `${(lng - delta).toFixed(5)},${(lat - delta).toFixed(5)},${(lng + delta).toFixed(
    5
  )},${(lat + delta).toFixed(5)}`;
  return {
    osmEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox
    )}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`,
    googleMapsUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`,
  };
}

export async function reverseGeocodeRealCoords(
  lat: number,
  lng: number,
  source: StoreMapsLocation["source"] = "browser_gps"
): Promise<StoreMapsLocation> {
  const urls = buildMapUrlsFromCoords(lat, lng);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        String(lat)
      )}&lon=${encodeURIComponent(String(lng))}&zoom=17&addressdetails=1`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json().catch(() => null);
    const addr = data?.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.state || addr.county || "Detected Location";
    const country = addr.country || "";
    const displayAddress =
      data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return {
      label: `${city}${country ? `, ${country}` : ""}`,
      address: displayAddress,
      city,
      country,
      lat,
      lng,
      ...urls,
      source,
      verifiedAt: new Date().toISOString(),
    };
  } catch {
    return {
      label: `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: `Latitude ${lat.toFixed(6)}, Longitude ${lng.toFixed(6)}`,
      city: "Custom Coordinates",
      country: "",
      lat,
      lng,
      ...urls,
      source,
      verifiedAt: new Date().toISOString(),
    };
  }
}

export async function searchRealLocationsOsm(query: string): Promise<StoreMapsLocation[]> {
  const clean = query.trim();
  if (!clean) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
      clean
    )}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) {
    throw new Error(`OpenStreetMap Nominatim returned HTTP ${res.status}`);
  }
  const rows = (await res.json()) as any[];
  return rows.map((row) => {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    const addr = row.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.state || row.name || clean;
    const country = addr.country || "";
    return {
      label: `${row.name || city}${country ? `, ${country}` : ""}`,
      address: row.display_name || clean,
      city,
      country,
      lat,
      lng,
      ...buildMapUrlsFromCoords(lat, lng),
      source: "osm_search" as const,
      verifiedAt: new Date().toISOString(),
    };
  });
}

export function detectBrowserRealGpsLocation(): Promise<StoreMapsLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Browser Geolocation API is unavailable on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocodeRealCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            "browser_gps"
          );
          resolve(loc);
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        reject(new Error(err?.message || "Permission denied or GPS signal unavailable."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}
