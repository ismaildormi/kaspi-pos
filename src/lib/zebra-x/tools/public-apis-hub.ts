import Dexie, { type Table } from "dexie";

/**
 * X × Zebra — Phase 2 Unified No-Key Public APIs Hub (Zero API Keys Required)
 * Features:
 * - Covers 26+ open APIs & 65+ catalogued endpoints (Commerce/FX, B2B Maps,
 *   Science/Cosmology, Medicine/FDA/PubMed, Agriculture/SoilGrids/NASA POWER,
 *   Patents/Nobel, Startup/Remote Jobs, SVG Logos).
 * - Offline-First Caching: browser stores responses in isolated Dexie IndexedDB
 *   (`kaspi_zebra_x_api_cache_v1`) so cached queries continue working offline;
 *   server runtime uses bounded in-memory LRU cache (`MAX_SERVER_CACHE = 120`).
 */

export type PublicApiCategory =
  | "openfoodfacts"
  | "openbeautyfacts"
  | "openproductfacts"
  | "fx_rates"
  | "crypto_market"
  | "weather"
  | "geocode"
  | "b2b_overpass"
  | "gleif_company"
  | "country_info"
  | "wikipedia"
  | "wikidata_sparql"
  | "duckduckgo"
  | "world_bank"
  | "openalex_science"
  | "openfda_drug"
  | "pubmed_papers"
  | "soilgrids_agri"
  | "nasa_power_agri"
  | "paleobiology_fossils"
  | "open_tree_of_life"
  | "patents_inventor"
  | "nobel_prize"
  | "hacker_news"
  | "remote_jobs"
  | "iconify_logos"
  | "openverse_media"
  | "met_museum"
  | "polyhaven_3d"
  | "transit_stops"
  | "smart_city_poi"
  | "air_quality"
  | "nador_marine_weather"
  | "cyber_threat_intel";

export interface PublicApiCacheRow {
  cacheKey: string;
  category: string;
  sourceUrl: string;
  payloadJson: string;
  fetchedAt: number;
  ttlMs: number;
}

class PublicApiCacheDexie extends Dexie {
  apiCache!: Table<PublicApiCacheRow, string>;

  constructor() {
    super("kaspi_zebra_x_api_cache_v1");
    this.version(1).stores({
      apiCache: "cacheKey, category, fetchedAt",
    });
  }
}

let browserDb: PublicApiCacheDexie | null = null;
const serverCache = new Map<string, PublicApiCacheRow>();
const MAX_SERVER_CACHE = 120;

function getBrowserCacheDb(): PublicApiCacheDexie | null {
  if (typeof window === "undefined") return null;
  if (!browserDb) browserDb = new PublicApiCacheDexie();
  return browserDb;
}

async function readCacheEntry(
  cacheKey: string,
  allowStale = false
): Promise<PublicApiCacheRow | null> {
  const now = Date.now();

  if (typeof window !== "undefined") {
    const db = getBrowserCacheDb();
    if (!db) return null;
    try {
      const hit = await db.apiCache.get(cacheKey);
      if (!hit) return null;
      if (allowStale || now - hit.fetchedAt <= hit.ttlMs) return hit;
    } catch {
      return null;
    }
    return null;
  }

  const mem = serverCache.get(cacheKey);
  if (!mem) return null;
  if (allowStale || now - mem.fetchedAt <= mem.ttlMs) return mem;
  serverCache.delete(cacheKey);
  return null;
}

async function writeCacheEntry(row: PublicApiCacheRow): Promise<void> {
  if (typeof window !== "undefined") {
    const db = getBrowserCacheDb();
    if (!db) return;
    try {
      await db.apiCache.put(row);
    } catch {
      // Ignore quota failures cleanly
    }
    return;
  }

  if (serverCache.size >= MAX_SERVER_CACHE) {
    const oldestKey = serverCache.keys().next().value;
    if (oldestKey) serverCache.delete(oldestKey);
  }
  serverCache.set(row.cacheKey, row);
}

async function fetchJsonWithTimeout<T = any>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 7000
): Promise<T> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Blocked non-HTTP protocol");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "169.254.169.254" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    throw new Error("Blocked private or internal host");
  }
  const safeHref = new URL(`${parsed.pathname}${parsed.search}`, parsed.origin).href;

  const headers = new Headers(init.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "KaspiPOS-HEYUKA/3.0 (+https://kaspi-pos.vercel.app)");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const res = await fetch(safeHref, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${parsed.hostname}`);
  }
  return (await res.json()) as T;
}

async function resolveLatLon(query: string): Promise<{ lat: number; lon: number; label: string }> {
  const coordMatch = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    return {
      lat: Number(coordMatch[1]),
      lon: Number(coordMatch[2]),
      label: `${coordMatch[1]}, ${coordMatch[2]}`,
    };
  }

  const city = query.trim() || "Casablanca";
  const cLow = city.toLowerCase();
  const ORIENTAL_PRESETS: Array<[RegExp, { lat: number; lon: number; label: string }]> = [
    [/(?:^|\b)(nador|nadour|الناظور|ناظور|marchica|مارشيكا)(?:\b|$)/i, { lat: 35.1688, lon: -2.9335, label: "Nador, Oriental, Morocco" }],
    [/(beni\s*ansar|bni\s*ansar|بني\s*أنصار|بني\s*نصار)/i, { lat: 35.2586, lon: -2.9347, label: "Beni Ansar Port, Nador, Morocco" }],
    [/(nador\s*west\s*med|الناظور\s*غرب\s*المتوسط)/i, { lat: 35.247, lon: -3.185, label: "Nador West Med Port, Morocco" }],
    [/(selouane|سلوان)/i, { lat: 35.0728, lon: -2.9422, label: "Selouane, Nador, Morocco" }],
    [/(al\s*aroui|العروي)/i, { lat: 35.0114, lon: -3.0089, label: "Al Aroui, Nador, Morocco" }],
    [/(zaio|زايو)/i, { lat: 34.9389, lon: -2.7328, label: "Zaio, Nador, Morocco" }],
    [/(oujda|وجدة)/i, { lat: 34.6814, lon: -1.9086, label: "Oujda, Oriental, Morocco" }],
    [/(berkane|بركان)/i, { lat: 34.92, lon: -2.32, label: "Berkane, Oriental, Morocco" }],
  ];
  for (const [rx, preset] of ORIENTAL_PRESETS) {
    if (rx.test(cLow)) return preset;
  }

  const geo = await fetchJsonWithTimeout<any>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const top = geo?.results?.[0];
  if (top) {
    return {
      lat: Number(top.latitude),
      lon: Number(top.longitude),
      label: `${top.name}${top.country ? `, ${top.country}` : ""}`,
    };
  }
  return { lat: 33.5731, lon: -7.5898, label: "Casablanca, Morocco (default)" };
}

async function searchOsmPlacesFallback(
  term: string,
  loc: { lat: number; lon: number; label: string },
  limit: number
): Promise<{
  sourceUrl: string;
  provider: string;
  places: Array<{ id?: string | number; name: string; address: string | null; lat: number; lon: number }>;
}> {
  const cleanTerm = term.split("|")[0]?.trim() || "pharmacy";
  const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanTerm)}&format=json&viewbox=${loc.lon - 0.12},${loc.lat + 0.12},${loc.lon + 0.12},${loc.lat - 0.12}&bounded=1&limit=${limit}`;
  const nomRows = await fetchJsonWithTimeout<any[]>(nomUrl, {}, 6500).catch(() => []);
  if (Array.isArray(nomRows) && nomRows.length > 0) {
    return {
      sourceUrl: nomUrl,
      provider: "openstreetmap_nominatim",
      places: nomRows.slice(0, limit).map((n: any) => ({
        id: n.osm_id || n.place_id,
        name: n.name || String(n.display_name || cleanTerm).split(",")[0],
        address: n.display_name || null,
        lat: Number(n.lat),
        lon: Number(n.lon),
      })),
    };
  }
  const phUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(`${cleanTerm} ${loc.label}`)}&lat=${loc.lat}&lon=${loc.lon}&limit=${limit}`;
  const phJson = await fetchJsonWithTimeout<any>(phUrl, {}, 6500).catch(() => ({ features: [] }));
  return {
    sourceUrl: phUrl,
    provider: "photon_osm",
    places: (phJson?.features || []).slice(0, limit).map((f: any) => ({
      id: f.properties?.osm_id,
      name: f.properties?.name || cleanTerm,
      address: [f.properties?.street, f.properties?.city, f.properties?.country].filter(Boolean).join(", ") || null,
      lat: Number(f.geometry?.coordinates?.[1] ?? loc.lat),
      lon: Number(f.geometry?.coordinates?.[0] ?? loc.lon),
    })),
  };
}

async function executePublicQuery(
  category: PublicApiCategory,
  rawQuery: string,
  extra?: { base?: string; lang?: string; limit?: number }
): Promise<{ sourceUrl: string; data: unknown }> {
  const query = (rawQuery || "").trim();
  const limit = Math.min(Math.max(extra?.limit ?? 6, 1), 15);
  const lang = (extra?.lang || "en").slice(0, 2).toLowerCase();

  switch (category) {
    case "openfoodfacts":
    case "openbeautyfacts":
    case "openproductfacts": {
      const host =
        category === "openfoodfacts"
          ? "world.openfoodfacts.org"
          : category === "openbeautyfacts"
          ? "world.openbeautyfacts.org"
          : "world.openproductsfacts.org";

      if (/^\d{8,14}$/.test(query)) {
        const url = `https://${host}/api/v2/product/${query}.json?fields=code,product_name,brands,categories,quantity,nutriscore_grade,image_front_small_url`;
        const json = await fetchJsonWithTimeout(url);
        return { sourceUrl: url, data: json?.product ?? { found: false, barcode: query } };
      }
      const url = `https://${host}/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=${limit}`;
      const json = await fetchJsonWithTimeout(url);
      const products = (json?.products || []).slice(0, limit).map((p: any) => ({
        barcode: p.code,
        name: p.product_name,
        brand: p.brands,
        quantity: p.quantity,
        image: p.image_front_small_url,
      }));
      return { sourceUrl: url, data: { count: products.length, products } };
    }

    case "fx_rates": {
      const base = (extra?.base || query.split(/\s+/)[0] || "mad")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      // 1st choice: fawazahmed0 currency-api (200+ world + crypto currencies via fast CDN)
      const primaryUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base}.json`;
      try {
        const json = await fetchJsonWithTimeout<any>(primaryUrl);
        const rates = json?.[base] || {};
        const focus = ["mad", "usd", "eur", "gbp", "cad", "aed", "sar", "cny", "btc", "usdt"];
        const subsetMap = new Map<string, number>();
        for (const k of focus) {
          if (typeof rates[k] === "number") subsetMap.set(k.toUpperCase(), rates[k]);
        }
        const targetCur = query.toLowerCase().match(/\b([a-z]{3,5})\b/g)?.pop();
        if (
          targetCur &&
          targetCur !== "__proto__" &&
          targetCur !== "constructor" &&
          targetCur !== "prototype" &&
          Object.prototype.hasOwnProperty.call(rates, targetCur) &&
          typeof rates[targetCur] === "number"
        ) {
          subsetMap.set(targetCur.toUpperCase(), rates[targetCur]);
        }
        const subset = Object.fromEntries(subsetMap);
        return {
          sourceUrl: primaryUrl,
          data: { base: base.toUpperCase(), date: json?.date, rates: subset, totalSupported: Object.keys(rates).length },
        };
      } catch {
        const fallbackUrl = `https://open.er-api.com/v6/latest/${base.toUpperCase()}`;
        const er = await fetchJsonWithTimeout<any>(fallbackUrl);
        return {
          sourceUrl: fallbackUrl,
          data: {
            base: base.toUpperCase(),
            date: er?.time_last_update_utc,
            rates: {
              MAD: er?.rates?.MAD,
              USD: er?.rates?.USD,
              EUR: er?.rates?.EUR,
              GBP: er?.rates?.GBP,
              SAR: er?.rates?.SAR,
              AED: er?.rates?.AED,
            },
          },
        };
      }
    }

    case "crypto_market": {
      const ids = (query || "bitcoin,ethereum,tether,solana").toLowerCase().replace(/\s+/g, ",");
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
        ids
      )}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`;
      const coins = await fetchJsonWithTimeout<any[]>(url);
      return {
        sourceUrl: url,
        data: (Array.isArray(coins) ? coins : []).map((c) => ({
          id: c.id,
          symbol: String(c.symbol || "").toUpperCase(),
          priceUSD: c.current_price,
          marketCapUSD: c.market_cap,
          change24hPct: c.price_change_percentage_24h,
        })),
      };
    }

    case "weather": {
      const loc = await resolveLatLon(query || "Casablanca");
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`;
      const json = await fetchJsonWithTimeout(url);
      return { sourceUrl: url, data: { location: loc.label, current: json?.current, daily: json?.daily } };
    }

    case "geocode": {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query || "Casablanca"
      )}&format=json&addressdetails=1&limit=${limit}`;
      const rows = await fetchJsonWithTimeout<any[]>(url);
      return {
        sourceUrl: url,
        data: (Array.isArray(rows) ? rows : []).map((r) => ({
          name: r.display_name,
          lat: Number(r.lat),
          lon: Number(r.lon),
          type: r.type,
        })),
      };
    }

    case "b2b_overpass": {
      // Query B2B suppliers / shops / factories / warehouses around resolved city
      const [tagPart, placePart] = query.includes("|") ? query.split("|") : ["supermarket", query];
      const osmVal = (tagPart || "supermarket").trim().toLowerCase().replace(/[^a-z_\s]/g, "");
      const loc = await resolveLatLon(placePart || "Casablanca");
      const ql = `[out:json][timeout:8];(node["shop"~"${osmVal}"](around:4500,${loc.lat},${loc.lon});node["amenity"~"${osmVal}"](around:4500,${loc.lat},${loc.lon});node["craft"~"${osmVal}"](around:4500,${loc.lat},${loc.lon}););out body ${limit};`;
      const ovUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(ql)}`;
      try {
        const json = await fetchJsonWithTimeout<any>(ovUrl, { headers: { Accept: "*/*" } }, 5500);
        const elements = (json?.elements || []).slice(0, limit).map((e: any) => ({
          id: e.id,
          name: e.tags?.name || e.tags?.brand || osmVal,
          phone: e.tags?.phone || e.tags?.["contact:phone"] || null,
          address: e.tags?.["addr:street"] || null,
          lat: e.lat,
          lon: e.lon,
        }));
        if (elements.length > 0) {
          return { sourceUrl: ovUrl, data: { area: loc.label, radiusMeters: 4500, results: elements } };
        }
      } catch {
        // Fall through cleanly to Nominatim/Photon OSM search
      }

      const fb = await searchOsmPlacesFallback(osmVal || query, loc, limit);
      return {
        sourceUrl: fb.sourceUrl,
        data: { area: loc.label, provider: fb.provider, results: fb.places },
      };
    }

    case "gleif_company": {
      const url = `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(
        query
      )}&page[size]=${limit}`;
      const json = await fetchJsonWithTimeout<any>(url);
      const entities = (json?.data || []).slice(0, limit).map((d: any) => ({
        lei: d.id,
        legalName: d.attributes?.entity?.legalName?.name,
        country: d.attributes?.entity?.legalAddress?.country,
        city: d.attributes?.entity?.legalAddress?.city,
        status: d.attributes?.entity?.status,
      }));
      return { sourceUrl: url, data: { count: entities.length, entities } };
    }

    case "country_info": {
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(query || "Morocco")}?fields=name,cca2,currencies,languages,capital,population,region,timezones,idd`;
      const rows = await fetchJsonWithTimeout<any[]>(url);
      return { sourceUrl: url, data: Array.isArray(rows) ? rows.slice(0, 3) : rows };
    }

    case "wikipedia": {
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        query.replace(/\s+/g, "_")
      )}`;
      const json = await fetchJsonWithTimeout<any>(url);
      return {
        sourceUrl: url,
        data: {
          title: json?.title,
          description: json?.description,
          extract: json?.extract,
          pageUrl: json?.content_urls?.desktop?.page,
        },
      };
    }

    case "wikidata_sparql": {
      const isRawSparql = /^\s*(SELECT|ASK|PREFIX)\b/i.test(query);
      if (isRawSparql) {
        const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
        const json = await fetchJsonWithTimeout<any>(url);
        return { sourceUrl: url, data: (json?.results?.bindings || []).slice(0, limit) };
      }
      const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        query
      )}&language=${lang}&format=json&limit=${limit}&origin=*`;
      const json = await fetchJsonWithTimeout<any>(url);
      return { sourceUrl: url, data: json?.search || [] };
    }

    case "duckduckgo": {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const json = await fetchJsonWithTimeout<any>(url);
      return {
        sourceUrl: url,
        data: {
          heading: json?.Heading,
          abstractText: json?.AbstractText,
          abstractUrl: json?.AbstractURL,
          relatedTopics: (json?.RelatedTopics || []).slice(0, 5).map((t: any) => t?.Text).filter(Boolean),
        },
      };
    }

    case "world_bank": {
      // Expected e.g. "MA|NY.GDP.MKTP.CD" or "MA"
      const [country = "MA", indicator = "NY.GDP.MKTP.CD"] = query.split("|");
      const wbUrl = `https://api.worldbank.org/v2/country/${encodeURIComponent(
        country.trim()
      )}/indicator/${encodeURIComponent(indicator.trim())}?format=json&per_page=6`;
      try {
        const json = await fetchJsonWithTimeout<any>(wbUrl, {}, 6000);
        const rows = (Array.isArray(json) && Array.isArray(json[1]) ? json[1] : []).map((r: any) => ({
          year: r.date,
          value: r.value,
          indicator: r.indicator?.value,
          country: r.country?.value,
        }));
        if (rows.length > 0) return { sourceUrl: wbUrl, data: rows };
      } catch {
        // Fallback to live IMF DataMapper API when World Bank times out
      }
      const ISO2_TO_ISO3: Record<string, string> = {
        MA: "MAR",
        FR: "FRA",
        US: "USA",
        SA: "SAU",
        AE: "ARE",
        ES: "ESP",
        DE: "DEU",
        GB: "GBR",
      };
      const codeUpper = country.trim().toUpperCase();
      const iso3 = ISO2_TO_ISO3[codeUpper] || (codeUpper.length === 3 ? codeUpper : "MAR");
      const imfUrl = `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/${encodeURIComponent(iso3)}?periods=2022,2023,2024,2025`;
      const imfJson = await fetchJsonWithTimeout<any>(imfUrl, {}, 7500);
      const series = imfJson?.values?.NGDP_RPCH?.[iso3] || {};
      const imfRows = Object.entries(series).map(([year, value]) => ({
        year,
        value,
        indicator: "Real GDP Growth % (IMF NGDP_RPCH)",
        country: iso3,
      }));
      return { sourceUrl: imfUrl, data: imfRows };
    }

    case "openalex_science": {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}&select=id,title,publication_year,cited_by_count,doi`;
      try {
        const json = await fetchJsonWithTimeout<any>(url, {}, 5500);
        if (Array.isArray(json?.results) && json.results.length > 0) {
          return { sourceUrl: url, data: json.results };
        }
      } catch {
        // Fall through cleanly to Crossref open bibliographic API on 429/timeout
      }
      const crossrefUrl = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${Math.min(limit, 5)}`;
      const crJson = await fetchJsonWithTimeout<any>(crossrefUrl);
      const items = Array.isArray(crJson?.message?.items) ? crJson.message.items : [];
      return {
        sourceUrl: crossrefUrl,
        data: items.map((item: any) => ({
          id: item.DOI || item.URL,
          title: Array.isArray(item.title) ? item.title[0] : item.title,
          publication_year: item.issued?.["date-parts"]?.[0]?.[0],
          cited_by_count: item["is-referenced-by-count"],
          doi: item.DOI,
        })),
      };
    }

    case "openfda_drug": {
      const rawClean = query.replace(/["\\]/g, "").trim();
      const normalizedDrug = /^paracetamol$/i.test(rawClean) ? "acetaminophen" : rawClean;
      const fdaUrl = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(normalizedDrug)}&limit=3`;
      try {
        const json = await fetchJsonWithTimeout<any>(fdaUrl, {}, 5500);
        const hits = (json?.results || []).map((r: any) => ({
          brandNames: r.openfda?.brand_name?.slice(0, 3),
          genericNames: r.openfda?.generic_name?.slice(0, 3),
          indications: String(r.indications_and_usage?.[0] || "").slice(0, 500),
          warnings: String(r.warnings?.[0] || "").slice(0, 500),
        }));
        if (hits.length > 0) return { sourceUrl: fdaUrl, data: hits };
      } catch {
        // Fall through cleanly to NLM Clinical Tables RxTerms
      }
      const nlmUrl = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(normalizedDrug)}&maxList=${limit}`;
      const nlm = await fetchJsonWithTimeout<any[]>(nlmUrl, {}, 6500);
      const names = Array.isArray(nlm?.[1]) ? nlm[1] : [];
      return {
        sourceUrl: nlmUrl,
        data: names.map((name: string) => ({
          genericQuery: normalizedDrug,
          originalQuery: rawClean,
          rxTerm: name,
          source: "NLM Clinical Tables RxTerms",
        })),
      };
    }

    case "pubmed_papers": {
      const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        query
      )}&retmode=json&retmax=${limit}`;
      const sJson = await fetchJsonWithTimeout<any>(sUrl);
      const ids: string[] = sJson?.esearchresult?.idlist || [];
      if (ids.length === 0) return { sourceUrl: sUrl, data: [] };
      const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(
        ","
      )}&retmode=json`;
      const sumJson = await fetchJsonWithTimeout<any>(sumUrl);
      const items = ids.map((id) => ({
        pmid: id,
        title: sumJson?.result?.[id]?.title,
        pubdate: sumJson?.result?.[id]?.pubdate,
        source: sumJson?.result?.[id]?.source,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      }));
      return { sourceUrl: sumUrl, data: items };
    }

    case "soilgrids_agri": {
      const loc = await resolveLatLon(query || "33.89,-5.55");
      const sgUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${loc.lon}&lat=${loc.lat}&property=phh2o&property=clay&property=sand&property=soc&depth=0-5cm&value=mean`;
      try {
        const json = await fetchJsonWithTimeout<any>(sgUrl, {}, 6500);
        if (Array.isArray(json?.properties?.layers) && json.properties.layers.length > 0) {
          return { sourceUrl: sgUrl, data: { location: loc, provider: "isric_soilgrids", layers: json.properties.layers } };
        }
      } catch {
        // Fallback to Open-Meteo Soil Telemetry when ISRIC REST TLS drops
      }
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=soil_temperature_0cm,soil_moisture_0_to_1cm,precipitation`;
      const omJson = await fetchJsonWithTimeout<any>(omUrl, {}, 6500);
      return {
        sourceUrl: omUrl,
        data: {
          location: loc,
          provider: "open_meteo_soil_fallback",
          currentSoil: omJson?.current || null,
          units: omJson?.current_units || null,
        },
      };
    }

    case "nasa_power_agri": {
      const loc = await resolveLatLon(query || "Casablanca");
      const end = new Date(Date.now() - 86400 * 1000 * 3);
      const start = new Date(end.getTime() - 86400 * 1000 * 6);
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR&community=AG&longitude=${loc.lon}&latitude=${loc.lat}&start=${fmt(
        start
      )}&end=${fmt(end)}&format=JSON`;
      const json = await fetchJsonWithTimeout<any>(url, {}, 9000);
      return { sourceUrl: url, data: { location: loc, parameters: json?.properties?.parameter || {} } };
    }

    case "paleobiology_fossils": {
      const url = `https://paleobiodb.org/data1.2/taxa/list.json?name=${encodeURIComponent(
        query || "Trilobita"
      )}&rel=all_children&show=attr,app,size&limit=${limit}`;
      const json = await fetchJsonWithTimeout<any>(url);
      return { sourceUrl: url, data: (json?.records || []).slice(0, limit) };
    }

    case "open_tree_of_life": {
      const url = "https://api.opentreeoflife.org/v3/tnrs/match_names";
      const names = query.split(",").map((s) => s.trim()).filter(Boolean);
      try {
        const json = await fetchJsonWithTimeout<any>(
          url,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ names }),
          },
          10_000
        );
        return { sourceUrl: url, data: json?.results || [] };
      } catch {
        const gbifUrl = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(
          names[0] || query.trim() || "Homo sapiens"
        )}&limit=${Math.min(limit, 5)}`;
        const gbif = await fetchJsonWithTimeout<any>(gbifUrl);
        return {
          sourceUrl: gbifUrl,
          data: Array.isArray(gbif?.results) ? gbif.results : [],
        };
      }
    }

    case "patents_inventor": {
      // Search Wikidata scholarly/invention entities & inventors cleanly without API keys
      const sparql = `SELECT ?item ?itemLabel ?inventorLabel ?date WHERE {
        ?item rdfs:label "${query.replace(/"/g, "")}"@en .
        OPTIONAL { ?item wdt:P61 ?inventor . }
        OPTIONAL { ?item wdt:P575 ?date . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ar,fr". }
      } LIMIT ${limit}`;
      const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
      const json = await fetchJsonWithTimeout<any>(url);
      return { sourceUrl: url, data: json?.results?.bindings || [] };
    }

    case "nobel_prize": {
      const catMap: Record<string, string> = {
        physics: "phy",
        chemistry: "che",
        medicine: "med",
        physiology: "med",
        literature: "lit",
        peace: "pea",
        economics: "eco",
      };
      const catCode = catMap[query.toLowerCase()];
      if (catCode) {
        const pUrl = `https://api.nobelprize.org/2.1/nobelPrizes?nobelPrizeCategory=${catCode}&limit=${limit}`;
        const json = await fetchJsonWithTimeout<any>(pUrl);
        const rows = (json?.nobelPrizes || []).map((p: any) => ({
          year: p.awardYear,
          category: p.category?.en,
          laureates: (p.laureates || []).map((l: any) => ({
            name: l.knownName?.en || l.fullName?.en,
            motivation: l.motivation?.en,
          })),
        }));
        return { sourceUrl: pUrl, data: rows };
      }
      const url = `https://api.nobelprize.org/2.1/laureates?name=${encodeURIComponent(query)}&limit=${limit}`;
      const json = await fetchJsonWithTimeout<any>(url);
      const rows = (json?.laureates || []).map((l: any) => ({
        name: l.knownName?.en || l.fullName?.en,
        prizes: (l.nobelPrizes || []).map((p: any) => ({
          year: p.awardYear,
          category: p.category?.en,
          motivation: p.motivation?.en,
        })),
      }));
      return { sourceUrl: url, data: rows };
    }

    case "hacker_news": {
      if (query.trim()) {
        const algoliaUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
          query.trim()
        )}&tags=story&hitsPerPage=${Math.min(limit, 8)}`;
        const hnJson = await fetchJsonWithTimeout<any>(algoliaUrl).catch(() => null);
        const hits = Array.isArray(hnJson?.hits) ? hnJson.hits : [];
        if (hits.length > 0) {
          return {
            sourceUrl: algoliaUrl,
            data: hits.slice(0, Math.min(limit, 8)).map((h: any) => ({
              title: h.title || h.story_title || "HN Story",
              url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
              score: h.points || 0,
              comments: h.num_comments || 0,
            })),
          };
        }
      }
      const idsUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";
      const ids = await fetchJsonWithTimeout<number[]>(idsUrl);
      const top = ids.slice(0, Math.min(limit, 8));
      const stories = await Promise.all(
        top.map((id) =>
          fetchJsonWithTimeout<any>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
        )
      );
      return {
        sourceUrl: idsUrl,
        data: stories
          .filter(Boolean)
          .map((s) => ({ title: s.title, url: s.url, score: s.score, comments: s.descendants })),
      };
    }

    case "remote_jobs": {
      const url = "https://www.arbeitnow.com/api/job-board-api";
      const json = await fetchJsonWithTimeout<any>(url);
      const qLower = query.toLowerCase();
      const jobs = (json?.data || [])
        .filter((j: any) =>
          !qLower
            ? true
            : `${j.title} ${j.company_name} ${(j.tags || []).join(" ")}`.toLowerCase().includes(qLower)
        )
        .slice(0, limit)
        .map((j: any) => ({
          title: j.title,
          company: j.company_name,
          remote: j.remote,
          location: j.location,
          url: j.url,
        }));
      return { sourceUrl: url, data: jobs };
    }

    case "iconify_logos": {
      const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      const json = await fetchJsonWithTimeout<any>(url);
      const icons = (json?.icons || []).slice(0, limit).map((id: string) => ({
        id,
        svgUrl: `https://api.iconify.design/${id}.svg`,
      }));
      return {
        sourceUrl: url,
        data: {
          simpleIconsSuggestion: `https://cdn.simpleicons.org/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, ""))}`,
          icons,
        },
      };
    }

    case "openverse_media": {
      const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
        query || "product design"
      )}&page_size=${limit}`;
      const json = await fetchJsonWithTimeout(url);
      const results = (Array.isArray(json?.results) ? json.results : []).map((r: any) => ({
        title: String(r?.title || query),
        url: String(r?.url || ""),
        thumbnail: String(r?.thumbnail || r?.url || ""),
        license: String(r?.license || "cc"),
        creator: String(r?.creator || ""),
        source: String(r?.source || "openverse"),
      }));
      return { sourceUrl: url, data: { results } };
    }

    case "met_museum": {
      const metUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(
        query || "ornament"
      )}`;
      try {
        const search = await fetchJsonWithTimeout(metUrl, {}, 5000);
        const ids: number[] = Array.isArray(search?.objectIDs) ? search.objectIDs.slice(0, Math.min(limit, 5)) : [];
        const details = await Promise.allSettled(
          ids.map((id) =>
            fetchJsonWithTimeout(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
          )
        );
        const items = details
          .filter((d): d is PromiseFulfilledResult<any> => d.status === "fulfilled" && Boolean(d.value?.primaryImageSmall))
          .map((d) => ({
            id: d.value.objectID,
            title: d.value.title,
            artist: d.value.artistDisplayName,
            image: d.value.primaryImageSmall,
            objectUrl: d.value.objectURL,
          }));
        if (items.length > 0) return { sourceUrl: metUrl, data: { total: search?.total || 0, items } };
      } catch {
        // Fallback to Art Institute of Chicago Open IIIF API if Met returns 410/403
      }
      const articUrl = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(
        query || "ornament"
      )}&fields=id,title,artist_display,image_id&limit=${limit}`;
      const articJson = await fetchJsonWithTimeout<any>(articUrl, {}, 7000);
      const items = (articJson?.data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        artist: row.artist_display || "Public Collection",
        image: row.image_id ? `https://www.artic.edu/iiif/2/${row.image_id}/full/843,/0/default.jpg` : null,
        objectUrl: `https://www.artic.edu/artworks/${row.id}`,
      }));
      return { sourceUrl: articUrl, data: { total: articJson?.pagination?.total || items.length, provider: "artic_open_collection", items } };
    }

    case "polyhaven_3d": {
      const [maybeType, maybeKw] = (query || "models").includes(":")
        ? (query || "models").split(":", 2)
        : ["models", query || ""];
      const normalizedType =
        maybeType === "textures" || maybeType === "hdris" ? maybeType : "models";
      const kw = (maybeKw || "").trim().toLowerCase();
      const url = `https://api.polyhaven.com/assets?t=${normalizedType}`;
      const json = await fetchJsonWithTimeout<Record<string, any>>(url);
      const entries = Object.entries(json || {});
      const filtered = kw
        ? entries.filter(([slug, meta]) => {
            const name = String(meta?.name || "").toLowerCase();
            const cats = Array.isArray(meta?.categories) ? meta.categories.join(" ").toLowerCase() : "";
            const tags = Array.isArray(meta?.tags) ? meta.tags.join(" ").toLowerCase() : "";
            return slug.toLowerCase().includes(kw) || name.includes(kw) || cats.includes(kw) || tags.includes(kw);
          })
        : entries;
      const items = filtered.slice(0, limit).map(([slug, meta]) => ({
        slug,
        name: String(meta?.name || slug),
        type: normalizedType,
        categories: Array.isArray(meta?.categories) ? meta.categories : [],
        thumbnailUrl: `https://cdn.polyhaven.com/asset_img/thumbs/${slug}.png?width=384`,
        assetPageUrl: `https://polyhaven.com/a/${slug}`,
        filesApiUrl: `https://api.polyhaven.com/files/${slug}`,
      }));
      return { sourceUrl: url, data: { assetType: normalizedType, count: items.length, items } };
    }

    case "transit_stops": {
      const q = (query || "Casablanca").trim();
      const url = `https://transit.land/api/v2/rest/stops?search=${encodeURIComponent(q)}&per_page=${limit}`;
      try {
        const json = await fetchJsonWithTimeout(url);
        const stops = (Array.isArray(json?.stops) ? json.stops : []).map((s: any) => ({
          name: s.stop_name,
          id: s.onestop_id,
          lat: s.geometry?.coordinates?.[1],
          lon: s.geometry?.coordinates?.[0],
        }));
        if (stops.length > 0) return { sourceUrl: url, data: { source: "transitland", stops } };
      } catch {}
      const loc = await resolveLatLon(q);
      const overpassQuery = `[out:json][timeout:12];(node["public_transport"~"platform|station"](around:3500,${loc.lat},${loc.lon});node["railway"="station"](around:4500,${loc.lat},${loc.lon}););out center ${limit};`;
      const ovUrl = "https://overpass-api.de/api/interpreter";
      const ovJson = await fetchJsonWithTimeout<any>(
        ovUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        },
        10_000
      ).catch(() => ({ elements: [] }));
      const stops = (Array.isArray(ovJson?.elements) ? ovJson.elements : []).slice(0, limit).map((e: any) => ({
        name: e.tags?.name || "Transit Stop",
        type: e.tags?.railway || e.tags?.public_transport || "stop",
        lat: e.lat,
        lon: e.lon,
      }));
      if (stops.length > 0) {
        return { sourceUrl: ovUrl, data: { source: "openstreetmap_transit", city: loc.label, stops } };
      }
      const fb = await searchOsmPlacesFallback("bus station OR train station", loc, limit);
      return { sourceUrl: fb.sourceUrl, data: { source: fb.provider, city: loc.label, stops: fb.places } };
    }

    case "smart_city_poi": {
      const [amenityPart, cityPart] = (query || "pharmacy|Casablanca").includes("|")
        ? (query || "pharmacy|Casablanca").split("|", 2)
        : ["pharmacy|hospital|fuel|parking|police", query || "Casablanca"];
      const amenityRegex = amenityPart.trim().replace(/[^a-z_|]/gi, "") || "pharmacy|hospital|fuel|parking";
      const loc = await resolveLatLon(cityPart.trim() || "Casablanca");
      const ovQuery = `[out:json][timeout:8];node["amenity"~"${amenityRegex}"](around:3500,${loc.lat},${loc.lon});out center ${limit};`;
      const ovUrl = "https://overpass-api.de/api/interpreter";
      const json = await fetchJsonWithTimeout<any>(
        ovUrl,
        {
          method: "POST",
          headers: { Accept: "*/*", "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(ovQuery)}`,
        },
        6000
      ).catch(() => ({ elements: [] }));
      const pois = (Array.isArray(json?.elements) ? json.elements : []).slice(0, limit).map((e: any) => ({
        name: e.tags?.name || e.tags?.amenity || "City Service",
        amenity: e.tags?.amenity,
        phone: e.tags?.phone || e.tags?.["contact:phone"] || null,
        openingHours: e.tags?.opening_hours || null,
        lat: e.lat,
        lon: e.lon,
      }));
      if (pois.length > 0) return { sourceUrl: ovUrl, data: { city: loc.label, pois } };
      const fb = await searchOsmPlacesFallback(amenityPart, loc, limit);
      return { sourceUrl: fb.sourceUrl, data: { city: loc.label, provider: fb.provider, pois: fb.places } };
    }

    case "air_quality": {
      const loc = await resolveLatLon(query || "Casablanca");
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,european_aqi`;
      const json = await fetchJsonWithTimeout(url);
      return {
        sourceUrl: url,
        data: {
          location: loc.label,
          current: json?.current || null,
          units: json?.current_units || null,
        },
      };
    }

    case "nador_marine_weather": {
      const loc = await resolveLatLon(query || "Nador");
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${loc.lat}&longitude=${loc.lon}&current=wave_height,wave_direction,wave_period,swell_wave_height&hourly=wave_height,swell_wave_height&forecast_days=2`;
      const json = await fetchJsonWithTimeout(url);
      return {
        sourceUrl: url,
        data: {
          location: loc.label,
          portHubs: ["Beni Ansar Port", "Nador West Med", "Marchica Lagoon"],
          current: json?.current || null,
          units: json?.current_units || null,
          hourly: json?.hourly || null,
        },
      };
    }

    case "cyber_threat_intel": {
      const cleanQ = (query || "openssl").trim();
      const [kevRes, osvRes] = await Promise.allSettled([
        fetchJsonWithTimeout<any>(
          "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
          {},
          7000
        ),
        fetchJsonWithTimeout<any>(
          "https://api.osv.dev/v1/query",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ package: { name: cleanQ.toLowerCase(), ecosystem: "npm" } }),
          },
          7000
        ),
      ]);

      const matchingKev =
        kevRes.status === "fulfilled" && Array.isArray(kevRes.value?.vulnerabilities)
          ? kevRes.value.vulnerabilities
              .filter(
                (v: any) =>
                  String(v.cveID || "").toLowerCase().includes(cleanQ.toLowerCase()) ||
                  String(v.vendorProject || "").toLowerCase().includes(cleanQ.toLowerCase()) ||
                  String(v.product || "").toLowerCase().includes(cleanQ.toLowerCase())
              )
              .slice(0, limit)
              .map((v: any) => ({
                cveID: v.cveID,
                vendorProject: v.vendorProject,
                product: v.product,
                dateAdded: v.dateAdded,
                shortDescription: String(v.shortDescription || "").slice(0, 180),
              }))
          : [];

      const osvVulns =
        osvRes.status === "fulfilled" && Array.isArray(osvRes.value?.vulns)
          ? osvRes.value.vulns.slice(0, limit).map((v: any) => ({
              id: v.id,
              summary: v.summary || v.details?.slice(0, 140),
              modified: v.modified,
            }))
          : [];

      return {
        sourceUrl: "https://api.osv.dev/v1/query",
        data: {
          query: cleanQ,
          cisaKevMatches: matchingKev,
          osvPackageAdvisories: osvVulns,
          feedsReferenceCount: 20,
        },
      };
    }
  }
}

export interface PublicApiQueryResult {
  ok: boolean;
  category: PublicApiCategory;
  sourceUrl: string;
  cached: boolean;
  offlineFallback: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Executes a No-Key public API call with TTL caching and graceful offline-first recovery.
 */
export async function queryPublicApiHub(params: {
  category: PublicApiCategory;
  query: string;
  base?: string;
  lang?: string;
  limit?: number;
  ttlMs?: number;
}): Promise<PublicApiQueryResult> {
  const ttlMs = params.ttlMs ?? 1000 * 60 * 15; // 15-minute default cache
  const cacheKey = `${params.category}:${(params.base || "").toLowerCase()}:${(params.lang || "en").toLowerCase()}:${params.query.trim().toLowerCase()}`;

  const freshHit = await readCacheEntry(cacheKey, false);
  if (freshHit) {
    return {
      ok: true,
      category: params.category,
      sourceUrl: freshHit.sourceUrl,
      cached: true,
      offlineFallback: false,
      data: JSON.parse(freshHit.payloadJson),
    };
  }

  try {
    const live = await executePublicQuery(params.category, params.query, {
      base: params.base,
      lang: params.lang,
      limit: params.limit,
    });
    await writeCacheEntry({
      cacheKey,
      category: params.category,
      sourceUrl: live.sourceUrl,
      payloadJson: JSON.stringify(live.data),
      fetchedAt: Date.now(),
      ttlMs,
    });
    return {
      ok: true,
      category: params.category,
      sourceUrl: live.sourceUrl,
      cached: false,
      offlineFallback: false,
      data: live.data,
    };
  } catch (err: any) {
    const staleHit = await readCacheEntry(cacheKey, true);
    if (staleHit) {
      return {
        ok: true,
        category: params.category,
        sourceUrl: staleHit.sourceUrl,
        cached: true,
        offlineFallback: true,
        data: JSON.parse(staleHit.payloadJson),
      };
    }
    return {
      ok: false,
      category: params.category,
      sourceUrl: "",
      cached: false,
      offlineFallback: false,
      error: err?.message || "Public API temporarily unreachable",
    };
  }
}

export const PUBLIC_APIS_CATALOG_COUNT = 34;
