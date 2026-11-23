#!/usr/bin/env python3
"""
HEYUKA Zero-Dollar Foundation Model Pretraining & Continual Pretraining (CPT) Engine
- Mode 'cpt': Continual Pretraining on curated FineWeb-2 / Vault / Web corpus via Unsloth 4-bit or PEFT+TRL
  with 10% replay buffer to prevent catastrophic forgetting + automatic checkpoint saving.
- Mode 'scratch': Clean minimal PyTorch causal Transformer pretraining loop from scratch on curated shards.
Runs cleanly on Free Kaggle 2xT4 (30h/wk), Google Colab T4, or local CUDA/CPU hardware.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import List


def run_continual_pretraining(
    base_model: str,
    cpt_jsonl: str,
    output_dir: str,
    max_steps: int,
    max_seq_len: int,
    stream_fineweb: bool,
    push_gguf: bool,
) -> None:
    try:
        from datasets import Dataset, concatenate_datasets, load_dataset
        from transformers import TrainingArguments
        from trl import SFTTrainer
    except ImportError as exc:
        print(
            f"[foundation_trainer] Missing ML dependencies ({exc}). Install: pip install unsloth datasets trl transformers peft accelerate",
            file=sys.stderr,
        )
        raise SystemExit(1)

    local_rows: List[dict] = []
    if os.path.exists(cpt_jsonl):
        with open(cpt_jsonl, "r", encoding="utf-8") as fh:
            for line in fh:
                if line.strip():
                    obj = json.loads(line)
                    txt = obj.get("text") or ""
                    if len(txt) >= 40:
                        local_rows.append({"text": f"### Source: {obj.get('title', 'Corpus')}\n{txt}"})

    replay_rows: List[dict] = []
    if stream_fineweb:
        from itertools import islice

        for ds_name, cfg in [("HuggingFaceFW/fineweb-2", "arb_Arab"), ("HuggingFaceFW/fineweb-edu", None)]:
            try:
                ds = load_dataset(ds_name, cfg, split="train", streaming=True) if cfg else load_dataset(ds_name, split="train", streaming=True)
                for rec in islice(ds, 1000):
                    t = str(rec.get("text") or "").strip()
                    if len(t) >= 80:
                        replay_rows.append({"text": t[:4000]})
            except Exception:
                continue

    combined_rows = local_rows + replay_rows
    if not combined_rows:
        raise ValueError("No curated training rows found. Run web_scale_crawler.py & massive_curator.py first.")

    train_dataset = Dataset.from_list(combined_rows)
    if local_rows and replay_rows:
        train_dataset = concatenate_datasets([Dataset.from_list(local_rows), Dataset.from_list(replay_rows)]).shuffle(seed=42)

    try:
        from unsloth import FastLanguageModel

        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=base_model,
            max_seq_length=max_seq_len,
            load_in_4bit=True,
        )
        model = FastLanguageModel.get_peft_model(
            model,
            r=32,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj", "embed_tokens", "lm_head"],
            lora_alpha=32,
            lora_dropout=0.0,
            use_gradient_checkpointing="unsloth",
        )
        using_unsloth = True
    except ImportError:
        from peft import LoraConfig, get_peft_model
        from transformers import AutoModelForCausalLM, AutoTokenizer

        tokenizer = AutoTokenizer.from_pretrained(base_model)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        model = AutoModelForCausalLM.from_pretrained(base_model, device_map="auto")
        model = get_peft_model(
            model,
            LoraConfig(r=16, lora_alpha=16, task_type="CAUSAL_LM", target_modules=["q_proj", "v_proj"]),
        )
        using_unsloth = False

    os.makedirs(output_dir, exist_ok=True)
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        dataset_text_field="text",
        max_seq_length=max_seq_len,
        packing=True,
        args=TrainingArguments(
            output_dir=output_dir,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=8,
            warmup_steps=10,
            max_steps=max_steps,
            learning_rate=5e-5,
            lr_scheduler_type="cosine",
            logging_steps=5,
            save_steps=50,
            save_total_limit=3,
            bf16=False,
            fp16=True,
            optim="adamw_8bit" if using_unsloth else "adamw_torch",
        ),
    )

    resume_ckpt = os.path.exists(os.path.join(output_dir, "trainer_state.json")) or any(
        d.startswith("checkpoint-") for d in os.listdir(output_dir)
    )
    trainer.train(resume_from_checkpoint=resume_ckpt)
    model.save_pretrained(os.path.join(output_dir, "final_adapter"))
    tokenizer.save_pretrained(os.path.join(output_dir, "final_adapter"))

    if push_gguf and using_unsloth:
        model.save_pretrained_gguf(os.path.join(output_dir, "gguf"), tokenizer, quantization_method="q4_k_m")


def run_from_scratch_mini_pretrain(cpt_jsonl: str, output_dir: str, max_steps: int) -> None:
    """Minimal self-contained PyTorch causal Transformer pretraining loop from random weights."""
    import torch
    import torch.nn as nn

    if not os.path.exists(cpt_jsonl):
        raise FileNotFoundError(f"Missing corpus file: {cpt_jsonl}")

    corpus_text = []
    with open(cpt_jsonl, "r", encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                corpus_text.append(str(json.loads(line).get("text") or ""))
    joined = "\n\n".join(corpus_text)
    if len(joined) < 256:
        raise ValueError("Corpus too small for from-scratch character/byte transformer pretraining.")

    data = torch.tensor(list(joined.encode("utf-8", errors="ignore")), dtype=torch.long)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    block_size = 128

    class TinyFoundationLM(nn.Module):
        def __init__(self, vocab: int = 256, dim: int = 256, heads: int = 4, layers: int = 4) -> None:
            super().__init__()
            self.tok_emb = nn.Embedding(vocab, dim)
            self.pos_emb = nn.Embedding(block_size, dim)
            enc_layer = nn.TransformerEncoderLayer(d_model=dim, nhead=heads, dim_feedforward=dim * 4, batch_first=True)
            self.blocks = nn.TransformerEncoder(enc_layer, num_layers=layers)
            self.head = nn.Linear(dim, vocab)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            b, t = x.shape
            pos = torch.arange(t, device=x.device).unsqueeze(0).expand(b, t)
            h = self.tok_emb(x) + self.pos_emb(pos)
            mask = nn.Transformer.generate_square_subsequent_mask(t, device=x.device)
            h = self.blocks(h, mask=mask)
            return self.head(h)

    model = TinyFoundationLM().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4)
    loss_fn = nn.CrossEntropyLoss()

    os.makedirs(output_dir, exist_ok=True)
    for step in range(1, max_steps + 1):
        ix = torch.randint(0, max(1, len(data) - block_size - 1), (16,))
        xb = torch.stack([data[i : i + block_size] for i in ix]).to(device)
        yb = torch.stack([data[i + 1 : i + 1 + block_size] for i in ix]).to(device)
        logits = model(xb)
        loss = loss_fn(logits.view(-1, 256), yb.view(-1))
        opt.zero_grad()
        loss.backward()
        opt.step()
        if step % max(1, max_steps // 5) == 0 or step == max_steps:
            print(f"[scratch-pretrain] step={step}/{max_steps} loss={loss.item():.4f} device={device}")

    torch.save(model.state_dict(), os.path.join(output_dir, "heyuka_scratch_mini.pt"))


def main() -> int:
    parser = argparse.ArgumentParser(description="HEYUKA Zero-Dollar Foundation & CPT Pretraining Runner")
    parser.add_argument("--mode", choices=["cpt", "scratch"], default="cpt")
    parser.add_argument("--base-model", default="Qwen/Qwen2.5-7B-Instruct")
    parser.add_argument("--corpus", default="/tmp/heyuka_curated_cpt.jsonl")
    parser.add_argument("--out", default="./outputs/heyuka_foundation")
    parser.add_argument("--max-steps", type=int, default=200)
    parser.add_argument("--max-seq-len", type=int, default=4096)
    parser.add_argument("--stream-fineweb", action="store_true")
    parser.add_argument("--export-gguf", action="store_true")
    args = parser.parse_args()

    if args.mode == "scratch":
        run_from_scratch_mini_pretrain(args.corpus, args.out, args.max_steps)
    else:
        run_continual_pretraining(
            base_model=args.base_model,
            cpt_jsonl=args.corpus,
            output_dir=args.out,
            max_steps=args.max_steps,
            max_seq_len=args.max_seq_len,
            stream_fineweb=args.stream_fineweb,
            push_gguf=args.export_gguf,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
