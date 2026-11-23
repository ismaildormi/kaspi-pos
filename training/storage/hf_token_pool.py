#!/usr/bin/env python3
"""
HEYUKA Multi-Token Hugging Face Pool & Rate-Limit Rotator ($0.00 Zero-Hardcoded-Secrets)
======================================================================================
Reads environment variables safely (HF_TOKEN, HF_TOKEN_2, HF_TOKEN_3, HF_TOKEN_4, HUGGINGFACE_API_KEYS)
plus repository target (HF_DATASET_REPO / HF_REPO_ID). Never logs raw secret strings.

- Tracks per-token rate-limit cooldowns (429/503) and write-permission rejections (401/403).
- Distributes reads/inference across all tokens and prioritizes write-capable tokens for dataset syncs.
- Includes zero-dependency stdlib Hugging Face Hub Commit API uploader (with huggingface_hub fallback).
"""

from __future__ import annotations

import base64
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple


DEFAULT_DATASET_REPO = "zuvyrismail/heyuka-omni-vault"


def mask_token(tok: str) -> str:
    clean = str(tok or "").strip()
    if len(clean) <= 8:
        return "***"
    return f"hf_...{clean[-6:]}"


def resolve_hf_dataset_repo() -> str:
    for var in ("HF_DATASET_REPO", "HF_REPO_ID"):
        val = os.environ.get(var, "").strip()
        if val:
            return val
    return DEFAULT_DATASET_REPO


class HfTokenPool:
    """Thread-safe / single-process smart round-robin pool with cooldown & write-lane tracking."""

    def __init__(self, entries: List[Tuple[str, str]]) -> None:
        # entries: list of (env_name, token_value)
        seen = set()
        self.tokens: List[Dict[str, Any]] = []
        for idx, (env_name, val) in enumerate(entries):
            tok = val.strip()
            if not tok or "mock" in tok.lower() or tok in seen:
                continue
            seen.add(tok)
            self.tokens.append(
                {
                    "index": len(self.tokens),
                    "env_name": env_name,
                    "token": tok,
                    "masked": mask_token(tok),
                    "cooldown_until": 0.0,
                    "write_denied": False,
                    "uses": 0,
                }
            )
        self._cursor = 0

    @classmethod
    def from_env(cls, dotenv_fallback: Optional[str] = None) -> "HfTokenPool":
        env_values: Dict[str, str] = {}
        if dotenv_fallback and os.path.exists(dotenv_fallback):
            try:
                with open(dotenv_fallback, "r", encoding="utf-8") as fh:
                    for raw in fh:
                        line = raw.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        env_values[k.strip()] = v.strip().strip('"').strip("'")
            except OSError:
                pass

        def get_var(name: str) -> str:
            return os.environ.get(name, "").strip() or env_values.get(name, "").strip()

        ordered: List[Tuple[str, str]] = []
        for name in ("HF_TOKEN", "HF_TOKEN_2", "HF_TOKEN_3", "HF_TOKEN_4", "HUGGINGFACE_API_KEY"):
            v = get_var(name)
            if v:
                ordered.append((name, v))

        csv_pool = get_var("HUGGINGFACE_API_KEYS")
        if csv_pool:
            for idx, item in enumerate(csv_pool.split(",")):
                if item.strip():
                    ordered.append((f"HUGGINGFACE_API_KEYS[{idx}]", item.strip()))

        return cls(ordered)

    def count(self) -> int:
        return len(self.tokens)

    def masked_summary(self) -> List[Dict[str, Any]]:
        now = time.time()
        return [
            {
                "env": t["env_name"],
                "masked": t["masked"],
                "write_denied": t["write_denied"],
                "cooling_down": t["cooldown_until"] > now,
                "uses": t["uses"],
            }
            for t in self.tokens
        ]

    def ordered_candidates(self, purpose: str = "read") -> List[Dict[str, Any]]:
        if not self.tokens:
            return []
        now = time.time()
        n = len(self.tokens)
        rotated = [self.tokens[(self._cursor + i) % n] for i in range(n)]
        self._cursor = (self._cursor + 1) % n

        if purpose == "write":
            # Prefer non-write-denied, active tokens first; HF_TOKEN & HF_TOKEN_2 lead writes safely
            healthy = [t for t in rotated if not t["write_denied"] and t["cooldown_until"] <= now]
            cooling = [t for t in rotated if not t["write_denied"] and t["cooldown_until"] > now]
            fallback = [t for t in rotated if t["write_denied"]]
            return [*healthy, *cooling, *fallback]

        healthy = [t for t in rotated if t["cooldown_until"] <= now]
        cooling = [t for t in rotated if t["cooldown_until"] > now]
        return [*healthy, *cooling]

    def mark_used(self, entry: Dict[str, Any]) -> None:
        entry["uses"] = int(entry.get("uses", 0)) + 1

    def mark_error(self, entry: Dict[str, Any], status_code: int) -> None:
        if status_code in (429, 503):
            entry["cooldown_until"] = time.time() + 60.0
        elif status_code in (401, 403):
            entry["write_denied"] = True


def ensure_dataset_repo_http(repo_id: str, pool: HfTokenPool) -> Dict[str, object]:
    """Ensures dataset repository exists on Hugging Face Hub without extra packages."""
    repo_name = repo_id.split("/", 1)[-1]
    for entry in pool.ordered_candidates("write"):
        req = urllib.request.Request(
            "https://huggingface.co/api/repos/create",
            data=json.dumps({"name": repo_name, "type": "dataset", "private": False}).encode("utf-8"),
            headers={"Authorization": f"Bearer {entry['token']}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                pool.mark_used(entry)
                return {
                    "ok": True,
                    "repo_id": repo_id,
                    "token_env": entry["env_name"],
                    "status": f"created_http_{resp.status}",
                }
        except urllib.error.HTTPError as err:
            if err.code == 409:
                pool.mark_used(entry)
                return {"ok": True, "repo_id": repo_id, "token_env": entry["env_name"], "status": "already_exists"}
            pool.mark_error(entry, err.code)
        except Exception:
            continue
    return {"ok": False, "repo_id": repo_id, "status": "no_write_token_succeeded"}


def upload_file_to_hf_dataset_http(
    file_path: str,
    path_in_repo: str,
    repo_id: str,
    pool: HfTokenPool,
    commit_message: str = "chore: sync verified HEYUKA Nano-Crystal shard",
) -> Dict[str, object]:
    """Uploads file cleanly to HF Hub dataset via HfApi (if present) or native NDJSON Commit API."""
    candidates = pool.ordered_candidates("write")
    if not candidates:
        return {"provider": "huggingface_hub", "status": "skipped_no_token", "env_needed": "HF_TOKEN"}

    with open(file_path, "rb") as fh:
        raw_bytes = fh.read()

    # Try official Commit API directly via stdlib (base64 NDJSON) — zero pip requirement
    b64_data = base64.b64encode(raw_bytes).decode("ascii")
    ndjson_lines = [
        json.dumps({"key": "header", "value": {"summary": commit_message}}, ensure_ascii=False),
        json.dumps(
            {
                "key": "file",
                "value": {
                    "content": b64_data,
                    "path": path_in_repo.lstrip("/"),
                    "encoding": "base64",
                },
            },
            ensure_ascii=False,
        ),
    ]
    body_bytes = ("\n".join(ndjson_lines) + "\n").encode("utf-8")

    last_err = "unknown"
    for entry in candidates:
        # Try optional huggingface_hub first only if small retry not needed; actually HTTP NDJSON handles up to ~50MB cleanly and verifies HTTP 200 directly!
        req = urllib.request.Request(
            f"https://huggingface.co/api/datasets/{repo_id}/commit/main",
            data=body_bytes,
            headers={
                "Authorization": f"Bearer {entry['token']}",
                "Content-Type": "application/x-ndjson",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                pool.mark_used(entry)
                res_json = json.loads(resp.read().decode("utf-8"))
                return {
                    "provider": "huggingface_hub",
                    "status": "uploaded",
                    "repo_id": repo_id,
                    "token_used": entry["env_name"],
                    "token_masked": entry["masked"],
                    "commit_oid": res_json.get("commitOid"),
                    "url": f"https://huggingface.co/datasets/{repo_id}/blob/main/{path_in_repo.lstrip('/')}",
                }
        except urllib.error.HTTPError as err:
            pool.mark_error(entry, err.code)
            detail = err.read().decode("utf-8", errors="ignore")[:180]
            last_err = f"HTTP {err.code}: {detail}"
            if err.code == 404:
                ensure_dataset_repo_http(repo_id, pool)
        except Exception as exc:
            last_err = str(exc)[:180]

        # Optional huggingface_hub fallback if installed and HTTP returned error (e.g. LFS large shard)
        try:
            from huggingface_hub import HfApi  # type: ignore

            api = HfApi(token=entry["token"])
            url = api.upload_file(
                path_or_fileobj=file_path,
                path_in_repo=path_in_repo.lstrip("/"),
                repo_id=repo_id,
                repo_type="dataset",
                commit_message=commit_message,
            )
            pool.mark_used(entry)
            return {
                "provider": "huggingface_hub",
                "status": "uploaded",
                "repo_id": repo_id,
                "token_used": entry["env_name"],
                "token_masked": entry["masked"],
                "url": str(url),
            }
        except ImportError:
            pass
        except Exception as hub_exc:
            last_err = str(hub_exc)[:180]

    return {"provider": "huggingface_hub", "status": "error", "repo_id": repo_id, "detail": last_err}
