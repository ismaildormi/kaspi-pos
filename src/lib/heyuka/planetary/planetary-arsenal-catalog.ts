/**
 * HEYUKA / YUKA — Planetary Scale, Shield, Multi-OS & First-Shot Arsenal (`v15.3` – `v19.0`)
 *
 * Strictly deduplicated zero-key registry combining:
 * - v15.3: Multi-OS Build & WASM/Cloud Media Fallbacks (cargo-xwin, tauri-action, @ffmpeg/ffmpeg, Mediabunny, Manifold-3D, gltf-transform)
 * - v15.4: 10-Layer Serverless & Browser Shield (unstorage /tmp, fflate, p-retry, file-type magic bytes, ErrorBoundary)
 * - v16.0: Planetary Edge & 1,100-Language Scale (Hono, Turso/libSQL, SeamlessM4T/MMS, GeoLite2, Altcha, Unkey)
 * - v17.0: 100 Hyperscale Edge, Polyglot, Multi-Tenant B2B & Observability/Resilience tools
 * - v18.0: 100 Zero-Downtime Geo-Routing, Cultural Localization/Accessibility, Enterprise Commerce & 24/7 Cloud tools
 * - v19.0: 25 First-Shot Accuracy, Anti-Garbage Data & Formal Verification engines
 */

export type PlanetaryPackVersion = "v15.3" | "v15.4" | "v16.0" | "v17.0" | "v18.0" | "v19.0";

export type PlanetaryPackGroup =
  | "multi_os_wasm_fallbacks"
  | "serverless_production_shield"
  | "hyperscale_edge_queues"
  | "polyglot_accessibility"
  | "b2b_enterprise_isolation"
  | "zero_downtime_observability"
  | "first_shot_formal_data";

export interface PlanetaryArsenalEntry {
  id: string;
  name: string;
  version: PlanetaryPackVersion;
  group: PlanetaryPackGroup;
  sourceUrl: string;
  summary: string;
}

type CompactRow = [id: string, name: string, version: PlanetaryPackVersion, group: PlanetaryPackGroup, url: string, summary: string];

const RAW_ROWS: readonly CompactRow[] = [
  // v15.3 & v15.4 & v16.0 Foundations
  ["cargo-xwin", "cargo-xwin", "v15.3", "multi_os_wasm_fallbacks", "https://github.com/rust-cross/cargo-xwin", "Cross-compile and verify Windows MSVC Rust/Tauri targets cleanly inside Linux/WSL."],
  ["tauri-action", "tauri-apps/tauri-action", "v15.3", "multi_os_wasm_fallbacks", "https://github.com/tauri-apps/tauri-action", "Automated GitHub Actions matrix compiling .exe/.msi, .dmg, and .AppImage releases."],
  ["ffmpeg-wasm", "@ffmpeg/ffmpeg Single-Thread", "v15.3", "multi_os_wasm_fallbacks", "https://github.com/ffmpegwasm/ffmpeg.wasm", "Client-side audio/video transcode without COOP/COEP image blocking or server bloat."],
  ["mediabunny-webcodecs", "Mediabunny WebCodecs", "v15.3", "multi_os_wasm_fallbacks", "https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API", "Zero-cost in-browser hardware-accelerated media muxing and frame processing."],
  ["manifold-3d-wasm", "Manifold-3D + @gltf-transform/core", "v15.3", "multi_os_wasm_fallbacks", "https://github.com/elalish/manifold", "Watertight binary .glb 3D mesh generation and verification directly in JS/WASM."],
  ["uvr5-onnx-webgpu", "UVR5 / MDX-Net ONNX WebGPU", "v15.3", "multi_os_wasm_fallbacks", "https://github.com/Anjok07/ultimatevocalremovergui", "Browser WebGPU ONNX vocal/stem isolation fallback without local GPU servers."],
  ["unstorage-tmp", "unjs/unstorage (/tmp Ephemeral)", "v15.4", "serverless_production_shield", "https://github.com/unjs/unstorage", "ROFS-safe OS /tmp storage + IndexedDB persistence layer for Vercel Serverless."],
  ["fflate-compression", "101arrowz/fflate", "v15.4", "serverless_production_shield", "https://github.com/101arrowz/fflate", "High-speed client/server deflate & zip compression preventing 413 payload limits."],
  ["p-retry-circuit", "sindresorhus/p-retry", "v15.4", "serverless_production_shield", "https://github.com/sindresorhus/p-retry", "Exponential retry and multi-tier failover across unreliable public APIs."],
  ["file-type-magic", "sindresorhus/file-type Magic Validator", "v15.4", "serverless_production_shield", "https://github.com/sindresorhus/file-type", "Magic-byte integrity gate preventing 0-byte or corrupted PDF/GLB/ZIP/Media outputs."],
  ["react-error-boundary", "bvaughn/react-error-boundary", "v15.4", "serverless_production_shield", "https://github.com/bvaughn/react-error-boundary", "Component-level error isolation preventing full-page crashes across YUKA modules."],
  ["hono-edge", "honojs/hono Edge Router", "v16.0", "hyperscale_edge_queues", "https://github.com/honojs/hono", "Ultra-light Web Standards Edge routing pattern for <15ms global API responses."],
  ["turso-libsql", "Turso (libSQL Edge Replicas)", "v16.0", "hyperscale_edge_queues", "https://github.com/tursodatabase/libsql", "Edge-replicated SQLite syncing lightweight local deltas globally."],
  ["seamless-m4t", "Meta SeamlessM4T v2 / MMS", "v16.0", "polyglot_accessibility", "https://github.com/facebookresearch/seamless_communication", "Speech & text understanding across 1,100+ global languages and regional dialects."],
  ["geolite2-mmdb", "MaxMind GeoLite2 Open MMDB", "v16.0", "polyglot_accessibility", "https://github.com/P3TERX/GeoLite.mmdb", "Zero-key country, currency, timezone & regional adaptation lookup."],
  ["altcha-pow", "altcha-org/altcha PoW Shield", "v16.0", "zero_downtime_observability", "https://github.com/altcha-org/altcha", "Open-source SHA-256 Proof-of-Work anti-spam shield requiring zero third-party captchas."],
  ["yjs-crdt", "Yjs Local-First CRDT Sync", "v16.0", "hyperscale_edge_queues", "https://github.com/yjs/yjs", "Conflict-free replicated data types for zero-latency offline workspace state sync."],

  // v17.0 Batch 1 — Hyperscale Edge, Caches, DB Sharding & Queues (25)
  ["pingora", "Cloudflare Pingora", "v17.0", "hyperscale_edge_queues", "https://github.com/cloudflare/pingora", "Memory-safe Rust HTTP proxy scaling beyond 40M req/sec."],
  ["envoy-proxy", "Envoy Proxy", "v17.0", "hyperscale_edge_queues", "https://github.com/envoyproxy/envoy", "L7 distributed edge proxy and global traffic router."],
  ["haproxy", "HAProxy", "v17.0", "hyperscale_edge_queues", "https://github.com/haproxy/haproxy", "Ultra-low-latency TCP/HTTP load balancer for planetary traffic bursts."],
  ["valkey", "Valkey (Linux Foundation)", "v17.0", "hyperscale_edge_queues", "https://github.com/valkey-io/valkey", "Open in-memory key-value store caching millions of concurrent sessions."],
  ["dragonflydb", "DragonflyDB", "v17.0", "hyperscale_edge_queues", "https://github.com/dragonflydb/dragonfly", "Multi-threaded shared-nothing in-memory datastore."],
  ["keydb", "KeyDB", "v17.0", "hyperscale_edge_queues", "https://github.com/Snapchat/KeyDB", "High-throughput multithreaded Redis-compatible cache."],
  ["clickhouse", "ClickHouse", "v17.0", "hyperscale_edge_queues", "https://github.com/ClickHouse/ClickHouse", "Columnar OLAP analytics engine aggregating billions of telemetry events."],
  ["vitess", "Vitess", "v17.0", "hyperscale_edge_queues", "https://github.com/vitessio/vitess", "Horizontal MySQL clustering and sharding architecture."],
  ["citus", "Citus (PostgreSQL)", "v17.0", "hyperscale_edge_queues", "https://github.com/citusdata/citus", "Distributed PostgreSQL horizontal tenant sharding extension."],
  ["scylladb", "ScyllaDB", "v17.0", "hyperscale_edge_queues", "https://github.com/scylladb/scylladb", "Low-latency C++ shard-per-core wide-column datastore."],
  ["apache-pulsar", "Apache Pulsar", "v17.0", "hyperscale_edge_queues", "https://github.com/apache/pulsar", "Cloud-native multi-tenant pub/sub event streaming backbone."],
  ["centrifugo", "Centrifugo", "v17.0", "hyperscale_edge_queues", "https://github.com/centrifugal/centrifugo", "Scalable real-time WebSocket / SSE fanout server."],
  ["uwebsockets", "uWebSockets.js", "v17.0", "hyperscale_edge_queues", "https://github.com/uNetworking/uWebSockets.js", "High-efficiency C++/JS WebSocket streaming runtime."],
  ["krakend", "KrakenD API Gateway", "v17.0", "hyperscale_edge_queues", "https://github.com/krakend/krakend-ce", "Stateless high-concurrency API aggregator."],
  ["apache-apisix", "Apache APISIX", "v17.0", "hyperscale_edge_queues", "https://github.com/apache/apisix", "Dynamic cloud-native API gateway with real-time key & rate rules."],
  ["varnish-cache", "Varnish Cache", "v17.0", "hyperscale_edge_queues", "https://github.com/varnishcache/varnish-cache", "Sub-millisecond HTTP reverse caching accelerator."],
  ["frankenphp", "Caddy / FrankenPHP", "v17.0", "hyperscale_edge_queues", "https://github.com/dunglas/frankenphp", "Modern Auto-HTTPS application server & edge worker."],
  ["partytown", "Partytown", "v17.0", "hyperscale_edge_queues", "https://github.com/QwikDev/partytown", "Offload intensive third-party scripts into Web Workers off main thread."],
  ["comlink", "Google Comlink", "v17.0", "hyperscale_edge_queues", "https://github.com/GoogleChromeLabs/comlink", "Ergonomic zero-boilerplate RPC bridge for browser Web Workers."],
  ["workbox", "Google Workbox", "v17.0", "hyperscale_edge_queues", "https://github.com/GoogleChrome/workbox", "Offline-first PWA Service Worker precaching & background sync toolkit."],
  ["zstd-compression", "Zstd / Brotli Compression", "v17.0", "hyperscale_edge_queues", "https://github.com/facebook/zstd", "Fast real-time payload compression cutting global bandwidth up to 80%."],
  ["temporalio", "Temporal.io", "v17.0", "hyperscale_edge_queues", "https://github.com/temporalio/temporal", "Durable execution workflow engine surviving network and worker restarts."],
  ["inngest-oss", "Inngest OSS", "v17.0", "hyperscale_edge_queues", "https://github.com/inngest/inngest", "Event-driven durable step queue without queue bottlenecks."],
  ["litestream", "Litestream", "v17.0", "hyperscale_edge_queues", "https://github.com/benbjohnson/litestream", "Continuous asynchronous WAL replication for SQLite databases."],
  ["rqlite", "rqlite", "v17.0", "hyperscale_edge_queues", "https://github.com/rqlite/rqlite", "Raft-replicated distributed relational database built on SQLite."],

  // v17.0 Batch 2 — Global Polyglot, Dialects & Anti-Confusion (25)
  ["flores-200", "FLORES-200 (Meta)", "v17.0", "polyglot_accessibility", "https://github.com/facebookresearch/flores", "Multi-way translation benchmark covering 200+ global languages and scripts."],
  ["opus-mt", "OPUS-MT (Helsinki-NLP)", "v17.0", "polyglot_accessibility", "https://github.com/Helsinki-NLP/Opus-MT", "1,000+ compact open translation models across language pairs."],
  ["tatoeba", "Tatoeba Multilingual Corpus", "v17.0", "polyglot_accessibility", "https://tatoeba.org/en/downloads", "Community-verified parallel sentences across hundreds of living languages."],
  ["glotlid", "GlotLID / Glot500", "v17.0", "polyglot_accessibility", "https://github.com/cisnlp/GlotLID", "Rapid sub-millisecond language & script identification across 500+ varieties."],
  ["fasttext-lid", "fastText Language ID", "v17.0", "polyglot_accessibility", "https://github.com/facebookresearch/fastText", "0.05ms compact text classification and anti-confusion language routing."],
  ["unicode-cldr", "Unicode CLDR", "v17.0", "polyglot_accessibility", "https://github.com/unicode-org/cldr", "Authoritative locale formatting for currencies, dates, plurals, and calendars."],
  ["unicode-icu", "Unicode ICU", "v17.0", "polyglot_accessibility", "https://github.com/unicode-org/icu", "C++/JS internationalization engine for collation, casing, and BiDi layout."],
  ["formatjs", "FormatJS / Intl.MessageFormat", "v17.0", "polyglot_accessibility", "https://github.com/formatjs/formatjs", "Strict pluralization and gender-aware runtime message formatting."],
  ["i18next", "i18next + Locize OSS", "v17.0", "polyglot_accessibility", "https://github.com/i18next/i18next", "Zero-reload runtime locale switching framework."],
  ["tolgee", "Tolgee Open Localization", "v17.0", "polyglot_accessibility", "https://github.com/tolgee/tolgee-platform", "Interactive open-source localization platform."],
  ["weblate", "Weblate", "v17.0", "polyglot_accessibility", "https://github.com/WeblateOrg/weblate", "Continuous git-backed translation workflow across 400+ locales."],
  ["madar-dialects", "MADAR Arabic Dialects Corpus", "v17.0", "polyglot_accessibility", "https://github.com/camel-lab/MADAR", "Parallel corpus spanning 25 Arabic city dialects including Maghrebi/Darija."],
  ["qadi-arabic", "QADI Dialect Identifier", "v17.0", "polyglot_accessibility", "https://github.com/qcri/QADI", "Country-level Arabic dialect classification dataset."],
  ["arabench", "AraBench", "v17.0", "polyglot_accessibility", "https://github.com/qcri/AraBench", "Dialectal Arabic evaluation suite across Moroccan, Levantine & Gulf varieties."],
  ["masakhane", "Masakhane African NLP", "v17.0", "polyglot_accessibility", "https://github.com/masakhane-io", "Open African language translation and NER research community."],
  ["ai4bharat", "IndicNLP / AI4Bharat IndicTrans2", "v17.0", "polyglot_accessibility", "https://github.com/AI4Bharat/IndicTrans2", "High-accuracy open models across 22 scheduled Indian languages."],
  ["europarl", "Europarl Parallel Corpus", "v17.0", "polyglot_accessibility", "https://www.statmt.org/europarl/", "Official legal and commercial transcripts in 24 European languages."],
  ["opensubtitles", "OpenSubtitles Multilingual", "v17.0", "polyglot_accessibility", "https://opus.nlpl.eu/OpenSubtitles", "Everyday conversational phrasing across 60+ spoken languages."],
  ["common-voice", "Mozilla Common Voice", "v17.0", "polyglot_accessibility", "https://commonvoice.mozilla.org/", "Open multilingual community voice dataset covering 120+ languages."],
  ["google-fleurs", "Google FLEURS Speech", "v17.0", "polyglot_accessibility", "https://huggingface.co/datasets/google/fleurs", "Few-shot speech recognition benchmark across 102 languages."],
  ["espeak-ng", "eSpeak-NG + Gruut", "v17.0", "polyglot_accessibility", "https://github.com/espeak-ng/espeak-ng", "Zero-RAM compact multilingual text-to-phoneme synthesizer."],
  ["uroman", "Uroman Universal Romanizer", "v17.0", "polyglot_accessibility", "https://github.com/isi-nlp/uroman", "Cross-script ASCII transliteration unifying Arabic, CJK & Cyrillic search."],
  ["polyglot-nlp", "Polyglot NLP", "v17.0", "polyglot_accessibility", "https://github.com/aboSamoor/polyglot", "130-language tokenization, sentiment & named-entity extraction."],
  ["stanford-stanza", "Stanford Stanza NLP", "v17.0", "polyglot_accessibility", "https://github.com/stanfordnlp/stanza", "Syntactic dependency parsing & lemmatization in 70+ languages."],
  ["comet-eval", "Unbabel COMET / sacreBLEU", "v17.0", "polyglot_accessibility", "https://github.com/Unbabel/COMET", "Neural machine translation quality scoring preventing garbled phrasing."],

  // v17.0 Batch 3 — Multi-Tenant B2B Enterprise Isolation (25)
  ["keycloak", "Keycloak", "v17.0", "b2b_enterprise_isolation", "https://github.com/keycloak/keycloak", "Enterprise SSO, OIDC, and SAML 2.0 identity provider."],
  ["authentik", "Authentik", "v17.0", "b2b_enterprise_isolation", "https://github.com/goauthentik/authentik", "Flexible open identity and organization RBAC broker."],
  ["ory-kratos", "Ory Hydra / Kratos", "v17.0", "b2b_enterprise_isolation", "https://github.com/ory/kratos", "Cloud-native identity infrastructure built for hundreds of millions of accounts."],
  ["logto", "Logto", "v17.0", "b2b_enterprise_isolation", "https://github.com/logto-io/logto", "Multi-tenant SaaS organization auth & RBAC layer."],
  ["casbin", "Casbin RBAC/ABAC", "v17.0", "b2b_enterprise_isolation", "https://github.com/casbin/casbin", "Policy enforcement guaranteeing strict cross-tenant isolation."],
  ["openfga", "OpenFGA (CNCF Zanzibar)", "v17.0", "b2b_enterprise_isolation", "https://github.com/openfga/openfga", "Fine-grained relationship-based access control at Google Zanzibar scale."],
  ["spicedb", "AuthZed SpiceDB", "v17.0", "b2b_enterprise_isolation", "https://github.com/authzed/spicedb", "Distributed authorization graph preventing tenant cross-reads."],
  ["openmeter", "OpenMeter", "v17.0", "b2b_enterprise_isolation", "https://github.com/openmeterio/openmeter", "Real-time API token & event usage metering for tenant keys."],
  ["flexprice", "Flexprice", "v17.0", "b2b_enterprise_isolation", "https://github.com/flexprice/flexprice", "Usage-based metering and flexible enterprise quota billing."],
  ["novu", "Novu Notifications", "v17.0", "b2b_enterprise_isolation", "https://github.com/novuhq/novu", "Unified omnichannel notification router across web, email & messaging."],
  ["svix-webhooks", "Svix Webhooks OSS", "v17.0", "b2b_enterprise_isolation", "https://github.com/svix/svix-webhooks", "Reliable signed outbound webhook delivery engine."],
  ["convoy-webhooks", "Convoy Webhook Gateway", "v17.0", "b2b_enterprise_isolation", "https://github.com/frain-dev/convoy", "High-throughput webhook filtering and retry gateway."],
  ["infisical", "Infisical", "v17.0", "b2b_enterprise_isolation", "https://github.com/Infisical/infisical", "End-to-end encrypted enterprise secret and API credential vault."],
  ["hashicorp-vault", "HashiCorp Vault", "v17.0", "b2b_enterprise_isolation", "https://github.com/hashicorp/vault", "Dynamic encryption keys, leases, and identity-based secret access."],
  ["openbao", "OpenBao", "v17.0", "b2b_enterprise_isolation", "https://github.com/openbao/openbao", "Fully open-source Linux Foundation secrets vault."],
  ["calcom", "Cal.com API", "v17.0", "b2b_enterprise_isolation", "https://github.com/calcom/cal.com", "Open-source B2B scheduling & booking automation."],
  ["medusajs", "Medusa v2", "v17.0", "b2b_enterprise_isolation", "https://github.com/medusajs/medusa", "Modular headless multi-region commerce core."],
  ["bagisto", "Bagisto", "v17.0", "b2b_enterprise_isolation", "https://github.com/bagisto/bagisto", "Multi-tenant multi-currency e-commerce catalog engine."],
  ["zammad", "Zammad Enterprise", "v17.0", "b2b_enterprise_isolation", "https://github.com/zammad/zammad", "Automated customer support and enterprise SLA ticketing."],
  ["chatwoot", "Chatwoot", "v17.0", "b2b_enterprise_isolation", "https://github.com/chatwoot/chatwoot", "Unified web, WhatsApp & social omnichannel inbox."],
  ["twenty-crm", "Twenty CRM", "v17.0", "b2b_enterprise_isolation", "https://github.com/twentyhq/twenty", "Modern extensible open-source CRM platform."],
  ["budibase", "Budibase", "v17.0", "b2b_enterprise_isolation", "https://github.com/Budibase/budibase", "Rapid internal B2B portal & admin dashboard builder."],
  ["tooljet", "ToolJet", "v17.0", "b2b_enterprise_isolation", "https://github.com/ToolJet/ToolJet", "Low-code database & API admin workspace builder."],
  ["appsmith", "Appsmith", "v17.0", "b2b_enterprise_isolation", "https://github.com/appsmithorg/appsmith", "Open internal dashboards bound cleanly to enterprise REST/SQL."],
  ["directus", "Directus", "v17.0", "b2b_enterprise_isolation", "https://github.com/directus/directus", "Instant REST/GraphQL data studio over SQL schemas."],

  // v17.0 Batch 4 — Planetary Observability, WAF & Circuit Breakers (25)
  ["prometheus", "Prometheus", "v17.0", "zero_downtime_observability", "https://github.com/prometheus/prometheus", "Time-series node & gateway latency monitoring."],
  ["grafana", "Grafana", "v17.0", "zero_downtime_observability", "https://github.com/grafana/grafana", "Real-time fleet telemetry dashboards across global clusters."],
  ["victoriametrics", "VictoriaMetrics", "v17.0", "zero_downtime_observability", "https://github.com/VictoriaMetrics/VictoriaMetrics", "Low-RAM high-ingestion metrics store."],
  ["grafana-loki", "Grafana Loki", "v17.0", "zero_downtime_observability", "https://github.com/grafana/loki", "Cost-efficient horizontally scalable log aggregation."],
  ["signoz", "SigNoz", "v17.0", "zero_downtime_observability", "https://github.com/SigNoz/signoz", "OpenTelemetry full-stack tracing, metrics & logs."],
  ["glitchtip", "GlitchTip", "v17.0", "zero_downtime_observability", "https://github.com/glitchtip/glitchtip-backend", "Lightweight open error tracker compatible with Sentry SDKs."],
  ["opentelemetry-js", "OpenTelemetry JS", "v17.0", "zero_downtime_observability", "https://github.com/open-telemetry/opentelemetry-js", "Vendor-neutral distributed request tracing spans."],
  ["coraza-waf", "Coraza WAF", "v17.0", "zero_downtime_observability", "https://github.com/corazawaf/coraza", "OWASP Core Rule Set enterprise Web Application Firewall."],
  ["crowdsec", "CrowdSec", "v17.0", "zero_downtime_observability", "https://github.com/crowdsecurity/crowdsec", "Collaborative IPS blocking malicious scanners at edge."],
  ["fail2ban", "Fail2ban", "v17.0", "zero_downtime_observability", "https://github.com/fail2ban/fail2ban", "Automated IP brute-force mitigation daemon."],
  ["opossum-cb", "Nodeshift Opossum", "v17.0", "zero_downtime_observability", "https://github.com/nodeshift/opossum", "Automatic circuit breaker isolating failing upstream dependencies."],
  ["cockatiel-ts", "Cockatiel Resilience", "v17.0", "zero_downtime_observability", "https://github.com/connor4312/cockatiel", "TypeScript retry, timeout, circuit-breaker & bulkhead policies."],
  ["tenacity-py", "Tenacity (Python)", "v17.0", "zero_downtime_observability", "https://github.com/jd/tenacity", "General-purpose exponential backoff decorator library."],
  ["locust-io", "Locust Load Tester", "v17.0", "zero_downtime_observability", "https://github.com/locustio/locust", "Distributed Python swarm user simulation load tester."],
  ["artillery-io", "Artillery", "v17.0", "zero_downtime_observability", "https://github.com/artilleryio/artillery", "High-scale HTTP/WebSocket cloud load generator."],
  ["vegeta-http", "Vegeta", "v17.0", "zero_downtime_observability", "https://github.com/tsenart/vegeta", "Constant-rate Go HTTP load testing CLI & library."],
  ["autocannon", "Autocannon", "v17.0", "zero_downtime_observability", "https://github.com/mcollina/autocannon", "Fast Node.js HTTP/1.1 benchmarking suite."],
  ["chaosblade", "Alibaba ChaosBlade", "v17.0", "zero_downtime_observability", "https://github.com/chaosblade-io/chaosblade", "Fault-injection chaos toolkit for OS, JVM & cloud clusters."],
  ["cilium-ebpf", "Cilium (eBPF)", "v17.0", "zero_downtime_observability", "https://github.com/cilium/cilium", "Kernel-level eBPF networking, observability & zero-trust policy."],
  ["linkerd2", "Linkerd2 Service Mesh", "v17.0", "zero_downtime_observability", "https://github.com/linkerd/linkerd2", "Ultra-light Rust micro-proxy service mesh with automatic mTLS."],
  ["argocd", "Argo CD", "v17.0", "zero_downtime_observability", "https://github.com/argoproj/argo-cd", "Declarative GitOps continuous cluster delivery."],
  ["fluxcd", "Flux CD", "v17.0", "zero_downtime_observability", "https://github.com/fluxcd/flux2", "Automated progressive cluster state synchronization."],
  ["velero", "Velero Backup", "v17.0", "zero_downtime_observability", "https://github.com/vmware-tanzu/velero", "Disaster-recovery cluster & volume snapshot automation."],
  ["netdata", "Netdata", "v17.0", "zero_downtime_observability", "https://github.com/netdata/netdata", "Per-second host hardware, network & process monitoring."],
  ["keep-aiops", "Keep AIOps", "v17.0", "zero_downtime_observability", "https://github.com/keephq/keep", "Alert deduplication and automated self-healing runbook workflows."],

  // v18.0 — Zero-Downtime Geo-Routing, Accessibility, Global ERP & Cloud Resilience (100 compact entries)
  ["powerdns", "PowerDNS", "v18.0", "hyperscale_edge_queues", "https://github.com/PowerDNS/pdns", "Geo-aware authoritative & recursive DNS routing users to closest nodes."],
  ["coredns", "CoreDNS", "v18.0", "hyperscale_edge_queues", "https://github.com/coredns/coredns", "Extensible CNCF service-discovery DNS server."],
  ["bird-bgp", "BIRD Anycast Routing", "v18.0", "hyperscale_edge_queues", "https://github.com/CZ-NIC/bird", "Global BGP Anycast internet routing daemon."],
  ["varnish-hitch", "Varnish Hitch TLS", "v18.0", "hyperscale_edge_queues", "https://github.com/varnish/hitch", "High-concurrency TLS terminator for global edges."],
  ["openresty", "OpenResty", "v18.0", "hyperscale_edge_queues", "https://github.com/openresty/openresty", "Non-blocking LuaJIT edge filtering directly atop Nginx."],
  ["sozu-proxy", "Sozu Zero-Downtime Proxy", "v18.0", "hyperscale_edge_queues", "https://github.com/sozu-proxy/sozu", "Hot-reloadable Rust reverse proxy dropping zero live connections."],
  ["zalando-skipper", "Skipper HTTP Router", "v18.0", "hyperscale_edge_queues", "https://github.com/zalando/skipper", "High-scale HTTP proxy built for millions of concurrent retail sessions."],
  ["solo-gloo", "Solo Gloo Edge", "v18.0", "hyperscale_edge_queues", "https://github.com/solo-io/gloo", "Envoy-powered multi-region API gateway."],
  ["emissary-ingress", "Emissary-ingress", "v18.0", "hyperscale_edge_queues", "https://github.com/emissary-ingress/emissary", "Kubernetes API gateway streaming gRPC and WebSockets."],
  ["ms-garnet", "Microsoft Garnet", "v18.0", "hyperscale_edge_queues", "https://github.com/microsoft/garnet", "High-performance remote cache store from Microsoft Research."],
  ["kvrocks", "Apache Kvrocks", "v18.0", "hyperscale_edge_queues", "https://github.com/apache/kvrocks", "RocksDB-backed Redis-protocol cache slashing RAM usage."],
  ["atom-pika", "OpenAtom Pika", "v18.0", "hyperscale_edge_queues", "https://github.com/OpenAtomFoundation/pika", "High-capacity persistent Redis-protocol storage."],
  ["tikv", "TiKV (CNCF)", "v18.0", "hyperscale_edge_queues", "https://github.com/tikv/tikv", "Distributed transactional Raft key-value engine."],
  ["foundationdb", "Apple FoundationDB", "v18.0", "hyperscale_edge_queues", "https://github.com/apple/foundationdb", "Deterministic simulation-tested ACID distributed datastore."],
  ["dgraph", "Dgraph", "v18.0", "hyperscale_edge_queues", "https://github.com/dgraph-io/dgraph", "Distributed GraphQL knowledge-graph database."],
  ["questdb", "QuestDB", "v18.0", "hyperscale_edge_queues", "https://github.com/questdb/questdb", "High-speed columnar time-series ingestion engine."],
  ["timescaledb", "TimescaleDB", "v18.0", "hyperscale_edge_queues", "https://github.com/timescale/timescaledb", "Time-series hypertables integrated natively in PostgreSQL."],
  ["starrocks", "StarRocks", "v18.0", "hyperscale_edge_queues", "https://github.com/StarRocks/starrocks", "Sub-second real-time analytical MPP SQL database."],
  ["apache-doris", "Apache Doris", "v18.0", "hyperscale_edge_queues", "https://github.com/apache/doris", "High-concurrency analytical lakehouse warehouse."],
  ["apache-datafusion", "Apache DataFusion", "v18.0", "hyperscale_edge_queues", "https://github.com/apache/datafusion", "Extensible Apache Arrow Rust vectorized query engine."],
  ["tantivy", "Tantivy Full-Text", "v18.0", "hyperscale_edge_queues", "https://github.com/quickwit-oss/tantivy", "Rust full-text search engine powering sub-millisecond indexing."],
  ["quickwit", "Quickwit", "v18.0", "hyperscale_edge_queues", "https://github.com/quickwit-oss/quickwit", "Cloud-native object-storage full-text search engine."],
  ["zincsearch", "ZincSearch", "v18.0", "hyperscale_edge_queues", "https://github.com/zincsearch/zincsearch", "Lightweight single-binary full-text indexer."],
  ["watermill-go", "Watermill Event Bus", "v18.0", "hyperscale_edge_queues", "https://github.com/ThreeDotsLabs/watermill", "Go event-driven async stream processing framework."],
  ["machinery-go", "Machinery Task Queue", "v18.0", "hyperscale_edge_queues", "https://github.com/RichardKnop/machinery", "Distributed asynchronous background job runner."],
  ["linguijs", "LinguiJS", "v18.0", "polyglot_accessibility", "https://github.com/lingui/js-lingui", "Tiny 3KB compile-time ICU internationalization framework."],
  ["paraglide-js", "Inlang Paraglide JS", "v18.0", "polyglot_accessibility", "https://github.com/opral/inlang-paraglide-js", "Tree-shakable zero-bloat compiled i18n messages."],
  ["mozilla-fluent", "Mozilla Fluent", "v18.0", "polyglot_accessibility", "https://github.com/projectfluent/fluent", "Asymmetric natural grammar localization syntax."],
  ["rtlcss", "RTLCSS", "v18.0", "polyglot_accessibility", "https://github.com/MohammadYounes/rtlcss", "Automated CSS flipping for RTL Arabic/Hebrew/Urdu UI."],
  ["noto-fonts", "Noto Global Fonts", "v18.0", "polyglot_accessibility", "https://github.com/notofonts/notofonts.github.io", "Complete typographic script coverage across 1,000+ languages."],
  ["harfbuzz", "HarfBuzz Shaping", "v18.0", "polyglot_accessibility", "https://github.com/harfbuzz/harfbuzz", "Industry-standard complex Arabic/Indic glyph shaping engine."],
  ["bidi-js", "bidi-js (Unicode UAX #9)", "v18.0", "polyglot_accessibility", "https://github.com/lojjic/bidi-js", "Exact mixed RTL/LTR bidirectional text layout resolution."],
  ["iana-tz", "IANA tzdata", "v18.0", "polyglot_accessibility", "https://github.com/eggert/tz", "Authoritative historical & DST global timezone rules."],
  ["iso-3166-registry", "ISO-3166 / ISO-4217 Registry", "v18.0", "polyglot_accessibility", "https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes", "Standardized country, currency, and subdivision codes."],
  ["fawaz-exchange", "Exchange API Open Registry", "v18.0", "polyglot_accessibility", "https://github.com/fawazahmed0/exchange-api", "Zero-key CDN global fiat & currency rate mirror."],
  ["date-holidays", "date-holidays (150+ Countries)", "v18.0", "polyglot_accessibility", "https://github.com/commenthol/date-holidays", "Global national, commercial & religious holiday calendars."],
  ["openaddresses", "OpenAddresses", "v18.0", "polyglot_accessibility", "https://github.com/openaddresses/openaddresses", "Open worldwide street address & postal archive."],
  ["whosonfirst", "Who's On First Gazetteer", "v18.0", "polyglot_accessibility", "https://github.com/whosonfirst-data", "Hierarchical neighborhood, city & country GeoJSON gazetteer."],
  ["pelias", "Pelias Geocoder", "v18.0", "polyglot_accessibility", "https://github.com/pelias/pelias", "Open modular global address/POI geocoder."],
  ["openrouteservice", "OpenRouteService", "v18.0", "polyglot_accessibility", "https://github.com/GIScience/openrouteservice", "Multi-modal routing, isochrones & logistics optimization."],
  ["axe-core", "Axe-Core Accessibility", "v18.0", "polyglot_accessibility", "https://github.com/dequelabs/axe-core", "Automated WCAG screen-reader & ARIA contrast auditing."],
  ["nvda-sr", "NVDA Screen Reader Compat", "v18.0", "polyglot_accessibility", "https://github.com/nvaccess/nvda", "Screen reader semantic navigation compatibility standard."],
  ["liblouis", "Liblouis Braille Translator", "v18.0", "polyglot_accessibility", "https://github.com/liblouis/liblouis", "Open Braille transcription across 100+ languages."],
  ["wlasl-sign", "WLASL Sign Language Corpus", "v18.0", "polyglot_accessibility", "https://github.com/dxli94/WLASL", "Large-scale sign language recognition video dataset."],
  ["vosk-asr", "Vosk Offline Speech", "v18.0", "polyglot_accessibility", "https://github.com/alphacep/vosk-api", "Compact offline mobile/edge speech recognizer in 20+ languages."],
  ["julius-stt", "Julius Speech Decoder", "v18.0", "polyglot_accessibility", "https://github.com/julius-speech/julius", "Ultra-light continuous real-time speech decoder."],
  ["cultural-idioms", "Multilingual Proverbs & Idioms", "v18.0", "polyglot_accessibility", "https://huggingface.co/datasets", "Cross-cultural pragmatic idiom translation corpora."],
  ["afrisenti", "AfriSenti Sentiment", "v18.0", "polyglot_accessibility", "https://github.com/afrisenti-semeval/afrisent-semeval-2023", "African languages including Moroccan Arabic & Hausa sentiment."],
  ["detoxify", "UnitaryAI Detoxify", "v18.0", "polyglot_accessibility", "https://github.com/unitaryai/detoxify", "Multilingual toxicity & safety moderation classifier."],
  ["ckan-open-data", "CKAN Open Data Portals", "v18.0", "polyglot_accessibility", "https://github.com/ckan/ckan", "Global public government & economic open-data connectors."],
  ["odoo-core", "Odoo Community Core", "v18.0", "b2b_enterprise_isolation", "https://github.com/odoo/odoo", "Modular B2B accounting, inventory & HR reference patterns."],
  ["frappe-fw", "Frappe Framework", "v18.0", "b2b_enterprise_isolation", "https://github.com/frappe/frappe", "Metadata-driven Python/JS enterprise ERP framework."],
  ["erpnext", "ERPNext", "v18.0", "b2b_enterprise_isolation", "https://github.com/frappe/erpnext", "Full open-source manufacturing, retail & supply-chain ERP."],
  ["metasfresh", "Metasfresh ERP", "v18.0", "b2b_enterprise_isolation", "https://github.com/metasfresh/metasfresh", "High-volume wholesale & distribution ERP."],
  ["saleor", "Saleor Commerce", "v18.0", "b2b_enterprise_isolation", "https://github.com/saleor/saleor", "GraphQL headless enterprise commerce engine."],
  ["vendure", "Vendure TypeScript Commerce", "v18.0", "b2b_enterprise_isolation", "https://github.com/vendure-ecommerce/vendure", "Extensible TypeScript/NestJS multi-channel commerce."],
  ["ever-gauzy", "EverGauzy ERP/CRM", "v18.0", "b2b_enterprise_isolation", "https://github.com/ever-co/ever-gauzy", "Distributed team, project & time-tracking business suite."],
  ["huly-platform", "Huly Workspace", "v18.0", "b2b_enterprise_isolation", "https://github.com/hcengineering/platform", "Unified project tracker, docs & team chat."],
  ["appflowy-cloud", "AppFlowy Cloud", "v18.0", "b2b_enterprise_isolation", "https://github.com/AppFlowy-IO/AppFlowy-Cloud", "Real-time collaborative enterprise knowledge base."],
  ["zulip-chat", "Zulip Topic Chat", "v18.0", "b2b_enterprise_isolation", "https://github.com/zulip/zulip", "Structured thread-by-topic enterprise messaging."],
  ["mattermost", "Mattermost", "v18.0", "b2b_enterprise_isolation", "https://github.com/mattermost/mattermost", "Sovereign self-hosted enterprise operational messaging."],
  ["rocketchat", "Rocket.Chat", "v18.0", "b2b_enterprise_isolation", "https://github.com/RocketChat/Rocket.Chat", "Omnichannel customer & staff collaboration hub."],
  ["jitsi-meet", "Jitsi Meet", "v18.0", "b2b_enterprise_isolation", "https://github.com/jitsi/jitsi-meet", "Zero-fee encrypted WebRTC video conferencing."],
  ["bigbluebutton", "BigBlueButton", "v18.0", "b2b_enterprise_isolation", "https://github.com/bigbluebutton/bigbluebutton", "Interactive virtual classroom & onboarding platform."],
  ["mautic", "Mautic Automation", "v18.0", "b2b_enterprise_isolation", "https://github.com/mautic/mautic", "Open-source customer campaign automation."],
  ["dittofeed", "Dittofeed", "v18.0", "b2b_enterprise_isolation", "https://github.com/dittofeed/dittofeed", "Event-triggered customer lifecycle messaging."],
  ["growthbook", "GrowthBook", "v18.0", "b2b_enterprise_isolation", "https://github.com/growthbook/growthbook", "Open Bayesian A/B experimentation & feature flagging."],
  ["flagsmith", "Flagsmith", "v18.0", "b2b_enterprise_isolation", "https://github.com/Flagsmith/flagsmith", "Real-time multi-environment feature toggles."],
  ["unleash", "Unleash Feature Flags", "v18.0", "b2b_enterprise_isolation", "https://github.com/Unleash/unleash", "Progressive canary rollout guardrails."],
  ["cube-js", "Cube.js Semantic Layer", "v18.0", "b2b_enterprise_isolation", "https://github.com/cube-js/cube", "Pre-aggregated semantic BI API layer."],
  ["apache-superset", "Apache Superset", "v18.0", "b2b_enterprise_isolation", "https://github.com/apache/superset", "Enterprise visual data exploration & BI charts."],
  ["lightdash", "Lightdash", "v18.0", "b2b_enterprise_isolation", "https://github.com/lightdash/lightdash", "Natural-language governed dbt metrics querying."],
  ["dbt-core", "dbt Core", "v18.0", "b2b_enterprise_isolation", "https://github.com/dbt-labs/dbt-core", "SQL transformation testing and lineage compiler."],
  ["meltano", "Meltano ELT", "v18.0", "b2b_enterprise_isolation", "https://github.com/meltano/meltano", "Modular open-source data ingestion pipelines."],
  ["kestra", "Kestra Orchestrator", "v18.0", "b2b_enterprise_isolation", "https://github.com/kestra-io/kestra", "Declarative YAML high-volume workflow scheduler."],
  ["talos-linux", "Talos Linux", "v18.0", "zero_downtime_observability", "https://github.com/siderolabs/talos", "Minimal immutable API-driven Kubernetes OS."],
  ["k3s-cncf", "K3s Lightweight K8s", "v18.0", "zero_downtime_observability", "https://github.com/k3s-io/k3s", "Low-footprint certified Kubernetes for edge nodes."],
  ["k0s", "k0s Zero-Deps K8s", "v18.0", "zero_downtime_observability", "https://github.com/k0sproject/k0s", "Single-binary zero-dependency cluster runtime."],
  ["harvester-hci", "Harvester HCI", "v18.0", "zero_downtime_observability", "https://github.com/harvester/harvester", "Open-source hyperconverged infrastructure platform."],
  ["longhorn", "Longhorn Storage", "v18.0", "zero_downtime_observability", "https://github.com/longhorn/longhorn", "Replicated cloud-native block storage across nodes."],
  ["rook-ceph", "Rook / Ceph", "v18.0", "zero_downtime_observability", "https://github.com/rook/rook", "Self-healing petabyte-scale distributed storage operator."],
  ["openebs", "OpenEBS", "v18.0", "zero_downtime_observability", "https://github.com/openebs/openebs", "Container-attached high-IOPS NVMe storage."],
  ["metallb", "MetalLB", "v18.0", "zero_downtime_observability", "https://github.com/metallb/metallb", "Bare-metal BGP/Layer-2 virtual IP failover."],
  ["external-dns", "External-DNS", "v18.0", "zero_downtime_observability", "https://github.com/kubernetes-sigs/external-dns", "Automated cluster DNS record synchronization."],
  ["cert-manager", "Cert-Manager", "v18.0", "zero_downtime_observability", "https://github.com/cert-manager/cert-manager", "Zero-touch ACME/TLS certificate rotation."],
  ["step-ca", "Smallstep CA", "v18.0", "zero_downtime_observability", "https://github.com/smallstep/certificates", "Internal short-lived mTLS PKI authority."],
  ["teleport", "Gravitational Teleport", "v18.0", "zero_downtime_observability", "https://github.com/gravitational/teleport", "Zero-trust identity-aware infrastructure access."],
  ["hashicorp-boundary", "HashiCorp Boundary", "v18.0", "zero_downtime_observability", "https://github.com/hashicorp/boundary", "Dynamic session-scoped infrastructure tunneling."],
  ["falco-runtime", "Falco Runtime Security", "v18.0", "zero_downtime_observability", "https://github.com/falcosecurity/falco", "Real-time syscall anomaly detection & prevention."],
  ["trivy-scan", "Aqua Trivy", "v18.0", "zero_downtime_observability", "https://github.com/aquasecurity/trivy", "All-in-one CVE, IaC & secret vulnerability scanner."],
  ["syft-grype", "Anchore Syft & Grype", "v18.0", "zero_downtime_observability", "https://github.com/anchore/grype", "SBOM dependency inventory & vulnerability auditing."],
  ["cosign-sigstore", "Sigstore Cosign", "v18.0", "zero_downtime_observability", "https://github.com/sigstore/cosign", "Cryptographic signing of container images & releases."],
  ["opa-policy", "Open Policy Agent (OPA)", "v18.0", "zero_downtime_observability", "https://github.com/open-policy-agent/opa", "Decoupled Rego policy authorization engine."],
  ["kyverno", "Kyverno", "v18.0", "zero_downtime_observability", "https://github.com/kyverno/kyverno", "Declarative Kubernetes security & isolation policies."],
  ["jaeger-tracing", "Jaeger Tracing", "v18.0", "zero_downtime_observability", "https://github.com/jaegertracing/jaeger", "End-to-end distributed latency span analyzer."],
  ["grafana-tempo", "Grafana Tempo", "v18.0", "zero_downtime_observability", "https://github.com/grafana/tempo", "Object-storage backed distributed trace backend."],
  ["pyroscope", "Grafana Pyroscope", "v18.0", "zero_downtime_observability", "https://github.com/grafana/pyroscope", "Continuous low-overhead CPU/memory flamegraphs."],
  ["parca-prof", "Parca Profiler", "v18.0", "zero_downtime_observability", "https://github.com/parca-dev/parca", "eBPF always-on continuous system profiling."],
  ["robusta-k8s", "Robusta AIOps", "v18.0", "zero_downtime_observability", "https://github.com/robusta-dev/robusta", "Automated pod diagnostics and self-healing runbooks."],
  ["dragonfly-p2p", "Dragonfly P2P Distribution", "v18.0", "zero_downtime_observability", "https://github.com/dragonflyoss/dragonfly", "P2P artifact distribution across large edge fleets."],

  // v19.0 — First-Shot Accuracy, Anti-Garbage Data & Formal Verification (25)
  ["fineweb-2", "FineWeb-2", "v19.0", "first_shot_formal_data", "https://huggingface.co/datasets/HuggingFaceFW/fineweb-2", "Clean deduplicated multilingual corpus spanning 1,000+ languages."],
  ["the-stack-v2", "The Stack v2 Deduped", "v19.0", "first_shot_formal_data", "https://huggingface.co/datasets/bigcode/the-stack-v2-dedup", "Curated high-quality permissively licensed source code in 600+ languages."],
  ["nemotron-cc", "NVIDIA Nemotron-CC", "v19.0", "first_shot_formal_data", "https://huggingface.co/datasets/nvidia/Nemotron-CC", "AI-filtered noise-free web reasoning dataset."],
  ["dclm-baseline", "DCLM-Baseline (DataComp)", "v19.0", "first_shot_formal_data", "https://huggingface.co/datasets/mlfoundations/dclm-baseline-1.0", "Quality-selected reasoning pretraining baseline."],
  ["datajuicer", "Alibaba DataJuicer", "v19.0", "first_shot_formal_data", "https://github.com/datajuicer/data-juicer", "Modular multimodal data cleaning, filtering & deduplication pipeline."],
  ["datasketch-lsh", "Datasketch (MinHashLSH)", "v19.0", "first_shot_formal_data", "https://github.com/ekzhu/datasketch", "Probabilistic near-duplicate elimination via MinHash Locality-Sensitive Hashing."],
  ["trafilatura", "Trafilatura Extractor", "v19.0", "first_shot_formal_data", "https://github.com/adbar/trafilatura", "Boilerplate/ad-stripping clean main-content web extractor."],
  ["cleanlab", "Cleanlab Data-Centric AI", "v19.0", "first_shot_formal_data", "https://github.com/cleanlab/cleanlab", "Automated detection of label errors, contradictions, and dataset outliers."],
  ["colbertv2", "ColBERTv2 / RAGatouille", "v19.0", "first_shot_formal_data", "https://github.com/AnswerDotAI/RAGatouille", "Token-level late-interaction neural retrieval for pinpointed answers."],
  ["flashrank", "FlashRank Reranker", "v19.0", "first_shot_formal_data", "https://github.com/PrithivirajDamodaran/FlashRank", "Ultra-lightweight (~4MB) cross-encoder passage reranker."],
  ["bge-reranker-m3", "BGE-Reranker-v2-M3", "v19.0", "first_shot_formal_data", "https://huggingface.co/BAAI/bge-reranker-v2-m3", "Multilingual cross-encoder ranking supporting 100+ languages."],
  ["bm25s", "BM25s Lexical Engine", "v19.0", "first_shot_formal_data", "https://github.com/xhluca/bm25s", "Vectorized ultra-fast exact lexical retrieval."],
  ["rank-bm25", "Rank-BM25", "v19.0", "first_shot_formal_data", "https://github.com/dorianbrown/rank_bm25", "Lightweight hybrid sparse/dense search scoring."],
  ["tlaplus", "TLA+ Formal Specs", "v19.0", "first_shot_formal_data", "https://github.com/tlaplus/tlaplus", "Temporal logic specification verifier catching deadlocks and races before coding."],
  ["quint-spec", "Quint (Informal Systems)", "v19.0", "first_shot_formal_data", "https://github.com/informalsystems/quint", "Modern typed executable specification checker for APIs and protocols."],
  ["lean-4", "Lean 4 Prover", "v19.0", "first_shot_formal_data", "https://github.com/leanprover/lean4", "Interactive theorem prover validating mathematical & financial proofs."],
  ["coq-rocq", "Coq / Rocq Prover", "v19.0", "first_shot_formal_data", "https://github.com/coq/coq", "Dependently-typed formal proof assistant for zero-defect algorithms."],
  ["kani-rust", "Kani Rust Verifier (AWS)", "v19.0", "first_shot_formal_data", "https://github.com/model-checking/kani", "Bit-precise bounded model checker proving memory/panic safety in Rust."],
  ["prusti-rust", "Prusti Rust Verifier", "v19.0", "first_shot_formal_data", "https://github.com/viperproject/prusti-dev", "Specification-based formal correctness checker for Rust crates."],
  ["alloy-analyzer", "MIT Alloy Analyzer", "v19.0", "first_shot_formal_data", "https://github.com/AlloyTools/org.alloytools.alloy", "Relational logic model finder proving tenant isolation & auth invariants."],
  ["crosshair-py", "CrossHair Python Symbolic", "v19.0", "first_shot_formal_data", "https://github.com/pschanely/CrossHair", "SMT symbolic execution uncovers edge-case counterexamples in Python functions."],
  ["deal-contracts", "Deal Design-by-Contract", "v19.0", "first_shot_formal_data", "https://github.com/life4/deal", "Precondition/postcondition runtime contract enforcement."],
  ["pandera", "Pandera Schema Contracts", "v19.0", "first_shot_formal_data", "https://github.com/unionai-oss/pandera", "Typed dataframe & Excel column/range assertions before math runs."],
  ["great-expectations", "Great Expectations", "v19.0", "first_shot_formal_data", "https://github.com/great-expectations/great_expectations", "Declarative data-quality contract assertions across pipelines."],
  ["typebox-validator", "TypeBox / ArkType Validator", "v19.0", "first_shot_formal_data", "https://github.com/sinclairzx81/typebox", "JIT-speed JSON Schema & TypeScript runtime contract validation."],
];

export const PLANETARY_ARSENAL_CATALOG: readonly PlanetaryArsenalEntry[] = RAW_ROWS.map(
  ([id, name, version, group, sourceUrl, summary]) => ({
    id,
    name,
    version,
    group,
    sourceUrl,
    summary,
  })
);

export const PLANETARY_CATALOG_COUNTS = {
  v15_3_multi_os_wasm: PLANETARY_ARSENAL_CATALOG.filter((e) => e.version === "v15.3").length,
  v15_4_shield: PLANETARY_ARSENAL_CATALOG.filter((e) => e.version === "v15.4").length,
  v16_0_planetary: PLANETARY_ARSENAL_CATALOG.filter((e) => e.version === "v16.0").length,
  v17_0_scale_polyglot: PLANETARY_ARSENAL_CATALOG.filter((e) => e.version === "v17.0").length,
  v18_0_zero_downtime: PLANETARY_ARSENAL_CATALOG.filter((e) => e.version === "v18.0").length,
  v19_0_first_shot: PLANETARY_ARSENAL_CATALOG.filter((e) => e.version === "v19.0").length,
  total: PLANETARY_ARSENAL_CATALOG.length,
} as const;

export function searchPlanetaryArsenalCatalog(query: string, limit = 15): PlanetaryArsenalEntry[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return PLANETARY_ARSENAL_CATALOG.slice(0, limit);
  return PLANETARY_ARSENAL_CATALOG.filter((entry) =>
    `${entry.id} ${entry.name} ${entry.version} ${entry.group} ${entry.summary}`.toLowerCase().includes(q)
  ).slice(0, limit);
}
