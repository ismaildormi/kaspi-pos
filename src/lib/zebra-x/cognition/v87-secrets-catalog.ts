import type { SovereignPackSourceEntry } from "@/lib/zebra-x/core/sovereign-pack-types";
import type { CognitiveClusterId } from "@/lib/zebra-x/core/cognitive-brain-registry";

export type SecretNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SecretSpecMetadata {
  secretNumber: SecretNumber;
  pack: `v87.${SecretNumber}`;
  titleAr: string;
  titleEn: string;
  engineFile: string;
  summaryAr: string;
}

export const SEVEN_SECRETS_METADATA: readonly SecretSpecMetadata[] = [
  {
    secretNumber: 1,
    pack: "v87.1",
    titleAr: "اللعب الذاتي والتوليد التطوري للمعرفة (Absolute Zero & GRPO)",
    titleEn: "Absolute Zero & Self-Play Evolution",
    engineFile: "training/evolution/secret1_self_play.py",
    summaryAr: "توليد تحديات ذاتية في الرياضيات والمنطق والكود وتجارة KASPI POS مع التحقق التنفيذي وحساب Elo وتدرج الصعوبة.",
  },
  {
    secretNumber: 2,
    pack: "v87.2",
    titleAr: "التفكير العميق وقت الاختبار والبحث الشجري (MCTS + Symbolic)",
    titleEn: "Test-Time Compute & MCTS Tree Reasoning",
    engineFile: "src/lib/zebra-x/cognition/secret2_mcts_reasoner.ts",
    summaryAr: "بحث شجري PUCT متعدد المسارات + مضاعفة التفكير s1 + التحقق الرمزي CoVe وMathJS/Nerdamer.",
  },
  {
    secretNumber: 3,
    pack: "v87.3",
    titleAr: "التجريب الفعلي والمحاكاة الرقمية والفيزيائية (Physics + Market + Sandbox)",
    titleEn: "Embodied Execution & World Simulation",
    engineFile: "src/lib/zebra-x/simulation/secret3_world_sim.ts",
    summaryAr: "محاكاة توازن المجسمات 3D، محاكاة طوابير ومخزون وأسعار المتاجر KASPI POS، والتحقق الآمن للأكواد.",
  },
  {
    secretNumber: 4,
    pack: "v87.4",
    titleAr: "الذكاء التجريدي المرن وربط العلوم المتباعدة (ARC-AGI + PySR + TRIZ)",
    titleEn: "ARC-AGI Fluid Intelligence & Cross-Domain Synthesis",
    engineFile: "src/lib/zebra-x/cognition/secret4_fluid_invention.ts",
    summaryAr: "استنباط برامج الشبكات ARC-AGI من أمثلة قليلة، استخراج القوانين الرياضية R^2، ومصفوفة TRIZ للابتكار.",
  },
  {
    secretNumber: 5,
    pack: "v87.5",
    titleAr: "التعديل الذاتي المستمر وصناعة الأدوات (Voyager Tool Forge)",
    titleEn: "Recursive Self-Improvement & Tool Forge",
    engineFile: "src/lib/zebra-x/evolution/secret5_tool_forge.ts",
    summaryAr: "برمجة أدوات مصغرة وفحصها أمنياً وتشغيلها مع اختبارات عشوائية ثم تسجيلها في مكتبة المهارات.",
  },
  {
    secretNumber: 6,
    pack: "v87.6",
    titleAr: "التناغم الجماعي ومجلس النقد القاسي (12-Mind Swarm + Red-Team)",
    titleEn: "Collective Swarm Intelligence & Adversarial Council",
    engineFile: "src/lib/zebra-x/cognition/secret6_adversarial_council.ts",
    summaryAr: "مجلس 3/6/12 عقلاً متخصصاً + مدقق أمني ومحاسبي + مناظرة نقدية ودمج RRF الموزون.",
  },
  {
    secretNumber: 7,
    pack: "v87.7",
    titleAr: "الحدس السريع (<15ms) والذاكرة الترابطية الخالدة والاستباقية",
    titleEn: "System-1 Intuition + System-2 Logic & Omni-Context",
    engineFile: "src/lib/zebra-x/cognition/secret7_dual_brain_orchestrator.ts",
    summaryAr: "توجيه ثنائي سريع System-1 (<15ms) وتصعيد System-2 + ذاكرة ترابطية + استباقية ذكية.",
  },
];

type CompactV87Tuple = [
  secret: SecretNumber,
  idSlug: string,
  name: string,
  url: string,
  clusterId: CognitiveClusterId,
  clientCapable: boolean,
  roleAr: string,
];

const VERIFIED_V87_ROWS: readonly CompactV87Tuple[] = [
  // Secret 1 (v87.1): Self-Play & GRPO Evolution
  [1, "azr_leaplab", "Absolute Zero Reasoner (AZR)", "https://github.com/LeapLabTHU/Absolute-Zero-Reasoner", "code_ide_and_surgical_editing", false, "نموذج يبتكر مسائله البرمجية والمنطقية ويتحقق منها ذاتياً عبر مفسر الكود دون بيانات بشرية."],
  [1, "spin_ucla", "SPIN (Self-Play Fine-Tuning)", "https://github.com/uclaml/SPIN", "code_ide_and_surgical_editing", false, "لعب ذاتي ضد النسخة السابقة لتطوير دقة الاستدلال عبر الجولات."],
  [1, "sppo_ucla", "SPPO (Self-Play Preference Optimization)", "https://github.com/uclaml/SPPO", "code_ide_and_surgical_editing", false, "خوارزمية لعب ذاتي رياضية تقود للتوازن الأمثل في الجودة."],
  [1, "openspiel", "OpenSpiel (DeepMind Games)", "https://github.com/google-deepmind/open_spiel", "elastic_swarm_3_6_12_and_worker_bots", true, "أكثر من 70 بيئة لعب استراتيجي وتفاوض متعدد الوكلاء."],
  [1, "pettingzoo", "PettingZoo (Multi-Agent RL)", "https://github.com/Farama-Foundation/PettingZoo", "robotics_agents_and_mobile_lab", true, "بيئات تنافس وتعاون بين عدة وكلاء أذكياء."],
  [1, "gymnasium", "Gymnasium (Farama RL Arena)", "https://github.com/Farama-Foundation/Gymnasium", "robotics_agents_and_mobile_lab", true, "الإطار القياسي لمحاكاة واتخاذ القرارات في البيئات التفاعلية."],
  [1, "poet_uber", "POET (Open-Ended Trailblazer)", "https://github.com/uber-research/poet", "code_ide_and_surgical_editing", false, "توليد بيئات وتحديات متدرجة الصعوبة بالتوازي مع تطور الموديل."],
  [1, "voyager_minedojo", "Voyager (Embodied Skill Curriculum)", "https://github.com/MineDojo/Voyager", "robotics_agents_and_mobile_lab", false, "منهج دراسي ذاتي يكتشف المهام ويبني مكتبة مهارات متنامية."],
  [1, "eureka_nvidia", "Eureka (Self-Reward Designer)", "https://github.com/eureka-research/Eureka", "code_ide_and_surgical_editing", false, "تصميم دوال المكافأة تلقائياً لتقييم الأداء بفعالية عالية."],
  [1, "alphazero_general", "AlphaZero-General (MCTS + Self-Play)", "https://github.com/suragnair/alpha-zero-general", "code_ide_and_surgical_editing", true, "خوارزمية التعلم من الصفر عبر MCTS واللعب الذاتي."],
  [1, "muzero_general", "MuZero-General (Model-Based RL)", "https://github.com/werner-duvaud/muzero-general", "code_ide_and_surgical_editing", false, "تعلم قوانين الأنظمة بالتجربة وبناء نموذج داخلي."],
  [1, "trl_hf", "TRL (HuggingFace GRPO Trainer)", "https://github.com/huggingface/trl", "code_ide_and_surgical_editing", false, "تدريب GRPO وRLOO لمكافأة المسارات الأذكى."],
  [1, "open_r1", "Open-R1 (Verifiable RLVR)", "https://github.com/huggingface/open-r1", "code_ide_and_surgical_editing", false, "خط أنابيب التعلم المعزز القابل للتحقق RLVR."],
  [1, "verl_volcengine", "veRL (Volcano Engine RL)", "https://github.com/volcengine/verl", "code_ide_and_surgical_editing", false, "إطار سريع للتعلم المعزز للنماذج اللغوية."],
  [1, "unsloth", "Unsloth GRPO (Free GPU RL)", "https://github.com/unslothai/unsloth", "code_ide_and_surgical_editing", false, "تشغيل GRPO على كارت شاشة مجاني Colab / Kaggle."],
  [1, "star_reasoner", "STaR (Self-Taught Reasoner)", "https://github.com/ezelikman/STaR", "code_ide_and_surgical_editing", false, "تدريب الموديل على شرح التفكير وحفظ المسارات الصحيحة."],
  [1, "math_verify_hf", "Math-Verify (Symbolic Checker)", "https://github.com/huggingface/Math-Verify", "hardware_cad_voip_testing_and_physics", true, "التحقق الرياضي الرمزي من صحة المعادلات أثناء اللعب الذاتي."],
  [1, "swe_gym", "SWE-Gym (Coding Self-Train)", "https://github.com/SWE-Gym/SWE-Gym", "code_ide_and_surgical_editing", false, "بيئة إصلاح مستودعات برمجية حقيقية والتعلم من النتائج."],
  [1, "reflexion_shinn", "Reflexion (Verbal RL Memory)", "https://github.com/noahshinn/reflexion", "code_ide_and_surgical_editing", true, "تحويل الأخطاء إلى دروس لغوية توجه المحاولة التالية."],
  [1, "funsearch", "FunSearch (Evolutionary Search)", "https://github.com/google-deepmind/funsearch", "code_ide_and_surgical_editing", false, "دمج النموذج اللغوي مع التطور الجيني لاكتشاف خوارزميات جديدة."],

  // Secret 2 (v87.2): MCTS & Test-Time Compute & Formal Proof
  [2, "rstar_ms", "rStar-Math (Microsoft MCTS)", "https://github.com/microsoft/rStar", "code_ide_and_surgical_editing", true, "دمج البحث الشجري MCTS مع التحقق البرمجي لحل المسائل المعقدة."],
  [2, "tot_princeton", "Tree-of-Thoughts (Princeton)", "https://github.com/princeton-nlp/tree-of-thought-llm", "code_ide_and_surgical_editing", true, "استكشاف فروع تفكير متوازية والتراجع الذكي عند الخطأ."],
  [2, "lats_uiuc", "LATS (Language Agent Tree Search)", "https://github.com/andyz245/LanguageAgentTreeSearch", "code_ide_and_surgical_editing", true, "توحيد التفكير والفعل داخل شجرة بحث مونت كارلو MCTS."],
  [2, "got_eth", "Graph-of-Thoughts (ETH Zurich)", "https://github.com/spcl/graph-of-thoughts", "code_ide_and_surgical_editing", true, "ربط الأفكار في رسم بياني غير خطي لدمج الحلول."],
  [2, "s1_stanford", "s1 (Budget Forcing Scaling)", "https://github.com/simplescaling/s1", "code_ide_and_surgical_editing", true, "إطالة التفكير وتدقيق الخطوات وقت الاختبار لرفع الدقة."],
  [2, "optillm", "OptiLLM (Test-Time Compute Proxy)", "https://github.com/codelion/optillm", "code_ide_and_surgical_editing", true, "تطبيق MCTS وBest-of-N وSelf-Consistency على النماذج وقت الاستدلال."],
  [2, "search_and_learn_hf", "Search-and-Learn (HuggingFace)", "https://github.com/huggingface/search-and-learn", "code_ide_and_surgical_editing", true, "مكتبة HuggingFace لخوارزميات Best-of-N وDVTS وBeam Search."],
  [2, "open_thoughts", "OpenThoughts (Reasoning Traces)", "https://github.com/open-thoughts/open-thoughts", "code_ide_and_surgical_editing", false, "مسارات تفكير عميق موثقة في الرياضيات والكود والعلوم."],
  [2, "z3_prover", "Z3 Theorem Prover (Microsoft SMT)", "https://github.com/Z3Prover/z3", "hardware_cad_voip_testing_and_physics", true, "محرك البرهان المنطقي وحل القيود الرياضي."],
  [2, "lean4_prover", "Lean 4 (Theorem Prover)", "https://github.com/leanprover/lean4", "hardware_cad_voip_testing_and_physics", false, "لغة البرهان الرياضي الرسمية للتحقق خطوة بخطوة."],
  [2, "leandojo", "LeanDojo (LLM + Lean 4)", "https://github.com/lean-dojo/LeanDojo", "code_ide_and_surgical_editing", false, "جسر ربط النماذج اللغوية بمحرك البرهان Lean 4."],
  [2, "sympy", "SymPy (Symbolic Mathematics)", "https://github.com/sympy/sympy", "hardware_cad_voip_testing_and_physics", true, "جبر رمزي وتفاضل وتكامل دقيق 100%."],
  [2, "google_ortools", "Google OR-Tools (Constraint Solver)", "https://github.com/google/or-tools", "kaspi_pos_merchant_intelligence", true, "حل مسائل التحسين والجدولة ومسارات التوصيل والمخزون."],
  [2, "cvc5_smt", "cvc5 (Stanford/Iowa SMT)", "https://github.com/cvc5/cvc5", "hardware_cad_voip_testing_and_physics", true, "محرك تحقق منطقي للأنظمة والخوارزميات."],
  [2, "logic_llm", "Logic-LLM (Symbolic CoT)", "https://github.com/teacherpeterpan/Logic-LLM", "code_ide_and_surgical_editing", false, "ترجمة المسائل الكلامية إلى منطق رمزي للبرهنة."],
  [2, "cove_meta", "Chain-of-Verification (CoVe)", "https://github.com/ritun16/chain-of-verification", "code_ide_and_surgical_editing", true, "طرح أسئلة تحقق مستقلة لاكتشاف وتصحيح الأخطاء قبل العرض."],

  // Secret 3 (v87.3): Embodied Execution & Physics / Market Simulation
  [3, "genesis_sim", "Genesis (Embodied Physics Engine)", "https://github.com/Genesis-Embodied-AI/Genesis", "games_3d_video_and_audio", false, "محرك محاكاة فيزيائية فائق السرعة للأجسام الصلبة والسوائل والروبوتات."],
  [3, "mujoco_dm", "MuJoCo (DeepMind Physics)", "https://github.com/google-deepmind/mujoco", "games_3d_video_and_audio", false, "المحرك الفيزيائي الدقيق للميكانيكا والاتصال متعدد المفاصل."],
  [3, "bullet3", "PyBullet / Bullet3 Physics", "https://github.com/bulletphysics/bullet3", "games_3d_video_and_audio", true, "محاكاة الاصطدامات والجاذبية في الوقت الحقيقي."],
  [3, "nvidia_warp", "NVIDIA Warp (Spatial Physics)", "https://github.com/NVIDIA/warp", "games_3d_video_and_audio", false, "مترجم نوى محاكاة فيزيائية بلغة Python على GPU."],
  [3, "taichi_lang", "Taichi (Parallel Physics)", "https://github.com/taichi-dev/taichi", "games_3d_video_and_audio", true, "محاكاة السوائل والمواد المرنة بسرعة متوازية عالية."],
  [3, "rapier_wasm", "Rapier (Rust/WASM 3D Physics)", "https://github.com/dimforge/rapier", "games_3d_video_and_audio", true, "محرك فيزياء ثلاثي الأبعاد يعمل مباشرة في المتصفح عبر WASM."],
  [3, "cannon_es", "Cannon-es (JS 3D Physics)", "https://github.com/pmndrs/cannon-es", "games_3d_video_and_audio", true, "محاكاة الكتلة والاصطدامات داخل مشاهد Three.js."],
  [3, "pyodide", "Pyodide (Python WASM Sandbox)", "https://github.com/pyodide/pyodide", "code_ide_and_surgical_editing", true, "تنفيذ Python والتحقق الحسابي مباشرة داخل المتصفح."],
  [3, "sandpack", "Sandpack (Live Browser Sandbox)", "https://github.com/codesandbox/sandpack", "code_ide_and_surgical_editing", true, "تشغيل ومعاينة تطبيقات الويب حياً في المتصفح."],
  [3, "piston", "Piston (Multi-Language Runner)", "https://github.com/engineer-man/piston", "code_ide_and_surgical_editing", true, "تشغيل معزول لأكثر من 70 لغة برمجة."],
  [3, "playwright", "Playwright (Real Browser Verifier)", "https://github.com/microsoft/playwright", "browser_autopilot_oauth_cloud_factory", false, "فتح التطبيقات والنقر التلقائي والتحقق من غياب الأخطاء."],
  [3, "openhands", "OpenHands (Autonomous Engineer)", "https://github.com/All-Hands-AI/OpenHands", "code_ide_and_surgical_editing", false, "بيئة تطوير واختبار معزولة للوكلاء."],
  [3, "concordia_dm", "Concordia (Agent Market Sim)", "https://github.com/google-deepmind/concordia", "kaspi_pos_merchant_intelligence", false, "محاكاة الأسواق والمستهلكين بالوكلاء التوليديين."],
  [3, "mesa_abm", "Mesa (Agent-Based Modeling)", "https://github.com/projectmesa/mesa", "kaspi_pos_merchant_intelligence", true, "نمذجة سلوك المستهلكين وتدفق المنتجات."],
  [3, "oasis_camel", "OASIS (Social Market Sim)", "https://github.com/camel-ai/oasis", "kaspi_pos_merchant_intelligence", false, "محاكاة تفاعلات واسعة النطاق في الأسواق والمنصات."],
  [3, "sumo_traffic", "Eclipse SUMO (Mobility Sim)", "https://github.com/eclipse-sumo/sumo", "robotics_agents_and_mobile_lab", false, "محاكاة حركة المرور واللوجستيك ومسارات التوصيل."],
  [3, "simpy_des", "SimPy (Discrete-Event Sim)", "https://gitlab.com/team-simpy/simpy", "kaspi_pos_merchant_intelligence", true, "محاكاة طوابير الانتظار وسلاسل التوريد والمستودعات."],

  // Secret 4 (v87.4): ARC-AGI Fluid Intelligence & Cross-Domain Synthesis
  [4, "arc_agi", "ARC-AGI Official Benchmark", "https://github.com/fchollet/ARC-AGI", "patents_and_inventions_150m", true, "المعيار المرجعي لاستنباط القوانين التجريدية الجديدة من أمثلة قليلة."],
  [4, "arc_dsl_hodel", "Hodel ARC-DSL", "https://github.com/michaelhodel/arc-dsl", "patents_and_inventions_150m", true, "لغة عمليات هندسية ومجردة لبرامج الألغاز البصرية والشبكات."],
  [4, "dreamcoder", "DreamCoder (Bayesian Program Learn)", "https://github.com/ellisk42/ec", "patents_and_inventions_150m", false, "تعلم مفاهيم جديدة وبناء لغة مصغرة متطورة بالتكرار."],
  [4, "compress_arc", "CompressARC (Compression IQ)", "https://github.com/iliao2345/CompressARC", "patents_and_inventions_150m", true, "استنباط أقصر قاعدة رياضية تفسر البيانات (Occam / Kolmogorov)."],
  [4, "pysr", "PySR (Symbolic Regression)", "https://github.com/MilesCranmer/PySR", "patents_and_inventions_150m", false, "استخراج القوانين والمعادلات الرياضية الخفية من الجداول والأرقام."],
  [4, "ai_feynman", "AI-Feynman (MIT Law Discovery)", "https://github.com/SJ001/AI-Feynman", "patents_and_inventions_150m", false, "اكتشاف القوانين الفيزيائية من البيانات بالتناظر وفصل المتغيرات."],
  [4, "pykan", "KAN (Kolmogorov-Arnold Nets)", "https://github.com/KindXiaoming/pykan", "patents_and_inventions_150m", false, "شبكات تكشف الصيغ الرياضية الصريحة داخل البيانات."],
  [4, "hipporag", "HippoRAG (Associative Graph)", "https://github.com/OSU-NLP-Group/HippoRAG", "patents_and_inventions_150m", true, "قفزات معرفية شبيهة بالحُصين لربط العلوم المتباعدة."],
  [4, "conceptnet5", "ConceptNet 5 (Cross-Domain Graph)", "https://github.com/commonsense/conceptnet5", "patents_and_inventions_150m", true, "شبكة مفاهيم دلالية تربط الاستخدامات والعلاقات عبر المجالات."],
  [4, "torchhd", "Torchhd (Hyperdimensional VSA)", "https://github.com/hyperdimensional-computing/torchhd", "patents_and_inventions_150m", false, "دمج المفاهيم المتباعدة جبرياً لابتكار تركيبات جديدة."],
  [4, "ai_scientist_v2", "AI-Scientist-v2 (Autonomous Lab)", "https://github.com/SakanaAI/AI-Scientist-v2", "patents_and_inventions_150m", false, "توليد فرضيات وتجارب وأوراق علمية متكاملة آلياً."],
  [4, "agent_lab", "AgentLaboratory (Research Loop)", "https://github.com/SamuelSchmidgall/AgentLaboratory", "patents_and_inventions_150m", false, "إدارة دورة البحث العلمي من مراجعة الأدبيات حتى التحقق."],
  [4, "discoverybench", "DiscoveryBench (AllenAI)", "https://github.com/allenai/discoverybench", "patents_and_inventions_150m", false, "استنباط فرضيات علمية دقيقة من مجموعات البيانات."],
  [4, "manim", "Manim (Mathematical Animations)", "https://github.com/ManimCommunity/manim", "games_3d_video_and_audio", false, "تصوير النظريات والمعادلات الرياضية كرسوم متحركة."],
  [4, "pysindy", "PySINDy (Nonlinear Dynamics)", "https://github.com/dynamicslab/pysindy", "hardware_cad_voip_testing_and_physics", false, "اكتشاف المعادلات التفاضلية الحاكمة للأنظمة المتغيرة."],

  // Secret 5 (v87.5): Recursive Self-Improvement & Tool Forge
  [5, "fastmcp", "FastMCP (Instant MCP Builder)", "https://github.com/jlowin/fastmcp", "code_ide_and_surgical_editing", true, "توليد خوادم وأدوات MCP جديدة في ثوانٍ بضوابط نظيفة."],
  [5, "smolagents_hf", "Smolagents (HF Tool Agents)", "https://github.com/huggingface/smolagents", "code_ide_and_surgical_editing", true, "وكلاء يكتبون ويحفظون الأدوات البرمجية ويعيدون استخدامها."],
  [5, "extism", "Extism (WASM Plugin System)", "https://github.com/extism/extism", "code_ide_and_surgical_editing", true, "تغليف الأدوات المبتكرة في إضافات WASM معزولة وآمنة."],
  [5, "aider", "Aider (Surgical Diff Editor)", "https://github.com/Aider-AI/aider", "sovereign_os_shell_file_surgeon_and_sentinel", false, "تعديل الملفات جراحياً مع التحقق عبر Git والاختبارات."],
  [5, "swe_agent", "SWE-Agent (Auto Bug Fixer)", "https://github.com/SWE-agent/SWE-agent", "sovereign_os_shell_file_surgeon_and_sentinel", false, "إعادة إنتاج الأخطاء وإصلاحها والتحقق من الاختبارات."],
  [5, "repair_agent", "RepairAgent (Program Repair)", "https://github.com/sola-st/RepairAgent", "sovereign_os_shell_file_surgeon_and_sentinel", false, "إصلاح الأعطال البرمجية ذاتياً بالتحليل التاريخي."],
  [5, "tree_sitter", "Tree-Sitter (AST Code Parser)", "https://github.com/tree-sitter/tree-sitter", "code_ide_and_surgical_editing", true, "تحليل الشجرة التركيبية للكود لتعديل الدوال بدقة."],
  [5, "dspy_stanford", "DSPy (Systematic Optimization)", "https://github.com/stanfordnlp/dspy", "code_ide_and_surgical_editing", true, "تحسين التعليمات والخطوات برمجياً وفق مقاييس نجاح فعلية."],
  [5, "textgrad", "TextGrad (Textual Differentiation)", "https://github.com/zou-group/textgrad", "code_ide_and_surgical_editing", true, "تحسين النصوص والبرومبتات خطوة بخطوة عبر النقد الموجه."],
  [5, "evoagentx", "EvoAgentX (Self-Evolving Agents)", "https://github.com/EvoAgentX/EvoAgentX", "elastic_swarm_3_6_12_and_worker_bots", false, "تطوير معماريات الوكلاء تلقائياً بالخوارزميات التطورية."],
  [5, "adas_hu", "ADAS (Agent System Design)", "https://github.com/ShengranHu/ADAS", "elastic_swarm_3_6_12_and_worker_bots", false, "توليد واختبار معماريات وكلاء جديدة برمجياً."],
  [5, "stop_ms", "STOP (Self-Taught Optimizer)", "https://github.com/microsoft/stop", "code_ide_and_surgical_editing", false, "تحسين خوارزميات البحث والتخطيط تكرارياً بأمان."],
  [5, "hypothesis", "Hypothesis (Property Fuzz Testing)", "https://github.com/HypothesisWorks/hypothesis", "hardware_cad_voip_testing_and_physics", true, "اختبار الأدوات بمدخلات حدية وعشوائية قبل اعتمادها."],
  [5, "biomejs", "Biome (Fast Linter & Formatter)", "https://github.com/biomejs/biome", "code_ide_and_surgical_editing", true, "تدقيق جودة وسرعة كود JS/TS تلقائياً."],
  [5, "semgrep", "Semgrep (Static Security Audit)", "https://github.com/semgrep/semgrep", "sovereign_os_shell_file_surgeon_and_sentinel", false, "كشف الثغرات الأمنية والأنماط الخطرة قبل التشغيل."],

  // Secret 6 (v87.6): Collective 12-Mind Swarm & Adversarial Council
  [6, "together_moa", "Together MoA (Mixture of Agents)", "https://github.com/togethercomputer/MoA", "elastic_swarm_3_6_12_and_worker_bots", true, "تجميع إجابات طبقات النماذج المتعددة في مخرج متفوق."],
  [6, "langgraph", "LangGraph (Stateful Swarm Graph)", "https://github.com/langchain-ai/langgraph", "elastic_swarm_3_6_12_and_worker_bots", true, "تنسيق رسوم بيانية دائرية بين العقول الـ 12 مع نقاط تفتيش."],
  [6, "ag2_autogen", "AG2 / AutoGen (Multi-Agent Chat)", "https://github.com/ag2ai/ag2", "elastic_swarm_3_6_12_and_worker_bots", false, "حوار جماعي منظم بين المخطط والمبرمج والناقد والمدقق."],
  [6, "crewai", "CrewAI (Role-Playing Crews)", "https://github.com/crewAIInc/crewAI", "elastic_swarm_3_6_12_and_worker_bots", false, "توزيع المسؤوليات الدقيقة على فريق خبراء متناغم."],
  [6, "metagpt", "MetaGPT (Software Company SOP)", "https://github.com/geekan/MetaGPT", "elastic_swarm_3_6_12_and_worker_bots", false, "محاكاة شركة برمجيات كاملة بمخرجات ومواصفات موحدة."],
  [6, "chatdev", "ChatDev (Dev Multi-Agent)", "https://github.com/OpenBMB/ChatDev", "elastic_swarm_3_6_12_and_worker_bots", false, "تقسيم تطوير التطبيقات إلى مراحل تصميم وبرمجة واختبار."],
  [6, "agentverse", "AgentVerse (Dynamic Swarm Scale)", "https://github.com/OpenBMB/AgentVerse", "elastic_swarm_3_6_12_and_worker_bots", false, "تجنيد العدد المناسب من العقول (3 -> 6 -> 12) حسب المهمة."],
  [6, "mad_debate", "MAD (Multi-Agent Debate)", "https://github.com/Skytliang/Multi-Agents-Debate", "elastic_swarm_3_6_12_and_worker_bots", true, "مناظرة بين رأيين وحكم ثالث لكشف التحيز والأخطاء الخفية."],
  [6, "du_factuality", "MIT Multi-Agent Factuality Debate", "https://github.com/composable-models/llm_multiagent_debate", "elastic_swarm_3_6_12_and_worker_bots", true, "جولات نقاش لرفع دقة الحقائق والاستدلال الرياضي."],
  [6, "llm_blender", "LLM-Blender (Rank & Fuse)", "https://github.com/yuchenlin/LLM-Blender", "elastic_swarm_3_6_12_and_worker_bots", true, "مقارنة مخرجات النماذج زوجاً بزوج ودمج أفضل الأجزاء."],
  [6, "garak_nvidia", "Garak (Red-Team Scanner)", "https://github.com/NVIDIA/garak", "sovereign_os_shell_file_surgeon_and_sentinel", false, "فحص الثغرات والاختراق والهلوسة في المخرجات."],
  [6, "pyrit_azure", "PyRIT (Risk Identification Kit)", "https://github.com/Azure/PyRIT", "sovereign_os_shell_file_surgeon_and_sentinel", false, "اختبارات هجومية متعددة الخطوات لتحصين المنظومة."],
  [6, "promptfoo", "Promptfoo (Adversarial Eval)", "https://github.com/promptfoo/promptfoo", "sovereign_os_shell_file_surgeon_and_sentinel", true, "مقارنة الانحدار والاختبارات الحدية قبل الاعتماد."],
  [6, "storm_stanford", "STORM (Multi-Perspective Synthesis)", "https://github.com/stanford-oval/storm", "patents_and_inventions_150m", false, "تركيب تقارير علمية شاملة من منظورات متعددة."],
  [6, "llm_guard", "LLM Guard (Security Veto Filter)", "https://github.com/protectai/llm-guard", "sovereign_os_shell_file_surgeon_and_sentinel", true, "درع تحقق يمنع تسريب الأسرار والثغرات في المخرجات."],

  // Secret 7 (v87.7): System-1 <15ms Intuition, Titans/Infinite Context & Foresight
  [7, "eagle_spec", "EAGLE (Speculative Decoding)", "https://github.com/SafeAILab/EAGLE", "code_ide_and_surgical_editing", false, "تسريع الاستدلال عبر التنبؤ المتوازي بالكلمات القادمة."],
  [7, "gptcache", "GPTCache (Sub-ms Semantic Cache)", "https://github.com/zilliztech/GPTCache", "zip_vfs_and_file_packaging", true, "استرجاع الإجابات الدلالية المتكررة في أجزاء الميلي ثانية."],
  [7, "lmcache", "LMCache (KV-Cache Persistence)", "https://github.com/LMCache/LMCache", "zip_vfs_and_file_packaging", false, "حفظ حالة انتباه السياق لإلغاء إعادة قراءة الملفات."],
  [7, "sglang", "SGLang (RadixAttention KV Sharing)", "https://github.com/sgl-project/sglang", "code_ide_and_surgical_editing", false, "مشاركة البادئات المشتركة في الذاكرة لتسريع البداية."],
  [7, "vllm", "vLLM (PagedAttention Serving)", "https://github.com/vllm-project/vllm", "code_ide_and_surgical_editing", false, "إدارة ذاكرة GPU بكفاءة عالية لتدفق التوكنز."],
  [7, "llama_cpp", "llama.cpp (Local Edge Inference)", "https://github.com/ggml-org/llama.cpp", "airgapped_offline_vault_and_lan_mesh", true, "تشغيل سريع محلي وأوفلاين على CPU وGPU."],
  [7, "web_llm", "WebLLM (Browser WebGPU Shaders)", "https://github.com/mlc-ai/web-llm", "airgapped_offline_vault_and_lan_mesh", true, "تشغيل حدس الذكاء مباشرة في المتصفح بلا تأخير شبكة."],
  [7, "titans_pytorch", "Titans (Neural Long-Term Memory)", "https://github.com/lucidrains/titans-pytorch", "zip_vfs_and_file_packaging", false, "ذاكرة عصبية تتعلم حفظ المعارف الجوهرية وقت الاختبار."],
  [7, "mamba_ssm", "Mamba (Linear O(N) State Space)", "https://github.com/state-spaces/mamba", "code_ide_and_surgical_editing", false, "معالجة سياقات طويلة جداً بتكلفة خطية."],
  [7, "rwkv_lm", "RWKV (Constant-Memory RNN/LLM)", "https://github.com/BlinkDL/RWKV-LM", "airgapped_offline_vault_and_lan_mesh", true, "ذاكرة متواصلة ثابتة الحجم مهما طال الحوار."],
  [7, "yarn_ctx", "YaRN (Long Context RoPE)", "https://github.com/jquesnelle/yarn", "code_ide_and_surgical_editing", false, "تمديد نافذة السياق إلى ملايين الرموز دون ضياع المنتصف."],
  [7, "streaming_llm", "StreamingLLM (Attention Sinks)", "https://github.com/mit-han-lab/streaming-llm", "code_ide_and_surgical_editing", false, "تشغيل حوارات ممتدة بلا انهيار السياق."],
  [7, "repomix", "Repomix (Codebase Context Packer)", "https://github.com/yamadashy/repomix", "code_ide_and_surgical_editing", true, "ضغط وترتيب مستودع الكود الكامل في سياق منظم."],
  [7, "routellm", "RouteLLM (Fast vs Deep Switch)", "https://github.com/lm-sys/RouteLLM", "google_ai_studio_dual_brand_workspace", true, "التبديل التلقائي بين الحدس السريع System-1 والمنطق العميق System-2."],
  [7, "river_online", "River (Online Anomaly Foresight)", "https://github.com/online-ml/river", "kaspi_pos_merchant_intelligence", true, "رصد الشذوذ والتنبيه المبكر لحظياً على تدفقات البيانات."],
  [7, "letta_memgpt", "Letta (Long-Horizon Stateful Mem)", "https://github.com/letta-ai/letta", "zip_vfs_and_file_packaging", true, "إدارة الذاكرة الحية ونقاط التفتيش عبر الجلسات الطويلة."],
];

export const V87_SUPER_INTELLIGENCE_SOURCES: readonly SovereignPackSourceEntry[] = VERIFIED_V87_ROWS.map(
  ([secret, idSlug, name, url, clusterId, clientCapable, roleAr], idx) => {
    const pack = `v87.${secret}` as const;
    return {
      id: `v87_${secret}_${String(idx + 1).padStart(3, "0")}_${idSlug}`,
      pack,
      index: idx + 1,
      groupId: `v87_secret_${secret}`,
      groupTitleAr: SEVEN_SECRETS_METADATA[secret - 1].titleAr,
      clusterId,
      name,
      url,
      canonicalUrlVerified: true,
      vaultUri: `vault://heyuka/${pack}/${String(idx + 1).padStart(3, "0")}-${idSlug}`,
      mirrorStrategy: clientCapable ? "browser_webgpu_wasm" : "huggingface_xet_weights",
      clientComputeCapable: clientCapable,
      zeroKeyApiFree: true,
      roleAr,
    };
  }
);

export function getSevenSecretsCatalogSummary() {
  return {
    totalVerifiedV87Sources: V87_SUPER_INTELLIGENCE_SOURCES.length,
    bySecret: SEVEN_SECRETS_METADATA.map((meta) => ({
      ...meta,
      sourcesCount: V87_SUPER_INTELLIGENCE_SOURCES.filter((s) => s.pack === meta.pack).length,
    })),
  };
}
