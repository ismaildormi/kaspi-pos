import {
  V24_TO_V28_MASTER_CATALOG,
  type V24PlusSourceEntry,
} from "@/lib/zebra-x/core/v24-v28-master-catalog";

/**
 * HEYUKA / YUKA — Master Engineering, Security, Bot Factory, Robotics & Mobile Lab Catalog (`v20.2`–`v28.1`)
 *
 * Strictly deduplicated Progressive-Disclosure Registry (Level 1 lightweight metadata):
 * - v20.2 (25): Massive Defensive Cybersecurity & Code Auditing Corpora (1M+ Records)
 * - v20.3 (25): Full-Stack Web, Mobile, UI & Database Engineering Masters
 * - v20.4 (25): Deep Systems, Linux Kernel, DevOps & Memory Safety Masters
 * - v21.0–v21.5 (44): Universal Bot Factory (10), NVIDIA/MS/xAI Blueprints (21), Spec/Constraints (5), Physical Robotics/IoT (8)
 * - v22.0–v22.1 (100): Complete Mobile Diagnostics, Malware Sweep, iOS & Hardware Repair Shop Lab
 */

export type V20PlusGroup =
  | "v20_2_defensive_security_sast"
  | "v20_3_fullstack_web_mobile_db"
  | "v20_4_systems_kernel_devops"
  | "v21_0_universal_bot_factory"
  | "v21_2_nvidia_ms_xai_blueprints"
  | "v21_4_hyper_custom_spec_robotics"
  | "v22_mobile_adb_transfer_25"
  | "v22_mobile_ios_apple_25"
  | "v22_mobile_av_debloat_25"
  | "v22_mobile_hardware_shop_25"
  | "v23_real_world_omniscience";

export interface MasterSourceEntry {
  id: string;
  name: string;
  group: V20PlusGroup;
  url: string;
  zeroKey: boolean;
  role: string;
}

type CompactRow = [id: string, name: string, url: string, role: string];

function packGroup(group: V20PlusGroup, rows: readonly CompactRow[]): MasterSourceEntry[] {
  return rows.map(([id, name, url, role]) => ({
    id,
    name,
    group,
    url,
    zeroKey: true,
    role,
  }));
}

export const V20_2_DEFENSIVE_SECURITY: readonly MasterSourceEntry[] = packGroup("v20_2_defensive_security_sast", [
  ["nist-nvd", "NIST NVD Full Feeds", "https://nvd.nist.gov/vuln/data-feeds", "260k+ CVE/CVSS/CWE vulnerability taxonomy feeds"],
  ["mitre-cve-cwe", "MITRE CVE & CWE Corpus", "https://github.com/CVEProject/cvelistV5", "Root-cause weakness graphs (SQLi, XSS, SSRF, Buffer)"],
  ["google-osv-dev", "Google OSV.dev (1M+)", "https://osv.dev/", "1M+ open source vulnerability advisories across npm/PyPI/Cargo/Go"],
  ["ghsa-db", "GitHub Advisory Database", "https://github.com/github/advisory-database", "CVE diff patches pairing vulnerable code with fixes"],
  ["bigvul-diversevul", "Big-Vul & DiverseVul", "https://github.com/ZeoVan/MSR_20_Code_vulnerability_CSV_Dataset", "330k+ pre/post-fix vulnerable functions"],
  ["primevul-formai", "PrimeVul & FormAI (1.1M+)", "https://github.com/topics/formai", "1.12M formally verified C programs for zero-bug synthesis"],
  ["juliet-sard", "Juliet Test Suite (NIST SARD)", "https://samate.nist.gov/SARD/test-suites", "100k+ SAST reference test cases across 118 CWEs"],
  ["owasp-cheatsheet", "OWASP Cheat Sheet Series & ASVS", "https://github.com/OWASP/CheatSheetSeries", "Mandatory API, auth, SQL & web hardening standards"],
  ["mitre-d3fend", "MITRE ATT&CK & D3FEND", "https://d3fend.mitre.org/", "Defensive countermeasure graph mapping threats to mitigations"],
  ["semgrep-rules", "Semgrep Rules Registry", "https://github.com/semgrep/semgrep-rules", "2,500+ multi-language static security rules"],
  ["bandit-gosec-cargo", "Bandit / Brakeman / Gosec / Cargo-Audit", "https://github.com/PyCQA/bandit", "Language-native SAST scanners for Python/Ruby/Go/Rust"],
  ["yara-rules", "YARA Rules Mega-Repository", "https://github.com/Yara-Rules/rules", "Binary & malware pattern matching signatures"],
  ["sigma-hq", "Sigma HQ Rules", "https://github.com/SigmaHQ/sigma", "Generic SIEM log anomaly detection rules"],
  ["cyberseceval-seccode", "CyberSecEval & SecCodePLT", "https://github.com/meta-llama/PurpleLlama", "AI-generated code security evaluation suite"],
  ["seclists-miessler", "SecLists Fuzzing Wordlists", "https://github.com/danielmiessler/SecLists", "Adversarial input fuzzing & secret leakage corpora"],
  ["gitleaks-trufflehog", "Gitleaks & TruffleHog Rules", "https://github.com/gitleaks/gitleaks", "Pre-commit & CI hardcoded credential leak detection"],
  ["nuclei-templates", "Nuclei Templates", "https://github.com/projectdiscovery/nuclei-templates", "9,000+ authorized defensive security posture templates"],
  ["owasp-zap", "OWASP Zed Attack Proxy (ZAP)", "https://github.com/zaproxy/zaproxy", "Web app vulnerability & header posture verifier"],
  ["ghidra-nsa", "Ghidra Reverse Engineering", "https://github.com/NationalSecurityAgency/ghidra", "Open binary decompiler for safety inspection"],
  ["radare2-rizin", "Radare2 / Rizin", "https://github.com/rizinorg/rizin", "CLI binary & firmware inspector"],
  ["suricata-snort", "Suricata & Snort ET Rules", "https://github.com/OISF/suricata", "Network IDS/IPS threat defense signatures"],
  ["abuse-ch-feeds", "Abuse.ch (URLhaus / Bazaar / ThreatFox)", "https://abuse.ch/", "Real-time malicious URL & SHA-256 hash blocklists"],
  ["osv-scanner", "Google OSV-Scanner", "https://github.com/google/osv-scanner", "Lockfile & dependency vulnerability auditor"],
  ["primus-seed-secqa", "Primus-Seed & SecQA Corpus", "https://huggingface.co/datasets/trendmicro-ailab/Primus-Seed", "Cyber defense knowledge & reasoning corpus"],
  ["oss-fuzz", "OSS-Fuzz & ClusterFuzz", "https://github.com/google/oss-fuzz", "Continuous automated parser/runtime fuzzing"],
]);

export const V20_3_FULLSTACK_ENGINEERING: readonly MasterSourceEntry[] = packGroup("v20_3_fullstack_web_mobile_db", [
  ["websight-design2code", "WebSight & Design2Code", "https://huggingface.co/datasets/HuggingFaceM4/WebSight", "Screenshot-to-HTML/Tailwind UI synthesis corpus"],
  ["rico-screen2words", "Rico & Screen2Words", "https://interactionmining.org/rico", "72k+ mobile UI hierarchy layouts"],
  ["shadcn-radix", "Shadcn/ui & Radix Primitives", "https://github.com/shadcn-ui/ui", "Accessible Tailwind + React component registry"],
  ["magic-ui-motion", "Magic UI & Motion Primitives", "https://github.com/magicuidesign/magicui", "60fps Framer Motion UI effects"],
  ["tanstack-suite", "TanStack Query / Table / Router / Form", "https://github.com/TanStack", "Typed async state, tables, forms & routing"],
  ["drizzle-prisma", "Drizzle ORM & Prisma", "https://github.com/drizzle-team/drizzle-orm", "Type-safe SQL & relational schema tooling"],
  ["trpc-orpc", "tRPC & oRPC", "https://github.com/trpc/trpc", "End-to-end typesafe client-server procedures"],
  ["better-auth", "Better-Auth", "https://github.com/better-auth/better-auth", "TypeScript sessions, RBAC, 2FA & OAuth"],
  ["zod-valibot", "Zod & Valibot", "https://github.com/fabian-hiller/valibot", "Strict runtime schema validation"],
  ["zustand-xstate", "Zustand / Jotai / XState", "https://github.com/statelyai/xstate", "Deterministic UI & workflow state machines"],
  ["tiptap-plate", "Tiptap & Plate Editors", "https://github.com/ueberdosis/tiptap", "Collaborative rich-text & AI document editing"],
  ["excalidraw-xyflow", "Excalidraw & XYFlow", "https://github.com/xyflow/xyflow", "Node-based diagrams & interactive whiteboards"],
  ["echarts-tremor", "Apache ECharts & Tremor", "https://github.com/apache/echarts", "Financial dashboards & telemetry charting"],
  ["duckdb-wasm", "DuckDB-Wasm", "https://github.com/duckdb/duckdb-wasm", "In-browser analytical OLAP SQL engine"],
  ["spider-bird-sql", "Spider & BIRD-SQL", "https://bird-bench.github.io/", "Natural-language-to-SQL synthesis benchmarks"],
  ["postgrest-hasura", "PostgREST & Hasura", "https://github.com/PostgREST/postgrest", "Zero-boilerplate PostgreSQL REST/GraphQL gateways"],
  ["fastapi-litestar", "FastAPI / Litestar / Robyn", "https://github.com/fastapi/fastapi", "High-throughput typed Python backends"],
  ["axum-actix", "Axum & Actix-Web (Rust)", "https://github.com/tokio-rs/axum", "Ultra-fast memory-safe Rust HTTP microservices"],
  ["fiber-gin-echo", "Fiber / Gin / Echo (Go)", "https://github.com/gofiber/fiber", "Low-footprint concurrent Go APIs"],
  ["expo-rn-tamagui", "Expo / React Native / Tamagui", "https://github.com/expo/expo", "Cross-platform native iOS & Android engineering"],
  ["flutter-riverpod", "Flutter & Riverpod", "https://github.com/flutter/flutter", "120fps Skia/Impeller multi-platform apps"],
  ["turborepo-nx", "Turborepo & Nx", "https://github.com/vercel/turborepo", "Scalable monorepo caching & orchestration"],
  ["vitest-playwright", "Vitest & Playwright Codegen", "https://github.com/vitest-dev/vitest", "Automated unit & E2E verification"],
  ["storybook", "Storybook", "https://github.com/storybookjs/storybook", "Isolated UI component testing"],
  ["awesome-selfhosted", "Awesome-Selfhosted Mega-List", "https://github.com/awesome-selfhosted/awesome-selfhosted", "1,000+ self-hostable open source stacks"],
]);

export const V20_4_SYSTEMS_KERNEL_DEVOPS: readonly MasterSourceEntry[] = packGroup("v20_4_systems_kernel_devops", [
  ["linux-kernel", "Linux Kernel Source & Docs", "https://github.com/torvalds/linux", "OS scheduler, memory & networking architecture"],
  ["xv6-osdev", "xv6 & OSDev Wiki", "https://github.com/mit-pdos/xv6-riscv", "Clean UNIX-like RISC-V kernel engineering"],
  ["ebpf-aya", "eBPF & Aya (Rust eBPF)", "https://github.com/aya-rs/aya", "Safe in-kernel telemetry & packet filtering"],
  ["wasmtime-wasmer", "Wasmtime & Wasmer", "https://github.com/bytecodealliance/wasmtime", "Sandboxed multi-language WASI execution"],
  ["tokio-runtime", "Tokio Async Runtime", "https://github.com/tokio-rs/tokio", "Work-stealing async I/O concurrency in Rust"],
  ["nixpkgs", "Nix & Nixpkgs", "https://github.com/NixOS/nixpkgs", "100k+ reproducible immutable packages"],
  ["bazel-buck2", "Bazel & Buck2", "https://github.com/facebook/buck2", "Hermetic multi-language monorepo builds"],
  ["opentofu", "OpenTofu IaC", "https://github.com/opentofu/opentofu", "Declarative multi-cloud infrastructure as code"],
  ["ansible", "Ansible Automation", "https://github.com/ansible/ansible", "Agentless fleet configuration & playbooks"],
  ["dagger-ci", "Dagger Programmable CI/CD", "https://github.com/dagger/dagger", "Code-defined containerized build pipelines"],
  ["podman-buildah", "Podman & Buildah", "https://github.com/containers/podman", "Rootless OCI container builds & runtime"],
  ["firecracker", "Firecracker MicroVMs", "https://github.com/firecracker-microvm/firecracker", "Sub-125ms isolated untrusted code sandboxes"],
  ["wireshark-scapy", "Wireshark & Scapy", "https://github.com/secdev/scapy", "Packet inspection & protocol diagnostics"],
  ["rustls-openssl", "OpenSSL / Rustls / Libsodium", "https://github.com/rustls/rustls", "Modern memory-safe TLS & AEAD cryptography"],
  ["age-encryption", "age File Encryption", "https://github.com/FiloSottile/age", "Modern encrypted backups & secret key wrapping"],
  ["spiffe-spire", "SPIFFE & SPIRE", "https://github.com/spiffe/spire", "Cryptographic workload identity Federation"],
  ["wazuh-xdr", "Wazuh Open XDR & SIEM", "https://github.com/wazuh/wazuh", "FIM, vulnerability & endpoint telemetry"],
  ["osquery", "Osquery (Linux Foundation)", "https://github.com/osquery/osquery", "SQL querying across OS processes & sockets"],
  ["lynis-audit", "Lynis System Auditor", "https://github.com/CISOfy/lynis", "Linux/macOS configuration hardening scans"],
  ["cert-cwe-coding", "CWE Top 25 & CERT Coding", "https://wiki.sei.cmu.edu/confluence", "Formal defensive coding standards"],
  ["afl-libfuzzer", "AFL++ & LibFuzzer", "https://github.com/AFLplusplus/AFLplusplus", "Coverage-guided crash & vulnerability hunting"],
  ["valgrind-asan", "Valgrind & AddressSanitizer", "https://github.com/google/sanitizers", "Memory leak & bounds violation checks"],
  ["crafting-interpreters", "Crafting Interpreters", "https://github.com/munificent/craftinginterpreters", "Compiler, bytecode VM & DSL design"],
  ["jepsen-ddia", "Jepsen & Distributed Systems", "https://github.com/jepsen-io/jepsen", "Consensus & partition-tolerance correctness tests"],
  ["awesome-cto", "Awesome-CTO Playbooks", "https://github.com/kuchin/awesome-cto", "Engineering architecture & reliability standards"],
]);

export const V21_BOT_FACTORY_BLUEPRINTS_ROBOTICS: readonly MasterSourceEntry[] = [
  ...packGroup("v21_0_universal_bot_factory", [
    ["bot-telegram-grammy", "grammY / Aiogram 3 / Telethon", "https://github.com/grammyjs/grammY", "Telegram interactive & payment bot engine"],
    ["bot-whatsapp-baileys", "Baileys / WAHA / Evolution API", "https://github.com/EvolutionAPI/evolution-api", "WhatsApp commerce & Darija media bots"],
    ["bot-discord-slack", "Discord.js / Pycord / Slack Bolt", "https://github.com/discordjs/discord.js", "Community, voice & ops Slack/Discord bots"],
    ["bot-omnichannel-typebot", "Botpress / Rasa / Typebot", "https://github.com/baptisteArno/typebot.io", "Unified web/WhatsApp/Instagram conversational flows"],
    ["bot-web-crawlee", "Crawlee / Playwright Stealth / Nodriver", "https://github.com/apify/crawlee", "Resilient web monitoring & browser automation bots"],
    ["bot-markets-ccxt", "Freqtrade / Hummingbot / CCXT", "https://github.com/freqtrade/freqtrade", "Market telemetry & strategy simulation bots"],
    ["bot-voice-pipecat", "Pipecat / LiveKit Agents / Asterisk", "https://github.com/pipecat-ai/pipecat", "Sub-500ms conversational voice bots"],
    ["bot-sim-mineflayer", "Mineflayer / Gymnasium / PettingZoo", "https://github.com/PrismarineJS/mineflayer", "Autonomous simulated 3D environment agents"],
    ["bot-crm-flowise", "Chatwoot SDK / Dify / Flowise", "https://github.com/FlowiseAI/Flowise", "24/7 RAG support & store assistant bots"],
    ["bot-compiler-copier", "Cookiecutter / Copier / Docker", "https://github.com/copier-org/copier", "One-click deployable project & bot scaffolding"],
  ]),
  ...packGroup("v21_2_nvidia_ms_xai_blueprints", [
    ["nvidia-nemo-agent", "NVIDIA NeMo Agent Toolkit", "https://github.com/NVIDIA/NeMo-Agent-Toolkit", "Multi-bot orchestration & latency profiling"],
    ["nvidia-gen-examples", "NVIDIA GenerativeAI Blueprints", "https://github.com/NVIDIA/GenerativeAIExamples", "Production customer-support & document RAG blueprints"],
    ["nvidia-guardrails", "NVIDIA NeMo Guardrails", "https://github.com/NVIDIA/NeMo-Guardrails", "Programmable policy & safety rails for bots"],
    ["nvidia-isaac-lab", "NVIDIA Isaac Lab & Sim", "https://github.com/isaac-sim/IsaacLab", "3D robotic control & physics simulation"],
    ["nvidia-ace", "NVIDIA ACE Digital Human", "https://developer.nvidia.com/ace", "Interactive real-time 3D lip-sync voice bots"],
    ["nvidia-triton", "NVIDIA Triton Inference Server", "https://github.com/triton-inference-server/server", "Concurrent GPU model batching & serving"],
    ["nvidia-rapids", "NVIDIA RAPIDS (cuDF / cuGraph)", "https://github.com/rapidsai/cudf", "GPU-accelerated SEO & graph analytics"],
    ["ms-bot-framework", "Microsoft Bot Framework SDK", "https://github.com/microsoft/botbuilder-js", "Enterprise conversational channel adapters"],
    ["ms-teams-ai", "Microsoft Teams AI Library", "https://github.com/microsoft/teams-ai", "Context-aware workspace action bots"],
    ["ms-graphrag", "Microsoft GraphRAG", "https://github.com/microsoft/graphrag", "Hierarchical entity-relationship bot memory"],
    ["ms-promptflow", "Microsoft Prompt flow", "https://github.com/microsoft/promptflow", "DAG execution evaluation & prompt workflows"],
    ["ms-tinytroupe", "Microsoft TinyTroupe", "https://github.com/microsoft/TinyTroupe", "Simulated persona testing for products & SEO"],
    ["ms-rd-agent", "Microsoft RD-Agent", "https://github.com/microsoft/RD-Agent", "Autonomous R&D hypothesis & feature evolution"],
    ["ms-powertoys", "Microsoft PowerToys & WinAppDriver", "https://github.com/microsoft/PowerToys", "Native Windows UI automation & window HUD hooks"],
    ["xai-grok-1", "xAI Grok-1 Open Architecture", "https://github.com/xai-org/grok-1", "314B MoE sparse routing architecture reference"],
    ["xai-grok-prompts", "xAI Official Prompts", "https://github.com/xai-org/grok-prompts", "Direct live-web reasoning system prompts"],
    ["xai-cookbook", "xAI Agentic Cookbook", "https://github.com/xai-org/xai-cookbook", "Real-time search, trends & SEO workflows"],
    ["twikit-pulse", "Twikit / Nitter-OSS Social Pulse", "https://github.com/d60/twikit", "Live topic momentum without paid keys"],
    ["pytrends-seo", "pytrends SEO Pulse", "https://github.com/GeneralMills/pytrends", "Live regional keyword discovery for SEO bots"],
    ["news-please-searx", "SearXNG + News-Please", "https://github.com/fhamborg/news-please", "Continuous structured news extraction for SEO"],
    ["agentops-telemetry", "AgentOps Bot Telemetry", "https://github.com/AgentOps-AI/agentops", "Live agent trace, latency & task audit metrics"],
  ]),
  ...packGroup("v21_4_hyper_custom_spec_robotics", [
    ["spec-zod-yaml", "JSON Schema + YAML Spec + Zod", "https://github.com/colinhacks/zod", "Strict schema compiler for any user requirement"],
    ["spec-parlant", "Parlant Behavioral Guidelines + Card V2", "https://github.com/emcie-co/parlant", "Exact conditional rule adherence in bots"],
    ["spec-xstate-rete", "XState v5 + Rete.js + LiteGraph", "https://github.com/statelyai/xstate", "Visual & state-machine decision workflows"],
    ["spec-style-dictionary", "Style Dictionary + Tailwind AST", "https://github.com/amzn/style-dictionary", "Dynamic design token & brand theme compilation"],
    ["spec-ortools-z3", "Google OR-Tools + Z3 Solver", "https://github.com/google/or-tools", "Mathematical scheduling, budget & constraint optimization"],
    ["robotics-ros2", "ROS 2 (Robot Operating System)", "https://github.com/ros2/ros2", "Standard pub/sub robotics & actuator middleware"],
    ["robotics-lerobot", "HuggingFace LeRobot & OpenVLA", "https://github.com/huggingface/lerobot", "Vision-language-action manipulation policies"],
    ["robotics-gazebo-mujoco", "Gazebo Sim + DeepMind MuJoCo", "https://github.com/google-deepmind/mujoco", "3D rigid-body physics verification prior to actuation"],
    ["robotics-px4-mavsdk", "PX4 Autopilot & MAVSDK", "https://github.com/PX4/PX4-Autopilot", "Autonomous drone waypoint & telemetry control"],
    ["robotics-esphome-ha", "Home Assistant / ESPHome / PlatformIO", "https://github.com/esphome/esphome", "ESP32/Arduino sensors & smart relay firmware"],
    ["robotics-cadquery-klipper", "CadQuery / OpenSCAD / Klipper", "https://github.com/CadQuery/cadquery", "Parametric 3D mechanical CAD & 3D print control"],
    ["robotics-zenoh-mqtt", "Eclipse Zenoh & Mosquitto MQTT", "https://github.com/eclipse-zenoh/zenoh", "Sub-millisecond robotics & IoT telemetry bus"],
    ["robotics-opencv-yolo", "OpenCV / YOLO / MediaPipe Vision", "https://github.com/opencv/opencv", "Real-time object tracking & industrial QA vision"],
  ]),
];

// 100 Mobile Diagnostics, Repair, Anti-Malware & Shop Tools (v22.0 - v22.1)
export const V22_MOBILE_REPAIR_100_TOOLS: readonly MasterSourceEntry[] = [
  ...packGroup("v22_mobile_adb_transfer_25", [
    ["mob-tango-webadb", "Tango ADB (@yume-chan/adb)", "https://github.com/yume-chan/ya-webadb", "Zero-install browser WebUSB Android diagnostics"],
    ["mob-ppadb", "pure-python-adb (ppadb)", "https://github.com/Swind/pure-python-adb", "Python ADB sidecar automation"],
    ["mob-adb-shell", "adb-shell", "https://github.com/JeffLIrion/adb_shell", "USB/TCP Android shell diagnostics"],
    ["mob-qtscrcpy", "QtScrcpy", "https://github.com/barry-ran/QtScrcpy", "60fps low-latency screen mirroring"],
    ["mob-ws-scrcpy", "ws-scrcpy", "https://github.com/NetrisTV/ws-scrcpy", "Browser WebSocket phone control console"],
    ["mob-gnirehtet", "gnirehtet Reverse Tether", "https://github.com/Genymobile/gnirehtet", "Share repair PC internet to client phone over USB"],
    ["mob-openmtp", "OpenMTP", "https://github.com/ganeshrvel/openmtp", "High-speed MTP media backup before wipe"],
    ["mob-aft-mtp", "Android File Transfer CLI", "https://github.com/whoozle/android-file-transfer-linux", "Automated CLI DCIM backup"],
    ["mob-kdeconnect", "KDE Connect", "https://github.com/KDE/kdeconnect-kde", "Wireless clipboard & file transfer bridge"],
    ["mob-localsend", "LocalSend", "https://github.com/localsend/localsend", "Offline P2P encrypted customer file transfer"],
    ["mob-betteradb", "BetterADB", "https://github.com/topics/adb", "Multi-device parallel USB diagnostics"],
    ["mob-adb-sync", "google/adb-sync", "https://github.com/google/adb-sync", "Resumable delta folder backup over USB"],
    ["mob-abe", "Android Backup Extractor", "https://github.com/nelenkov/android-backup-extractor", "Inspect user-authorized .ab archives"],
    ["mob-openandroidbackup", "OpenAndroidBackup", "https://github.com/mrrfv/open-android-backup", "Guided customer backup before servicing"],
    ["mob-sms-ie", "SMS Import / Export", "https://github.com/tmo1/sms-ie", "Portable JSON SMS/Call/Contact preservation"],
    ["mob-heimdall", "Heimdall (Samsung Flash)", "https://github.com/Benjamin-Dobell/Heimdall", "Authorized Samsung stock firmware recovery"],
    ["mob-thor-flash", "Thor Flash Utility", "https://github.com/topics/samsung-flash", "CLI Samsung recovery image installer"],
    ["mob-mtkclient", "mtkclient", "https://github.com/bkerler/mtkclient", "MediaTek bootloader/partition backup & unbrick"],
    ["mob-edl-qcom", "Qualcomm edl Tool", "https://github.com/bkerler/edl", "Qualcomm EDL firmware rescue & readback"],
    ["mob-spd-dump", "spd_dump (Unisoc)", "https://github.com/ilyakurdyukov/spreadtrum_flash", "Unisoc/Spreadtrum stock recovery flasher"],
    ["mob-fastboot-enhance", "FastbootEnhance", "https://github.com/libxzr/FastbootEnhance", "Dynamic partition & payload.bin verification"],
    ["mob-payload-dumper", "payload-dumper-go", "https://github.com/ssut/payload-dumper-go", "Fast OTA boot/vendor image extractor"],
    ["mob-appmanager", "AppManager", "https://github.com/MuntashirAkon/AppManager", "Detailed Android package permission & tracker viewer"],
    ["mob-shizuku", "Shizuku", "https://github.com/RikkaApps/Shizuku", "Elevated non-root maintenance APIs"],
    ["mob-pidcat", "Logcat-Color / Pidcat", "https://github.com/JakeWharton/pidcat", "Readable crash log triage during repair"],
  ]),
  ...packGroup("v22_mobile_ios_apple_25", [
    ["ios-pymobiledevice3", "pymobiledevice3", "https://github.com/doronz88/pymobiledevice3", "Complete Python iOS diagnostics & backup protocol"],
    ["ios-idevicerestore", "idevicerestore", "https://github.com/libimobiledevice/idevicerestore", "Authorized IPSW recovery/restore outside iTunes"],
    ["ios-ideviceinstaller", "ideviceinstaller", "https://github.com/libimobiledevice/ideviceinstaller", "Inspect installed iOS IPA inventory"],
    ["ios-ifuse", "iFuse", "https://github.com/libimobiledevice/ifuse", "Mount user media folders directly via USB"],
    ["ios-libirecovery", "libirecovery", "https://github.com/libimobiledevice/libirecovery", "Exit Recovery/DFU boot loops safely"],
    ["ios-usbmuxd", "usbmuxd", "https://github.com/libimobiledevice/usbmuxd", "Concurrent multi-iPhone USB multiplexing"],
    ["ios-futurerestore", "futurerestore", "https://github.com/futurerestore/futurerestore", "Signed iOS restoration utility"],
    ["ios-tsschecker", "tsschecker", "https://github.com/tihmstar/tsschecker", "Verify Apple SHSH signing windows"],
    ["ios-ipsw", "blacktop/ipsw", "https://github.com/blacktop/ipsw", "Firmware & kernelcache structural inspector"],
    ["ios-panic-analyzer", "iDevicePanicLogAnalyzer", "https://github.com/waynebonc/iDeviceLogAnalyzer-public", "Translate Apple panic logs into failing hardware flex/IC"],
    ["ios-backup-decrypt", "iphone_backup_decrypt", "https://github.com/jsharkey13/iphone_backup_decrypt", "Owner-authorized encrypted backup recovery"],
    ["ios-go-ios", "danielpaulus/go-ios", "https://github.com/danielpaulus/go-ios", "Go cross-platform iOS telemetry daemon"],
    ["ios-tidevice", "tidevice", "https://github.com/alibaba/taobao-iphone-device", "Live iOS CPU, FPS & battery thermal profiling"],
    ["ios-uxplay", "UxPlay AirPlay Mirror", "https://github.com/FDH2/UxPlay", "Wireless customer demo & screen verification"],
    ["ios-altserver", "AltServer-Linux", "https://github.com/NyaMisty/AltServer-Linux", "Diagnostic utility sideloading helper"],
    ["ios-cfgutil", "Apple Configurator CLI", "https://github.com/topics/apple-configurator", "Supervised fleet provisioning profiles"],
    ["ios-libplist", "libplist", "https://github.com/libimobiledevice/libplist", "Parse Apple binary/XML property list diagnostics"],
    ["ios-glue", "libimobiledevice-glue", "https://github.com/libimobiledevice/libimobiledevice-glue", "Windows/Linux USB driver stability layer"],
    ["ios-ibattery", "iBatteryInfo Extractor", "https://github.com/topics/ios-battery", "Read GasGauge design vs FCC mAh & cycle counts"],
    ["ios-img4tool", "img4tool", "https://github.com/tihmstar/img4tool", "Inspect IMG4 hardware component manifests"],
    ["ios-activation", "libideviceactivation", "https://github.com/libimobiledevice/libideviceactivation", "Check post-repair baseband activation state"],
    ["ios-crashreport", "idevicecrashreport", "https://github.com/libimobiledevice/libimobiledevice", "Pull baseband/SpringBoard sysdiagnose logs"],
    ["ios-screenshot", "idevicescreenshot", "https://github.com/libimobiledevice/libimobiledevice", "Attach crisp display proofs to repair receipts"],
    ["ios-usb-drivers", "Apple USB Driver Installer OSS", "https://github.com/topics/usbmuxd", "Lightweight Windows Apple Mobile Device USB support"],
    ["ios-sensors-parser", "iOS Diagnostics Parser", "https://github.com/topics/sysdiagnose", "Audit FaceID, Touch, Gyro & Barometer health"],
  ]),
  ...packGroup("v22_mobile_av_debloat_25", [
    ["av-hypatia", "Hypatia Android AV", "https://github.com/Divested-Mobile/Hypatia", "Open-source signature malware scanner"],
    ["av-apkid", "APKiD", "https://github.com/rednaga/APKiD", "Identify obfuscators, packers & suspicious APK wrappers"],
    ["av-quark-engine", "Quark-Engine", "https://github.com/quark-engine/quark-engine", "Dalvik taint & malicious behavior scoring"],
    ["av-droidlysis", "DroidLysis", "https://github.com/cryptax/droidlysis", "Automated suspicious URL & permission triage"],
    ["av-androzoo", "AndroZoo Open Metadata", "https://androzoo.uni.lu/", "Million-app baseline reputation metadata"],
    ["av-exodus", "Exodus Privacy Standalone", "https://github.com/Exodus-Privacy/exodus-standalone", "Audit embedded adware & tracker SDKs"],
    ["av-classyshark", "ClassyShark (Google)", "https://github.com/google/android-classyshark", "Inspect APK dex/manifest structure fast"],
    ["av-jadx", "Jadx Decompiler", "https://github.com/skylot/jadx", "Inspect decompiled Java/Kotlin package safety"],
    ["av-apktool", "Apktool", "https://github.com/iBotPeaches/Apktool", "Decode AndroidManifest permissions & receivers"],
    ["av-canta", "Canta Debloater", "https://github.com/samolego/Canta", "Safe non-root bloatware removal list"],
    ["av-uad-scripts", "Universal Android Debloater", "https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation", "Community-vetted carrier bloat cleanup"],
    ["av-sdmaid-se", "SD Maid SE Open Core", "https://github.com/d4rken-org/sdmaid-se", "Orphan cache, corpse & thumbnail sweep"],
    ["av-rethinkdns", "RethinkDNS / NetGuard Rules", "https://github.com/celzero/rethink-app", "On-device firewall blocking rogue beacons"],
    ["av-adguard-dns", "AdGuard / Pi-hole DNS Filters", "https://github.com/AdguardTeam/AdguardFilters", "Block pop-up adware & phishing domains"],
    ["av-pirogue", "PiRogue Tool Suite", "https://github.com/PiRogue-Tool-Suite", "Inspect live Wi-Fi network egress from serviced phones"],
    ["av-tinycheck", "TinyCheck (Spyware Capture)", "https://github.com/KasperskyLab/TinyCheck", "Passive Wi-Fi IOC check for stalkerware"],
    ["av-mvt-iocs", "MVT IOCs Database", "https://github.com/mvt-project/mvt-indicators", "STIX indicators for spyware detection"],
    ["av-amnesty-lab", "Amnesty Tech Investigations", "https://github.com/AmnestyTech/investigations", "Backup & sysdiagnose forensic IOC matchers"],
    ["av-malwarebazaar", "MalwareBazaar Hash Check", "https://bazaar.abuse.ch/", "SHA-256 hash verification of suspicious APKs"],
    ["av-safe-clean", "Droid Safe Clean", "https://developer.android.com/tools/adb", "Clear `.tmp`, thumbnail cache & trimmed partitions"],
    ["av-perm-auditor", "Permissions Auditor", "https://developer.android.com/tools/dumpsys", "Flag background camera/mic/SMS access"],
    ["av-autostart-blocker", "Autostart Blocker (ADB)", "https://developer.android.com/tools/adb", "Disable battery-draining boot receivers"],
    ["av-battery-historian", "Google Battery Historian", "https://github.com/google/battery-historian", "Pinpoint wakelock & battery drain offenders"],
    ["av-thermal-cli", "Thermal Monitor CLI", "https://developer.android.com/tools/dumpsys", "Read live PMIC/Battery/SoC temperatures"],
    ["av-ncdu-storage", "Storage Analyzer CLI (ncdu)", "https://dev.yorhel.nl/ncdu", "Find multi-GB hidden cache/dump directories"],
  ]),
  ...packGroup("v22_mobile_hardware_shop_25", [
    ["hw-testdisk-photorec", "TestDisk & PhotoRec", "https://github.com/cgsecurity/testdisk", "Carve lost DCIM/documents from damaged SD/storage"],
    ["hw-scalpel-foremost", "Scalpel & Foremost", "https://github.com/sleuthkit/scalpel", "Signature-based media sector recovery"],
    ["hw-sleuthkit", "The Sleuth Kit (TSK)", "https://github.com/sleuthkit/sleuthkit", "EXT4/F2FS/FAT32 partition integrity repair"],
    ["hw-ddrescue", "GNU ddrescue", "https://www.gnu.org/software/ddrescue/", "Rescue unreadable blocks before chip failure"],
    ["hw-exiftool", "ExifTool", "https://github.com/exiftool/exiftool", "Reindex timestamps on recovered customer media"],
    ["hw-untrunc", "Untrunc Video Repair", "https://github.com/anthwlock/untrunc", "Rebuild truncated MP4/MOV moov atoms"],
    ["hw-ifixit-api", "iFixit Guides Open API", "https://www.ifixit.com/api/2.0/doc", "Teardown steps & torque specs per phone model"],
    ["hw-gsmarena-specs", "GSMArena Open Specs", "https://github.com/topics/gsmarena", "Verify factory battery mAh, display & SoC specs"],
    ["hw-imei-tacdb", "Osmocom IMEI/TAC Database", "https://github.com/topics/tac-database", "Identify genuine OEM model offline via 8-digit TAC"],
    ["hw-opencellid", "OpenCelliD / MLS", "https://www.opencellid.org/", "Verify cellular tower & RF antenna signal after repair"],
    ["hw-iperf3", "iPerf3 RF Throughput", "https://github.com/esnet/iperf", "Benchmark repaired Wi-Fi/BT throughput cleanly"],
    ["hw-fio", "Fio UFS/eMMC Benchmark", "https://github.com/axboe/fio", "Measure flash read/write health for aging NAND"],
    ["hw-touchscreen-grid", "Touchscreen Multi-Touch Canvas", "https://developer.mozilla.org/en-US/docs/Web/API/Touch_events", "Test dead digitizer zones prior to adhesive seal"],
    ["hw-dead-pixel", "Dead-Pixel & Burn-In Tester", "https://github.com/topics/pixel-test", "Full-gamut RGB display uniform pixel QA"],
    ["hw-webaudio-mic", "WebAudio Mic & Speaker QA", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API", "Frequency sweep testing earpiece, mic & buzzer"],
    ["hw-sensor-tester", "Gyro, Compass & Proximity QA", "https://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs", "Verify IMU calibration & proximity sensor post-screen"],
    ["hw-openboardview", "OpenBoardView", "https://github.com/OpenBoardView/OpenBoardView", "Inspect `.brd` motherboard pads & diode lines"],
    ["hw-kicad", "KiCad Schematics", "https://github.com/KiCad/kicad-source-mirror", "Review PMIC/charging circuit pathways"],
    ["hw-sigrok-pulseview", "sigrok & PulseView", "https://github.com/sigrokproject/pulseview", "Decode I2C/SPI power rail logic waveforms"],
    ["hw-peppermint-ticket", "RepairShopr-OSS / Peppermint", "https://github.com/Peppermint-Lab/peppermint", "Track customer ticket states (Intake -> Ready)"],
    ["hw-snipe-it", "Snipe-IT Spare Parts", "https://github.com/snipe/snipe-it", "Track serialized screens, batteries & flex cables"],
    ["hw-part-db", "Part-DB Micro-Components", "https://github.com/Part-DB/Part-DB-server", "Catalog board-level PMICs, inductors & caps"],
    ["hw-usb-ids", "USB-IDs (hwdata) Repository", "https://github.com/vcrhonek/hwdata", "Auto-detect EDL/DFU/BROM VID:PID chip states"],
    ["hw-pnpdevice", "PowerShell Get-PnpDevice Recovery", "https://learn.microsoft.com/en-us/powershell", "Auto-diagnose Windows COM/ADB/Apple driver flags"],
    ["hw-thermal-ticket", "ESC/POS Repair Receipt + QR", "https://github.com/kaspi-pos", "58mm/80mm intake & health ticket with live tracking QR"],
  ]),
];

export const V20_TO_V22_MASTER_CATALOG: readonly MasterSourceEntry[] = [
  ...V20_2_DEFENSIVE_SECURITY,
  ...V20_3_FULLSTACK_ENGINEERING,
  ...V20_4_SYSTEMS_KERNEL_DEVOPS,
  ...V21_BOT_FACTORY_BLUEPRINTS_ROBOTICS,
  ...V22_MOBILE_REPAIR_100_TOOLS,
];

export function searchV20ToV22Catalog(query: string, limit = 12): MasterSourceEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return V20_TO_V22_MASTER_CATALOG.slice(0, limit);
  return V20_TO_V22_MASTER_CATALOG.filter(
    (entry) =>
      entry.name.toLowerCase().includes(q) ||
      entry.role.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q) ||
      entry.group.toLowerCase().includes(q)
  ).slice(0, limit);
}

export function getV20ToV22Counts(): {
  v20_2_security: number;
  v20_3_fullstack: number;
  v20_4_systems: number;
  v21_bots_blueprints_robotics: number;
  v22_mobile_repair: number;
  totalUnique: number;
} {
  const uniqueIds = new Set(V20_TO_V22_MASTER_CATALOG.map((e) => e.id));
  return {
    v20_2_security: V20_2_DEFENSIVE_SECURITY.length,
    v20_3_fullstack: V20_3_FULLSTACK_ENGINEERING.length,
    v20_4_systems: V20_4_SYSTEMS_KERNEL_DEVOPS.length,
    v21_bots_blueprints_robotics: V21_BOT_FACTORY_BLUEPRINTS_ROBOTICS.length,
    v22_mobile_repair: V22_MOBILE_REPAIR_100_TOOLS.length,
    totalUnique: uniqueIds.size,
  };
}

/**
 * v23.0 — Real-World Omniscience & Every-Scenario Pack (100% Free & Zero-Key)
 */
export const V23_REAL_WORLD_OMNISCIENCE_CATALOG: readonly MasterSourceEntry[] = packGroup("v23_real_world_omniscience", [
  ["v23-osrm", "OSRM Driving & Logistics Router", "https://project-osrm.org/", "Live route geometry, travel duration & distance across Morocco & worldwide"],
  ["v23-valhalla", "Valhalla + Overpass Geo Engine", "https://valhalla.github.io/valhalla/", "Isochrone routing, turn-by-turn & OpenStreetMap amenity discovery"],
  ["v23-usgs-quake", "USGS Earthquake Live GeoJSON", "https://earthquake.usgs.gov/", "Real-time seismic magnitude feeds & disaster alerts"],
  ["v23-nasa-eonet", "NASA EONET + APOD Open APIs", "https://api.nasa.gov/", "Natural hazard tracking & astronomy observation data"],
  ["v23-celestrak", "Celestrak TLE Satellite Tracker", "https://celestrak.org/", "Orbital TLE ephemeris & satellite pass calculations"],
  ["v23-obd2-dtc", "OBD-II Open PIDs & P0xxx Decoder", "https://github.com/brendan-w/python-OBD", "Decode automotive engine fault DTCs & sensor diagnostics"],
  ["v23-nhtsa", "NHTSA Vehicles & Recalls API", "https://vpic.nhtsa.dot.gov/", "Vehicle make/model specs, VIN metadata & safety recalls"],
  ["v23-openfda-rx", "OpenFDA + NLM RxNav + Disease.sh", "https://rxnav.nlm.nih.gov/", "Public clinical terminology, RxCUI drug concepts & epidemiology stats"],
  ["v23-wger", "USDA FoodData + wger Workout API", "https://wger.de/", "Nutritional macro lookups & multi-language workout programming"],
  ["v23-courtlistener", "CourtListener + OpenLaws Corpus", "https://www.courtlistener.com/", "Open public legal opinions, licensing templates & contract structure"],
  ["v23-openlibrary", "OpenLibrary + OpenAlex (250M+)", "https://openlibrary.org/", "Millions of free educational books & scholarly papers"],
  ["v23-gbif", "GBIF + SoilGrids + OpenAQ", "https://www.gbif.org/", "Global biodiversity species taxonomy, soil metrics & air quality"],
  ["v23-frankfurter", "Frankfurter ECB + World Bank FX", "https://www.frankfurter.app/", "Central bank foreign exchange & macroeconomic indicators"],
  ["v23-themealdb", "TheMealDB & Recipe Catalog", "https://www.themealdb.com/api.php", "Structured global culinary recipes by ingredient or region"],
  ["v23-opensky", "OpenSky Network + ADS-B Live Flights", "https://opensky-network.org/", "Real-time airspace aircraft vectors & country metadata"],
]);

export const ALL_SOVEREIGN_MASTER_CATALOG: readonly (MasterSourceEntry | V24PlusSourceEntry)[] = [
  ...V20_TO_V22_MASTER_CATALOG,
  ...V23_REAL_WORLD_OMNISCIENCE_CATALOG,
  ...V24_TO_V28_MASTER_CATALOG,
];
