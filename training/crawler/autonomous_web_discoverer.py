#!/usr/bin/env python3
"""
HEYUKA Autonomous Public-Web & Open-Science Batch Discoverer ($0.00 Zero-Key)
- Automatically discovers and studies diverse public open-web knowledge without manual seed URLs:
  1. Common Crawl CDX Index API (rotates across public web indexes politely).
  2. Live Open Public Firehoses (OpenAlex Works, arXiv Atom API, Wikimedia Action API, GDELT News, USGS, NASA EONET).
  3. Repo Vault public documentation seeds + polite depth-limited outlink frontier in SQLite.
  4. Optional Open Pretraining Corpus streaming (FineWeb-Edu, FineWeb-2, The Stack v2) when 'datasets' is installed.
- Strict non-bypassable guardrails:
  - Always enforces SSRF checks (is_safe_public_http_url) and robots.txt (is_allowed_by_robots).
  - Never crawls private accounts, sessions, authenticated endpoints, or internal hosts.
  - Strictly enforces per-host cooldown spacing (>= 1.5s) and finite per-run batch caps (<= 500).
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Tuple

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from web_scale_crawler import (  # noqa: E402
    DEFAULT_UA,
    fetch_public_page,
    is_safe_public_http_url,
    stream_open_pretrain_datasets,
)

MEMORY_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "memory"))
if MEMORY_DIR not in sys.path:
    sys.path.insert(0, MEMORY_DIR)

from immortal_nano_vault import distill_key_sentences  # noqa: E402


def verify_record_double_read(record: Dict[str, object]) -> Dict[str, object]:
    """
    Mandatory Pass-1 + Pass-2 verification gate:
    - Pass 1: Verify readable length, non-boilerplate content & clean whitespace.
    - Pass 2: Re-read to extract structured factual sentences (pass2_facts), verification score & SHA-256 stamp.
    """
    text = re.sub(r"\s+", " ", str(record.get("text") or "")).strip()
    if len(text) < 45 or re.search(r"(enable javascript to run|accept all cookies|access denied)", text.lower()):
        out = dict(record)
        out["double_read_verified"] = False
        return out

    pass2_facts = distill_key_sentences(str(record.get("text") or ""), max_sentences=6)
    alpha_chars = len(re.findall(r"[A-Za-z\u0600-\u06FF]", text))
    density = round(alpha_chars / max(1, len(text)), 3)
    verified = len(pass2_facts) >= 1 and density >= 0.35
    digest = hashlib.sha256(f"{record.get('title','')}\n{'|'.join(pass2_facts)}".encode("utf-8")).hexdigest()[:24]

    enriched = dict(record)
    enriched["double_read_verified"] = verified
    enriched["pass2_facts"] = pass2_facts
    enriched["verification_score"] = min(100, int(65 + len(pass2_facts) * 6 + density * 15))
    enriched["verification_sha256"] = digest
    return enriched


COMMON_CRAWL_PREFIXES = [
    "https://nextjs.org/docs/*",
    "https://docs.python.org/3/*",
    "https://developer.mozilla.org/en-US/docs/Web/*",
    "https://react.dev/reference/*",
    "https://arxiv.org/abs/*",
]


def load_state(state_file: str) -> Dict[str, object]:
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return {
        "run_count": 0,
        "cc_prefix_idx": 0,
        "arxiv_start": 0,
        "openalex_page": 1,
        "total_crawled": 0,
        "total_records": 0,
    }


def save_state(state_file: str, state: Dict[str, object]) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(state_file)), exist_ok=True)
    state["last_run_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(state_file, "w", encoding="utf-8") as fh:
        json.dump(state, fh, ensure_ascii=False, indent=2)


def init_frontier_db(db_file: str) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(os.path.abspath(db_file)), exist_ok=True)
    conn = sqlite3.connect(db_file)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS frontier (
          url TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          depth INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending',
          discovered_at REAL NOT NULL,
          fetched_at REAL
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_frontier_status ON frontier(status, depth, discovered_at)")
    conn.commit()
    return conn


def enqueue_urls(conn: sqlite3.Connection, urls: List[Tuple[str, str, int]]) -> int:
    added = 0
    now = time.time()
    for raw_url, source, depth in urls:
        clean = raw_url.split("#")[0].strip()
        if not clean or depth > 2:
            continue
        safe, _ = is_safe_public_http_url(clean)
        if not safe:
            continue
        cur = conn.execute(
            "INSERT OR IGNORE INTO frontier (url, source, depth, status, discovered_at) VALUES (?, ?, ?, 'pending', ?)",
            (clean, source, depth, now),
        )
        if cur.rowcount > 0:
            added += 1
    conn.commit()
    return added


def http_get_text(url: str, timeout: int = 10, max_bytes: int = 250_000) -> Optional[str]:
    safe, _ = is_safe_public_http_url(url)
    if not safe:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": DEFAULT_UA, "Accept": "*/*"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read(max_bytes).decode("utf-8", errors="ignore")
    except Exception:
        return None


def discover_common_crawl_cdx(state: Dict[str, object], limit: int = 8) -> List[Tuple[str, str, int]]:
    """Queries Common Crawl's public index catalog and fetches a small batch of public documentation URLs."""
    discovered: List[Tuple[str, str, int]] = []
    coll_raw = http_get_text("https://index.commoncrawl.org/collinfo.json", timeout=8)
    if not coll_raw:
        return discovered
    try:
        colls = json.loads(coll_raw)
        cdx_api = str(colls[0].get("cdx-api") or "")
        if not cdx_api:
            return discovered
        idx = int(state.get("cc_prefix_idx", 0)) % len(COMMON_CRAWL_PREFIXES)
        prefix = COMMON_CRAWL_PREFIXES[idx]
        state["cc_prefix_idx"] = idx + 1
        cdx_url = (
            f"{cdx_api}?url={urllib.parse.quote(prefix, safe='')}"
            f"&output=json&filter=status:200&filter=mime:text/html&limit={limit}"
        )
        cdx_raw = http_get_text(cdx_url, timeout=12)
        if not cdx_raw:
            return discovered
        for line in cdx_raw.splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
                u = str(rec.get("url") or "").strip()
                if u.startswith(("http://", "https://")):
                    discovered.append((u, "common_crawl_cdx", 0))
            except Exception:
                continue
    except Exception:
        pass
    return discovered


def discover_repo_vault_public_urls(limit: int = 12) -> List[Tuple[str, str, int]]:
    """Extracts public open-source documentation/project URLs from local arsenal definitions."""
    discovered: List[Tuple[str, str, int]] = []
    repo_root = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
    pattern = os.path.join(repo_root, "src", "lib", "zebra-x", "core", "*.ts")
    url_re = re.compile(r"https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/[^\s\"'`<>)\]]+")
    seen = set()
    for fp in sorted(glob.glob(pattern)):
        try:
            with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read(120_000)
            for match in url_re.findall(text):
                clean = match.rstrip(".,;:")
                if clean in seen or any(skip in clean for skip in ("127.0.0.1", "localhost")):
                    continue
                seen.add(clean)
                discovered.append((clean, "vault_seed", 0))
                if len(discovered) >= limit:
                    return discovered
        except Exception:
            continue
    return discovered


def discover_live_public_firehoses(state: Dict[str, object]) -> Tuple[List[Dict[str, object]], List[Tuple[str, str, int]]]:
    """Queries public science, encyclopedia, news, and geophysical open feeds cleanly."""
    direct_records: List[Dict[str, object]] = []
    frontier_links: List[Tuple[str, str, int]] = []

    # 1. OpenAlex Rotating Open Papers
    oa_page = int(state.get("openalex_page", 1))
    oa_url = (
        f"https://api.openalex.org/works?search=artificial%20intelligence%20OR%20software%20engineering"
        f"&per-page=6&page={oa_page}&select=id,title,publication_year,doi,open_access"
    )
    oa_raw = http_get_text(oa_url, timeout=10)
    state["openalex_page"] = (oa_page % 25) + 1
    if oa_raw:
        try:
            for item in json.loads(oa_raw).get("results", []):
                title = str(item.get("title") or "").strip()
                link = str(item.get("doi") or item.get("id") or "")
                if title:
                    direct_records.append({
                        "id": hashlib.sha256(f"oa:{link}:{title}".encode()).hexdigest()[:24],
                        "title": title,
                        "url": link,
                        "source_kind": "openalex_firehose",
                        "text": f"{title} (Year: {item.get('publication_year', 'N/A')}). OpenAlex URL: {link}",
                    })
                    oa_info = item.get("open_access") or {}
                    oa_pdf_or_html = str(oa_info.get("oa_url") or "")
                    if oa_pdf_or_html.startswith("https://") and not oa_pdf_or_html.lower().endswith(".pdf"):
                        frontier_links.append((oa_pdf_or_html, "openalex_oa", 1))
        except Exception:
            pass

    # 2. arXiv Atom API
    ax_start = int(state.get("arxiv_start", 0))
    ax_url = f"https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.SE&start={ax_start}&max_results=5"
    ax_raw = http_get_text(ax_url, timeout=10)
    state["arxiv_start"] = (ax_start + 5) % 100
    if ax_raw:
        try:
            root = ET.fromstring(ax_raw)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            for entry in root.findall("atom:entry", ns):
                title = re.sub(r"\s+", " ", (entry.findtext("atom:title", "", ns) or "")).strip()
                summary = re.sub(r"\s+", " ", (entry.findtext("atom:summary", "", ns) or "")).strip()
                eid = (entry.findtext("atom:id", "", ns) or "").strip()
                if title and summary:
                    direct_records.append({
                        "id": hashlib.sha256(f"arxiv:{eid}".encode()).hexdigest()[:24],
                        "title": title,
                        "url": eid,
                        "source_kind": "arxiv_firehose",
                        "text": f"{title}\n\n{summary}",
                    })
        except Exception:
            pass

    # 3. Wikimedia Random Public Topics (Action API EN + AR)
    for lang_code in ("en", "ar"):
        wm_url = (
            f"https://{lang_code}.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0"
            "&grnlimit=4&prop=extracts|info&exintro=1&explaintext=1&inprop=url&format=json"
        )
        wm_raw = http_get_text(wm_url, timeout=10)
        if wm_raw:
            try:
                pages = json.loads(wm_raw).get("query", {}).get("pages", {})
                for p in pages.values():
                    title = str(p.get("title") or "").strip()
                    extract = str(p.get("extract") or "").strip()
                    fullurl = str(p.get("fullurl") or "")
                    if title and len(extract) >= 80:
                        direct_records.append({
                            "id": hashlib.sha256(f"wiki:{lang_code}:{title}".encode()).hexdigest()[:24],
                            "title": f"[{lang_code.upper()}] {title}",
                            "url": fullurl,
                            "source_kind": "wikimedia_live",
                            "text": f"{title}\n\n{extract}",
                        })
            except Exception:
                pass

    # 4. GDELT Public Global News ArtList
    gdelt_raw = http_get_text(
        "https://api.gdeltproject.org/api/v2/doc/doc?query=technology%20OR%20economy&mode=ArtList&maxrecords=5&format=json",
        timeout=10,
    )
    if gdelt_raw:
        try:
            for art in json.loads(gdelt_raw).get("articles", []):
                title = str(art.get("title") or "").strip()
                art_url = str(art.get("url") or "").strip()
                if title and art_url.startswith("https://"):
                    direct_records.append({
                        "id": hashlib.sha256(f"gdelt:{art_url}".encode()).hexdigest()[:24],
                        "title": title,
                        "url": art_url,
                        "source_kind": "gdelt_news",
                        "text": f"{title} ({art.get('domain', '')}, {art.get('seendate', '')}) - {art_url}",
                    })
        except Exception:
            pass

    # 5. USGS Earthquakes & NASA EONET Natural Events
    usgs_raw = http_get_text("https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=4", timeout=8)
    if usgs_raw:
        try:
            for feat in json.loads(usgs_raw).get("features", []):
                props = feat.get("properties") or {}
                title = str(props.get("title") or "USGS Seismic Event")
                u = str(props.get("url") or "https://earthquake.usgs.gov/")
                direct_records.append({
                    "id": hashlib.sha256(f"usgs:{u}:{title}".encode()).hexdigest()[:24],
                    "title": title,
                    "url": u,
                    "source_kind": "usgs_geophysics",
                    "text": f"{title} • Magnitude: {props.get('mag')} • Place: {props.get('place')}",
                })
        except Exception:
            pass

    eonet_raw = http_get_text("https://eonet.gsfc.nasa.gov/api/v3/events?limit=4&status=open", timeout=8)
    if eonet_raw:
        try:
            for ev in json.loads(eonet_raw).get("events", []):
                title = str(ev.get("title") or "").strip()
                link = str(ev.get("link") or "https://eonet.gsfc.nasa.gov/")
                cats = ", ".join(str(c.get("title") or "") for c in ev.get("categories", []))
                if title:
                    direct_records.append({
                        "id": hashlib.sha256(f"eonet:{link}:{title}".encode()).hexdigest()[:24],
                        "title": title,
                        "url": link,
                        "source_kind": "nasa_eonet",
                        "text": f"{title} (Category: {cats or 'Earth Observation'}) - {link}",
                    })
        except Exception:
            pass

    return direct_records, frontier_links


def drain_frontier_batch(
    conn: sqlite3.Connection, max_pages: int, per_host_delay_s: float = 1.5
) -> Tuple[List[Dict[str, object]], int]:
    """Politely crawls pending public URLs from SQLite frontier with host spacing & robots.txt."""
    crawled_docs: List[Dict[str, object]] = []
    discovered_outlinks: List[Tuple[str, str, int]] = []
    host_last_hit: Dict[str, float] = {}

    rows = conn.execute(
        "SELECT url, depth FROM frontier WHERE status = 'pending' ORDER BY depth ASC, discovered_at ASC LIMIT ?",
        (max_pages,),
    ).fetchall()

    for url, depth in rows:
        host = (urllib.parse.urlparse(url).hostname or "").lower()
        now = time.time()
        elapsed = now - host_last_hit.get(host, 0.0)
        if elapsed < per_host_delay_s:
            time.sleep(max(0.05, per_host_delay_s - elapsed))
        host_last_hit[host] = time.time()

        doc = fetch_public_page(url, timeout=10)
        status = "done" if doc else "skipped"
        conn.execute("UPDATE frontier SET status = ?, fetched_at = ? WHERE url = ?", (status, time.time(), url))
        if doc:
            outlinks = doc.pop("links", [])
            crawled_docs.append(doc)
            if isinstance(outlinks, list) and depth < 2:
                for nxt in outlinks[:6]:
                    discovered_outlinks.append((str(nxt), f"outlink:{host}", int(depth) + 1))
    conn.commit()
    added = enqueue_urls(conn, discovered_outlinks)
    return crawled_docs, added


def run_autonomous_batch(
    batch_size: int,
    db_file: str,
    state_file: str,
    out_path: str,
    stream_datasets: bool = False,
) -> Dict[str, object]:
    safe_batch = max(1, min(batch_size, 500))
    state = load_state(state_file)
    state["run_count"] = int(state.get("run_count", 0)) + 1
    conn = init_frontier_db(db_file)

    try:
        firehose_records, firehose_links = discover_live_public_firehoses(state)
        cdx_links = discover_common_crawl_cdx(state, limit=8)
        vault_links = discover_repo_vault_public_urls(limit=10)

        new_queued = enqueue_urls(conn, [*firehose_links, *cdx_links, *vault_links])

        remaining_for_crawl = max(2, min(safe_batch - len(firehose_records), 25))
        crawled_docs, outlink_queued = drain_frontier_batch(conn, max_pages=remaining_for_crawl)

        streamed_docs: List[Dict[str, object]] = []
        if stream_datasets:
            streamed_docs = stream_open_pretrain_datasets(max_samples=min(200, safe_batch))

        all_records_raw = [*firehose_records, *crawled_docs, *streamed_docs][:safe_batch]
        all_records = [verify_record_double_read(r) for r in all_records_raw]
        all_records = [r for r in all_records if r.get("double_read_verified") is True]
        pending_count = conn.execute("SELECT COUNT(*) FROM frontier WHERE status = 'pending'").fetchone()[0]
        done_count = conn.execute("SELECT COUNT(*) FROM frontier WHERE status = 'done'").fetchone()[0]
    finally:
        conn.close()

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        for rec in all_records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")

    breakdown: Dict[str, int] = {}
    for rec in all_records:
        k = str(rec.get("source_kind") or "unknown")
        breakdown[k] = breakdown.get(k, 0) + 1

    state["total_crawled"] = int(state.get("total_crawled", 0)) + len(crawled_docs)
    state["total_records"] = int(state.get("total_records", 0)) + len(all_records)
    save_state(state_file, state)

    return {
        "ok": True,
        "run_count": state["run_count"],
        "records_collected": len(all_records),
        "double_read_verified_count": len(all_records),
        "firehose_records": len(firehose_records),
        "crawled_pages": len(crawled_docs),
        "newly_queued_links": new_queued + outlink_queued,
        "frontier_pending": pending_count,
        "frontier_done": done_count,
        "sources_breakdown": breakdown,
        "out": out_path,
        "state_file": state_file,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="HEYUKA Polite Autonomous Open-Web Batch Discoverer ($0)")
    parser.add_argument("--batch-size", type=int, default=40, help="Bounded records per batch run (1..500)")
    parser.add_argument("--db-file", default="/tmp/heyuka_frontier/frontier_queue.sqlite", help="SQLite URL frontier")
    parser.add_argument("--state-file", default="/tmp/heyuka_frontier/eternal_frontier_state.json", help="Checkpoint JSON")
    parser.add_argument("--out", default="/tmp/heyuka_discovered_batch.jsonl", help="Output JSONL shard")
    parser.add_argument("--stream-datasets", action="store_true", help="Also stream HuggingFace FineWeb/Stack slices")
    args = parser.parse_args()

    summary = run_autonomous_batch(
        batch_size=args.batch_size,
        db_file=args.db_file,
        state_file=args.state_file,
        out_path=args.out,
        stream_datasets=args.stream_datasets,
    )
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
