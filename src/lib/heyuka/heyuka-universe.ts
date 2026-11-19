/**
 * HEYUKA Sovereign Intelligence Universe (Owned by KASPI) — v10.0 Canonical Catalog
 * Strictly isolated from KASPI POS deterministic cashier flows; imports cleanly
 * ONLY inside `apps/heyuka-desktop`, `packages/heyuka-os`, `src/app/[locale]/heyuka`,
 * and `arsenal-vault` metadata registries.
 */

export type HeyukaAccessoryType =
  | "royal_crown"
  | "royal_cape"
  | "grad_cap"
  | "round_glasses"
  | "diploma_scroll"
  | "rgb_headset"
  | "cyber_hoodie"
  | "pink_bow"
  | "princess_dress"
  | "backwards_cap"
  | "street_hoodie"
  | "pirate_hat"
  | "eyepatch"
  | "pirate_coat"
  | "sunglasses"
  | "biker_jacket"
  | "astro_helmet"
  | "astro_suit"
  | "hero_mask"
  | "hero_cape"
  | "hero_emblem"
  | "wizard_hat"
  | "wizard_cloak"
  | "magic_wand"
  | "glowing_star"
  | "winter_beanie"
  | "winter_scarf"
  | "console_cap"
  | "console_hoodie"
  | "cat_hoodie"
  | "hipster_beanie"
  | "bow_tie"
  | "mini_crown"
  | "rebel_cap"
  | "chef_toque"
  | "chef_coat"
  | "wooden_spoon"
  | "studio_headset"
  | "flower_crown"
  | "ninja_hood"
  | "ninja_mask"
  | "safari_hat"
  | "safari_goggles"
  | "celestial_wizard_hat"
  | "celestial_cloak"
  | "pink_headset"
  | "pink_hoodie"
  | "devil_horns"
  | "necktie_collar"
  | "crown_snapback"
  | "flame_crown"
  | "ice_crystal_crown"
  | "rock_armor";

export type HeyukaElementalVfx = "fire" | "ice" | "rock" | "sparkles" | "none";
export type HeyukaCharacterCategory =
  | "elemental"
  | "royalty_magic"
  | "tech_gamer"
  | "pro_adventure"
  | "street_cute";

export interface HeyukaCharacterProfile {
  id: string;
  name: string;
  category: HeyukaCharacterCategory;
  badge: string;
  furColor: string;
  tipColor: string;
  eyeColor: string;
  accessories: HeyukaAccessoryType[];
  vfxType: HeyukaElementalVfx;
  isFeatured?: boolean;
  tagline: string;
}

export interface HeyukaLightingPreset {
  id: string;
  name: string;
  subtitle: string;
  keyColor: string;
  rimColor: string;
  bgGradient: [string, string];
  glowColor: string;
}

export const HEYUKA_LIGHTING_PRESETS: readonly HeyukaLightingPreset[] = [
  {
    id: "studio",
    name: "Studio Softbox",
    subtitle: "Dark Cyclorama",
    keyColor: "#fff7ed",
    rimColor: "#c4b5fd",
    bgGradient: ["#090d16", "#111827"],
    glowColor: "rgba(196, 181, 253, 0.25)",
  },
  {
    id: "midnight",
    name: "Cyber Midnight",
    subtitle: "Neon Rim Studio",
    keyColor: "#38bdf8",
    rimColor: "#ec4899",
    bgGradient: ["#050811", "#11152c"],
    glowColor: "rgba(56, 189, 248, 0.28)",
  },
  {
    id: "sunset",
    name: "Warm Sunset",
    subtitle: "Twilight Horizon",
    keyColor: "#ffedd5",
    rimColor: "#fdba74",
    bgGradient: ["#18121e", "#2b192e"],
    glowColor: "rgba(253, 186, 116, 0.28)",
  },
  {
    id: "meadow",
    name: "Cloud Sky",
    subtitle: "Blue Sky & Mist",
    keyColor: "#fffbeb",
    rimColor: "#e0f2fe",
    bgGradient: ["#0c1626", "#162944"],
    glowColor: "rgba(147, 197, 253, 0.25)",
  },
  {
    id: "highrise",
    name: "Cozy Desk",
    subtitle: "Warm Study Lamp",
    keyColor: "#ffedd5",
    rimColor: "#f59e0b",
    bgGradient: ["#18121e", "#291d14"],
    glowColor: "rgba(245, 158, 11, 0.25)",
  },
];

export const HEYUKA_CHARACTER_PROFILES: readonly HeyukaCharacterProfile[] = [
  {
    id: "classic_heyuka",
    name: "Classic HEYUKA (Mochi-Puff)",
    category: "street_cute",
    badge: "Origin Companion",
    isFeatured: true,
    furColor: "#e0ecfa",
    tipColor: "#ffffff",
    eyeColor: "#2b388f",
    accessories: [],
    vfxType: "none",
    tagline: "Sentient cloud-soft KASPI companion with 60 FPS Marschner fur physics.",
  },
  {
    id: "fire_elemental",
    name: "Ignis · Fire Elemental",
    category: "elemental",
    badge: "Pyro Titan",
    isFeatured: true,
    furColor: "#ff3d00",
    tipColor: "#ffb700",
    eyeColor: "#ff8800",
    accessories: ["flame_crown"],
    vfxType: "fire",
    tagline: "Dynamic simplex flame shaders & flickering ember core.",
  },
  {
    id: "ice_elemental",
    name: "Glacies · Ice Elemental",
    category: "elemental",
    badge: "Cryo Titan",
    isFeatured: true,
    furColor: "#72e5ff",
    tipColor: "#ffffff",
    eyeColor: "#00a8e8",
    accessories: ["ice_crystal_crown"],
    vfxType: "ice",
    tagline: "Crystalline frost crown & razor-sharp analytic clarity.",
  },
  {
    id: "rock_elemental",
    name: "Terra · Rock Elemental",
    category: "elemental",
    badge: "Geo Titan",
    isFeatured: true,
    furColor: "#5c5346",
    tipColor: "#8ba85e",
    eyeColor: "#1f4d3a",
    accessories: ["rock_armor"],
    vfxType: "rock",
    tagline: "Granite armor & procedural moss resilience.",
  },
  {
    id: "starlight_wizard",
    name: "Arcane Starlight Wizard",
    category: "royalty_magic",
    badge: "Archmage",
    furColor: "#f3e5f5",
    tipColor: "#ffffff",
    eyeColor: "#5e35b1",
    accessories: ["wizard_hat", "wizard_cloak", "magic_wand", "glowing_star"],
    vfxType: "sparkles",
    tagline: "Weaves constellation spells into deep architecture.",
  },
  {
    id: "celestial_wizard",
    name: "Celestial Grand Wizard",
    category: "royalty_magic",
    badge: "Astral Mage",
    furColor: "#9b6bff",
    tipColor: "#d0b8ff",
    eyeColor: "#1d4ed8",
    accessories: ["celestial_wizard_hat", "celestial_cloak", "magic_wand", "glowing_star"],
    vfxType: "sparkles",
    tagline: "Clad in midnight star robes for orbital research.",
  },
  {
    id: "superhero",
    name: "Super Mochi Hero",
    category: "royalty_magic",
    badge: "Defender",
    furColor: "#f4f7fc",
    tipColor: "#ffffff",
    eyeColor: "#185adb",
    accessories: ["hero_mask", "hero_cape", "hero_emblem"],
    vfxType: "none",
    tagline: "Fearless defender squashing bugs across the OS.",
  },
  {
    id: "royal_king",
    name: "His Majesty King Mochi",
    category: "royalty_magic",
    badge: "Sovereign",
    furColor: "#f5f7fc",
    tipColor: "#ffffff",
    eyeColor: "#3b4bc8",
    accessories: ["royal_crown", "royal_cape"],
    vfxType: "sparkles",
    tagline: "Regal commander of the KASPI × HEYUKA Royal Fleet.",
  },
  {
    id: "golden_prince",
    name: "Golden Crown Prince",
    category: "royalty_magic",
    badge: "Sun Royalty",
    furColor: "#ffd426",
    tipColor: "#fff08a",
    eyeColor: "#3b220c",
    accessories: ["mini_crown"],
    vfxType: "sparkles",
    tagline: "Radiant solar optimism for every creative project.",
  },
  {
    id: "sakura_princess",
    name: "Sakura Ribbon Princess",
    category: "royalty_magic",
    badge: "Royal Cute",
    furColor: "#ff85b3",
    tipColor: "#ffc2d9",
    eyeColor: "#8c2d8c",
    accessories: ["pink_bow", "princess_dress"],
    vfxType: "sparkles",
    tagline: "Graceful pastel companion with shimmering kindness.",
  },
  {
    id: "flower_crown",
    name: "Flora Meadow Nymph",
    category: "royalty_magic",
    badge: "Botanical Spirit",
    furColor: "#b497f7",
    tipColor: "#dcd0ff",
    eyeColor: "#382078",
    accessories: ["flower_crown"],
    vfxType: "sparkles",
    tagline: "Tranquil nature wisdom and balanced design flow.",
  },
  {
    id: "shadow_imp",
    name: "Little Obsidian Imp",
    category: "royalty_magic",
    badge: "Chaos Imp",
    furColor: "#1e1c24",
    tipColor: "#3c364a",
    eyeColor: "#e6192e",
    accessories: ["devil_horns"],
    vfxType: "fire",
    tagline: "Mischievously fast terminal & automation sprint specialist.",
  },
  {
    id: "astronaut",
    name: "Astro Explorer Mochi",
    category: "pro_adventure",
    badge: "Orbital EVA",
    furColor: "#e4ecf8",
    tipColor: "#ffffff",
    eyeColor: "#1b62d6",
    accessories: ["astro_helmet", "astro_suit"],
    vfxType: "sparkles",
    tagline: "100 Cosmic Zero-Key telemetry explorer.",
  },
  {
    id: "pirate_captain",
    name: "Captain Blackbeard Mochi",
    category: "pro_adventure",
    badge: "High Seas",
    furColor: "#f2e6dc",
    tipColor: "#fff8f2",
    eyeColor: "#1e5aa8",
    accessories: ["pirate_hat", "eyepatch", "pirate_coat"],
    vfxType: "none",
    tagline: "Charting maritime & Nador port telemetry cleanly.",
  },
  {
    id: "master_chef",
    name: "Chef Patissier Mochi",
    category: "pro_adventure",
    badge: "5-Star Chef",
    furColor: "#f4f6fa",
    tipColor: "#ffffff",
    eyeColor: "#1f3c88",
    accessories: ["chef_toque", "chef_coat", "wooden_spoon"],
    vfxType: "none",
    tagline: "Crafts Michelin-grade structured reports & pipelines.",
  },
  {
    id: "safari_explorer",
    name: "Jungle Safari Ranger",
    category: "pro_adventure",
    badge: "Pathfinder",
    furColor: "#3ad4b8",
    tipColor: "#88f7e2",
    eyeColor: "#0c4a42",
    accessories: ["safari_hat", "safari_goggles"],
    vfxType: "none",
    tagline: "Tracks live public APIs & hidden open-source gems.",
  },
  {
    id: "shadow_ninja",
    name: "Shinobi Ghost Ninja",
    category: "pro_adventure",
    badge: "Stealth Ops",
    furColor: "#5e6168",
    tipColor: "#a4a9b3",
    eyeColor: "#9e1b1b",
    accessories: ["ninja_hood", "ninja_mask"],
    vfxType: "none",
    tagline: "Ghost Cursor OS execution & 20 cyber-defense feeds.",
  },
  {
    id: "scholar_grad",
    name: "Valedictorian Scholar",
    category: "pro_adventure",
    badge: "PhD Laureate",
    furColor: "#8b6be8",
    tipColor: "#bba3ff",
    eyeColor: "#3a4ed8",
    accessories: ["grad_cap", "round_glasses", "diploma_scroll"],
    vfxType: "none",
    tagline: "OpenAlex, PubMed & arXiv academic synthesis.",
  },
  {
    id: "dapper_professor",
    name: "Professor Bowtie Blue",
    category: "pro_adventure",
    badge: "Senior Fellow",
    furColor: "#4aa8ff",
    tipColor: "#94ceff",
    eyeColor: "#102a5c",
    accessories: ["round_glasses", "bow_tie"],
    vfxType: "none",
    tagline: "Turns dense specs into clear engineering diagrams.",
  },
  {
    id: "sky_scholar",
    name: "Executive Analyst Mochi",
    category: "pro_adventure",
    badge: "Tech Lead",
    furColor: "#7cc8ff",
    tipColor: "#bce4ff",
    eyeColor: "#153e75",
    accessories: ["round_glasses", "necktie_collar"],
    vfxType: "none",
    tagline: "DAG master planner & exact Dinero finance audit.",
  },
  {
    id: "cyber_gamer",
    name: "Cyber Neon Streamer",
    category: "tech_gamer",
    badge: "Pro Esports",
    isFeatured: true,
    furColor: "#dfe5f2",
    tipColor: "#f8faff",
    eyeColor: "#0095ff",
    accessories: ["rgb_headset", "cyber_hoodie"],
    vfxType: "sparkles",
    tagline: "60 FPS WebGL2 shaders & zero-latency workflow.",
  },
  {
    id: "console_gamer",
    name: "Pro Console Champion",
    category: "tech_gamer",
    badge: "Speedrunner",
    furColor: "#eef2f8",
    tipColor: "#ffffff",
    eyeColor: "#3442a6",
    accessories: ["console_cap", "console_hoodie"],
    vfxType: "none",
    tagline: "Phaser 3 & rapid prototyping speedrunner.",
  },
  {
    id: "kawaii_streamer",
    name: "Kawaii Pink Streamer",
    category: "tech_gamer",
    badge: "Idol VTuber",
    furColor: "#ff7eb6",
    tipColor: "#ffbad8",
    eyeColor: "#4a154b",
    accessories: ["pink_headset", "pink_hoodie"],
    vfxType: "sparkles",
    tagline: "Multilingual voice companion & TTS charisma.",
  },
  {
    id: "studio_dj",
    name: "Vinyl Studio Producer",
    category: "tech_gamer",
    badge: "Audio Master",
    furColor: "#f2f0eb",
    tipColor: "#ffffff",
    eyeColor: "#224099",
    accessories: ["studio_headset"],
    vfxType: "none",
    tagline: "Demucs stem splitter, Faster-Whisper & 16kHz PCM audio.",
  },
  {
    id: "biker_rockstar",
    name: "Golden Biker Rockstar",
    category: "street_cute",
    badge: "Maverick",
    furColor: "#ffcc1c",
    tipColor: "#ffe875",
    eyeColor: "#5c3808",
    accessories: ["sunglasses", "biker_jacket"],
    vfxType: "none",
    tagline: "Bold, fearless Adobe Premiere & Blender automation.",
  },
  {
    id: "street_skater",
    name: "Neon Lime Skater",
    category: "street_cute",
    badge: "Streetwear",
    furColor: "#7ae838",
    tipColor: "#b2ff78",
    eyeColor: "#0c6b58",
    accessories: ["backwards_cap", "street_hoodie"],
    vfxType: "none",
    tagline: "Fresh social crops & rapid creative effects.",
  },
  {
    id: "arctic_beanie",
    name: "Alpine Winter Explorer",
    category: "street_cute",
    badge: "Cozy Frost",
    furColor: "#72e8e2",
    tipColor: "#b5faf6",
    eyeColor: "#0d5c75",
    accessories: ["winter_beanie", "winter_scarf"],
    vfxType: "ice",
    tagline: "Calm background observer in Cozy Desk mode.",
  },
  {
    id: "neko_hoodie",
    name: "Sunny Neko Hoodie",
    category: "street_cute",
    badge: "Cozy Cat",
    furColor: "#fae6d8",
    tipColor: "#fff5ed",
    eyeColor: "#593424",
    accessories: ["cat_hoodie"],
    vfxType: "none",
    tagline: "Friendly Moroccan Darija, Tarifit & French helper.",
  },
  {
    id: "lime_beanie",
    name: "Moss Beanie Indie",
    category: "street_cute",
    badge: "Indie Creative",
    furColor: "#7ed928",
    tipColor: "#adfa5a",
    eyeColor: "#1c4214",
    accessories: ["hipster_beanie"],
    vfxType: "none",
    tagline: "7 Logo Archetypes & SVG minimalist artisan.",
  },
  {
    id: "crimson_rebel",
    name: "Crimson Street Rebel",
    category: "street_cute",
    badge: "Hype Striker",
    furColor: "#e62229",
    tipColor: "#ff6369",
    eyeColor: "#2b090c",
    accessories: ["rebel_cap", "biker_jacket"],
    vfxType: "fire",
    tagline: "High-speed TripoSR 3D & Video Person Eraser.",
  },
  {
    id: "lavender_bow",
    name: "Orchid Sweetheart",
    category: "street_cute",
    badge: "Pastel Dream",
    furColor: "#a882f5",
    tipColor: "#d4beff",
    eyeColor: "#382485",
    accessories: ["pink_bow"],
    vfxType: "sparkles",
    tagline: "Pastel polish & smooth AutoAnimate UI flow.",
  },
  {
    id: "hype_orange",
    name: "Tangerine Hype King",
    category: "street_cute",
    badge: "VIP Drip",
    furColor: "#ff7714",
    tipColor: "#ffb066",
    eyeColor: "#361808",
    accessories: ["crown_snapback", "sunglasses", "cyber_hoodie"],
    vfxType: "none",
    tagline: "Executive VIP controller for KASPI × HEYUKA OS.",
  },
];

export const HEYUKA_CYBER_DEFENSE_FEEDS = [
  { id: "cisa-kev", name: "CISA Known Exploited Vulnerabilities (KEV)", url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", category: "kev" },
  { id: "nist-nvd", name: "NIST NVD 2.0 CVE API", url: "https://services.nvd.nist.gov/rest/json/cves/2.0", category: "cve" },
  { id: "osv-dev", name: "Google OSV.dev Open Source Vulnerabilities", url: "https://api.osv.dev/v1/query", category: "supply_chain" },
  { id: "first-epss", name: "FIRST.org EPSS Exploit Prediction", url: "https://api.first.org/data/v1/epss", category: "scoring" },
  { id: "sans-isc", name: "SANS Internet Storm Center DShield", url: "https://isc.sans.edu/api/", category: "threat_intel" },
  { id: "urlhaus", name: "Abuse.ch URLhaus Malicious URLs", url: "https://urlhaus-api.abuse.ch/v1/", category: "malware" },
  { id: "threatfox", name: "Abuse.ch ThreatFox IOCs", url: "https://threatfox-api.abuse.ch/api/v1/", category: "ioc" },
  { id: "feodo-tracker", name: "Abuse.ch Feodo Botnet Tracker", url: "https://feodotracker.abuse.ch/downloads/ipblocklist.json", category: "botnet" },
  { id: "malwarebazaar", name: "Abuse.ch MalwareBazaar Hash API", url: "https://mb-api.abuse.ch/api/v1/", category: "hashes" },
  { id: "crt-sh", name: "crt.sh Certificate Transparency Logs", url: "https://crt.sh/", category: "tls_certs" },
  { id: "cloudflare-sec-doh", name: "Cloudflare 1.1.1.2 Malware-Blocking DoH", url: "https://security.cloudflare-dns.com/dns-query", category: "dns" },
  { id: "quad9-doh", name: "Quad9 Threat-Blocking DoH", url: "https://dns.quad9.net:5053/dns-query", category: "dns" },
  { id: "phishstats", name: "PhishStats Public Phishing Feed", url: "https://phishstats.info:2096/api/phishing", category: "phishing" },
  { id: "openphish", name: "OpenPhish Community Feed", url: "https://openphish.com/feed.txt", category: "phishing" },
  { id: "circl-cve", name: "CIRCL CVE Search JSON", url: "https://cve.circl.lu/api/last", category: "cve" },
  { id: "bgpview", name: "BGPView ASN & Prefix Telemetry", url: "https://api.bgpview.io/", category: "network" },
  { id: "iana-rdap", name: "IANA RDAP Domain & IP Bootstrap", url: "https://rdap.org/", category: "whois" },
  { id: "cymru-asn", name: "Team Cymru Bogon & ASN Lists", url: "https://www.team-cymru.org/", category: "network" },
  { id: "mitre-attack", name: "MITRE ATT&CK STIX Enterprise JSON", url: "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json", category: "tactics" },
  { id: "github-advisories", name: "GitHub Advisory Database (Public)", url: "https://api.github.com/advisories", category: "advisories" },
] as const;

export const HEYUKA_CLOUD_FLEET_GATEWAYS = [
  { id: "piston-polyglot-sandbox", name: "HEYUKA Polyglot Sandbox (Piston)", mode: "ZERO_KEY_REST", endpoint: "https://emkc.org/api/v2/piston/execute" },
  { id: "jina-web-reader", name: "HEYUKA Serverless Web Reader (Jina)", mode: "ZERO_KEY_REST", endpoint: "https://r.jina.ai/" },
  { id: "pollinations-flux-engine", name: "HEYUKA Flux & OpenAI Compute Mesh", mode: "ZERO_KEY_REST", endpoint: "https://image.pollinations.ai/prompt" },
  { id: "cisa-osv-security-mesh", name: "HEYUKA DEFCON-1 Cyber Mesh (CISA/NVD/OSV)", mode: "ZERO_KEY_REST", endpoint: "https://api.osv.dev/v1/query" },
  { id: "cloudflare-edge-doh", name: "HEYUKA Edge & Public Security DoH", mode: "ZERO_KEY_REST", endpoint: "https://security.cloudflare-dns.com/dns-query" },
  { id: "duckduckgo-instant-search", name: "HEYUKA Meta-Search & Instant Facts", mode: "ZERO_KEY_REST", endpoint: "https://api.duckduckgo.com/" },
  { id: "polyhaven-3d-catalog", name: "HEYUKA 8K PBR & 3D Asset Mesh", mode: "ZERO_KEY_REST", endpoint: "https://api.polyhaven.com/assets" },
  { id: "frankfurter-fx-rates", name: "HEYUKA Live ECB Currency & Ledger Mesh", mode: "ZERO_KEY_REST", endpoint: "https://api.frankfurter.app/latest" },
  { id: "ntfy-zero-key-pubsub", name: "HEYUKA Instant Pub/Sub Push Alerts", mode: "ZERO_KEY_REST", endpoint: "https://ntfy.sh" },
  { id: "ai-horde-volunteer-gpu", name: "HEYUKA Distributed Volunteer Image Cluster", mode: "ZERO_KEY_REST", endpoint: "https://aihorde.net/api/v2/" },
  { id: "local-ollama-compute", name: "HEYUKA Local CPU/GPU Inference Cell", mode: "LOCAL_NODE", endpoint: "http://127.0.0.1:11434" },
  { id: "local-triposr-chromadb", name: "HEYUKA TripoSR 3D & ChromaDB Vector Node", mode: "LOCAL_NODE", endpoint: "http://127.0.0.1:8188" },
] as const;

export const HEYUKA_COSMIC_DOMAINS = [
  { domain: "AI, Compute & Visual Media", count: 15, highlights: ["Pollinations OpenAI/Flux", "AI Horde", "Kroki", "QuickChart", "SVG APIs", "PolyHaven"] },
  { domain: "Encyclopedias & Science Research", count: 15, highlights: ["Wikipedia/Wikidata", "OpenAlex", "arXiv", "PubMed", "Crossref", "NASA DEMO"] },
  { domain: "Package Registries & Code", count: 15, highlights: ["Piston", "Judge0 CE", "NPM Registry", "PyPI", "Crates.io", "GitHub/Codeberg Public"] },
  { domain: "Finance, Crypto & Global Economy", count: 15, highlights: ["Frankfurter ECB", "Exchange API", "CoinGecko", "World Bank", "IMF", "SEC EDGAR"] },
  { domain: "Earth, Weather, Quakes, Space & Maps", count: 15, highlights: ["Open-Meteo", "Open-Meteo Marine (Nador)", "Nominatim", "Overpass", "USGS Quakes", "Transitland"] },
  { domain: "Developer Utilities & Networking", count: 15, highlights: ["Jina Reader", "DuckDuckGo", "RDAP", "Cloudflare DoH", "BGPView", "ntfy.sh"] },
  { domain: "Health, Chemistry & Culture Museums", count: 10, highlights: ["OpenFDA", "PubChem", "AlphaFold", "Met Museum", "Openverse", "OpenFoodFacts"] },
] as const;

export const HEYUKA_ARCHITECTURAL_STACK = {
  brand: "HEYUKA",
  ownerCompany: "KASPI",
  graphicsEngine: {
    fps: 60,
    gpuPipeline: "64 Shells + 60,000 Instanced Strands + 128x128 Ping-Pong Verlet GPGPU (16,384 Patches)",
    webglFallback: "32 Shells + 26,000 Strands + Analytic Inertia (zero RTT cost)",
    shading: "Marschner Hair Shading (Base/Tip Gradient, Sheen, Rim Light, Env Tint) + SSAO + UnrealBloom + Bokeh",
    visionLoop: "16x16 256-bit dHash perceptual delta inspection (<2ms)",
  },
  fiveTierHybridMemory: [
    "Tier 1: Browser Immediate State (localStorage presets, 60 chat turns, 40 studio projects, IndexedDB Dexie cache)",
    "Tier 2: Semantic & Fuzzy Local Search (@orama/orama + Fuse.js + 128-dim Cosine Similarity + SemHash + FSRS)",
    "Tier 3: Python Local RAG (ChromaDB persistent vector store for Desktop Companion)",
    "Tier 4: Opt-In Cloud Sync (KASPI Tenant Cloud / Supabase / Firebase Firestore mirror)",
    "Tier 5: Sovereign Encrypted Vault (AES-256-GCM + scrypt credential isolation)",
  ],
  osAutomationBridge: {
    shell: "Electron / Tauri Native Frameless Companion + Core Sandbox Escape",
    pythonControl: "PyAutoGUI + PyWinAuto + UIAutomation + Ghost Cursor overlay (24 Destructive Tools gate)",
    audioPipeline: "Web Speech API + Procedural WebAudio Synth + 16kHz PCM system loopback",
    media3dServers: "Local TripoSR (:8188) + Hunyuan 3D bridge + Adobe UXP/JSX + Blender-MCP (223 tools)",
  },
} as const;
