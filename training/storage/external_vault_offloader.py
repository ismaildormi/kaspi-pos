#!/usr/bin/env python3
"""
HEYUKA Multi-Cloud External Vault Offloader ($0 Open Storage Targets)
- Pushes compressed Nano-Crystal / Parquet / JSONL shards to free external storage when tokens are configured:
  1. Hugging Face Hub (HF_TOKEN + HF_REPO_ID, e.g. user/heyuka-corpus)
  2. Zenodo CERN Open Storage (ZENODO_TOKEN)
  3. Internet Archive S3 API (IA_ACCESS_KEY + IA_SECRET_KEY + IA_ITEM_ID)
- Updates lightweight pointer manifest (vault/union-manifest.json < 20 KB) and optionally purges local temp blobs.
- Never fabricates remote uploads: accurately reports 'uploaded' vs 'skipped_no_token'.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Dict, List

STORAGE_DIR = os.path.dirname(os.path.abspath(__file__))
if STORAGE_DIR not in sys.path:
    sys.path.insert(0, STORAGE_DIR)

from hf_token_pool import (  # noqa: E402
    HfTokenPool,
    ensure_dataset_repo_http,
    resolve_hf_dataset_repo,
    upload_file_to_hf_dataset_http,
)


def sha256_file(fp: str) -> str:
    h = hashlib.sha256()
    with open(fp, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def upload_to_huggingface(file_path: str, pool: HfTokenPool, repo_id: str, path_in_repo: str | None = None) -> Dict[str, object]:
    ensure_dataset_repo_http(repo_id, pool)
    target = path_in_repo or f"crystals/{os.path.basename(file_path)}"
    return upload_file_to_hf_dataset_http(file_path, target, repo_id, pool)


def upload_to_zenodo(file_path: str, zenodo_token: str) -> Dict[str, object]:
    try:
        req = urllib.request.Request(
            "https://zenodo.org/api/deposit/depositions",
            data=json.dumps({}).encode("utf-8"),
            headers={"Authorization": f"Bearer {zenodo_token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            dep = json.loads(resp.read().decode("utf-8"))
        bucket_url = dep.get("links", {}).get("bucket")
        if not bucket_url:
            return {"provider": "zenodo", "status": "error", "detail": "missing_bucket_url"}

        fname = os.path.basename(file_path)
        with open(file_path, "rb") as fh:
            payload = fh.read()
        put_req = urllib.request.Request(
            f"{bucket_url}/{fname}",
            data=payload,
            headers={"Authorization": f"Bearer {zenodo_token}", "Content-Type": "application/octet-stream"},
            method="PUT",
        )
        with urllib.request.urlopen(put_req, timeout=30) as p_resp:
            p_data = json.loads(p_resp.read().decode("utf-8"))
        return {"provider": "zenodo", "status": "uploaded_draft", "deposition_id": dep.get("id"), "key": p_data.get("key")}
    except Exception as exc:
        return {"provider": "zenodo", "status": "error", "detail": str(exc)[:200]}


def upload_to_internet_archive(file_path: str, access_key: str, secret_key: str, item_id: str) -> Dict[str, object]:
    try:
        fname = os.path.basename(file_path)
        with open(file_path, "rb") as fh:
            payload = fh.read()
        req = urllib.request.Request(
            f"https://s3.us.archive.org/{item_id}/{fname}",
            data=payload,
            headers={
                "Authorization": f"LOW {access_key}:{secret_key}",
                "x-amz-auto-make-bucket": "1",
                "x-archive-meta-mediatype": "data",
                "Content-Type": "application/octet-stream",
            },
            method="PUT",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {
                "provider": "internet_archive",
                "status": "uploaded" if 200 <= resp.status < 300 else f"http_{resp.status}",
                "url": f"https://archive.org/details/{item_id}",
            }
    except Exception as exc:
        return {"provider": "internet_archive", "status": "error", "detail": str(exc)[:200]}


def offload_artifact(file_path: str, manifest_path: str, purge_local: bool = False) -> Dict[str, object]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Missing artifact to offload: {file_path}")

    digest = sha256_file(file_path)
    size_bytes = os.path.getsize(file_path)
    uploads: List[Dict[str, object]] = []

    dotenv_local = os.path.abspath(os.path.join(STORAGE_DIR, "..", "..", ".env.local"))
    hf_pool = HfTokenPool.from_env(dotenv_fallback=dotenv_local)
    hf_repo = resolve_hf_dataset_repo()
    if hf_pool.count() > 0:
        uploads.append(upload_to_huggingface(file_path, hf_pool, hf_repo))
    else:
        uploads.append({"provider": "huggingface_hub", "status": "skipped_no_token", "env_needed": "HF_TOKEN"})

    zen_token = os.environ.get("ZENODO_TOKEN", "").strip()
    if zen_token:
        uploads.append(upload_to_zenodo(file_path, zen_token))
    else:
        uploads.append({"provider": "zenodo", "status": "skipped_no_token", "env_needed": "ZENODO_TOKEN"})

    ia_ak = os.environ.get("IA_ACCESS_KEY", "").strip()
    ia_sk = os.environ.get("IA_SECRET_KEY", "").strip()
    ia_item = os.environ.get("IA_ITEM_ID", "heyuka-open-corpus").strip()
    if ia_ak and ia_sk:
        uploads.append(upload_to_internet_archive(file_path, ia_ak, ia_sk, ia_item))
    else:
        uploads.append({"provider": "internet_archive", "status": "skipped_no_token", "env_needed": "IA_ACCESS_KEY+IA_SECRET_KEY"})

    any_remote_ok = any(str(u.get("status", "")).startswith("uploaded") for u in uploads)
    purged = False
    if purge_local and any_remote_ok:
        os.remove(file_path)
        purged = True

    manifest: Dict[str, object] = {"schema": "heyuka-union-manifest-v1", "shards": []}
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as mf:
                loaded = json.load(mf)
            if isinstance(loaded, dict) and isinstance(loaded.get("shards"), list):
                manifest = loaded
        except Exception:
            pass

    shards: List[dict] = list(manifest.get("shards", []))  # type: ignore
    shards.append(
        {
            "filename": os.path.basename(file_path),
            "size_bytes": size_bytes,
            "sha256": digest,
            "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "uploads": uploads,
            "local_purged": purged,
        }
    )
    manifest["shards"] = shards[-40:]

    os.makedirs(os.path.dirname(os.path.abspath(manifest_path)), exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, ensure_ascii=False, indent=2)

    if hf_pool.count() > 0 and any_remote_ok:
        upload_to_huggingface(manifest_path, hf_pool, hf_repo, path_in_repo=f"manifests/{os.path.basename(manifest_path)}")

    return {
        "ok": True,
        "filename": os.path.basename(file_path),
        "size_bytes": size_bytes,
        "sha256": digest,
        "any_remote_uploaded": any_remote_ok,
        "local_purged": purged,
        "hf_pool_tokens": hf_pool.count(),
        "hf_dataset_repo": hf_repo,
        "uploads": uploads,
        "manifest_path": manifest_path,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="HEYUKA Multi-Cloud Free Vault Offloader")
    parser.add_argument("--file", required=True, help="Compressed Nano-Crystal or shard to offload")
    parser.add_argument("--manifest", default="/tmp/heyuka_union_manifest.json", help="Pointer manifest output")
    parser.add_argument("--purge-local", action="store_true", help="Delete local artifact only after remote upload succeeds")
    args = parser.parse_args()

    res = offload_artifact(args.file, args.manifest, purge_local=args.purge_local)
    print(json.dumps(res, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
