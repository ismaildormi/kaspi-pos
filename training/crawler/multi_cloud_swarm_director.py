#!/usr/bin/env python3
"""
HEYUKA v98.0 / v99.0 — Multi-Cloud Swarm Topology Director (120 Shards across 6 Global Free Pools)
Cleanly partitions Shards 0..119 without collision or overlapping hosts:
- Shards   0..19  (20): GitHub Actions Free Matrix Workers
- Shards  20..44  (25): Hugging Face Spaces Docker Containers
- Shards  45..84  (40): Cloudflare Workers Global Edge Nodes (300+ cities)
- Shards  85..99  (15): Kaggle / Google Colab / Lightning.ai Heavy WARC Workers
- Shards 100..109 (10): GitLab CI & Vercel / Deno Edge Cron Workers
- Shards 110..119 (10): Browser P2P WebWorker Nodes (Zero-UI-Lag Volunteer Mesh)
"""

from __future__ import annotations

import json
import os
import sys
from typing import Dict, List

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from planetary_crawl_secrets import ConsistentHashRing  # noqa: E402

TOTAL_PLANETARY_SHARDS = 120

CLOUD_SWARM_POOLS: List[Dict[str, object]] = [
    {"id": "github_actions_matrix", "label": "GitHub Actions 20x Matrix", "start": 0, "end": 19, "template": ".github/workflows/eternal-public-study-loop.yml"},
    {"id": "hf_spaces_docker", "label": "Hugging Face Spaces Docker Swarm", "start": 20, "end": 44, "template": "deploy/swarm-nodes/hf-space-dockerfile"},
    {"id": "cloudflare_edge_workers", "label": "Cloudflare Workers (300+ Cities)", "start": 45, "end": 84, "template": "deploy/swarm-nodes/cf-worker-node.ts"},
    {"id": "kaggle_colab_warc", "label": "Kaggle / Colab / Lightning WARC Workers", "start": 85, "end": 99, "template": "deploy/swarm-nodes/universal-worker.py"},
    {"id": "gitlab_vercel_cron", "label": "GitLab CI / Vercel Edge Delta Workers", "start": 100, "end": 109, "template": "deploy/swarm-nodes/universal-worker.py"},
    {"id": "browser_p2p_mesh", "label": "Browser WebWorker P2P Micro-Swarm", "start": 110, "end": 119, "template": "public/swarm-worker.js"},
]


def resolve_pool_for_shard(shard_id: int) -> Dict[str, object]:
    sid = int(shard_id) % TOTAL_PLANETARY_SHARDS
    for pool in CLOUD_SWARM_POOLS:
        if int(pool["start"]) <= sid <= int(pool["end"]):
            return {"shardId": sid, **pool}
    return {"shardId": sid, **CLOUD_SWARM_POOLS[0]}


def get_planetary_swarm_topology(sample_hosts: List[str] | None = None) -> Dict[str, object]:
    ring = ConsistentHashRing(total_shards=TOTAL_PLANETARY_SHARDS)
    hosts = sample_hosts or [
        "en.wikipedia.org",
        "ar.wikipedia.org",
        "export.arxiv.org",
        "api.openalex.org",
        "huggingface.co",
        "world.openfoodfacts.org",
        "api.worldbank.org",
    ]
    assignments = []
    for h in hosts:
        shard = ring.owner_shard_for_host(h)
        pool = resolve_pool_for_shard(shard)
        assignments.append({"host": h, "shardId": shard, "pool": pool["id"]})

    return {
        "ok": True,
        "totalShards": TOTAL_PLANETARY_SHARDS,
        "poolsCount": len(CLOUD_SWARM_POOLS),
        "pools": CLOUD_SWARM_POOLS,
        "sampleHostAssignments": assignments,
    }


if __name__ == "__main__":
    print(json.dumps(get_planetary_swarm_topology(), ensure_ascii=False, indent=2))
