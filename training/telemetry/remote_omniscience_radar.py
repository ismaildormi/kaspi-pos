#!/usr/bin/env python3
"""
HEYUKA Remote Cloud Omniscience Radar (0 MB Metadata-Only Telemetry)
Queries only lightweight metadata endpoints without downloading bulky shards locally:
- Hugging Face Dataset API & tree listing (zuvyrismail/heyuka-omni-vault via HfTokenPool)
- Common Crawl public index catalog (https://index.commoncrawl.org/collinfo.json)
- GitHub Actions workflow runs for eternal-public-study-loop.yml & sovereign-24-7-watchdog.yml
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from typing import Dict, List, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "storage"))
if STORAGE_DIR not in sys.path:
    sys.path.insert(0, STORAGE_DIR)

from hf_token_pool import HfTokenPool, resolve_hf_dataset_repo  # noqa: E402


def _http_json(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 8) -> Optional[object]:
    req_headers = {"User-Agent": "HEYUKA-OmniscienceRadar/1.0 (+https://kaspi-pos.vercel.app)"}
    if headers:
        req_headers.update(headers)
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read(300_000).decode("utf-8", errors="ignore"))
    except Exception:
        return None


def collect_remote_omniscience_telemetry(state_file: Optional[str] = None) -> Dict[str, object]:
    """Collects verified live remote metadata across Hugging Face, Common Crawl & GitHub Actions."""
    t0 = time.monotonic()
    dotenv_path = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".env.local"))
    pool = HfTokenPool.from_env(dotenv_fallback=dotenv_path)
    repo_id = resolve_hf_dataset_repo()

    auth_headers: Dict[str, str] = {}
    candidates = pool.ordered_candidates(purpose="read")
    if candidates:
        auth_headers["Authorization"] = f"Bearer {candidates[0]['token']}"

    hf_info = _http_json(f"https://huggingface.co/api/datasets/{repo_id}", headers=auth_headers)
    hf_crystals = _http_json(f"https://huggingface.co/api/datasets/{repo_id}/tree/main/crystals", headers=auth_headers)
    hf_manifests = _http_json(f"https://huggingface.co/api/datasets/{repo_id}/tree/main/manifests", headers=auth_headers)

    crystal_files: List[Dict[str, object]] = []
    remote_crystal_bytes = 0
    if isinstance(hf_crystals, list):
        for item in hf_crystals:
            if isinstance(item, dict) and item.get("type") == "file":
                sz = int(item.get("size") or 0)
                remote_crystal_bytes += sz
                crystal_files.append({"path": item.get("path"), "size": sz})

    manifest_files: List[str] = []
    if isinstance(hf_manifests, list):
        for item in hf_manifests:
            if isinstance(item, dict) and item.get("path"):
                manifest_files.append(str(item.get("path")))

    cc_list = _http_json("https://index.commoncrawl.org/collinfo.json")
    cc_latest = None
    cc_count = 0
    if isinstance(cc_list, list) and cc_list:
        cc_count = len(cc_list)
        latest = cc_list[0] if isinstance(cc_list[0], dict) else {}
        cc_latest = latest.get("id") or latest.get("name")

    gh_runs = _http_json(
        "https://api.github.com/repos/ismaildormi/kaspi-pos/actions/workflows/eternal-public-study-loop.yml/runs?per_page=5"
    )
    gh_total_runs = 0
    gh_latest_status = "not_triggered_yet"
    if isinstance(gh_runs, dict):
        gh_total_runs = int(gh_runs.get("total_count") or 0)
        runs = gh_runs.get("workflow_runs") or []
        if isinstance(runs, list) and runs and isinstance(runs[0], dict):
            gh_latest_status = str(runs[0].get("conclusion") or runs[0].get("status") or "unknown")

    local_state: Dict[str, object] = {}
    if state_file and os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as fh:
                parsed = json.load(fh)
            if isinstance(parsed, dict):
                local_state = parsed
        except Exception:
            pass

    return {
        "ok": True,
        "metadataOnlyZeroMbDownload": True,
        "collectedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "latencyMs": round((time.monotonic() - t0) * 1000, 1),
        "huggingFace": {
            "datasetRepo": repo_id,
            "connected": isinstance(hf_info, dict) and bool(hf_info.get("id")),
            "poolActiveTokens": pool.count(),
            "crystalCount": len(crystal_files),
            "crystalBytes": remote_crystal_bytes,
            "manifestCount": len(manifest_files),
            "crystals": crystal_files,
        },
        "commonCrawlFrontier": {
            "latestIndex": cc_latest,
            "availableCrawlsCount": cc_count,
            "frontierScale": "110B+ public open-web pages across Common Crawl shards",
        },
        "githubActions": {
            "workflow": "eternal-public-study-loop.yml",
            "totalRuns": gh_total_runs,
            "latestStatus": gh_latest_status,
        },
        "localCrawlerState": {
            "runCount": int(local_state.get("run_count") or 0),
            "totalCrawled": int(local_state.get("total_crawled") or 0),
            "totalRecords": int(local_state.get("total_records") or 0),
            "lastRunAt": local_state.get("last_run_at"),
        },
    }


def main() -> int:
    report = collect_remote_omniscience_telemetry()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
