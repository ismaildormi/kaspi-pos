import type { SovereignPackSourceEntry, SovereignPackVersion } from "@/lib/zebra-x/core/sovereign-pack-types";
import type { CognitiveClusterId } from "@/lib/zebra-x/core/cognitive-brain-registry";

type OmegaTuple = [
  pack: Extract<SovereignPackVersion, "v88.0" | "v89.0" | "v90.1">,
  idSlug: string,
  name: string,
  url: string,
  clusterId: CognitiveClusterId,
  clientCapable: boolean,
  roleAr: string,
];

const VERIFIED_V88_V90_ROWS: readonly OmegaTuple[] = [
  // v88.0 — Secrets 8..12 (Online Distillation, Cyber-Immune, Hyper-Local Geo, Full-Duplex Audio-Vision, Morphing UI)
  ["v88.0", "distillkit", "DistillKit (Arcee Distillation)", "https://github.com/arcee-ai/DistillKit", "code_ide_and_surgical_editing", false, "نقل ذكاء النماذج الكبيرة إلى نماذج خفيفة سريعة مجاناً."],
  ["v88.0", "vowpal_wabbit", "Vowpal Wabbit (Contextual Bandits)", "https://github.com/VowpalWabbit/vowpal_wabbit", "kaspi_pos_merchant_intelligence", true, "تحسين التوصيات والقرارات لحظياً عبر التغذية الراجعة."],
  ["v88.0", "distilabel", "Distilabel (Trajectory Curator)", "https://github.com/argilla-io/distilabel", "code_ide_and_surgical_editing", false, "تصفية المحادثات والأكواد الناجحة إلى دروس تدريبية عالية الجودة."],
  ["v88.0", "mergekit", "MergeKit (Model TIES Breeding)", "https://github.com/arcee-ai/mergekit", "elastic_swarm_3_6_12_and_worker_bots", false, "دمج الخبرات والقدرات الأسبوعية في نموذج موحد."],
  ["v88.0", "lorax", "LoRAX (Multi-Adapter Serving)", "https://github.com/predibase/lorax", "code_ide_and_surgical_editing", false, "تشغيل عشرات المهارات المقطّرة فوق نموذج أساسي واحد."],
  ["v88.0", "purplellama", "PurpleLlama & Prompt Guard", "https://github.com/meta-llama/PurpleLlama", "sovereign_os_shell_file_surgeon_and_sentinel", true, "كشف حقن الأوامر ومحاولات التلاعب في المدخلات والصفحات."],
  ["v88.0", "nemo_guardrails", "NeMo Guardrails", "https://github.com/NVIDIA/NeMo-Guardrails", "sovereign_os_shell_file_surgeon_and_sentinel", false, "تقييد المخرجات بضوابط السلامة والمسار الآمن."],
  ["v88.0", "tenseal", "TenSEAL (Homomorphic Encryption)", "https://github.com/OpenMined/TenSEAL", "sovereign_os_shell_file_surgeon_and_sentinel", false, "حسابات وإحصائيات مشفرة دون كشف البيانات الخام."],
  ["v88.0", "cosign", "Sigstore Cosign (Artifact Sign)", "https://github.com/sigstore/cosign", "sovereign_os_shell_file_surgeon_and_sentinel", false, "توقيع رقمي للأدوات والإصدارات لمنع العبث."],
  ["v88.0", "simplewebauthn", "SimpleWebAuthn (Passkey Lock)", "https://github.com/MasterKale/SimpleWebAuthn", "sovereign_os_shell_file_surgeon_and_sentinel", true, "تأمين الإعدادات الحساسة ببصمة الجهاز Passkey."],
  ["v88.0", "valhalla_routing", "Valhalla (Open Routing Engine)", "https://github.com/valhalla/valhalla", "live_search_and_47_public_apis", true, "حساب مسارات التوصيل والوقت واللوجستيك للمتاجر."],
  ["v88.0", "maplibre_gl", "MapLibre GL JS (Vector Maps)", "https://github.com/maplibre/maplibre-gl-js", "live_search_and_47_public_apis", true, "خرائط تفاعلية ثلاثية الأبعاد بلا مفاتيح مدفوعة."],
  ["v88.0", "turfjs", "Turf.js (Geospatial Analysis)", "https://github.com/Turfjs/turf", "live_search_and_47_public_apis", true, "حساب المسافات والمناطق الجغرافية وكثافة المنافسين."],
  ["v88.0", "prophet", "Prophet (Seasonal Forecaster)", "https://github.com/facebook/prophet", "kaspi_pos_merchant_intelligence", false, "التنبؤ بالمبيعات الموسمية والأعياد تلقائياً."],
  ["v88.0", "nager_date", "Nager.Date (Holiday Calendar)", "https://github.com/nager/Nager.Date", "kaspi_pos_merchant_intelligence", true, "معرفة العطل الرسمية للتخطيط الاستباقي للمخزون."],
  ["v88.0", "pipecat", "Pipecat (Real-Time Audio-Vision)", "https://github.com/pipecat-ai/pipecat", "games_3d_video_and_audio", true, "بث صوتي وبصري متزامن مع المقاطعة الفورية Barge-In."],
  ["v88.0", "moshi_kyutai", "Moshi (Full-Duplex Speech AI)", "https://github.com/kyutai-labs/moshi", "games_3d_video_and_audio", false, "تفاعل صوتي يسمع ويتحدث في نفس اللحظة."],
  ["v88.0", "silero_vad", "Silero VAD (Sub-ms Speech Gate)", "https://github.com/snakers4/silero-vad", "games_3d_video_and_audio", true, "اكتشاف بداية الصوت في أقل من 1ms للمقاطعة الفورية."],
  ["v88.0", "moonshine_stt", "Moonshine (Low-Latency STT)", "https://github.com/usefulsensors/moonshine", "games_3d_video_and_audio", true, "تحويل الكلام المنطوق إلى نص لحظياً بعتاد خفيف."],
  ["v88.0", "kokoro_tts", "Kokoro-82M (Fast Neural TTS)", "https://github.com/hexgrad/kokoro", "games_3d_video_and_audio", true, "توليد صوت نقي وسريع (<80ms) مجاناً."],
  ["v88.0", "rnnoise", "RNNoise (Noise Suppression)", "https://github.com/xiph/rnnoise", "games_3d_video_and_audio", true, "تنقية الصوت من ضوضاء الخلفية داخل المتصفح."],
  ["v88.0", "seamless_comm", "SeamlessM4T (Live Translation)", "https://github.com/facebookresearch/seamless_communication", "games_3d_video_and_audio", false, "ترجمة صوتية فورية متعددة اللغات بنبرة طبيعية."],
  ["v88.0", "vega_lite", "Vega-Lite (Interactive Charts)", "https://github.com/vega/vega-lite", "pdf_office_and_documents", true, "توليد رسوم بيانية تفاعلية وتصفيتها داخل المحادثة."],
  ["v88.0", "tanstack_table", "TanStack Table (Live Data Grids)", "https://github.com/TanStack/table", "pdf_office_and_documents", true, "جداول بيانات قابلة للفرز والبحث والتصدير حياً."],
  ["v88.0", "excalidraw", "Excalidraw (Interactive Canvas)", "https://github.com/excalidraw/excalidraw", "image_svg_and_vision_studio", true, "مخططات معمارية قابلة للتعديل والسحب مباشرة."],
  ["v88.0", "model_viewer", "Google Model-Viewer (3D & AR)", "https://github.com/google/model-viewer", "games_3d_video_and_audio", true, "معاينة مجسمات 3D والتفاعل معها بالواقع المعزز."],
  ["v88.0", "adaptive_cards", "AdaptiveCards (JSON-to-UI)", "https://github.com/microsoft/AdaptiveCards", "google_ai_studio_dual_brand_workspace", true, "تحويل مخططات JSON إلى بطاقات واجهة تفاعلية فورية."],

  // v89.0 — Revolutionary Action-First UX
  ["v89.0", "remotion", "Remotion (Programmatic Video)", "https://github.com/remotion-dev/remotion", "games_3d_video_and_audio", true, "توليد فيديوهات ومقاطع موشن برمجياً داخل المتصفح."],
  ["v89.0", "webcontainers", "WebContainers (Browser Node OS)", "https://github.com/stackblitz/webcontainer-core", "code_ide_and_surgical_editing", true, "تشغيل Node.js وخوادم حية مباشرة داخل متصفح الزائر."],
  ["v89.0", "sesame_csm", "Sesame CSM (Natural Prosody)", "https://github.com/SesameAILabs/csm", "games_3d_video_and_audio", false, "نطق بشري طبيعي مع وقفات وتعبير صوتي حي."],
  ["v89.0", "faster_whisper", "Faster-Whisper (Multi-Dialect STT)", "https://github.com/SYSTRAN/faster-whisper", "games_3d_video_and_audio", true, "نسخ دقيق للكلام العربي واللهجات المحلية."],
  ["v89.0", "framer_motion", "Framer Motion (Fluid UI Physics)", "https://github.com/framer/motion", "google_ai_studio_dual_brand_workspace", true, "حركات انتقال ناعمة في الواجهات التفاعلية."],
  ["v89.0", "cmdk", "Cmdk (Instant Command Palette)", "https://github.com/pacocoursey/cmdk", "google_ai_studio_dual_brand_workspace", true, "تنفيذ الأوامر والأدوات فوراً باختصار لوحة المفاتيح."],
  ["v89.0", "sonner", "Sonner (Action Toast Alerts)", "https://github.com/emilkowalski/sonner", "google_ai_studio_dual_brand_workspace", true, "إشعارات ذكية بأزرار تنفيذ فورية."],
  ["v89.0", "dompurify", "DOMPurify (XSS Safe Widget UI)", "https://github.com/cure53/DOMPurify", "sovereign_os_shell_file_surgeon_and_sentinel", true, "تعقيم العناصر التفاعلية في المتصفح بأمان تام."],
  ["v89.0", "faker_js", "Faker (Realistic Sample Data)", "https://github.com/faker-js/faker", "code_ide_and_surgical_editing", true, "تعبئة النماذج ببيانات واقعية غنية بدل النصوص الفارغة."],
  ["v89.0", "jsbarcode", "JsBarcode (EAN-13 POS Labels)", "https://github.com/lindell/JsBarcode", "kaspi_pos_merchant_intelligence", true, "توليد باركود منتجات قابل للمسح والطباعة الحرارية."],

  // v90.1 — Dominance Secret #1: Extreme Scenario Adaptation, Anti-Fragile Crisis & TOPSIS Decision Intelligence
  ["v90.1", "ttt_pytorch", "TTT-LM (Test-Time Adaptation)", "https://github.com/test-time-training/ttt-lm-pytorch", "code_ide_and_surgical_editing", false, "تكييف الأوزان السريع مع السياقات النادرة وغير المألوفة."],
  ["v90.1", "mapie_uq", "MAPIE (Uncertainty Calibration)", "https://github.com/scikit-learn-contrib/MAPIE", "hardware_cad_voip_testing_and_physics", true, "قياس هامش الثقة والمخاطرة في الحالات الغامضة."],
  ["v90.1", "ftfy_healer", "ftfy (Corrupted Text Healer)", "https://github.com/rspeer/python-ftfy", "pdf_office_and_documents", true, "إصلاح النصوص المشوشة وأخطاء الترميز تلقائياً."],
  ["v90.1", "chaos_mesh", "Chaos Mesh (Fault Resilience)", "https://github.com/chaos-mesh/chaos-mesh", "hardware_cad_voip_testing_and_physics", false, "محاكاة الأعطال وانقطاع الشبكة لتحصين الأنظمة مسبقاً."],
  ["v90.1", "tenacity_py", "Tenacity (Smart Retry Breaker)", "https://github.com/jd/tenacity", "sovereign_os_shell_file_surgeon_and_sentinel", true, "آليات إعادة المحاولة وقواطع الدوائر لمنع الانهيار."],
  ["v90.1", "kopia_backup", "Kopia (Encrypted Snapshots)", "https://github.com/kopia/kopia", "zip_vfs_and_file_packaging", false, "نسخ احتياطي مشفر واستعادة فورية للمشاريع."],
  ["v90.1", "pydecision", "PyDecision (TOPSIS / AHP Matrix)", "https://github.com/Valdecy/pyDecision", "kaspi_pos_merchant_intelligence", true, "ترتيب القرارات الاستراتيجية متعددة المعايير بدقة رياضية."],
  ["v90.1", "botorch", "BoTorch (Bayesian Pareto Opt)", "https://github.com/pytorch/botorch", "hardware_cad_voip_testing_and_physics", false, "إيجاد النقطة الذهبية المثلى في الهندسة والتسعير."],
  ["v90.1", "salib", "SALib (Sensitivity Analysis)", "https://github.com/SALib/SALib", "hardware_cad_voip_testing_and_physics", true, "قياس حساسية نجاح المشاريع لتغيّر الأسعار والافتراضات."],
  ["v90.1", "highs_lp", "HiGHS (Linear Optimization)", "https://github.com/ERGO-Code/HiGHS", "kaspi_pos_merchant_intelligence", true, "توزيع الميزانيات والموارد بالبرمجة الخطية المثلى."],
  ["v90.1", "kiwix_tools", "Kiwix Tools (Offline Survival)", "https://github.com/kiwix/kiwix-tools", "airgapped_offline_vault_and_lan_mesh", true, "موسوعات ووثائق علمية كاملة تعمل أوفلاين عند الطوارئ."],
  ["v90.1", "scure_bip39", "Scure-BIP39 (Vault Recovery)", "https://github.com/paulmillr/scure-bip39", "sovereign_os_shell_file_surgeon_and_sentinel", true, "استعادة الهوية والمحفظة المعرفية بعبارات استرداد مشفرة."],
];

export const V88_V90_OMEGA_DOMINANCE_SOURCES: readonly SovereignPackSourceEntry[] = VERIFIED_V88_V90_ROWS.map(
  ([pack, idSlug, name, url, clusterId, clientCapable, roleAr], idx) => ({
    id: `${pack.replace(".", "_")}_${String(idx + 1).padStart(3, "0")}_${idSlug}`,
    pack,
    index: idx + 1,
    groupId: `${pack}_omega_group`,
    groupTitleAr:
      pack === "v88.0"
        ? "Tier-Omega v88.0: التقطير اللحظي + المناعة السيبرانية + الوعي المغربي + التزامن الحي + Generative UI"
        : pack === "v89.0"
        ? "Revolutionary UX v89.0: التنفيذ الفوري من أول 10 ثوانٍ"
        : "Dominance v90.1: التكيف اللحظي + الصمود ضد الأزمات + قرارات TOPSIS",
    clusterId,
    name,
    url,
    canonicalUrlVerified: true,
    vaultUri: `vault://heyuka/${pack}/${String(idx + 1).padStart(3, "0")}-${idSlug}`,
    mirrorStrategy: clientCapable ? "browser_webgpu_wasm" : "huggingface_xet_weights",
    clientComputeCapable: clientCapable,
    zeroKeyApiFree: true,
    roleAr,
  })
);
