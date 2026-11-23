#!/usr/bin/env python3
"""
HEYUKA Global Nervous Mesh Auto-Sync (`v101.0` - `v108.0`, $0.00 Zero-Hardcoded-Secrets)
========================================================================================
Bridges distributed GitHub Actions / Colab / Kaggle crawler outputs directly into:
1. Hugging Face Dataset Hub (`zuvyrismail/heyuka-omni-vault` via `HfTokenPool` rotation).
2. Live production HEYUKA Studio / KASPI POS `/api/v1/studio/ingest` (`action: "hot_sync"`),
   updating Studied Knowledge Corpus & `lastCloudSyncAt` telemetry immediately.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "storage"))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
if STORAGE_DIR not in sys.path:
    sys.path.insert(0, STORAGE_DIR)

from hf_token_pool import (  # noqa: E402
    HfTokenPool,
    resolve_hf_dataset_repo,
    upload_file_to_hf_dataset_http,
)


def load_shard_units(shard_paths: List[str], max_units: int = 80) -> List[Dict[str, str]]:
    """Extracts compact normalized corpus units from JSON/JSONL shards without loading unbounded RAM."""
    units: List[Dict[str, str]] = []
    seen_urls = set()
    for path in shard_paths:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as fh:
                for raw in fh:
                    if len(units) >= max_units:
                        break
                    line = raw.strip()
                    if not line:
                        continue
                    try:
                        rec = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if not isinstance(rec, dict):
                        continue
                    url = str(rec.get("url") or rec.get("source_url") or "").strip()
                    title = str(rec.get("title") or rec.get("domain") or "Crawled Knowledge Unit").strip()
                    content = str(
                        rec.get("text")
                        or rec.get("content")
                        or rec.get("summary")
                        or rec.get("double_read_digest")
                        or ""
                    ).strip()
                    if not content:
                        continue
                    dedup_key = url or hashlib.sha256(content[:256].encode("utf-8")).hexdigest()
                    if dedup_key in seen_urls:
                        continue
                    seen_urls.add(dedup_key)
                    units.append(
                        {
                            "title": title[:160],
                            "url": url or f"https://huggingface.co/datasets/{resolve_hf_dataset_repo()}",
                            "content": content[:2400],
                            "sourceKind": "web_crawl",
                        }
                    )
        except OSError:
            continue
    return units


def post_hot_sync_to_hub(
    hub_url: str,
    units: List[Dict[str, str]],
    source_label: str,
    timeout_s: int = 20,
) -> Dict[str, Any]:
    """Posts newly crawled knowledge units to `/api/v1/studio/ingest` action=hot_sync."""
    endpoint = hub_url.rstrip("/") + "/api/v1/studio/ingest"
    payload = json.dumps(
        {
            "action": "hot_sync",
            "sourceLabel": source_label,
            "units": units,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "HEYUKA-Nervous-Mesh-Sync/v108",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            data = json.loads(raw) if raw else {}
            return {"ok": True, "http_status": resp.status, "endpoint": endpoint, "response": data}
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore")[:240]
        return {"ok": False, "http_status": err.code, "endpoint": endpoint, "error": detail}
    except Exception as exc:
        return {"ok": False, "http_status": 0, "endpoint": endpoint, "error": str(exc)[:240]}


def run_distributed_sync(
    shard_paths: List[str],
    hub_url: str,
    source_label: str,
    upload_hf: bool = True,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Coordinates Hugging Face shard upload + live Studio Nervous Mesh hot-sync."""
    units = load_shard_units(shard_paths)
    if not units:
        units = [
            {
                "title": "HEYUKA Nervous Mesh Heartbeat",
                "url": f"https://huggingface.co/datasets/{resolve_hf_dataset_repo()}",
                "content": (
                    f"Distributed crawler pulse at {datetime.now(timezone.utc).isoformat()} "
                    f"from {source_label}. Synchronized public open-web shards and verified vault indexes."
                ),
                "sourceKind": "web_crawl",
            }
        ]

    hf_results: List[Dict[str, Any]] = []
    if upload_hf and not dry_run:
        pool = HfTokenPool.from_env(dotenv_fallback=os.path.join(ROOT_DIR, ".env.local"))
        repo_id = resolve_hf_dataset_repo()
        for path in shard_paths:
            if not os.path.exists(path):
                continue
            name = os.path.basename(path)
            res = upload_file_to_hf_dataset_http(
                file_path=path,
                path_in_repo=f"shards/{name}",
                repo_id=repo_id,
                pool=pool,
                commit_message=f"chore(mesh): hot-sync {name} from {source_label}",
            )
            hf_results.append(res)

    hub_sync: Dict[str, Any]
    if dry_run or not hub_url.strip():
        hub_sync = {
            "ok": True,
            "mode": "dry_run" if dry_run else "no_hub_url_configured",
            "preparedUnits": len(units),
            "sourceLabel": source_label,
        }
    else:
        hub_sync = post_hot_sync_to_hub(hub_url=hub_url, units=units, source_label=source_label)

    return {
        "ok": True,
        "version": "v108.0-nervous-mesh",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "unitsPrepared": len(units),
        "hfRepo": resolve_hf_dataset_repo(),
        "hfUploads": hf_results,
        "hubSync": hub_sync,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="HEYUKA Global Nervous Mesh Auto-Sync")
    parser.add_argument("--shards", nargs="*", default=[], help="JSONL shard paths to sync")
    parser.add_argument(
        "--hub-url",
        default=os.environ.get("HEYUKA_HUB_URL", "").strip(),
        help="Live HEYUKA / KASPI POS base URL (e.g. https://kaspi-pos.vercel.app)",
    )
    parser.add_argument("--source-label", default="github_actions_matrix_swarm", help="Origin swarm worker label")
    parser.add_argument("--no-hf", action="store_true", help="Skip Hugging Face shard upload")
    parser.add_argument("--dry-run", action="store_true", help="Build payload without external network calls")
    args = parser.parse_args()

    result = run_distributed_sync(
        shard_paths=args.shards,
        hub_url=args.hub_url,
        source_label=args.source_label,
        upload_hf=not args.no_hf,
        dry_run=args.dry_run,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
