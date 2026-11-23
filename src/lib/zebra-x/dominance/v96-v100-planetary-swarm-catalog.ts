import type { SovereignPackSourceEntry, SovereignPackVersion } from "@/lib/zebra-x/core/sovereign-pack-types";
import type { CognitiveClusterId } from "@/lib/zebra-x/core/cognitive-brain-registry";

export type SwarmPackVersion = Extract<SovereignPackVersion, "v97.0" | "v99.0" | "v100.0">;

type SwarmTuple = [
  pack: SwarmPackVersion,
  idSlug: string,
  name: string,
  url: string,
  clusterId: CognitiveClusterId,
  clientCapable: boolean,
  roleAr: string,
];

const PACK_TITLES: Record<SwarmPackVersion, string> = {
  "v97.0": "Planetary Crawling Secrets (v97.0): Bloom Filter, HyperLogLog, ETag Delta, Sitemap & Consistent Hashing",
  "v99.0": "Global Free Swarm Nodes (v99.0): 120+ Multi-Cloud CI, Always-Free VMs, Edge & Browser P2P Mesh",
  "v100.0": "Golden Priority Sources (v100.0): المصادر المعرفية الذهبية الـ 15 ذات الأولوية القصوى في الزحف الكوني",
};

const RAW_SWARM_SOURCES: readonly SwarmTuple[] = [
  // v97.0 — 5 Hidden Planetary Crawling Secrets
  ["v97.0", "pybloom_live", "Scalable Bloom Filter (pybloom-live)", "https://github.com/jaybaird/python-bloomfilter", "elastic_swarm_3_6_12_and_worker_bots", true, "فلتر تشفيري خفيف يمنع تكرار زيارة أي رابط عبر مئات العقد."],
  ["v97.0", "cuckoofilter", "Cuckoo Filter (Space-Optimal Dedup)", "https://github.com/seiflotfy/cuckoofilter", "elastic_swarm_3_6_12_and_worker_bots", false, "فلتر سريع يدعم التحديث والحذف الذكي للروابط."],
  ["v97.0", "datasketch_hll", "Datasketch (HyperLogLog++ & MinHash LSH)", "https://github.com/ekzhu/datasketch", "elastic_swarm_3_6_12_and_worker_bots", false, "تقدير عدد الصفحات الفريدة على مستوى المليارات وكشف التشابه النصي."],
  ["v97.0", "simhash_py", "SimHash 64-Bit Locality Fingerprinting", "https://github.com/1e0ng/simhash", "elastic_swarm_3_6_12_and_worker_bots", true, "بصمة 8 بايتات لكشف النصوص شبه المكررة والتغييرات الطفيفة."],
  ["v97.0", "text_dedup_fw", "Text-Dedup (FineWeb Deduplication)", "https://github.com/ChenghaoMou/text-dedup", "code_ide_and_surgical_editing", false, "تنظيف المليارات من النصوص المكررة بنفس تقنيات FineWeb."],
  ["v97.0", "w3lib_canon", "w3lib URL Canonicalizer", "https://github.com/scrapy/w3lib", "live_search_and_47_public_apis", true, "توحيد الروابط وحذف معاملات التتبع لمنع الزحف المكرر."],
  ["v97.0", "croaring_bit", "CRoaring Compressed Bitmaps", "https://github.com/RoaringBitmap/CRoaring", "zip_vfs_and_file_packaging", false, "ضغط فهارس الوثائق والصفحات بنسبة عالية."],
  ["v97.0", "hishel_http", "Hishel RFC 9111 HTTP Conditional Cache", "https://github.com/karpetrosyan/hishel", "live_search_and_47_public_apis", false, "فحص تلقائي لرؤوس ETag وIf-Modified-Since لتجاوز الصفحات الثابتة في 1ms."],
  ["v97.0", "diff_match_patch", "Google Diff-Match-Patch (Delta-Only)", "https://github.com/google/diff-match-patch", "code_ide_and_surgical_editing", true, "استخراج الفقرات المتغيرة فقط عند تحديث صفحات المواقع."],
  ["v97.0", "cdx_toolkit", "Common Crawl CDX Toolkit", "https://github.com/cocrawler/cdx_toolkit", "live_search_and_47_public_apis", false, "استعلام فهرس Common Crawl للوصول للروابط حسب اللغة والمجال."],
  ["v97.0", "warcio_stream", "Warcio Web Archive Stream Reader", "https://github.com/webrecorder/warcio", "zip_vfs_and_file_packaging", false, "قراءة شرائح WARC من Common Crawl مباشرة بلا ضغط على المواقع."],
  ["v97.0", "katana_spider", "ProjectDiscovery Katana Web Spider", "https://github.com/projectdiscovery/katana", "browser_autopilot_oauth_cloud_factory", false, "استكشاف الروابط الداخلية والخرائط في التطبيقات الحديثة."],
  ["v97.0", "extruct_schema", "Extruct (JSON-LD & Schema.org Extractor)", "https://github.com/scrapinghub/extruct", "live_search_and_47_public_apis", false, "استخلاص البيانات المهيكلة النظيفة والأسعار والأبحاث مباشرة."],
  ["v97.0", "wayback_archive", "Internet Archive Wayback CDX Client", "https://github.com/internetarchive/wayback", "live_search_and_47_public_apis", false, "استرجاع الصفحات التاريخية والكتب المفتوحة من archive.org."],
  ["v97.0", "uhashring_py", "Consistent Hashing Ring (uhashring)", "https://github.com/ultrabug/uhashring", "elastic_swarm_3_6_12_and_worker_bots", true, "تقسيم المواقع على 120 شريحة حتمية دون تداخل العقد."],
  ["v97.0", "aiolimiter_py", "Per-Domain Token-Bucket Rate Limiter", "https://github.com/mjpieters/aiolimiter", "elastic_swarm_3_6_12_and_worker_bots", false, "التحكم في معدل الطلبات باحترام لكل نطاق على حدة."],
  ["v97.0", "datatrove_hf", "HuggingFace Datatrove Petabyte Pipeline", "https://github.com/huggingface/datatrove", "elastic_swarm_3_6_12_and_worker_bots", false, "خط أنابيب تصفية الجودة التعليمية وإزالة الضوضاء."],
  ["v97.0", "simple_peer_rtc", "Simple-Peer WebRTC DataChannel Mesh", "https://github.com/feross/simple-peer", "multiplayer_crdt_huddles_and_gamification", true, "تبادل الفهارس والنتائج ند-لند بين المتصفحات التشاركية."],

  // v99.0 — Free Global Swarm Node Platforms (CI/CD, Always-Free Cloud VMs, Edge & GPUs)
  ["v99.0", "oracle_always_free", "Oracle Cloud Always-Free ARM VMs", "https://www.oracle.com/cloud/free/", "elastic_swarm_3_6_12_and_worker_bots", false, "موارد سحابية دائمة لتشغيل عقد الزحف والفرز 24/7."],
  ["v99.0", "cloudflare_workers", "Cloudflare Workers Free Global Edge", "https://workers.cloudflare.com/", "browser_autopilot_oauth_cloud_factory", false, "تشغيل عقد فحص Sitemap وETag عبر مراكز الحافة العالمية."],
  ["v99.0", "deno_deploy_edge", "Deno Deploy Free Serverless Edge", "https://deno.com/deploy", "browser_autopilot_oauth_cloud_factory", false, "تنفيذ طلبات TypeScript الموزعة عبر المناطق العالمية."],
  ["v99.0", "hf_zerogpu_spaces", "Hugging Face Spaces & ZeroGPU", "https://huggingface.co/zero-gpu-explorers", "elastic_swarm_3_6_12_and_worker_bots", false, "حاويات Docker مجانية للرفع المباشر لـ zuvyrismail/heyuka-omni-vault."],
  ["v99.0", "kaggle_free_gpu", "Kaggle Free 2xT4 GPU Notebooks", "https://www.kaggle.com/", "elastic_swarm_3_6_12_and_worker_bots", false, "معالجة شرائح WARC الكبيرة وتقطير المعرفة مجاناً."],
  ["v99.0", "lightning_ai_free", "Lightning.ai Free Cloud Studios", "https://lightning.ai/", "elastic_swarm_3_6_12_and_worker_bots", false, "بيئات حوسبة مجانية لتدريب وتقييم العقد."],
  ["v99.0", "activepieces_oss", "Activepieces Open Workflow Automation", "https://github.com/activepieces/activepieces", "browser_autopilot_oauth_cloud_factory", false, "أتمتة سحب الخلاصات والربط السحابي بدون تكلفة."],
  ["v99.0", "headscale_mesh", "Headscale Sovereign Mesh VPN", "https://github.com/juanfont/headscale", "airgapped_offline_vault_and_lan_mesh", false, "ربط الأجهزة والعقد في شبكة مشفرة سيادية."],
  ["v99.0", "wasmer_edge_wasm", "Wasmer Edge WebAssembly Serverless", "https://wasmer.io/", "airgapped_offline_vault_and_lan_mesh", true, "تشغيل عمال WebAssembly المعزولين على الحافة العالمية."],
  ["v99.0", "modal_free_compute", "Modal Serverless Compute Tier", "https://modal.com/", "elastic_swarm_3_6_12_and_worker_bots", false, "تشغيل دفعات بايثون ومهام التدريب المتفرقة بدون إعداد خوادم."],

  // v100.0 — 15 Golden Priority Knowledge & Dataset Sources
  ["v100.0", "golden_fineweb_edu", "FineWeb-Edu Open Pretraining Dataset", "https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu", "live_search_and_47_public_apis", true, "المصدر الذهبي 1: تريليونات التوكنات التعليمية والعلمية المصفاة."],
  ["v100.0", "golden_the_stack_v2", "BigCode The Stack v2 (600+ Languages)", "https://huggingface.co/datasets/bigcode/the-stack-v2", "code_ide_and_surgical_editing", false, "المصدر الذهبي 2: أكبر مستودع مفتوح للأكواد البرمجية عالمياً."],
  ["v100.0", "golden_lean_mathlib4", "Lean Mathlib4 Formal Proofs Library", "https://github.com/leanprover-community/mathlib4", "code_ide_and_surgical_editing", false, "المصدر الذهبي 7: براهين الرياضيات الرسمية المدققة آلياً."],
  ["v100.0", "golden_common_crawl", "Common Crawl Open Web Corpus", "https://commoncrawl.org/", "live_search_and_47_public_apis", true, "المصدر الذهبي 9: أرشيف الويب العام المفتوح (110+ مليار صفحة)."],
  ["v100.0", "golden_atlasia_darija", "AtlasIA Moroccan Darija Open Dataset", "https://huggingface.co/datasets/atlasia/AL-Atlas-Moroccan-Darija-Pretraining-Dataset", "kaspi_pos_merchant_intelligence", true, "المصدر الذهبي 11: أضخم قاعدة مفتوحة للدارجة المغربية الأصيلة."],
  ["v100.0", "golden_camel_tools", "CAMeL Lab Arabic NLP Suite", "https://github.com/CAMeL-Lab/camel_tools", "kaspi_pos_merchant_intelligence", true, "المصدر الذهبي 12: أدوات ومصادر اللغة العربية واللهجات."],
  ["v100.0", "golden_europe_pmc", "Europe PMC & PubMed Central Papers", "https://europepmc.org/", "live_search_and_47_public_apis", true, "المصدر الذهبي 6: ملايين الأبحاث الطبية والسريرية المحكمة."],
  ["v100.0", "golden_openlibrary", "Open Library & Gutenberg Open Books", "https://openlibrary.org/", "pdf_office_and_documents", true, "المصدر الذهبي 8: عشرات الآلاف من الكتب المفتوحة والأكاديمية."],
];

export const V96_V100_PLANETARY_SWARM_SOURCES: readonly SovereignPackSourceEntry[] = RAW_SWARM_SOURCES.map(
  ([pack, idSlug, name, url, clusterId, clientCapable, roleAr], idx) => ({
    id: `${pack.replace(".", "_")}_${String(idx + 1).padStart(3, "0")}_${idSlug}`,
    pack,
    index: idx + 1,
    groupId: `${pack}_swarm_group`,
    groupTitleAr: PACK_TITLES[pack],
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
