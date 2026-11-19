import type { XZebraKeyScope } from "@/lib/zebra-x/api-auth";

export type StudioLocale = "ar" | "fr" | "en";

export type SpecializedProductId =
  | "3d-studio"
  | "background-studio"
  | "image-studio"
  | "video-studio"
  | "shorts-studio"
  | "coding-studio"
  | "audio-studio"
  | "conversion-studio"
  | "data-studio"
  | "web-studio"
  | "document-studio"
  | "automation-studio";

export interface SpecializedProductDefinition {
  id: SpecializedProductId;
  name: string;
  shortTag: string;
  tagline: Record<StudioLocale, string>;
  description: Record<StudioLocale, string>;
  capabilityIds: string[];
  recommendedScopes: XZebraKeyScope[];
  allowedApiEndpoints: string[];
  excludedTaskGuidance: string;
  specializedSystemPrompt: string;
  quickPrompts: Record<StudioLocale, string[]>;
  supportsEmbedWidget: boolean;
  sharedEngineDisclosure: Record<StudioLocale, string>;
}

export const SPECIALIZED_PRODUCTS: readonly SpecializedProductDefinition[] = [
  {
    id: "3d-studio",
    name: "HEYUKA 3D STUDIO",
    shortTag: "3D & GLB",
    tagline: {
      ar: "تصميم ومعالجة واستعراض المجسمات ثلاثية الأبعاد وملفات Blender/GLB",
      fr: "Création, inspection WebGL2 et scripts Blender/GLB 3D",
      en: "3D asset search, WebGL2 studio preview & Blender script workflows",
    },
    description: {
      ar: "مساحة متخصصة لمشاريع 3D: بحث حي في مكتبة PolyHaven و Openverse، معاينة تفاعلية Three.js، كتابة سكربتات `bpy` الجاهزة، وتشغيل توليد `.glb`/`.fbx` عند ربط عقدة Worker.",
      fr: "Espace dédié 3D : recherche temps réel PolyHaven, prévisualisation WebGL2, génération de scripts Blender `bpy` et export maillage via Worker.",
      en: "Focused 3D workspace: live PolyHaven/Openverse search, interactive WebGL2 Three.js inspection, executable Blender `bpy` scripts, and Worker-backed GLB generation.",
    },
    capabilityIds: ["polyhaven_3d_catalog_viewer", "generative_3d_mesh_worker"],
    recommendedScopes: ["3d:assets", "3d:generate", "chat:universal"],
    allowedApiEndpoints: ["/api/v1/3d/assets", "/api/v1/3d/generate"],
    excludedTaskGuidance: "Focus strictly on 3D geometry, PBR textures, HDRIs, glTF/GLB/FBX/BLEND workflows.",
    specializedSystemPrompt:
      "You are the HEYUKA 3D Studio Specialist inside the unified HEYUKA engine (by KASPI). Help users search real PBR/HDRI/GLB catalogs, write clean Blender Python (`bpy`) scene scripts, diagnose glTF mesh/UV/rig issues, and explain honestly when binary `.glb` synthesis requires a connected GPU Worker.",
    quickPrompts: {
      ar: [
        "ابحث عن أصول خشب أو كراسي 3D مع HDRI استوديو",
        "اكتب سكربت Blender `bpy` لتصدير مجسم منتج بصيغة GLB",
        "اشرح لي الفرق بين `.glb` و `.fbx` للويب و Blender",
      ],
      fr: [
        "Chercher des textures PBR marbre & HDRI studio",
        "Écrire un script Blender bpy exportant un objet en GLB",
        "Expliquer l'optimisation de polygones glTF pour WebGL2",
      ],
      en: [
        "Search PolyHaven 3D furniture models and studio HDRIs",
        "Write an executable Blender bpy script exporting .glb",
        "Diagnose UV seams and normal map artifacts in glTF",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "يستخدم محرك HEYUKA المشترك مع تعليمات ونطاق أدوات 3D معزول (ليس موديلاً منفصل الأوزان).",
      fr: "Propulsé par le moteur unifié HEYUKA avec contexte, outils et permissions 3D isolés.",
      en: "Powered by HEYUKA's shared core intelligence with isolated 3D tools, prompts, and project memory.",
    },
  },
  {
    id: "background-studio",
    name: "HEYUKA BACKGROUND STUDIO",
    shortTag: "Cutout PNG",
    tagline: {
      ar: "إزالة وتفريغ الخلفيات بدقة عالية محلياً على جهازك مجاناً",
      fr: "Détourage PNG transparent local zéro-coût (WebGPU/WASM)",
      en: "Zero-cost local WebGPU transparent PNG cutout & batch studio",
    },
    description: {
      ar: "أداة متخصصة لتفريغ الخلفيات مع معاينة قبل وبعد، تحميل PNG شفاف حقيقي فوراً من متصفحك عبر ONNX/WebGPU بدون أي تكلفة سيرفر، ودعم الاستبدال بخلفيات نظيفة.",
      fr: "Studio de détourage dédié : comparaison avant/après, transparence PNG réelle via ONNX/WebGPU sur votre appareil et export immédiat.",
      en: "Dedicated cutout studio with real before/after split inspection, local WebGPU ONNX PNG transparency extraction, background replacement colors, and batch export.",
    },
    capabilityIds: ["browser_bg_cutout_png", "studio_image_synthesis"],
    recommendedScopes: ["vision:remove-bg", "images:generate", "chat:universal"],
    allowedApiEndpoints: ["/api/v1/vision/remove-bg", "/api/v1/images/generate"],
    excludedTaskGuidance: "Handle exclusively foreground extraction, alpha edges, studio backdrop contrast, and PNG export.",
    specializedSystemPrompt:
      "You are the HEYUKA Background Studio Specialist inside the unified HEYUKA engine. Assist users strictly with transparent PNG cutout quality, edge feathering, alpha matting, lighting spill cleanup, and batch product photography prep.",
    quickPrompts: {
      ar: [
        "اقترح أفضل خلفية متاجر لإبراز منتج عطور داكن",
        "كيف أعالج حواف الشعر أو الزجاج عند تفريغ الخلفية؟",
        "ما الفرق بين وضع ONNX الدقيق وتنظيف الحواف السريع؟",
      ],
      fr: [
        "Comment optimiser les bords transparents autour du verre ?",
        "Conseils pour détourer proprement des photos e-commerce",
        "Différence entre masque ONNX et nettoyage chromatique de bord",
      ],
      en: [
        "How do I avoid halo edges on hair and transparent glass cutouts?",
        "Best lighting backdrop ratios for e-commerce product photography",
        "Compare local WebGPU ONNX cutout vs headless Worker batching",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "يعتمد معالجة ONNX المحلية في متصفحك ومساعد HEYUKA المشترك بمهام الخلفيات فقط.",
      fr: "Exécute ONNX en local navigateur avec l'assistant spécialisé HEYUKA.",
      en: "Runs @imgly ONNX natively in-browser with HEYUKA's specialized Background Studio agent context.",
    },
  },
  {
    id: "image-studio",
    name: "HEYUKA IMAGE STUDIO",
    shortTag: "Images",
    tagline: {
      ar: "توليد الصور بالذكاء، البحث المرئي، والتعديل الفوري للصيغ والأبعاد",
      fr: "Génération d'images studio, recherche visuelle & retouche Canvas",
      en: "Studio image generation, visual search & real client-side transforms",
    },
    description: {
      ar: "توليد صور عبر المحرك المجاني، البحث في Wikimedia Commons، فلاتر وتعديل الحجم وتحويل الصيغ (PNG/JPEG/WEBP) مباشرة في مساحتك مع حفظ الأبعاد والمعلومات الحقيقية.",
      fr: "Génération d'images sans clé, recherche Wikimedia, recadrage/filtres Canvas réels et journal des dimensions et métadonnées.",
      en: "Zero-key studio image diffusion, Wikimedia reference lookup, real Canvas resize/filter/contrast adjustments, and verifiable Output Vault logging.",
    },
    capabilityIds: ["studio_image_synthesis", "office_zip_doc_conversion"],
    recommendedScopes: ["images:generate", "chat:universal"],
    allowedApiEndpoints: ["/api/v1/images/generate"],
    excludedTaskGuidance: "Focus on prompt engineering, visual composition, style consistency, and image transformations.",
    specializedSystemPrompt:
      "You are the HEYUKA Image Studio Creative Director inside HEYUKA. Help craft crisp, detailed prompts, analyze composition, lighting, typography placement, and real format/dimension specifications.",
    quickPrompts: {
      ar: [
        "صغ لي برومبت احترافي لتصوير منتج ساعة فاخرة بإضاءة سينمائية",
        "ابحث عن صور مرجعية عالية الدقة للهندسة المعمارية المغربية",
        "اشرح لي متى أختار صيغة WEBP بدل PNG للمتاجر",
      ],
      fr: [
        "Rédige un prompt photoréaliste pour un flacon de parfum en verre",
        "Quand privilégier WEBP vs PNG pour le web haute vitesse ?",
        "Comment garder la cohérence visuelle sur une série de 5 visuels ?",
      ],
      en: [
        "Craft a studio architectural photography prompt with glass reflections",
        "Suggest composition variations for a 3-shot campaign series",
        "Compare lossless PNG vs WebP compression quality for UI visuals",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "توجيه متخصص لتوليد وتعديل الصور فوق نواة HEYUKA الموحدة.",
      fr: "Interface dédiée Image au-dessus du moteur partagé HEYUKA.",
      en: "Dedicated image prompting & Canvas pipeline powered by HEYUKA's core engine.",
    },
  },
  {
    id: "video-studio",
    name: "HEYUKA VIDEO STUDIO",
    shortTag: "Video 16:9",
    tagline: {
      ar: "تخطيط المشاهد، بناء السكربتات، وتصدير مقاطع WebM محلياً أو عبر Worker FFmpeg",
      fr: "Scénarisation multi-scènes, rendu WebM navigateur & Worker FFmpeg",
      en: "Multi-scene video storyboarding, browser WebM renderer & Worker FFmpeg",
    },
    description: {
      ar: "فصل واضح بين الواقع التقني والخيال: ينشئ خطط المشاهد (Storyboard)، يسجّل فعلياً ملف `.webm` من لوحة Canvas على جهازك، ويوضّح بصدق أن توليد MP4 المتقدم بالـ FFmpeg يتطلب ربط Worker خاص بك.",
      fr: "Pipeline honnête : storyboard multi-scènes, enregistrement réel `.webm` via MediaRecorder local, et passerelle explicite vers votre Worker FFmpeg pour le H.264 MP4.",
      en: "Truthful video studio: generates structured multi-scene plans, renders real playable `.webm` sequences locally via Canvas MediaRecorder, and clearly requires your connected FFmpeg Worker for heavy MP4 rendering.",
    },
    capabilityIds: ["browser_webm_canvas_composer", "worker_ffmpeg_video_transcode"],
    recommendedScopes: ["chat:universal", "images:generate"],
    allowedApiEndpoints: ["/api/v1/chat/completions", "/api/v1/images/generate"],
    excludedTaskGuidance: "Focus strictly on scene breakdowns, camera direction, pacing, storyboards, WebM rendering, or FFmpeg specs.",
    specializedSystemPrompt:
      "You are the HEYUKA Video Studio Director inside HEYUKA. Help write structured multi-scene scripts, camera movements, timing cues, and FFmpeg compositing specs. NEVER claim an MP4 file was generated if no FFmpeg Worker executed it.",
    quickPrompts: {
      ar: [
        "خطط إعلان فيديو احترافي من 4 مشاهد (16:9) لمنتج تقني",
        "اعطني أوامر FFmpeg نظيفة لدمج 4 صور مع ملف صوتي",
        "كيف أضمن استمرارية الإضاءة بين مشاهد القصة؟",
      ],
      fr: [
        "Créer un storyboard de 4 scènes 16:9 pour une marque tech",
        "Générer la commande FFmpeg pour assembler scènes + audio",
        "Conseils de continuité visuelle et mouvements caméra",
      ],
      en: [
        "Build a 4-scene horizontal 16:9 brand film storyboard",
        "Generate an FFmpeg filter_complex command with crossfade",
        "List camera movement transitions suited for product reveals",
      ],
    },
    supportsEmbedWidget: false,
    sharedEngineDisclosure: {
      ar: "التوليد المحلي يخرج WebM حقيقي من متصفحك؛ التصيير السحابي بالـ FFmpeg يتم فقط عبر Worker مرتبط من طرفك.",
      fr: "Rendu WebM réel côté navigateur ; transcodage lourd MP4 uniquement via votre propre Worker FFmpeg.",
      en: "Renders real WebM locally in-browser; heavy FFmpeg MP4 transcoding activates only via your connected Worker.",
    },
  },
  {
    id: "shorts-studio",
    name: "HEYUKA SHORTS STUDIO",
    shortTag: "Shorts 9:16",
    tagline: {
      ar: "منتج مستقل للفيديوهات القصيرة العمودية 9:16 والترجمة المصاحبة SRT",
      fr: "Studio vertical 9:16 dédié : hooks, sous-titres SRT & export WebM",
      en: "Dedicated vertical 9:16 Reels/TikTok/Shorts workflow & SRT subtitles",
    },
    description: {
      ar: "سير عمل مخصص لمقاطع 9:16 (1080×1920): خطاف أول 3 ثوانٍ (Hook)، تقسيم زمني بالثانية، توليد ملفات ترجمة `.srt` و `.vtt` حقيقية جاهزة للتنزيل، ومصيّر مقاطع عمودية حقيقي بصيغة `.webm`.",
      fr: "Workflow vertical distinct : hook des 3 premières secondes, découpage rythmique, export réel de sous-titres `.srt`/`.vtt` et rendu WebM vertical.",
      en: "Distinct vertical 9:16 pipeline: 3-second retention hooks, beat-paced shot timers, real downloadable `.srt`/`.vtt` captions, and local 9:16 `.webm` motion preview rendering.",
    },
    capabilityIds: ["browser_webm_canvas_composer", "audio_speech_transcription"],
    recommendedScopes: ["chat:universal", "audio:transcribe"],
    allowedApiEndpoints: ["/api/v1/chat/completions", "/api/v1/audio/transcribe"],
    excludedTaskGuidance: "Focus on 15s-60s vertical 9:16 retention pacing, short captions, hooks, and SRT/VTT timing.",
    specializedSystemPrompt:
      "You are the HEYUKA Shorts Studio Producer. Design crisp 15-45s vertical 9:16 video workflows with explicit second-by-second hooks, punchy Arabic/French/English on-screen captions, and downloadable SRT timing.",
    quickPrompts: {
      ar: [
        "اكتب سكريبت شورتس 30 ثانية بالدارجة مع توقيت بالثانية",
        "حوّل هذا النص إلى ملف ترجمة SRT بمقاطع قصيرة سريعة",
        "اقترح 5 خطافات (Hooks) قوية لأول 3 ثوانٍ",
      ],
      fr: [
        "Script Short vertical 30s avec timing seconde par seconde",
        "Convertir un texte en sous-titres SRT dynamiques",
        "5 hooks percutants pour les 3 premières secondes",
      ],
      en: [
        "Write a tight 30-second 9:16 Short with 3s hook and CTA",
        "Format voiceover lines into crisp `.srt` timestamps",
        "Design vertical safe-zone text layout guidelines",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "بيئة إنتاج Shorts عمودية مستقلة فوق محرك HEYUKA المشترك.",
      fr: "Workflow vertical indépendant propulsé par le noyau unifié HEYUKA.",
      en: "Specialized vertical short-form workflow running on HEYUKA's unified intelligence gateway.",
    },
  },
  {
    id: "coding-studio",
    name: "HEYUKA CODING STUDIO",
    shortTag: "IDE + Sandbox",
    tagline: {
      ar: "بيئة برمجة متكاملة مع مستعرض ملفات، Diff حقيقي، وتشغيل sandbox فعلي",
      fr: "IDE Avancé : Éditeur multi-fichiers, Diff, Terminal Sandbox & Tests",
      en: "Multi-file editor, real Diff viewer, sandbox runner & execution timeline",
    },
    description: {
      ar: "ليس مجرد شات: محرر ملفات متعدد داخل مشروع معزول، مقارنة التعديلات (Diff)، سجل تنفيذ حقيقي، مراجعة أمان، وتشغيل فعلي للأكواد والاختبارات عبر `/api/v1/sandbox/execute` (ولا يظهر أي كود كمنفذ إذا لم يتم تشغيله فعلياً).",
      fr: "Éditeur multi-fichiers isolé, comparaison Diff temps réel, timeline d'exécution, revue sécurité et exécution réelle Python/JS/TS/Go via `/api/v1/sandbox/execute`.",
      en: "True engineering workspace: multi-file project explorer, line-level diff viewer, approval gate, execution timeline, security checklist, and genuine runtime execution via `/api/v1/sandbox/execute`.",
    },
    capabilityIds: ["chat_multilingual_reasoning", "polyglot_code_sandbox"],
    recommendedScopes: ["chat:universal", "sandbox:execute"],
    allowedApiEndpoints: ["/api/v1/chat/completions", "/api/v1/sandbox/execute"],
    excludedTaskGuidance: "Enforce clean software architecture, TypeScript safety, zero secret leaks, and real test verification.",
    specializedSystemPrompt:
      "You are the HEYUKA Coding Studio Principal Engineer. Inspect project files provided in context, propose precise surgical code edits, explain architecture tradeoffs cleanly, suggest real unit tests, and NEVER mark code as executed or passing unless a sandbox run verified it.",
    quickPrompts: {
      ar: [
        "راجع هذا الكود أمنياً واكتشف أي ثغرات محتملة",
        "اكتب اختبارات وحدة للتحقق من حساب الضريبة TVA بدقة",
        "حسّن أداء هذه الدالة واشرح التعقيد الزمني",
      ],
      fr: [
        "Auditer la sécurité et les cas limites du fichier actif",
        "Écrire des tests unitaires et les exécuter en sandbox",
        "Refactoriser en gardant le typage TypeScript strict",
      ],
      en: [
        "Audit the open project files for edge cases and security bugs",
        "Write Python or TypeScript tests and run them in sandbox",
        "Explain how to decompose this module cleanly",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "محرر IDE في المتصفح مع صندوق تنفيذ حقيقي 7 لغات ومحرك HEYUKA الهندسي.",
      fr: "Environnement IDE navigateur + Sandbox réel 7 langages sur le moteur HEYUKA.",
      en: "In-browser IDE + 7-language Sandbox runner sharing HEYUKA's flagship coding intelligence.",
    },
  },
  {
    id: "audio-studio",
    name: "HEYUKA AUDIO STUDIO",
    shortTag: "Voice & Stems",
    tagline: {
      ar: "تفريغ الصوت والدارجة إلى نص، وفصل المسارات عبر عقد Worker",
      fr: "Transcription multilingue Whisper & séparation stems Worker",
      en: "Multilingual audio transcription & Worker stem separation studio",
    },
    description: {
      ar: "رفع أو تسجيل الصوت مباشرة للتفريغ الفوري بالعربية والدارجة والفرنسية والإنجليزية عبر `/api/v1/audio/transcribe`، وتمرير فصل المسارات الصوتية لـ Worker متصل مع فصل تام لعدم وجود Demucs محلي على السيرفر.",
      fr: "Transcription directe audio/micro via `/api/v1/audio/transcribe` ; séparation vocale orientée vers vos nœuds Worker dédiés.",
      en: "Upload or record real audio for multilingual transcription via `/api/v1/audio/transcribe`, with clear Worker handoff for vocal stem separation.",
    },
    capabilityIds: ["audio_speech_transcription", "worker_audio_stem_separation"],
    recommendedScopes: ["audio:transcribe", "audio:separate", "chat:universal"],
    allowedApiEndpoints: ["/api/v1/audio/transcribe", "/api/v1/audio/separate"],
    excludedTaskGuidance: "Focus on speech clarity, timestamp formatting, WER quality, and audio pipeline diagnostics.",
    specializedSystemPrompt:
      "You are the HEYUKA Audio Studio Engineer. Help transcribe, clean, timestamp, and format multilingual speech into structured scripts or SRT subtitles.",
    quickPrompts: {
      ar: [
        "نظّف وحوّل نص التفريغ الصوتي إلى محضر اجتماع مرتب",
        "رتّب هذا الحوار إلى متحدثين وتوقيتات واضحة",
        "اشرح لي كيف أربط عقدة Demucs محلية لفصل الصوت عن الموسيقى",
      ],
      fr: [
        "Structurer une transcription brute en compte-rendu clair",
        "Formater des dialogues avec horodatage propre",
        "Guide pour connecter un Worker GPU Demucs personnel",
      ],
      en: [
        "Clean up a raw multilingual transcript into structured notes",
        "Convert dialogue transcript into WebVTT subtitles",
        "How do I connect my own Linux GPU Worker for stem separation?",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "التفريغ يعمل حياً على الملفات المرفوعة؛ فصل المسارات يفوّض إلى Worker خاص بك.",
      fr: "Transcription active sur fichiers envoyés ; séparation stems via Worker dédié.",
      en: "Direct upload transcription runs live; vocal stem separation requires a connected user Worker.",
    },
  },
  {
    id: "conversion-studio",
    name: "HEYUKA CONVERSION STUDIO",
    shortTag: "Converters",
    tagline: {
      ar: "تحويل حقيقي وفوري للصيغ المدعومة (PNG/WEBP/JPEG · JSON/CSV · SRT/VTT · ZIP)",
      fr: "Convertisseur réel multi-formats (Images, CSV/JSON, SRT/VTT, ZIP)",
      en: "Real zero-cost format conversion across Images, CSV/JSON, Captions & ZIP",
    },
    description: {
      ar: "يحوّل فعلياً داخل المتصفح والسيرفر الصيغ المدعومة بدون خداع: صور (`PNG ↔ JPEG ↔ WEBP`)، بيانات (`CSV ↔ JSON`)، ترجمات (`SRT ↔ VTT`)، ومستندات (`Markdown → HTML / XLSX`).",
      fr: "Conversions réelles côté client et serveur : images (`PNG ↔ WEBP ↔ JPEG`), données (`CSV ↔ JSON`), sous-titres (`SRT ↔ VTT`) et tableurs XLSX.",
      en: "Performs genuine conversions over supported pipelines: Image formats (`PNG/JPEG/WEBP`), Data (`CSV/JSON`), Captions (`SRT/VTT`), and Spreadsheet exports.",
    },
    capabilityIds: ["office_zip_doc_conversion", "browser_bg_cutout_png"],
    recommendedScopes: ["chat:universal"],
    allowedApiEndpoints: ["/api/v1/chat/completions"],
    excludedTaskGuidance: "Perform exact schema mapping, encoding safety (UTF-8), and MIME checks.",
    specializedSystemPrompt:
      "You are the HEYUKA Conversion Studio Specialist. Help users convert schemas, clean CSV/JSON delimiters, validate character encodings, and pick lossless vs compressed output targets.",
    quickPrompts: {
      ar: [
        "حوّل بيانات JSON هذه إلى جدول CSV متوافق مع Excel العربي",
        "ما الفرق في الحجم والدقة بين PNG و WEBP لصور المتجر؟",
        "حوّل تنسيق وقت الترجمة من SRT إلى WebVTT",
      ],
      fr: [
        "Convertir un JSON complexe en CSV propre UTF-8",
        "Transformer des sous-titres SRT au format WebVTT",
        "Nettoyer les colonnes et types lors d'un import Excel",
      ],
      en: [
        "Normalize nested JSON arrays into flat CSV rows",
        "Convert SRT subtitles to WebVTT with clean cue alignment",
        "Explain UTF-8 BOM handling for Excel Arabic exports",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "عمليات التحويل المدعومة تتم محلياً في المتصفح بصفر تكلفة وتوثّق في Output Vault.",
      fr: "Conversions exécutées en local sans coût serveur avec journalisation réelle.",
      en: "Supported conversions execute locally on-device with real SHA-256 verification.",
    },
  },
  {
    id: "data-studio",
    name: "HEYUKA DATA STUDIO",
    shortTag: "Analytics",
    tagline: {
      ar: "قراءة ملفات CSV/JSON، استخراج الإحصاءات، والرسوم البيانية التفاعلية",
      fr: "Analyse CSV/JSON, statistiques mathématiques & graphiques interactifs",
      en: "Real CSV/JSON parsing, math statistics, live data feeds & interactive charts",
    },
    description: {
      ar: "استورد ملفات CSV أو JSON أو استعلم من 34 مصدر بيانات حية (`/api/v1/public-apis`)، مع تحليل إحصائي دقيق ورسوم بيانية تفاعلية حقيقية وتصدير XLSX/CSV.",
      fr: "Analyse réelle de fichiers CSV/JSON, requêtes sur 34 flux temps réel, graphiques Recharts et export Excel/CSV.",
      en: "Upload real CSV/JSON tables or query 34 live public feeds (`/api/v1/public-apis`), generate interactive Recharts visuals, and compute exact statistics.",
    },
    capabilityIds: ["realtime_public_apis_and_web", "office_zip_doc_conversion", "polyglot_code_sandbox"],
    recommendedScopes: ["public-apis:query", "sandbox:execute", "chat:universal"],
    allowedApiEndpoints: ["/api/v1/public-apis", "/api/v1/sandbox/execute"],
    excludedTaskGuidance: "Never hallucinate numbers; verify every metric via parsed rows or live API payloads.",
    specializedSystemPrompt:
      "You are the HEYUKA Data Studio Analyst. Inspect ONLY real parsed data columns and rows or verified public API responses. Never invent totals or statistical claims.",
    quickPrompts: {
      ar: [
        "حلّل هذا الجدول واستخرج القيم الشاذة والمتوسط والانحراف",
        "اجلب سعر الصرف الحالي للأورو والدولار مقابل الدرهم MAD",
        "اكتب كود Python Pandas أو إحصاء لتحليل المبيعات الشهرية",
      ],
      fr: [
        "Analyser les tendances et anomalies du CSV importé",
        "Consulter les taux de change EUR/USD/MAD en direct",
        "Calculer les marges et KPIs clés en tableau synthétique",
      ],
      en: [
        "Analyze uploaded CSV anomalies, mean, median, and variance",
        "Fetch live EUR to MAD exchange telemetry",
        "Summarize growth trends without fabricating missing rows",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "يعتمد التحليل على البيانات الحقيقية المرفوعة أو الاستعلام المباشر عبر محرك HEYUKA.",
      fr: "Analyse basée strictement sur les données réelles fournies ou flux live vérifiés.",
      en: "Strict real-data parsing + HEYUKA analyst directives — zero fabricated sample numbers.",
    },
  },
  {
    id: "web-studio",
    name: "HEYUKA WEB STUDIO",
    shortTag: "Web & UI",
    tagline: {
      ar: "تصميم صفحات وتطبيقات الويب مع معاينة حية وتصدير كود نظيف في ملف ZIP",
      fr: "Création web Frontend, prévisualisation live & export ZIP réel",
      en: "Frontend web engineering, sandboxed live preview & real PKZIP export",
    },
    description: {
      ar: "بناء واجهات HTML/CSS/JS كاملة مع معاينة فورية معزولة (`sandbox` iframe) وتنزيل حزمة المشروع كاملة بصيغة `.zip` قياسية جاهزة للنشر.",
      fr: "Générez des interfaces web complètes, testez-les en direct dans une iframe isolée et téléchargez l'archive `.zip` propre.",
      en: "Design responsive web apps, inspect them safely inside a sandboxed preview frame, and export all files as a clean `.zip` bundle.",
    },
    capabilityIds: ["chat_multilingual_reasoning", "office_zip_doc_conversion"],
    recommendedScopes: ["chat:universal"],
    allowedApiEndpoints: ["/api/v1/chat/completions"],
    excludedTaskGuidance: "Write accessible, responsive HTML/CSS/Tailwind/TypeScript without unsafe inline eval.",
    specializedSystemPrompt:
      "You are the HEYUKA Web Studio Architect. Generate clean, accessible, responsive web layouts, components, and full-stack Next.js/React code that builds cleanly.",
    quickPrompts: {
      ar: [
        "أنشئ صفحة هبوط زجاجية متجاوبة تدعم العربية RTL",
        "صمّم واجهة لوحة تحكم سريعة مع بطاقات متجاوبة",
        "تأكد من التباين وإمكانية الوصول في النموذج",
      ],
      fr: [
        "Créer une landing page responsive RTL/LTR en verre cristallin",
        "Structurer une page produit e-commerce accessible",
        "Optimiser le CSS pour Mobile et Desktop sans surcharge",
      ],
      en: [
        "Build a responsive Future Glass portfolio page with RTL support",
        "Create a pricing grid component with clean contrast tokens",
        "Review accessibility and semantic HTML landmarks",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "تُعرض المعاينة في متصفحك ويُصدّر المشروع بأكمله بصيغة ZIP حقيقية.",
      fr: "Aperçu immédiat dans iframe isolée et export PKZIP réel.",
      en: "Sandboxed browser preview + verified PKZIP export powered by HEYUKA's unified engine.",
    },
  },
  {
    id: "document-studio",
    name: "HEYUKA DOCUMENT STUDIO",
    shortTag: "Docs & PDF",
    tagline: {
      ar: "تحليل المستندات، صياغة التقارير الاحترافية، وتصدير Markdown/HTML/XLSX",
      fr: "Rédaction technique, analyse de documents & exports structurés",
      en: "Document analysis, executive report authoring & structured exports",
    },
    description: {
      ar: "قراءة النصوص والملفات المهيكلة، تلخيص العقود والتقارير، إنشاء تقارير HTML/Markdown قابلة للطباعة PDF وتصدير جداول البيانات بصيغة Excel حقيقية.",
      fr: "Synthèse de documents, génération de rapports prêts pour impression PDF et exports tabulaires propres.",
      en: "Inspect documents cleanly, draft executive reports in Arabic/French/English, render printable HTML/PDF layouts, and export structured Excel spreadsheets.",
    },
    capabilityIds: ["chat_multilingual_reasoning", "office_zip_doc_conversion"],
    recommendedScopes: ["chat:universal"],
    allowedApiEndpoints: ["/api/v1/chat/completions"],
    excludedTaskGuidance: "Ensure formal clarity, Arabic typography alignment, and accurate source citations.",
    specializedSystemPrompt:
      "You are the HEYUKA Document Studio Editor. Organize unstructured notes into crisp executive reports, contracts, technical specs, and structured tables in Arabic, French, or English.",
    quickPrompts: {
      ar: [
        "لخّص هذا المستند إلى نقاط تنفيذية وجدول التزامات",
        "صغ سياسة خصوصية وشروط استخدام واضحة لتطبيق SaaS",
        "أعد تقرير تدقيق فني منظم للطباعة كـ PDF",
      ],
      fr: [
        "Structurer un cahier des charges technique complet",
        "Rédiger une note de synthèse claire avec points d'action",
        "Préparer un rapport trimestriel prêt pour impression PDF",
      ],
      en: [
        "Turn raw notes into an executive technical specification report",
        "Extract action items, owners, and risks into a table",
        "Draft bilingual privacy documentation for API consumers",
      ],
    },
    supportsEmbedWidget: true,
    sharedEngineDisclosure: {
      ar: "استوديو المستندات يعتمد محرك HEYUKA للغة والتنسيق مع عزل تام للمحتوى.",
      fr: "Édition documentaire dédiée avec isolation stricte des données du projet.",
      en: "Focused document editing & structured exports over HEYUKA's isolated project vault.",
    },
  },
  {
    id: "automation-studio",
    name: "HEYUKA AUTOMATION STUDIO",
    shortTag: "Workflows",
    tagline: {
      ar: "بناء تدفقات العمل، ربط OpenAPI و Webhooks، والتحقق من Cron & DAG",
      fr: "Workflows automatisés, connecteurs OpenAPI/Webhooks & planning DAG",
      en: "Workflow builder, OpenAPI/Webhook connector discovery & cron/DAG planning",
    },
    description: {
      ar: "فحص مواصفات OpenAPI 3.1 الخارجية، تسجيل Webhooks آمنة، تخطيط موجات DAG، والتحقق من تعابير Cron عبر نقاط `/api/v1/zebra-x/auto-connect` دون المساس بنظام KASPI POS الأساسي.",
      fr: "Inspection OpenAPI 3.1, enregistrement Webhooks SSRF-safe, validation Cron et orchestration multi-étapes isolée.",
      en: "Discover external OpenAPI/Swagger specs cleanly, register SSRF-verified webhooks, validate cron schedules, and orchestrate workflows safely.",
    },
    capabilityIds: ["openapi_webhook_automation", "polyglot_code_sandbox"],
    recommendedScopes: ["connector:discover", "chat:universal", "web:research"],
    allowedApiEndpoints: ["/api/v1/zebra-x/auto-connect", "/api/v1/public-apis"],
    excludedTaskGuidance: "Enforce explicit approval before side effects and block unsafe internal network URLs.",
    specializedSystemPrompt:
      "You are the HEYUKA Automation Studio Architect. Design reliable webhook workflows, idempotent retries, OpenAPI integrations, and cron pipelines without exposing secrets or bypassing approval gates.",
    quickPrompts: {
      ar: [
        "افحص رابط مواصفة OpenAPI خارجي وحدد المسارات الآمنة للربط",
        "صمم تدفق عمل من 4 خطوات مع إعادة المحاولة عند الفشل",
        "اشرح لي تعبير Cron التالي: `0 9 * * 1-5`",
      ],
      fr: [
        "Inspecter un schéma OpenAPI 3.1 externe pour intégration",
        "Concevoir un workflow Webhook idempotent avec gestion d'erreur",
        "Valider les expressions Cron et l'ordre d'exécution DAG",
      ],
      en: [
        "Inspect an external OpenAPI JSON spec and list safe operations",
        "Design an idempotent webhook retry & dead-letter flow",
        "Verify multi-step DAG execution waves cleanly",
      ],
    },
    supportsEmbedWidget: false,
    sharedEngineDisclosure: {
      ar: "الأتمتة معزولة بقيود SSRF وموافقات واضحة دون تعديل نواة KASPI POS.",
      fr: "Orchestration protégée anti-SSRF sans aucune mutation du cœur POS.",
      en: "SSRF-guarded automation planning decoupled completely from core POS registers.",
    },
  },
];

export function getSpecializedProductById(
  id: string
): SpecializedProductDefinition | undefined {
  return SPECIALIZED_PRODUCTS.find((p) => p.id === id);
}

/**
 * Simple keyword intent router for HEYUKA Intelligence Command Center
 * suggesting (never forcing) the most aligned specialized product.
 */
export function recommendProductForPrompt(
  prompt: string
): SpecializedProductDefinition | null {
  const q = (prompt || "").toLowerCase();
  if (/(\b3d\b|glb|fbx|blender|polyhaven|hdri|مجسم|ثلاثي الأبعاد)/i.test(q)) {
    return getSpecializedProductById("3d-studio") || null;
  }
  if (/(remove bg|background|cutout|transparent png|خلفية|تفريغ|تقطيع)/i.test(q)) {
    return getSpecializedProductById("background-studio") || null;
  }
  if (/(shorts|reels|tiktok|9:16|vertical video|فيديو قصير|شورتس|ريلز|srt)/i.test(q)) {
    return getSpecializedProductById("shorts-studio") || null;
  }
  if (/(video|storyboard|ffmpeg|mp4|webm|فيديو|مونتاج|مشاهد)/i.test(q)) {
    return getSpecializedProductById("video-studio") || null;
  }
  if (/(audio|voice|whisper|transcribe|stems|demucs|صوت|تفريغ صوتي|فصل الصوت)/i.test(q)) {
    return getSpecializedProductById("audio-studio") || null;
  }
  if (/(convert|conversion|csv to json|webp|srt to vtt|تحويل الصيغ)/i.test(q)) {
    return getSpecializedProductById("conversion-studio") || null;
  }
  if (/(code|typescript|python|bug|refactor|unit test|diff|برمجة|كود|تصحيح)/i.test(q)) {
    return getSpecializedProductById("coding-studio") || null;
  }
  if (/(website|landing page|html|css|frontend|react component|موقع|واجهة)/i.test(q)) {
    return getSpecializedProductById("web-studio") || null;
  }
  if (/(csv|excel|analytics|chart|fx rate|بيانات|إحصاء|رسم بياني|تداول)/i.test(q)) {
    return getSpecializedProductById("data-studio") || null;
  }
  if (/(pdf|report|contract|document|تقرير|مستند|عقد|ملخص)/i.test(q)) {
    return getSpecializedProductById("document-studio") || null;
  }
  if (/(webhook|openapi|cron|workflow|automate|أتمتة|ربط)/i.test(q)) {
    return getSpecializedProductById("automation-studio") || null;
  }
  if (/(image|photo|poster|logo|صورة|توليد صور|تصميم صورة)/i.test(q)) {
    return getSpecializedProductById("image-studio") || null;
  }
  return null;
}
