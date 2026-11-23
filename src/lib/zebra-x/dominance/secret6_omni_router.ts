import { getHfTokenPoolSummary, selectHfTokenForRole } from "@/lib/heyuka/compute/hf-token-pool";

export type TaskSpecialty = "coding" | "math_reasoning" | "vision_multimodal" | "darija_commerce" | "general";

/**
 * Dominance v90.6 Part A: Query-Specialty Router selecting optimal open-weights model & HF Pool lane.
 */
export function routeTaskToOptimalModel(prompt: string): {
  ok: true;
  specialty: TaskSpecialty;
  recommendedOpenModel: string;
  fallbackModels: string[];
  hfPoolActiveTokens: number;
  selectedHfLaneEnv: string | null;
  hfDatasetRepo: string;
} {
  const p = String(prompt || "");
  let specialty: TaskSpecialty = "general";
  let recommendedOpenModel = "Qwen/Qwen2.5-72B-Instruct";
  let fallbackModels = ["meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-Coder-32B-Instruct"];
  let role: "model_1_omni" | "model_2_core" | "model_3_vision" | "read_fast" = "model_1_omni";

  if (/(code|bug|typescript|python|sql|rust|docker|api|برمجة|كود|تطبيق)/i.test(p)) {
    specialty = "coding";
    recommendedOpenModel = "Qwen/Qwen2.5-Coder-32B-Instruct";
    fallbackModels = ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-R1"];
    role = "model_2_core";
  } else if (/(prove|integral|matrix|theorem|finance|eoq|vaR|معادلة|برهان|رياضيات|مخاطر)/i.test(p)) {
    specialty = "math_reasoning";
    recommendedOpenModel = "deepseek-ai/DeepSeek-R1";
    fallbackModels = ["Qwen/Qwen2.5-72B-Instruct"];
    role = "model_1_omni";
  } else if (/(image|video|3d|screen|camera|ocr|صورة|فيديو|شاشة|مجسم)/i.test(p)) {
    specialty = "vision_multimodal";
    recommendedOpenModel = "Qwen/Qwen2.5-VL-72B-Instruct";
    fallbackModels = ["Qwen/Qwen2.5-72B-Instruct"];
    role = "model_3_vision";
  } else if (/(kaspi|dgi|tva|darija|درهم|فاتورة|ضريبة|متجر|مخزون)/i.test(p)) {
    specialty = "darija_commerce";
    recommendedOpenModel = "Qwen/Qwen2.5-72B-Instruct";
    fallbackModels = ["meta-llama/Llama-3.3-70B-Instruct"];
    role = "model_1_omni";
  }

  const summary = getHfTokenPoolSummary();
  const chosen = selectHfTokenForRole(role);

  return {
    ok: true,
    specialty,
    recommendedOpenModel,
    fallbackModels,
    hfPoolActiveTokens: summary.configuredCount,
    selectedHfLaneEnv: chosen?.envName || null,
    hfDatasetRepo: summary.datasetRepo,
  };
}

/**
 * Dominance v90.6 Part B: Generates real MergeKit YAML configs (`slerp`, `ties`, or `dare_ties`).
 */
export function generateMergeKitRecipeYaml(params: {
  method: "slerp" | "ties" | "dare_ties";
  baseModel?: string;
  expertModels?: string[];
  dtype?: "bfloat16" | "float16";
}): { ok: true; method: string; yaml: string } {
  const base = params.baseModel || "Qwen/Qwen2.5-7B-Instruct";
  const experts =
    params.expertModels && params.expertModels.length >= 2
      ? params.expertModels
      : ["Qwen/Qwen2.5-Coder-7B-Instruct", "Qwen/Qwen2.5-Math-7B-Instruct"];
  const dtype = params.dtype || "bfloat16";

  let yaml = "";
  if (params.method === "slerp") {
    yaml = `slices:
  - sources:
      - model: ${experts[0]}
        layer_range: [0, 28]
      - model: ${experts[1]}
        layer_range: [0, 28]
merge_method: slerp
base_model: ${base}
parameters:
  t:
    - filter: self_attn
      value: [0, 0.5, 0.3, 0.7, 1]
    - filter: mlp
      value: [1, 0.5, 0.7, 0.3, 0]
    - value: 0.5
dtype: ${dtype}`;
  } else {
    yaml = `models:
${experts
  .map(
    (m, i) => `  - model: ${m}
    parameters:
      density: ${i === 0 ? "0.6" : "0.5"}
      weight: ${(1 / experts.length).toFixed(2)}`
  )
  .join("\n")}
merge_method: ${params.method}
base_model: ${base}
parameters:
  normalize: true
  int8_mask: true
dtype: ${dtype}`;
  }

  return { ok: true, method: params.method, yaml };
}
