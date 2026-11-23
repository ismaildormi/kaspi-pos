#!/usr/bin/env python3
"""
HEYUKA Multi-Vault & Multi-Shard Union Aggregator (v97.0 - v98.0)
Merges ScalableBloomFilter snapshots (.bf.gz), HyperLogLog counters & shard manifests
across parallel CI/cloud workers, and uploads the unified snapshot to Hugging Face.
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys
import time
from typing import Dict, List

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRAWLER_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "crawler"))
for d in (SCRIPT_DIR, CRAWLER_DIR):
    if d not in sys.path:
        sys.path.insert(0, d)

from hf_token_pool import HfTokenPool, resolve_hf_dataset_repo, upload_file_to_hf_dataset_http  # noqa: E402
from planetary_crawl_secrets import HyperLogLogCounter, ScalableBloomFilter  # noqa: E402


def merge_shard_artifacts(shard_glob_dir: str, out_bloom_gz: str, out_manifest_json: str) -> Dict[str, object]:
    bloom_files = sorted(glob.glob(os.path.join(shard_glob_dir, "**", "*.bf.gz"), recursive=True))
    state_files = sorted(glob.glob(os.path.join(shard_glob_dir, "**", "*state*.json"), recursive=True))

    union_bloom: ScalableBloomFilter | None = None
    union_hll = HyperLogLogCounter()
    total_crawled = 0
    total_records = 0
    total_304_saved = 0
    shards_seen: List[int] = []

    for bf_path in bloom_files:
        try:
            with open(bf_path, "rb") as fh:
                bf = ScalableBloomFilter.from_gzip_bytes(fh.read())
            if union_bloom is None:
                union_bloom = bf
            elif bf.num_bits == union_bloom.num_bits:
                union_bloom.merge_from(bf)
        except Exception:
            pass

    if union_bloom is None:
        union_bloom = ScalableBloomFilter()

    for st_path in state_files:
        try:
            with open(st_path, "r", encoding="utf-8") as fh:
                st = json.load(fh)
            if not isinstance(st, dict):
                continue
            if "shard_id" in st:
                shards_seen.append(int(st["shard_id"]))
            total_crawled += int(st.get("total_crawled", 0))
            total_records += int(st.get("total_records", 0))
            total_304_saved += int(st.get("etag_304_skipped", 0))
            if isinstance(st.get("hll_b64"), str) and st["hll_b64"]:
                try:
                    union_hll.merge_from(HyperLogLogCounter.from_b64(st["hll_b64"]))
                except Exception:
                    pass
        except Exception:
            pass

    os.makedirs(os.path.dirname(os.path.abspath(out_bloom_gz)), exist_ok=True)
    with open(out_bloom_gz, "wb") as fh:
        fh.write(union_bloom.to_gzip_bytes())

    manifest = {
        "schema": "heyuka-multi-shard-union-v1",
        "mergedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "shardStateFilesMerged": len(state_files),
        "bloomFilesMerged": len(bloom_files),
        "shardsSeen": sorted(set(shards_seen)),
        "bloomInsertedCount": union_bloom.inserted_count,
        "hllUniqueUrlEstimate": union_hll.estimate(),
        "totalCrawledAcrossShards": total_crawled,
        "totalDoubleReadRecords": total_records,
        "etag304SavedAcrossShards": total_304_saved,
    }

    os.makedirs(os.path.dirname(os.path.abspath(out_manifest_json)), exist_ok=True)
    with open(out_manifest_json, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)

    pool = HfTokenPool.from_env(
        dotenv_fallback=os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".env.local"))
    )
    repo_id = resolve_hf_dataset_repo()
    hf_upload = None
    if pool.count() > 0:
        hf_upload = upload_file_to_hf_dataset_http(
            file_path=out_manifest_json,
            repo_id=repo_id,
            path_in_repo="manifests/multi_shard_union_manifest.json",
            pool=pool,
        )

    return {"ok": True, "manifest": manifest, "hfUpload": hf_upload}


def main() -> int:
    parser = argparse.ArgumentParser(description="Merge parallel shard Bloom filters & manifests")
    parser.add_argument("--shards-dir", default="/tmp/heyuka_shards")
    parser.add_argument("--out-bloom", default="/tmp/heyuka_union/global_seen.bf.gz")
    parser.add_argument("--out-manifest", default="/tmp/heyuka_union/multi_shard_union_manifest.json")
    args = parser.parse_args()

    res = merge_shard_artifacts(args.shards_dir, args.out_bloom, args.out_manifest)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
