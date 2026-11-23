#!/usr/bin/env python3
"""
HEYUKA Large-Scale Corpus Curator ($0.00 Zero-Key)
- Performs exact SHA-256 + 5-gram near-duplicate Jaccard filtering (MinHash-style curation).
- Enforces PII scrubbing (emails, phone numbers, API tokens/keys redacted cleanly).
- Detects Arabic/Darija, French, English, or Code slices and exports CPT + ChatML JSONL shards.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from typing import Dict, List, Set, Tuple


PII_PATTERNS: List[Tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "[REDACTED_EMAIL]"),
    (re.compile(r"\b(?:sk|rk|pk|gsk|ghp|AIza|hf)_[A-Za-z0-9_\-]{12,}\b"), "[REDACTED_TOKEN]"),
    (re.compile(r"(?<!\d)(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}(?!\d)"), "[REDACTED_PHONE]"),
]


URL_SPAN_RE = re.compile(r"https?://[^\s<>\"')]+")


def scrub_pii(text: str) -> str:
    # Preserve public HTTP/DOI URLs intact while scrubbing standalone emails, tokens & phone numbers in prose
    parts = URL_SPAN_RE.split(text)
    urls = URL_SPAN_RE.findall(text)
    out: List[str] = []
    for idx, seg in enumerate(parts):
        cleaned = seg
        for pat, repl in PII_PATTERNS:
            cleaned = pat.sub(repl, cleaned)
        out.append(cleaned)
        if idx < len(urls):
            out.append(urls[idx])
    return "".join(out)


def detect_slice_language(text: str) -> str:
    ar_chars = len(re.findall(r"[\u0600-\u06FF]", text))
    if ar_chars >= 12:
        return "ar"
    if re.search(r"\b(def |function |import |const |class |SELECT |<!DOCTYPE)\b", text):
        return "code"
    if re.search(r"\b(le |la |les |des |pour |avec |dans |être)\b", text.lower()):
        return "fr"
    return "en"


def ngram_shingles(text: str, n: int = 5) -> Set[int]:
    tokens = re.findall(r"\w+", text.lower())
    if len(tokens) < n:
        return {hash(" ".join(tokens))}
    return {hash(" ".join(tokens[i : i + n])) for i in range(0, min(len(tokens) - n + 1, 200))}


def is_near_duplicate(shingles: Set[int], seen_buckets: List[Set[int]], threshold: float = 0.72) -> bool:
    for prev in seen_buckets[-250:]:
        if not prev or not shingles:
            continue
        inter = len(shingles & prev)
        if inter == 0:
            continue
        union = len(shingles | prev)
        if union > 0 and (inter / union) >= threshold:
            return True
    return False


def curate_corpus(input_path: str, out_cpt_path: str, out_sft_path: str) -> Dict[str, int]:
    exact_seen: Set[str] = set()
    recent_shingles: List[Set[int]] = []
    stats = {"input_rows": 0, "kept_rows": 0, "dropped_duplicates": 0, "dropped_low_quality": 0}

    os.makedirs(os.path.dirname(os.path.abspath(out_cpt_path)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(out_sft_path)), exist_ok=True)

    with open(input_path, "r", encoding="utf-8") as fin, open(out_cpt_path, "w", encoding="utf-8") as fcpt, open(
        out_sft_path, "w", encoding="utf-8"
    ) as fsft:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            stats["input_rows"] += 1
            try:
                obj = json.loads(line)
            except Exception:
                stats["dropped_low_quality"] += 1
                continue

            raw_text = str(obj.get("text") or obj.get("content") or "").strip()
            raw_text = re.sub(r"\s+\n", "\n", raw_text)
            if len(raw_text) < 80:
                stats["dropped_low_quality"] += 1
                continue

            clean_text = scrub_pii(raw_text)
            digest = hashlib.sha256(clean_text.encode("utf-8")).hexdigest()
            if digest in exact_seen:
                stats["dropped_duplicates"] += 1
                continue

            shingles = ngram_shingles(clean_text)
            if is_near_duplicate(shingles, recent_shingles):
                stats["dropped_duplicates"] += 1
                continue

            exact_seen.add(digest)
            recent_shingles.append(shingles)
            lang = detect_slice_language(clean_text)
            title = scrub_pii(str(obj.get("title") or "Web Reference"))
            url = str(obj.get("url") or "")

            fcpt.write(
                json.dumps(
                    {
                        "id": obj.get("id") or digest[:20],
                        "lang": lang,
                        "title": title,
                        "url": url,
                        "text": clean_text,
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

            fsft.write(
                json.dumps(
                    {
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are HEYUKA, a precise bilingual engineering & commerce AI grounded in verified public sources.",
                            },
                            {
                                "role": "user",
                                "content": f"Summarize and explain key factual takeaways from: {title} ({url})".strip(),
                            },
                            {"role": "assistant", "content": clean_text[:4000]},
                        ]
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
            stats["kept_rows"] += 1

    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="HEYUKA Corpus Curator & Deduplicator ($0)")
    parser.add_argument("--in", dest="inp", required=True, help="Raw JSONL input path")
    parser.add_argument("--out-cpt", default="/tmp/heyuka_curated_cpt.jsonl", help="Clean CPT JSONL output")
    parser.add_argument("--out-sft", default="/tmp/heyuka_curated_sft.jsonl", help="Clean ChatML SFT JSONL output")
    args = parser.parse_args()

    stats = curate_corpus(args.inp, args.out_cpt, args.out_sft)
    print(json.dumps({"ok": True, **stats, "out_cpt": args.out_cpt, "out_sft": args.out_sft}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
