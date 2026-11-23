#!/usr/bin/env python3
"""
HEYUKA Sovereign Model Factory — MergeKit Flagship Builder (`v107.0` / `zuvyrismail/heyuka-*`)
=============================================================================================
Generates architecturally compatible MergeKit YAML recipes and optional execution commands
using free Hugging Face Storage (`0$`) and Colab/Kaggle T4/A100 compute:
1. `heyuka-core-32b-v1`: TIES/DARE merge combining Qwen2.5-32B-Instruct + Qwen2.5-Coder-32B-Instruct
2. `heyuka-pos-7b-v1`: SLERP merge combining Qwen2.5-7B-Instruct + Qwen2.5-Coder-7B-Instruct (edge/POS)
3. `heyuka-omni-moe-v1`: 4-expert sparse MoE merge template for multi-domain routing
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from typing import Any, Dict, List

DEFAULT_RECIPES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "recipes"
)


def build_merge_recipes(owner_namespace: str = "zuvyrismail") -> List[Dict[str, Any]]:
    """Returns MergeKit configurations with strictly matched base architectures per merge."""
    return [
        {
            "target_repo": f"{owner_namespace}/heyuka-core-32b-v1",
            "filename": "heyuka_core_32b_ties.yml",
            "method": "dare_ties",
            "hardware_target": "Colab A100 / Kaggle 2xT4 offloaded bf16->fp16",
            "yaml": """models:
  - model: Qwen/Qwen2.5-32B-Instruct
    parameters:
      density: 0.65
      weight: 0.55
  - model: Qwen/Qwen2.5-Coder-32B-Instruct
    parameters:
      density: 0.65
      weight: 0.45
merge_method: dare_ties
base_model: Qwen/Qwen2.5-32B-Instruct
parameters:
  normalize: true
  int8_mask: true
dtype: bfloat16
tokenizer_source: base
""",
        },
        {
            "target_repo": f"{owner_namespace}/heyuka-pos-7b-v1",
            "filename": "heyuka_pos_7b_slerp.yml",
            "method": "slerp",
            "hardware_target": "Free Kaggle T4 (16GB VRAM) / Local Edge",
            "yaml": """slices:
  - sources:
      - model: Qwen/Qwen2.5-7B-Instruct
        layer_range: [0, 28]
      - model: Qwen/Qwen2.5-Coder-7B-Instruct
        layer_range: [0, 28]
merge_method: slerp
base_model: Qwen/Qwen2.5-7B-Instruct
parameters:
  t:
    - filter: self_attn
      value: [0, 0.35, 0.5, 0.7, 1]
    - filter: mlp
      value: [1, 0.7, 0.5, 0.35, 0]
    - value: 0.5
dtype: float16
""",
        },
        {
            "target_repo": f"{owner_namespace}/heyuka-omni-moe-v1",
            "filename": "heyuka_omni_moe.yml",
            "method": "mixtral_moe",
            "hardware_target": "Multi-Expert Router (2 active experts per token)",
            "yaml": """base_model: Qwen/Qwen2.5-7B-Instruct
gate_mode: hidden
dtype: bfloat16
experts:
  - source_model: Qwen/Qwen2.5-7B-Instruct
    positive_prompts:
      - "Analyze Moroccan business commerce in Darija, Arabic, and French."
      - "Calculate TVA, IS, and KASPI POS inventory margins accurately."
  - source_model: Qwen/Qwen2.5-Coder-7B-Instruct
    positive_prompts:
      - "Write production TypeScript, Next.js App Router, and SQL migrations."
      - "Debug race conditions and optimize database queries."
""",
        },
    ]


def materialize_recipes(output_dir: str, owner_namespace: str = "zuvyrismail") -> Dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)
    recipes = build_merge_recipes(owner_namespace=owner_namespace)
    written: List[Dict[str, str]] = []
    for recipe in recipes:
        out_path = os.path.join(output_dir, recipe["filename"])
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(recipe["yaml"])
        written.append(
            {
                "target_repo": recipe["target_repo"],
                "method": recipe["method"],
                "hardware_target": recipe["hardware_target"],
                "yaml_path": out_path,
                "cli_command": f"mergekit-yaml {out_path} ./merged_{recipe['filename'].replace('.yml', '')} --cuda --lazy-unpickle",
            }
        )
    return {
        "ok": True,
        "version": "v107.0-sovereign-merge-factory",
        "owner_namespace": owner_namespace,
        "recipes_written": written,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build MergeKit sovereign recipes for zuvyrismail/heyuka-*")
    parser.add_argument("--output-dir", default=DEFAULT_RECIPES_DIR, help="Directory for generated YAML configs")
    parser.add_argument("--namespace", default="zuvyrismail", help="Hugging Face Hub namespace")
    parser.add_argument("--execute-target", default="", help="Optional recipe filename to run with mergekit-yaml")
    args = parser.parse_args()

    summary = materialize_recipes(output_dir=args.output_dir, owner_namespace=args.namespace)
    if args.execute_target:
        yaml_file = os.path.join(args.output_dir, args.execute_target)
        out_model = os.path.join(args.output_dir, "out_" + args.execute_target.replace(".yml", ""))
        proc = subprocess.run(["mergekit-yaml", yaml_file, out_model, "--cuda", "--lazy-unpickle"], check=False)
        summary["executed_returncode"] = proc.returncode

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
