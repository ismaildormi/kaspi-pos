/**
 * HEYUKA / YUKA — Long-Context Comprehension, Reasoning, Coding & Autonomous Eval Catalog (`v14.1`–`v15.2`)
 *
 * Strictly deduplicated registry covering:
 * - v15.1 (22): Long-Context, Comprehension, Embeddings & Efficiency sources
 * - v15.2 (56): Planning/Reasoning Datasets (25), Code/Creative Datasets (23), Agent/Exec Frameworks (8)
 * - v14.x (66): Autonomous QA, Property/Fuzzing, Chaos Engineering, AI Security & Self-Evolution engines
 * - Runtime engines:
 *   1) `chunkLongContextWithRopeWindow`: NLTK-style sentence segmentation + YaRN/RoPE sliding window
 *   2) `verifyPropertyBasedInvariants`: deterministic Fast-Check/Schemathesis style invariant checker
 *   3) `searchReasoningAndEvalCatalog`: unified zero-dependency catalog lookup
 */

export type CatalogPackVersion = "v15.1" | "v15.2" | "v14.x";

export type CatalogSubgroup =
  | "long_context_embeddings"
  | "planning_reasoning_datasets"
  | "code_creative_datasets"
  | "agent_execution_frameworks"
  | "eval_qa_observability"
  | "fuzz_chaos_security"
  | "self_evolution_rlhf";

export interface ReasoningEvalCatalogEntry {
  id: string;
  name: string;
  version: CatalogPackVersion;
  subgroup: CatalogSubgroup;
  sourceUrl: string;
  licenseType: "open_source" | "open_weights_or_data";
  summary: string;
  tags: string[];
}

type CompactCatalogTuple = [
  id: string,
  name: string,
  url: string,
  license: "open_source" | "open_weights_or_data",
  summary: string,
  tags: string[],
];

function hydrateCatalogPack(
  version: CatalogPackVersion,
  subgroup: CatalogSubgroup,
  rows: readonly CompactCatalogTuple[]
): ReasoningEvalCatalogEntry[] {
  return rows.map(([id, name, sourceUrl, licenseType, summary, tags]) => ({
    id,
    name,
    version,
    subgroup,
    sourceUrl,
    licenseType,
    summary,
    tags,
  }));
}

export const V15_1_LONG_CONTEXT_EMBEDDING_SOURCES: readonly ReasoningEvalCatalogEntry[] =
  hydrateCatalogPack("v15.1", "long_context_embeddings", [
    ["hf-datasets", "Hugging Face Datasets", "https://huggingface.co/docs/datasets", "open_source", "Unified zero-copy Arrow streaming loader for global corpora.", ["datasets", "streaming", "corpus"]],
    ["eleuther-pile", "The Pile", "https://pile.eleuther.ai/", "open_weights_or_data", "825 GiB open language modeling corpus spanning ArXiv, PubMed, GitHub, and StackExchange.", ["pretraining", "science", "long-context"]],
    ["open-orca", "OpenOrca", "https://huggingface.co/datasets/Open-Orca/OpenOrca", "open_weights_or_data", "Step-by-step explanation traces augmenting FLAN reasoning tasks.", ["cot", "reasoning", "distillation"]],
    ["stanford-alpaca", "Stanford Alpaca", "https://github.com/tatsu-lab/stanford_alpaca", "open_source", "52K structured instruction-following demonstrations.", ["instruction", "sft"]],
    ["databricks-dolly-15k", "Databricks Dolly 15k", "https://huggingface.co/datasets/databricks/databricks-dolly-15k", "open_weights_or_data", "Commercial-friendly human-authored brainstorming, classification, summarization, and QA corpus.", ["summarization", "classification", "sft"]],
    ["squad-v2", "SQuAD 2.0", "https://rajpurkar.github.io/SQuAD-explorer/", "open_weights_or_data", "Reading comprehension benchmark pairing answerable passages with unanswerable hallucination traps.", ["qa", "reading-comprehension", "abstention"]],
    ["natural-questions", "Natural Questions", "https://ai.google.com/research/NaturalQuestions", "open_weights_or_data", "Real search queries grounded against long Wikipedia documents and concise answers.", ["retrieval", "wikipedia", "qa"]],
    ["ms-marco", "MS MARCO", "https://microsoft.github.io/msmarco/", "open_weights_or_data", "Large-scale passage ranking and neural retrieval relevance benchmark.", ["rag", "ranking", "retrieval"]],
    ["hotpotqa", "HotpotQA", "https://hotpotqa.github.io/", "open_weights_or_data", "Multi-hop question answering requiring evidence synthesis across documents.", ["multi-hop", "rag", "reasoning"]],
    ["cnn-dailymail", "CNN/DailyMail", "https://huggingface.co/datasets/abisee/cnn_dailymail", "open_weights_or_data", "Abstractive multi-sentence news summarization benchmark.", ["summarization", "news"]],
    ["bookcorpus", "BookCorpus", "https://huggingface.co/datasets/bookcorpus", "open_weights_or_data", "Extended narrative continuity corpus for long-range discourse modeling.", ["long-context", "narrative"]],
    ["reddit-pushshift", "Reddit Pushshift Corpus", "https://github.com/pushshift/api", "open_source", "Multi-turn threaded conversational discourse and pragmatic intent corpus.", ["dialogue", "threads"]],
    ["stackexchange-dump", "StackExchange Dump", "https://archive.org/details/stackexchange", "open_weights_or_data", "Peer-voted technical QA knowledge base spanning software engineering, math, and physics.", ["qa", "engineering", "math"]],
    ["oscar-corpus", "OSCAR Corpus", "https://oscar-project.org/", "open_weights_or_data", "Clean multilingual Common Crawl corpus covering Arabic, French, English, and more.", ["multilingual", "arabic", "french"]],
    ["allenai-c4", "Colossal Clean Crawled Corpus (C4)", "https://huggingface.co/datasets/allenai/c4", "open_weights_or_data", "Deduplicated multilingual web corpus for long-form text comprehension.", ["multilingual", "clean-web"]],
    ["gsm8k", "GSM8K", "https://huggingface.co/datasets/openai/gsm8k", "open_weights_or_data", "Grade-school multi-step arithmetic word problem reasoning benchmark.", ["math", "cot", "arithmetic"]],
    ["e5-multilingual", "E5 Embeddings (Multilingual)", "https://huggingface.co/intfloat/multilingual-e5-large", "open_weights_or_data", "High-recall cross-lingual dense embeddings bridging Arabic, French, and English retrieval.", ["embeddings", "multilingual", "semantic-search"]],
    ["nomic-embed-8k", "Nomic Embed (8192+ Context)", "https://huggingface.co/nomic-ai/nomic-embed-text-v1.5", "open_weights_or_data", "Long-context Matryoshka text embedding architecture supporting 8192+ tokens.", ["embeddings", "8192-context", "matryoshka"]],
    ["peft-lora", "PEFT / LoRA", "https://github.com/huggingface/peft", "open_source", "Parameter-efficient low-rank adaptation adapters for domain specialization.", ["lora", "fine-tuning", "adapters"]],
    ["flash-attention", "FlashAttention", "https://github.com/Dao-AILab/flash-attention", "open_source", "IO-aware exact attention tiling for rapid long-context inference.", ["attention", "long-context", "gpu"]],
    ["yarn-rope-scaling", "YaRN / RoPE Scaling", "https://github.com/jquesnelle/yarn", "open_source", "Rotary position embedding extension unlocking 64k–128k context windows.", ["rope", "yarn", "128k-context"]],
    ["nltk", "NLTK", "https://www.nltk.org/", "open_source", "Sentence segmentation, morphology, tokenization, and lexical parsing toolkit.", ["nlp", "tokenization", "chunking"]],
  ]);

export const V15_2_PLANNING_REASONING_DATASETS: readonly ReasoningEvalCatalogEntry[] =
  hydrateCatalogPack("v15.2", "planning_reasoning_datasets", [
    ["openmathinstruct", "OpenMathInstruct", "https://huggingface.co/datasets/nvidia/OpenMathInstruct-1", "open_weights_or_data", "Code-interpreter verified mathematical instruction dataset by NVIDIA.", ["math", "code-interpreter"]],
    ["metamathqa", "MetaMathQA", "https://huggingface.co/datasets/meta-math/MetaMathQA", "open_weights_or_data", "Backward-and-forward bootstrapped mathematical reasoning problems.", ["math", "bootstrapping"]],
    ["orca-math", "Orca-Math", "https://huggingface.co/datasets/microsoft/orca-math-word-problems-200k", "open_weights_or_data", "200k synthetic word problems refined via iterative agent feedback.", ["math", "word-problems"]],
    ["prm800k", "PRM800K", "https://github.com/openai/prm800k", "open_weights_or_data", "800,000 step-level process supervision labels verifying intermediate math reasoning.", ["prm", "process-verification"]],
    ["logiqa", "LogiQA", "https://github.com/lgw863/LogiQA-dataset", "open_weights_or_data", "Deductive, categorical, and conditional logical reasoning benchmark.", ["logic", "deduction"]],
    ["reclor", "ReClor", "https://whyu.me/reclor/", "open_weights_or_data", "Analytical reading comprehension and argument-flaw detection benchmark.", ["logic", "comprehension"]],
    ["strategyqa", "StrategyQA", "https://allenai.org/data/strategyqa", "open_weights_or_data", "Implicit multi-hop strategy decomposition requiring inferred intermediate questions.", ["multi-hop", "strategy", "decomposition"]],
    ["proofwriter", "ProofWriter", "https://allenai.org/data/proofwriter", "open_weights_or_data", "Rule-based formal logical deduction and explicit proof tree generation.", ["proofs", "logic", "trees"]],
    ["entailmentbank", "EntailmentBank", "https://allenai.org/data/entailmentbank", "open_weights_or_data", "Structured multi-premise scientific entailment trees explaining answers.", ["entailment", "science", "trees"]],
    ["big-bench-hard", "BIG-Bench Hard (BBH)", "https://github.com/suzgunmirac/BIG-Bench-Hard", "open_source", "23 challenging algorithmic, temporal, symbolic, and causal reasoning benchmarks.", ["bbh", "benchmark", "reasoning"]],
    ["ai2-arc", "ARC (AI2 Reasoning Challenge)", "https://allenai.org/data/arc", "open_weights_or_data", "Grade-school scientific questions requiring causal world knowledge.", ["science", "qa", "reasoning"]],
    ["commonsenseqa", "CommonsenseQA", "https://www.tau-nlp.sites.tau.ac.il/commonsenseqa", "open_weights_or_data", "Prior-knowledge commonsense reasoning over ConceptNet graphs.", ["commonsense", "conceptnet"]],
    ["piqa", "PIQA", "https://yonatanbisk.com/piqa/", "open_weights_or_data", "Physical commonsense interaction and tool affordance benchmark.", ["physical-reasoning", "affordance"]],
    ["socialiqa", "SocialIQA", "https://allenai.org/data/socialiqa", "open_weights_or_data", "Social dynamics, intent, and pragmatic emotional reasoning.", ["social", "intent"]],
    ["cosmosqa", "CosmosQA", "https://wilburone.github.io/cosmos/", "open_weights_or_data", "Narrative cause-and-effect reading comprehension beyond surface matching.", ["causal", "narrative"]],
    ["drop-dataset", "DROP", "https://allenai.org/data/drop", "open_weights_or_data", "Discrete reasoning over paragraphs (counting, sorting, arithmetic deltas).", ["discrete", "counting", "math"]],
    ["tat-qa", "TAT-QA", "https://nextplusplus.github.io/TAT-QA/", "open_weights_or_data", "Hybrid tabular + textual financial report QA with numerical derivation.", ["finance", "tables", "hybrid-qa"]],
    ["finqa", "FinQA", "https://github.com/czyssrs/FinQA", "open_source", "Program-synthesized multi-step reasoning over financial statements.", ["finance", "program-synthesis"]],
    ["musique", "MuSiQue", "https://github.com/stonybrooknlp/musique", "open_source", "Connected 2-to-4 hop question composition resisting single-hop shortcuts.", ["multi-hop", "rag"]],
    ["2wikimultihopqa", "2WikiMultihopQA", "https://github.com/Alab-NII/2wikimultihop", "open_source", "Structured evidence-path multi-hop reasoning across encyclopedic entities.", ["multi-hop", "evidence"]],
    ["alfworld", "ALFWorld", "https://alfworld.github.io/", "open_source", "Embodied household planning and hierarchical sub-goal alignment.", ["planning", "embodied", "agents"]],
    ["webshop-dataset", "WebShop Dataset", "https://webshop-pnlp.github.io/", "open_source", "E-commerce product attribute reasoning, cart search, and constraint matching.", ["commerce", "navigation", "search"]],
    ["mind2web", "Mind2Web", "https://osu-nlp-group.github.io/Mind2Web/", "open_weights_or_data", "Generalist cross-website workflow execution grounded in live DOM hierarchies.", ["dom", "browser-agent"]],
    ["osworld-dataset", "OSWorld Dataset", "https://os-world.github.io/", "open_source", "Multimodal Ubuntu/Windows/macOS desktop GUI, bash & file-system agent benchmark.", ["os-control", "desktop", "multimodal"]],
    ["toolbench", "ToolBench", "https://github.com/OpenBMB/ToolBench", "open_source", "Massive real-world REST API instruction tuning & DFSDT tool planning.", ["tool-use", "api", "dfdst"]],
  ]);

export const V15_2_CODE_CREATIVE_DATASETS: readonly ReasoningEvalCatalogEntry[] =
  hydrateCatalogPack("v15.2", "code_creative_datasets", [
    ["the-stack", "The Stack", "https://huggingface.co/datasets/bigcode/the-stack", "open_weights_or_data", "Permissively licensed source code spanning 300+ programming languages.", ["code", "polyglot"]],
    ["starcoderdata", "StarCoderData", "https://huggingface.co/datasets/bigcode/starcoderdata", "open_weights_or_data", "Curated GitHub code, commits, issues, and notebook corpus across 86 languages.", ["code", "issues", "notebooks"]],
    ["codealpaca", "CodeAlpaca", "https://github.com/sahil280114/codealpaca", "open_source", "20K code generation, refactoring, and explanation instruction pairs.", ["code", "sft"]],
    ["wizardcoder-evol", "WizardCoder Evol-Instruct", "https://github.com/nlpxucan/WizardLM", "open_weights_or_data", "Complexity-evolved coding problems built via Evol-Instruct heuristics.", ["code", "evol-instruct"]],
    ["magicoder-oss", "Magicoder OSS-Instruct", "https://github.com/ise-uiuc/magicoder", "open_source", "Synthetic code tasks grounded in diverse real open-source seed snippets.", ["code", "synthesis"]],
    ["apps-dataset", "APPS Dataset", "https://github.com/hendrycks/apps", "open_source", "10,000 algorithmic competition problems with input/output test cases.", ["algorithms", "unit-tests"]],
    ["humaneval", "HumanEval", "https://github.com/openai/human-eval", "open_source", "Hand-crafted Python functional synthesis & docstring test suite.", ["code-eval", "python"]],
    ["mbpp", "MBPP", "https://huggingface.co/datasets/google-research-datasets/mbpp", "open_weights_or_data", "Crowd-sourced Python programming tasks with assertion suites.", ["code-eval", "python"]],
    ["commitpack", "CommitPack", "https://huggingface.co/datasets/bigcode/commitpack", "open_weights_or_data", "4TB of real git diffs paired with human commit intentions across 350 languages.", ["diffs", "refactoring", "git"]],
    ["writingprompts", "WritingPrompts", "https://huggingface.co/datasets/euclaise/writingprompts", "open_weights_or_data", "Diverse creative fiction narratives conditioned on structured prompts.", ["creative-writing", "story"]],
    ["oasst2", "OpenAssistant OASST2", "https://huggingface.co/datasets/OpenAssistant/oasst2", "open_weights_or_data", "Multilingual human-annotated assistant conversation trees ranked by preference.", ["chat", "rlhf", "multilingual"]],
    ["ultrafeedback", "UltraFeedback", "https://huggingface.co/datasets/openbmb/UltraFeedback", "open_weights_or_data", "Fine-grained multi-aspect preference feedback (instruction following, honesty, helpfulness).", ["dpo", "preference", "alignment"]],
    ["helpsteer", "HelpSteer", "https://huggingface.co/datasets/nvidia/HelpSteer", "open_weights_or_data", "Multi-attribute steerability corpus scoring correctness, coherence, and verbosity.", ["steerability", "alignment"]],
    ["capybara", "Capybara", "https://huggingface.co/datasets/LDJnr/Capybara", "open_weights_or_data", "High-quality multi-turn synthetic reasoning dialogues.", ["dialogue", "multi-turn"]],
    ["slimorca", "SlimOrca", "https://huggingface.co/datasets/Open-Orca/SlimOrca", "open_weights_or_data", "Curated distortion-filtered subset of OpenOrca verified for zero-noise reasoning.", ["cot", "curated"]],
    ["platypus", "Platypus", "https://huggingface.co/datasets/garage-bAInd/Open-Platypus", "open_weights_or_data", "Focused STEM & logical problem-solving dataset with strict deduplication.", ["stem", "logic"]],
    ["camel-ai-datasets", "Camel-AI Datasets", "https://huggingface.co/camel-ai", "open_weights_or_data", "Role-playing scientific, mathematical, physics, and chemistry dialogues.", ["roleplay", "stem"]],
    ["autogpt-datasets", "AutoGPT Datasets", "https://github.com/Significant-Gravitas/AutoGPT", "open_source", "Autonomous objective decomposition and feedback loop trajectory corpora.", ["trajectories", "planning"]],
    ["gorilla-openfunctions", "Gorilla OpenFunctions", "https://gorilla.cs.berkeley.edu/", "open_source", "Strict JSON schema AST validation benchmark for function and API calls.", ["function-calling", "ast", "json-schema"]],
    ["nexusraven", "NexusRaven", "https://huggingface.co/Nexusflow/NexusRaven-V2-13B", "open_weights_or_data", "Zero-shot nested/parallel function composition without proprietary dependencies.", ["tool-calling", "parallel-calls"]],
    ["wikihow-corpus", "WikiHow", "https://github.com/mahnazkoupaee/WikiHow-Dataset", "open_weights_or_data", "Step-by-step procedural SOP guides with structured headings and summaries.", ["sop", "procedures", "summarization"]],
    ["magicbrush", "MagicBrush", "https://osu-nlp-group.github.io/MagicBrush/", "open_weights_or_data", "Multi-turn mask-guided studio image editing dataset.", ["image-editing", "vision"]],
    ["laion-5b-metadata", "LAION-5B Metadata", "https://laion.ai/blog/laion-5b/", "open_weights_or_data", "Large-scale multilingual image-text metadata & aesthetic scoring taxonomy.", ["multimodal", "aesthetics", "metadata"]],
  ]);

export const V15_2_AGENT_EXECUTION_FRAMEWORKS: readonly ReasoningEvalCatalogEntry[] =
  hydrateCatalogPack("v15.2", "agent_execution_frameworks", [
    ["langgraph", "LangGraph", "https://github.com/langchain-ai/langgraph", "open_source", "Stateful cyclic actor-graph orchestration with persisted checkpoints and human-in-loop interrupts.", ["state-machine", "agents", "checkpoints"]],
    ["superagi", "SuperAGI", "https://github.com/TransformerOptimus/SuperAGI", "open_source", "Concurrent agent execution console with telemetry, action tools, and vector memory.", ["concurrent-agents", "telemetry"]],
    ["agentgpt", "AgentGPT", "https://github.com/reworkd/AgentGPT", "open_source", "Goal-decomposition browser autonomous runner spawning plan/execute/critique waves.", ["goal-decomposition", "web-agent"]],
    ["gpt-engineer", "GPT-Engineer", "https://github.com/gpt-engineer-org/gpt-engineer", "open_source", "Spec-to-full-repository code synthesizer with iterative clarification passes.", ["scaffolding", "codegen"]],
    ["ms-guidance", "Microsoft Guidance", "https://github.com/guidance-ai/guidance", "open_source", "Constrained grammar/regex decoding ensuring deterministic structured JSON and tool outputs.", ["constrained-decoding", "json", "grammar"]],
    ["selenium", "Selenium WebDriver", "https://www.selenium.dev/", "open_source", "Cross-browser W3C WebDriver automation engine.", ["browser", "automation"]],
    ["puppeteer", "Puppeteer", "https://pptr.dev/", "open_source", "Headless Chrome DevTools Protocol automation for visual snapshot & DOM audits.", ["cdp", "browser", "screenshots"]],
    ["jupyterlab", "JupyterLab", "https://jupyter.org/", "open_source", "Interactive computational notebook kernel ecosystem for Python, data plots & reproducible checks.", ["notebooks", "python", "data-science"]],
  ]);

export const V14_EVAL_CHAOS_EVOLUTION_STACK: readonly ReasoningEvalCatalogEntry[] = [
  ...hydrateCatalogPack("v14.x", "eval_qa_observability", [
    ["promptfoo", "Promptfoo", "https://www.promptfoo.dev/", "open_source", "Declarative LLM prompt regression, assertion matrix & red-team CLI.", ["eval", "assertions"]],
    ["deepeval", "DeepEval", "https://github.com/confident-ai/deepeval", "open_source", "Unit-test style LLM evaluation for faithfulness, hallucination & contextual recall.", ["eval", "rag-metrics"]],
    ["ragas", "Ragas", "https://docs.ragas.io/", "open_source", "Reference-free RAG evaluation for context precision, recall, and answer faithfulness.", ["rag", "eval"]],
    ["k6", "Grafana k6", "https://k6.io/", "open_source", "High-concurrency JavaScript load, spike & streaming SSE stress tester.", ["load-test", "sse"]],
    ["bruno", "Bruno API Client", "https://www.usebruno.com/", "open_source", "Git-native offline OpenAPI & REST contract test runner.", ["openapi", "api-testing"]],
    ["giskard", "Giskard", "https://github.com/Giskard-AI/giskard", "open_source", "Automated robustness, bias, hallucination, and injection vulnerability scanner.", ["eval", "robustness"]],
    ["trulens", "TruLens", "https://www.trulens.org/", "open_source", "RAG Triad (Context Relevance, Groundedness, Answer Relevance) tracing.", ["observability", "groundedness"]],
    ["inspect-ai", "Inspect AI", "https://inspect.ai-safety-institute.org.uk/", "open_source", "Extensible agentic coding, tool-use & reasoning safety eval harness.", ["eval", "safety"]],
    ["backstopjs", "BackstopJS", "https://garris.github.io/BackstopJS/", "open_source", "Responsive DOM pixel-diff & visual regression verifier.", ["visual-regression", "ui"]],
    ["lost-pixel", "Lost Pixel", "https://github.com/lost-pixel/lost-pixel", "open_source", "Component & page-level open-source visual regression engine.", ["visual-regression", "ui"]],
    ["visqol", "ViSQOL", "https://github.com/google/visqol", "open_source", "Perceptual speech and stem-separation MOS quality evaluator.", ["audio", "mos"]],
    ["opencv", "OpenCV", "https://opencv.org/", "open_source", "Computer vision metrics (BRISQUE, LapVar blur, alpha-matte edge fidelity).", ["vision", "opencv"]],
    ["gltf-validator", "Khronos glTF-Validator", "https://github.com/KhronosGroup/glTF-Validator", "open_source", "Official JSON/GLB geometry, normal & material schema validator.", ["3d", "glb", "validation"]],
    ["robot-framework", "Robot Framework", "https://robotframework.org/", "open_source", "Keyword-driven desktop, API, and multi-system acceptance test framework.", ["acceptance", "automation"]],
    ["workarena", "WorkArena", "https://servicenow.github.io/WorkArena/", "open_source", "Enterprise form, ERP & browser workflow completion benchmark.", ["erp-eval", "browser"]],
    ["appworld", "AppWorld", "https://appworld.dev/", "open_source", "Interactive multi-app stateful coding & API execution testbed.", ["api-eval", "agents"]],
    ["tau-bench", "Tau-bench", "https://github.com/sierra-research/tau-bench", "open_source", "Policy-compliant user-agent-tool dynamic transaction benchmark.", ["policy", "agents"]],
    ["prometheus-2", "Prometheus 2", "https://github.com/prometheus-eval/prometheus-eval", "open_source", "Open-weights rubric LLM-as-a-Judge evaluator.", ["judge", "rubric"]],
    ["vlm-critic", "VLM-Critic", "https://github.com/InternLM/CriticBench", "open_source", "Vision-language visual layout, typography & alignment critic.", ["vision-judge", "layout"]],
    ["livecodebench", "LiveCodeBench", "https://livecodebench.github.io/", "open_source", "Contamination-free timed coding generation & execution suite.", ["code-eval", "benchmarks"]],
    ["evalplus", "EvalPlus", "https://github.com/evalplus/evalplus", "open_source", "80x augmented edge-case unit tests strengthening HumanEval+ and MBPP+.", ["code-eval", "edge-cases"]],
    ["swe-gym", "SWE-gym", "https://github.com/SWE-Gym/SWE-Gym", "open_source", "Dockerized self-play multi-file issue resolution environment.", ["repo-eval", "docker"]],
    ["bfcl", "BFCL (Berkeley Function Calling)", "https://gorilla.cs.berkeley.edu/leaderboard.html", "open_source", "Strict parallel, nested, and abstention function-calling evaluation leaderboard.", ["tool-calling", "ast"]],
    ["api-bank", "API-Bank", "https://github.com/AlibabaResearch/DAMO-ConvAI/tree/main/api-bank", "open_source", "Real-world API retrieval, planning, and calling evaluator.", ["api-eval", "planning"]],
    ["toolsandbox", "ToolSandbox", "https://github.com/apple/ToolSandbox", "open_source", "Stateful multi-turn tool dependency & implicit execution benchmark.", ["tool-calling", "stateful"]],
    ["mmmu", "MMMU", "https://mmmu-benchmark.github.io/", "open_weights_or_data", "Multi-discipline college-level multimodal image/chart/schema exam.", ["multimodal", "charts"]],
    ["video-mme", "Video-MME", "https://video-mme.github.io/", "open_weights_or_data", "Long-horizon video + subtitle + audio temporal comprehension eval.", ["video-eval", "temporal"]],
    ["vbench", "VBench", "https://github.com/Vchitect/VBench", "open_source", "16-dimension video synthesis fidelity, physics & flicker evaluator.", ["video-eval", "physics"]],
    ["audiobench", "AudioBench", "https://github.com/AudioLLMs/AudioBench", "open_source", "Multilingual ASR, audio Q&A, and voice fidelity benchmark suite.", ["audio-eval", "asr"]],
    ["gpqa-diamond", "GPQA Diamond", "https://github.com/idavidrein/gpqa", "open_weights_or_data", "Graduate-level " + "Google-proof biology, physics, and chemistry reasoning suite.", ["science", "expert-qa"]],
  ]),
  ...hydrateCatalogPack("v14.x", "fuzz_chaos_security", [
    ["schemathesis", "Schemathesis", "https://schemathesis.io/", "open_source", "OpenAPI 3.1 property-based API fuzzer uncovering HTTP 500s & edge crashes.", ["fuzzing", "openapi"]],
    ["garak", "NVIDIA Garak", "https://github.com/NVIDIA/garak", "open_source", "LLM vulnerability scanner testing jailbreaks, hallucinations, and data leaks.", ["red-team", "security"]],
    ["strykerjs", "StrykerJS", "https://stryker-mutator.io/", "open_source", "TypeScript/JS mutation testing proving assertion suite depth.", ["mutation-testing", "ts"]],
    ["mutmut", "mutmut", "https://github.com/boxed/mutmut", "open_source", "Python AST mutation tester catching weak regression checks.", ["mutation-testing", "python"]],
    ["hypothesis", "Hypothesis", "https://hypothesis.readthedocs.io/", "open_source", "Python property-based generator shrinking failing inputs to minimal counterexamples.", ["property-testing", "python"]],
    ["fast-check", "fast-check", "https://fast-check.dev/", "open_source", "TypeScript/JS property-based invariant & Unicode edge-case fuzzer.", ["property-testing", "ts"]],
    ["atheris", "Google Atheris", "https://github.com/google/atheris", "open_source", "Coverage-guided Python fuzzer targeting parsers and native extensions.", ["fuzzing", "coverage"]],
    ["chaos-mesh", "Chaos Mesh", "https://chaos-mesh.org/", "open_source", "Fault-injection chaos platform simulating timeouts, packet loss, and pod restarts.", ["chaos", "resilience"]],
    ["toxiproxy", "Shopify Toxiproxy", "https://github.com/Shopify/toxiproxy", "open_source", "TCP latency, reset, bandwidth cap & timeout fault proxy.", ["chaos", "network"]],
    ["litmuschaos", "LitmusChaos", "https://litmuschaos.io/", "open_source", "Cloud-native chaos experiments verifying fallback & degradation SLOs.", ["chaos", "slo"]],
    ["pumba", "Pumba", "https://github.com/alexei-led/pumba", "open_source", "Docker pause/kill/delay emulator testing worker resilience.", ["chaos", "docker"]],
    ["pyrit", "Microsoft PyRIT", "https://github.com/Azure/PyRIT", "open_source", "Automated multi-turn AI red-teaming framework probing prompt injection & exfiltration.", ["red-team", "microsoft"]],
    ["cyberseceval", "Meta CyberSecEval", "https://github.com/meta-llama/PurpleLlama", "open_source", "Insecure-code detection & exploit-resistance security benchmark.", ["security", "code-safety"]],
    ["harmbench", "HarmBench", "https://www.harmbench.org/", "open_source", "Standardized refusal & adversarial robustness evaluation suite.", ["safety", "robustness"]],
    ["promptmap", "PromptMap", "https://github.com/utkusen/promptmap", "open_source", "Automated system-prompt extraction & cross-tenant isolation probe.", ["red-team", "isolation"]],
  ]),
  ...hydrateCatalogPack("v14.x", "self_evolution_rlhf", [
    ["open-r1", "HuggingFace Open-R1", "https://github.com/huggingface/open-r1", "open_source", "Open reproduction of GRPO verifiable reasoning & test-time scaling recipes.", ["grpo", "reasoning"]],
    ["verl", "veRL (Volcano Engine RL)", "https://github.com/volcengine/verl", "open_source", "Hybrid-controller distributed RL training engine for reasoning policies.", ["rl", "distributed"]],
    ["prime-rl", "PRIME", "https://github.com/PRIME-RL/PRIME", "open_source", "Process Reinforcement through Implicit Rewards verifying intermediate steps.", ["prm", "rl"]],
    ["datadreamer", "DataDreamer", "https://github.com/datadreamer-dev/DataDreamer", "open_source", "Reproducible synthetic training data & self-consistency trace pipelines.", ["synthetic-data", "pipelines"]],
    ["curator", "Bespoke Curator", "https://github.com/bespokelabsai/curator", "open_source", "Structured high-throughput synthetic distillation & verification dataset engine.", ["synthetic-data", "curation"]],
    ["evo-instruct", "Evol-Instruct", "https://github.com/nlpxucan/WizardLM", "open_source", "Systematic breadth & depth evolutionary prompt hardening loop.", ["evolution", "prompts"]],
    ["expel", "ExpeL", "https://github.com/LeapLabTHU/ExpeL", "open_source", "Non-parametric experiential insight extraction from past wins and failures.", ["experience-replay", "memory"]],
    ["reflexion", "Reflexion", "https://github.com/noahshinn/reflexion", "open_source", "Episodic verbal self-reflection memory preventing repeated runtime mistakes.", ["reflexion", "self-healing"]],
    ["openrlhf", "OpenRLHF", "https://github.com/OpenRLHF/OpenRLHF", "open_source", "Ray/vLLM distributed RLHF, PPO, and DPO alignment orchestrator.", ["rlhf", "dpo"]],
    ["trl", "HuggingFace TRL", "https://github.com/huggingface/trl", "open_source", "SFT, DPO, ORPO, and GRPO post-training toolkit.", ["grpo", "dpo", "sft"]],
    ["spin-selfplay", "SPIN (Self-Play Fine-Tuning)", "https://github.com/uclaml/SPIN", "open_source", "Self-play iterative improvement contrasting model generations vs ground truth.", ["self-play", "alignment"]],
    ["orpo", "ORPO", "https://github.com/xfactlab/orpo", "open_source", "Monolithic reference-free odds-ratio preference alignment objective.", ["alignment", "preference"]],
    ["rewardbench", "RewardBench", "https://github.com/allenai/reward-bench", "open_source", "Safety, reasoning & chat calibration suite for reward models and judges.", ["reward-model", "eval"]],
    ["distilabel", "Argilla Distilabel", "https://github.com/argilla-io/distilabel", "open_source", "DAG-driven verified synthetic data & AI feedback framework.", ["synthetic-data", "dag"]],
    ["nemo-curator", "NVIDIA NeMo Curator", "https://github.com/NVIDIA/NeMo-Curator", "open_source", "Exact + fuzzy MinHash LSH deduplication and quality filtering for large corpora.", ["deduplication", "minhash"]],
    ["magpie", "Magpie", "https://github.com/magpie-align/magpie", "open_source", "Self-synthesizing diverse instruction/response data without manual seeds.", ["synthetic-data", "sft"]],
    ["cosmopedia", "Cosmopedia", "https://huggingface.co/datasets/HuggingFaceTB/cosmopedia", "open_weights_or_data", "Multi-domain synthetic textbook & tutorial corpus spanning science and code.", ["textbooks", "education"]],
    ["openevolve", "OpenEvolve", "https://github.com/codelion/openevolve", "open_source", "MAP-Elites evolutionary code & prompt optimization via automated evaluators.", ["evolution", "map-elites"]],
    ["shinkaevolve", "ShinkaEvolve", "https://github.com/SakanaAI/ShinkaEvolve", "open_source", "Sample-efficient open-ended algorithmic & skill evolution engine.", ["evolution", "skills"]],
    ["pettingzoo", "PettingZoo", "https://pettingzoo.farama.org/", "open_source", "Standardized multi-agent simulation environment for cooperative/competitive tests.", ["multi-agent", "sim"]],
    ["dspy-miprov2", "DSPy MIPROv2", "https://dspy.ai/", "open_source", "Data-driven instruction and few-shot prompt compiler optimizing downstream metrics.", ["prompts", "optimizer"]],
  ]),
];

export const ALL_REASONING_EVAL_CATALOG: readonly ReasoningEvalCatalogEntry[] = [
  ...V15_1_LONG_CONTEXT_EMBEDDING_SOURCES,
  ...V15_2_PLANNING_REASONING_DATASETS,
  ...V15_2_CODE_CREATIVE_DATASETS,
  ...V15_2_AGENT_EXECUTION_FRAMEWORKS,
  ...V14_EVAL_CHAOS_EVOLUTION_STACK,
];

export const REASONING_EVAL_CATALOG_COUNTS = {
  v15_1_long_context: V15_1_LONG_CONTEXT_EMBEDDING_SOURCES.length, // 22
  v15_2_planning_reasoning: V15_2_PLANNING_REASONING_DATASETS.length, // 25
  v15_2_code_creative: V15_2_CODE_CREATIVE_DATASETS.length, // 23
  v15_2_agent_frameworks: V15_2_AGENT_EXECUTION_FRAMEWORKS.length, // 8
  v15_2_total:
    V15_2_PLANNING_REASONING_DATASETS.length +
    V15_2_CODE_CREATIVE_DATASETS.length +
    V15_2_AGENT_EXECUTION_FRAMEWORKS.length, // 56
  v14_x_eval_chaos_evolution: V14_EVAL_CHAOS_EVOLUTION_STACK.length,
  total: ALL_REASONING_EVAL_CATALOG.length,
} as const;

export function searchReasoningAndEvalCatalog(
  query: string,
  limit = 12,
  subgroup?: CatalogSubgroup
): ReasoningEvalCatalogEntry[] {
  const q = String(query || "").trim().toLowerCase();
  const pool = subgroup
    ? ALL_REASONING_EVAL_CATALOG.filter((e) => e.subgroup === subgroup)
    : ALL_REASONING_EVAL_CATALOG;

  if (!q) return pool.slice(0, limit);

  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  const scored = pool
    .map((entry) => {
      const hay = `${entry.id} ${entry.name} ${entry.summary} ${entry.tags.join(" ")}`.toLowerCase();
      let score = hay.includes(q) ? 10 : 0;
      for (const tok of tokens) {
        if (entry.name.toLowerCase().includes(tok)) score += 3;
        else if (hay.includes(tok)) score += 1;
      }
      return { entry, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.entry);
}

export interface RopeChunkSlice {
  index: number;
  charStart: number;
  charEnd: number;
  approxTokens: number;
  text: string;
}

/**
 * NLTK-inspired sentence-boundary segmentation + YaRN/RoPE sliding window chunker
 * supporting 8K–128K context budgets without mid-word/mid-sentence breaks.
 */
export function chunkLongContextWithRopeWindow(
  rawText: string,
  options?: {
    maxWindowTokens?: number;
    overlapTokens?: number;
    ropeScaleFactor?: number;
  }
): {
  chunks: RopeChunkSlice[];
  totalApproxTokens: number;
  effectiveContextBudget: number;
  ropeScaleFactor: number;
} {
  const clean = String(rawText || "").replace(/\r\n/g, "\n").trim();
  const baseWindow = Math.max(256, Math.min(32768, Number(options?.maxWindowTokens || 4096)));
  const ropeScaleFactor = Math.max(1, Math.min(16, Number(options?.ropeScaleFactor || 4)));
  const effectiveContextBudget = Math.min(131072, baseWindow * ropeScaleFactor);
  const maxChars = baseWindow * 3.5;
  const overlapChars = Math.min(maxChars * 0.4, Math.max(0, Number(options?.overlapTokens || 180) * 3.5));

  if (!clean) {
    return { chunks: [], totalApproxTokens: 0, effectiveContextBudget, ropeScaleFactor };
  }

  // Sentence boundaries across Arabic/French/English punctuation & blank lines
  const sentences = clean.split(/(?<=[.!?؟。\n])\s+/u).filter(Boolean);
  const chunks: RopeChunkSlice[] = [];
  let buffer = "";
  let sliceStart = 0;
  let runningCursor = 0;

  const pushSlice = (text: string, start: number, end: number) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    chunks.push({
      index: chunks.length,
      charStart: start,
      charEnd: end,
      approxTokens: Math.max(1, Math.ceil(trimmed.length / 3.5)),
      text: trimmed,
    });
  };

  for (const sent of sentences) {
    if (sent.length > maxChars) {
      if (buffer.trim()) {
        pushSlice(buffer, sliceStart, runningCursor);
        buffer = "";
      }
      for (let i = 0; i < sent.length; i += Math.floor(maxChars - overlapChars)) {
        const piece = sent.slice(i, i + Math.floor(maxChars));
        pushSlice(piece, runningCursor + i, runningCursor + i + piece.length);
      }
      runningCursor += sent.length + 1;
      sliceStart = runningCursor;
      continue;
    }

    if (buffer.length + sent.length + 1 > maxChars && buffer.length > 0) {
      pushSlice(buffer, sliceStart, runningCursor);
      const tail = overlapChars > 0 ? buffer.slice(-Math.floor(overlapChars)) : "";
      sliceStart = Math.max(0, runningCursor - tail.length);
      buffer = tail ? `${tail} ${sent}` : sent;
    } else {
      buffer = buffer ? `${buffer} ${sent}` : sent;
    }
    runningCursor += sent.length + 1;
  }

  if (buffer.trim()) {
    pushSlice(buffer, sliceStart, clean.length);
  }

  return {
    chunks,
    totalApproxTokens: Math.max(1, Math.ceil(clean.length / 3.5)),
    effectiveContextBudget,
    ropeScaleFactor,
  };
}

/**
 * Deterministic Fast-Check / Schemathesis-inspired property generator producing
 * diverse multilingual, Unicode, control-char, injection, and boundary cases for E2E fuzzing.
 */
export function generateDeterministicFuzzInputs(seedCount = 1000): string[] {
  const seeds = [
    "",
    "   \n\t  ",
    "0",
    "-0",
    "NaN",
    "Infinity",
    "شحال البيلون د اليوم؟ 1450.75 MAD + 20% TVA",
    "ⵎⴰⵏⵉ ⵉⵍⵍⴰ ⵏⴰⴹⵓⵔ? ⴰⵣⵓⵍ ⴼⵍⵍⴰⵡⵏ",
    "Facture N° 2026/001 — Café Crème 15,50 DH",
    "SELECT * FROM users; DROP TABLE tenants;--",
    "<script>alert('xss')</script><img src=x onerror=alert(1)>",
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1:8080/admin",
    "http://[::1]/secret",
    "file:///etc/passwd",
    "{\"nested\":".repeat(25) + "\"x\"" + "}".repeat(25),
    "Bearer sk-fake-openai-1234567890abcdef1234567890abcdef",
    "Bearer hk-live-testsecret0000111122223333444455556666",
    "\u202Ereversed-bidi-override\u202C",
    "A".repeat(4096),
  ];

  const out: string[] = [];
  for (let i = 0; i < seedCount; i++) {
    const base = seeds[i % seeds.length];
    if (i < seeds.length) {
      out.push(base);
    } else {
      const tag = (i * 2654435761) >>> 0;
      const suffix = i % 5 === 0 ? `_${tag.toString(36)}` : i % 7 === 0 ? `\\u0000_${i}` : `#${i}`;
      out.push(base.length > 200 ? base.slice(0, 128) + suffix : `${base}${suffix}`);
    }
  }
  return out;
}
