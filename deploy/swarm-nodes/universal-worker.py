#!/usr/bin/env python3
"""
HEYUKA Universal Multi-Cloud Swarm Worker (v99.0)
Deployable on Oracle Cloud Always-Free ARM VMs, Hugging Face Spaces, Kaggle, Colab, or Docker.
Reads shard assignment from SHARD_ID / TOTAL_SHARDS, runs double-read batch, offloads Crystal
to Hugging Face, and pings HEYUKA_HUB_URL/api/v1/swarm/nodes heartbeat.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CRAWLER_DIR = os.path.join(ROOT_DIR, "training", "crawler")
STORAGE_DIR = os.path.join(ROOT_DIR, "training", "storage")
MEMORY_DIR = os.path.join(ROOT_DIR, "training", "memory")
for d in (CRAWLER_DIR, STORAGE_DIR, MEMORY_DIR):
    if d not in sys.path:
        sys.path.insert(0, d)

from autonomous_web_discoverer import run_autonomous_batch  # noqa: E402
from immortal_nano_vault import pack_nano_crystal  # noqa: E402
from external_vault_offloader import offload_artifact  # noqa: E402


def run_once() -> None:
    shard_id = int(os.environ.get("SHARD_ID", "20"))
    total_shards = int(os.environ.get("TOTAL_SHARDS", "120"))
    batch_size = int(os.environ.get("BATCH_SIZE", "40"))
    hub = os.environ.get("HEYUKA_HUB_URL", "https://kaspi-pos.vercel.app").rstrip("/")

    work_dir = f"/tmp/heyuka_worker_s{shard_id}"
    raw_jsonl = os.path.join(work_dir, f"batch_s{shard_id}.jsonl")
    crystal_path = os.path.join(work_dir, f"crystal_s{shard_id}.crystal")
    manifest_path = os.path.join(work_dir, f"manifest_s{shard_id}.json")

    summary = run_autonomous_batch(
        batch_size=batch_size,
        db_file=os.path.join(work_dir, "frontier.sqlite"),
        state_file=os.path.join(work_dir, f"state_s{shard_id}.json"),
        out_path=raw_jsonl,
        shard_id=shard_id,
        total_shards=total_shards,
    )

    if int(summary.get("records_collected", 0)) > 0:
        pack_nano_crystal([raw_jsonl], crystal_path, purge_raw=True)
        offload_artifact(crystal_path, manifest_path, purge_local=False)

    heartbeat = json.dumps(
        {
            "nodeId": os.environ.get("SWARM_NODE_ID", f"universal-worker-s{shard_id}"),
            "kind": os.environ.get("SWARM_NODE_KIND", "hf_space_docker"),
            "shardId": shard_id,
            "totalShards": total_shards,
            "pagesProcessedDelta": int(summary.get("records_collected", 0)),
            "hllUniqueEstimate": int(summary.get("hll_unique_estimate", 0)),
        }
    ).encode("utf-8")
    try:
        req = urllib.request.Request(
            f"{hub}/api/v1/swarm/nodes",
            data=heartbeat,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=6):
            pass
    except Exception:
        pass
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    run_once()
