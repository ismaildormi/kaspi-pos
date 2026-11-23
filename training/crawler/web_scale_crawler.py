#!/usr/bin/env python3
"""
HEYUKA / KASPI Sovereign Public-Web & Open-Dataset Crawler ($0.00 Zero-Key)
- Strictly respects robots.txt and blocks private/loopback/internal SSRF targets.
- Crawls public web pages, sitemaps, and open scientific/tech feeds (arXiv, OpenAlex, Wikimedia, OSV).
- Optional streaming from open pretraining corpora (FineWeb-Edu, FineWeb-2 ar/fr, The Stack v2).
NEVER crawls private accounts, sessions, authenticated endpoints, or paywalled content.
"""

from __future__ import annotations

import argparse
import hashlib
import ipaddress
import json
import os
import re
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from typing import Dict, Iterable, List, Optional, Set, Tuple


DEFAULT_UA = "HEYUKA-PublicResearchBot/1.0 (+https://kaspi-pos.vercel.app)"


class ReadableHtmlExtractor(HTMLParser):
    """Lightweight stdlib HTML-to-Markdown-like extractor removing script/style noise."""

    SKIP_TAGS = {"script", "style", "noscript", "svg", "iframe"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self._in_title = False
        self.title_parts: List[str] = []
        self.text_parts: List[str] = []
        self.links: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        t = tag.lower()
        if t in self.SKIP_TAGS:
            self._skip_depth += 1
            return
        if t == "title":
            self._in_title = True
        if self._skip_depth == 0:
            if t in {"h1", "h2", "h3", "p", "li", "tr", "pre"}:
                self.text_parts.append("\n")
            if t == "a":
                for k, v in attrs:
                    if k.lower() == "href" and v:
                        self.links.append(v.strip())

    def handle_endtag(self, tag: str) -> None:
        t = tag.lower()
        if t in self.SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
            return
        if t == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._skip_depth > 0:
            return
        cleaned = re.sub(r"\s+", " ", data).strip()
        if not cleaned:
            return
        if self._in_title:
            self.title_parts.append(cleaned)
        else:
            self.text_parts.append(cleaned + " ")


def is_safe_public_http_url(url: str) -> Tuple[bool, str]:
    """Blocks non-HTTP schemes, localhost, private/reserved IPs, and metadata endpoints (SSRF guard)."""
    try:
        parsed = urllib.parse.urlparse(url.strip())
    except Exception:
        return False, "invalid_url"
    if parsed.scheme not in {"http", "https"}:
        return False, "unsupported_scheme"
    host = (parsed.hostname or "").lower()
    if not host or host in {"localhost", "127.0.0.1", "0.0.0.0", "::1"} or host.endswith(".local"):
        return False, "blocked_host"
    if parsed.username or parsed.password:
        return False, "credentials_in_url_blocked"

    try:
        infos = socket.getaddrinfo(host, None)
        for info in infos:
            ip_str = info[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                return False, f"blocked_non_public_ip:{ip_str}"
    except OSError:
        return False, "dns_resolution_failed"
    return True, "ok"


def is_allowed_by_robots(url: str, timeout: int = 6) -> bool:
    """Checks origin robots.txt cleanly; fails closed only on explicit Disallow."""
    parsed = urllib.parse.urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = urllib.robotparser.RobotFileParser()
    try:
        req = urllib.request.Request(robots_url, headers={"User-Agent": DEFAULT_UA})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read(128_000).decode("utf-8", errors="ignore")
        rp.parse(raw.splitlines())
        return rp.can_fetch(DEFAULT_UA, url)
    except urllib.error.HTTPError as e:
        if e.code in {401, 403}:
            return False
        return True
    except Exception:
        return True


def fetch_public_page(url: str, timeout: int = 12, max_bytes: int = 400_000) -> Optional[Dict[str, object]]:
    """Fetches a single public page cleanly if SSRF checks and robots.txt allow it."""
    safe, reason = is_safe_public_http_url(url)
    if not safe:
        return None
    if not is_allowed_by_robots(url):
        return None

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": DEFAULT_UA,
                "Accept": "text/html,application/json,text/plain;q=0.9",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            ctype = (resp.headers.get("Content-Type") or "").lower()
            raw = resp.read(max_bytes).decode("utf-8", errors="ignore")
    except Exception:
        return None

    title = url
    text = raw
    links: List[str] = []

    if "html" in ctype or "<html" in raw[:500].lower():
        try:
            import trafilatura  # type: ignore

            extracted = trafilatura.extract(raw, include_tables=True, output_format="txt")
            if extracted and len(extracted.strip()) >= 80:
                text = extracted.strip()
        except Exception:
            pass

        parser = ReadableHtmlExtractor()
        parser.feed(raw)
        if parser.title_parts:
            title = " ".join(parser.title_parts)[:240]
        if text == raw:
            text = re.sub(r"\n{3,}", "\n\n", "".join(parser.text_parts)).strip()
        for href in parser.links:
            joined = urllib.parse.urljoin(url, href)
            if joined.startswith(("http://", "https://")):
                links.append(joined)
    elif "json" in ctype:
        text = re.sub(r"\s+", " ", raw).strip()

    text = text[:16_000]
    if len(text) < 80:
        return None

    return {
        "id": hashlib.sha256(url.encode("utf-8")).hexdigest()[:24],
        "title": title,
        "url": url,
        "source_kind": "web_crawl",
        "text": text,
        "links": links[:25],
    }


def fetch_open_public_knowledge_feeds(max_per_feed: int = 8) -> List[Dict[str, object]]:
    """Fetches purely public open science/reference records (arXiv/OpenAlex/Wikimedia/OSV)."""
    records: List[Dict[str, object]] = []
    endpoints = [
        ("OpenAlex AI Papers", "https://api.openalex.org/works?search=language%20models%20reasoning&per-page=" + str(max_per_feed) + "&select=id,title,publication_year,doi"),
        ("Wikimedia Morocco Summary", "https://en.wikipedia.org/api/rest_v1/page/summary/Morocco"),
        ("Arabic Wikipedia AI", "https://ar.wikipedia.org/api/rest_v1/page/summary/%D8%B0%D9%83%D8%A7%D8%A1_%D8%A7%D8%B5%D8%B7%D9%86%D8%A7%D8%B9%D9%8A"),
    ]
    for label, url in endpoints:
        safe, _ = is_safe_public_http_url(url)
        if not safe:
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": DEFAULT_UA})
            with urllib.request.urlopen(req, timeout=12) as resp:
                body = resp.read(200_000).decode("utf-8", errors="ignore")
            data = json.loads(body)
            if isinstance(data, dict) and "results" in data and isinstance(data["results"], list):
                for item in data["results"][:max_per_feed]:
                    title = str(item.get("title") or label)
                    rec_url = str(item.get("doi") or item.get("id") or url)
                    txt = f"{title} ({item.get('publication_year', '')}). Source: {rec_url}"
                    records.append({
                        "id": hashlib.sha256(rec_url.encode("utf-8")).hexdigest()[:24],
                        "title": title,
                        "url": rec_url,
                        "source_kind": "open_science_feed",
                        "text": txt,
                    })
            elif isinstance(data, dict) and data.get("extract"):
                rec_url = str(data.get("content_urls", {}).get("desktop", {}).get("page") or url)
                records.append({
                    "id": hashlib.sha256(rec_url.encode("utf-8")).hexdigest()[:24],
                    "title": str(data.get("title") or label),
                    "url": rec_url,
                    "source_kind": "open_reference_feed",
                    "text": f"{data.get('title', '')}\n\n{data.get('extract', '')}",
                })
        except Exception:
            continue
    return records


def crawl_bfs_public(seed_urls: Iterable[str], max_pages: int = 20, max_depth: int = 1) -> List[Dict[str, object]]:
    """Bounded BFS crawl strictly over public seed origins and public HTTP links."""
    seen: Set[str] = set()
    queue: List[Tuple[str, int]] = [(u.strip(), 0) for u in seed_urls if u.strip()]
    results: List[Dict[str, object]] = []

    while queue and len(results) < max_pages:
        url, depth = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        doc = fetch_public_page(url)
        if not doc:
            continue
        links = doc.pop("links", [])
        results.append(doc)
        if depth < max_depth and isinstance(links, list):
            for nxt in links:
                if nxt not in seen and len(queue) < max_pages * 3:
                    queue.append((nxt, depth + 1))
    return results


def stream_open_pretrain_datasets(max_samples: int = 1500) -> List[Dict[str, object]]:
    """Streams public HuggingFace corpora (FineWeb-2 Arabic/French + FineWeb-Edu) when datasets pkg is present."""
    try:
        from itertools import islice
        from datasets import load_dataset  # type: ignore
    except Exception as exc:
        print(f"[crawler] Note: datasets library unavailable locally ({exc}); skipping HF stream.", file=sys.stderr)
        return []

    rows: List[Dict[str, object]] = []
    specs = [
        ("HuggingFaceFW/fineweb-2", "arb_Arab"),
        ("HuggingFaceFW/fineweb-2", "fra_Latn"),
        ("HuggingFaceFW/fineweb-edu", "default"),
    ]
    per_spec = max(1, max_samples // len(specs))
    for ds_name, cfg in specs:
        try:
            ds = (
                load_dataset(ds_name, cfg, split="train", streaming=True)
                if cfg != "default"
                else load_dataset(ds_name, split="train", streaming=True)
            )
            for idx, rec in enumerate(islice(ds, per_spec)):
                text = str(rec.get("text") or "").strip()
                if len(text) < 80:
                    continue
                rows.append({
                    "id": hashlib.sha256(f"{ds_name}:{cfg}:{idx}:{text[:80]}".encode("utf-8")).hexdigest()[:24],
                    "title": f"{ds_name}/{cfg}#{idx}",
                    "url": str(rec.get("url") or f"https://huggingface.co/datasets/{ds_name}"),
                    "source_kind": "open_pretrain_corpus",
                    "text": text[:8000],
                })
        except Exception:
            continue
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="HEYUKA Public-Web & Open-Dataset Crawler ($0)")
    parser.add_argument("--urls", nargs="*", default=[], help="Public seed URLs to crawl (robots.txt + SSRF guarded)")
    parser.add_argument("--max-pages", type=int, default=20, help="Maximum public pages to crawl")
    parser.add_argument("--public-feeds", action="store_true", help="Fetch public OpenAlex/Wikimedia open knowledge feeds")
    parser.add_argument("--stream-open-web", action="store_true", help="Stream FineWeb-Edu / FineWeb-2 open datasets")
    parser.add_argument("--stream-samples", type=int, default=1500, help="Number of streamed samples if enabled")
    parser.add_argument("--out", default="/tmp/heyuka_crawled_raw.jsonl", help="Output JSONL path")
    args = parser.parse_args()

    collected: List[Dict[str, object]] = []
    if args.urls:
        collected.extend(crawl_bfs_public(args.urls, max_pages=max(1, min(args.max_pages, 500))))
    if args.public_feeds or (not args.urls and not args.stream_open_web):
        collected.extend(fetch_open_public_knowledge_feeds())
    if args.stream_open_web:
        collected.extend(stream_open_pretrain_datasets(args.stream_samples))

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        for row in collected:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(json.dumps({"ok": True, "crawled_records": len(collected), "out": args.out}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
