#!/usr/bin/env python3
"""
HEYUKA v97.0 — 5 Hidden Planetary Distributed Crawling Secrets (Zero Paid Keys, Pure Stdlib + Optional Zstd)
1. ScalableBloomFilter + HyperLogLogCounter + URL Canonicalizer + SimHash64 near-duplicate guard
2. HTTP ETag / Last-Modified + Delta-Only changed-paragraph extractor
3. Sitemap.xml & robots.txt Sitemap-index turbo URL extractor
4. ConsistentHashRing (120-shard domain partitioning) & Graceful SelfRelayWatchdog
5. Adaptive Dwell Time & Vision/Image-Alt layout density estimator
"""

from __future__ import annotations

import base64
import gzip
import hashlib
import math
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, Iterable, List, Optional, Set, Tuple


TRACKING_QUERY_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
    "ref",
}


def canonicalize_url(raw_url: str) -> str:
    """Normalizes URLs (scheme/host lowercase, strips fragments & tracking query params)."""
    raw = (raw_url or "").strip()
    if not raw:
        return ""
    try:
        parsed = urllib.parse.urlparse(raw)
        if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
            return ""
        scheme = parsed.scheme.lower()
        host = parsed.hostname.lower()
        port_part = f":{parsed.port}" if parsed.port and parsed.port not in {80, 443} else ""
        path = parsed.path or "/"
        if len(path) > 1 and path.endswith("/"):
            path = path[:-1]
        q_pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=False)
        clean_q = sorted((k, v) for k, v in q_pairs if k.lower() not in TRACKING_QUERY_PARAMS)
        query = urllib.parse.urlencode(clean_q)
        return urllib.parse.urlunparse((scheme, f"{host}{port_part}", path, "", query, ""))
    except Exception:
        return ""


def compute_simhash64(text: str) -> int:
    """Computes a 64-bit locality-sensitive SimHash fingerprint over word 3-shingles."""
    tokens = re.findall(r"[A-Za-z0-9\u0600-\u06FF]+", (text or "").lower())
    if not tokens:
        return 0
    shingles = [
        " ".join(tokens[i : i + 3])
        for i in range(max(1, len(tokens) - 2))
    ]
    vec = [0] * 64
    for sh in shingles:
        digest = hashlib.blake2b(sh.encode("utf-8"), digest_size=8).digest()
        val = int.from_bytes(digest, "big")
        for bit in range(64):
            vec[bit] += 1 if (val >> bit) & 1 else -1
    out = 0
    for bit in range(64):
        if vec[bit] > 0:
            out |= 1 << bit
    return out


def hamming_distance64(a: int, b: int) -> int:
    return (int(a) ^ int(b)).bit_count()


class ScalableBloomFilter:
    """Compact bitarray Bloom Filter supporting gzip snapshot serialization & bitwise OR union merges."""

    def __init__(self, num_bits: int = 1 << 20, num_hashes: int = 7) -> None:
        # Default 1M bits (~128 KB uncompressed, <15 KB gzipped when sparse; scales via higher num_bits cleanly)
        self.num_bits = max(1024, int(num_bits))
        self.num_hashes = max(2, min(12, int(num_hashes)))
        self.bits = bytearray((self.num_bits + 7) // 8)
        self.inserted_count = 0

    def _positions(self, key: str) -> Iterable[int]:
        raw = key.encode("utf-8", errors="ignore")
        h1 = int.from_bytes(hashlib.blake2b(raw, digest_size=8, person=b"heyuka1").digest(), "big")
        h2 = int.from_bytes(hashlib.blake2b(raw, digest_size=8, person=b"heyuka2").digest(), "big") | 1
        for i in range(self.num_hashes):
            yield (h1 + i * h2) % self.num_bits

    def add(self, key: str) -> bool:
        """Adds canonicalized key; returns True if probably already present, False if newly inserted."""
        existed = True
        for pos in self._positions(key):
            byte_idx = pos >> 3
            mask = 1 << (pos & 7)
            if not (self.bits[byte_idx] & mask):
                existed = False
                self.bits[byte_idx] |= mask
        if not existed:
            self.inserted_count += 1
        return existed

    def __contains__(self, key: str) -> bool:
        for pos in self._positions(key):
            if not (self.bits[pos >> 3] & (1 << (pos & 7))):
                return False
        return True

    def merge_from(self, other: "ScalableBloomFilter") -> None:
        if other.num_bits != self.num_bits:
            raise ValueError("BloomFilter bit sizes must match for bitwise OR union")
        for idx in range(len(self.bits)):
            self.bits[idx] |= other.bits[idx]
        self.inserted_count += other.inserted_count

    def to_gzip_bytes(self) -> bytes:
        header = f"{self.num_bits}:{self.num_hashes}:{self.inserted_count}|".encode("ascii")
        return gzip.compress(header + bytes(self.bits), compresslevel=9)

    @classmethod
    def from_gzip_bytes(cls, blob: bytes) -> "ScalableBloomFilter":
        raw = gzip.decompress(blob)
        sep = raw.index(b"|")
        meta = raw[:sep].decode("ascii").split(":")
        inst = cls(num_bits=int(meta[0]), num_hashes=int(meta[1]))
        inst.inserted_count = int(meta[2])
        payload = raw[sep + 1 :]
        if len(payload) == len(inst.bits):
            inst.bits[:] = payload
        return inst


class HyperLogLogCounter:
    """HyperLogLog cardinality estimator (p=12 -> 4,096 registers = ~4 KB RAM, ~1.6% error)."""

    def __init__(self, precision: int = 12) -> None:
        self.p = max(6, min(16, int(precision)))
        self.m = 1 << self.p
        self.registers = bytearray(self.m)

    def add(self, key: str) -> None:
        digest = hashlib.blake2b(key.encode("utf-8", errors="ignore"), digest_size=8).digest()
        x = int.from_bytes(digest, "big")
        idx = x >> (64 - self.p)
        w = (x << self.p) & ((1 << 64) - 1)
        lz = (64 - self.p) + 1 if w == 0 else (64 - w.bit_length()) + 1
        rho = min(63, lz)
        if rho > self.registers[idx]:
            self.registers[idx] = rho

    def merge_from(self, other: "HyperLogLogCounter") -> None:
        if other.p != self.p:
            raise ValueError("Precision mismatch for HyperLogLog union")
        for i in range(self.m):
            if other.registers[i] > self.registers[i]:
                self.registers[i] = other.registers[i]

    def estimate(self) -> int:
        alpha = 0.7213 / (1.0 + 1.079 / self.m)
        z_inv = sum(2.0 ** (-r) for r in self.registers)
        raw_est = alpha * (self.m * self.m) / z_inv
        if raw_est <= 2.5 * self.m:
            zeros = self.registers.count(0)
            if zeros > 0:
                return int(round(self.m * math.log(self.m / zeros)))
        return int(round(raw_est))

    def to_b64(self) -> str:
        return base64.b64encode(bytes([self.p]) + gzip.compress(bytes(self.registers), compresslevel=6)).decode("ascii")

    @classmethod
    def from_b64(cls, s: str) -> "HyperLogLogCounter":
        raw = base64.b64decode(s.encode("ascii"))
        inst = cls(precision=raw[0])
        regs = gzip.decompress(raw[1:])
        if len(regs) == inst.m:
            inst.registers[:] = regs
        return inst


class ConsistentHashRing:
    """Consistent Hashing domain ring distributing hosts across Shards 0..N-1 without collision."""

    def __init__(self, total_shards: int = 120, vnodes_per_shard: int = 8) -> None:
        self.total_shards = max(1, int(total_shards))
        self.ring: List[Tuple[int, int]] = []
        for shard_id in range(self.total_shards):
            for v in range(vnodes_per_shard):
                h = int.from_bytes(
                    hashlib.blake2b(f"shard:{shard_id}:vnode:{v}".encode(), digest_size=8).digest(),
                    "big",
                )
                self.ring.append((h, shard_id))
        self.ring.sort(key=lambda pair: pair[0])

    def owner_shard_for_host(self, host_or_url: str) -> int:
        parsed = urllib.parse.urlparse(host_or_url if "://" in host_or_url else f"https://{host_or_url}")
        host = (parsed.hostname or host_or_url or "").lower()
        target = int.from_bytes(hashlib.blake2b(host.encode(), digest_size=8).digest(), "big")
        lo, hi = 0, len(self.ring) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if self.ring[mid][0] >= target:
                hi = mid - 1
            else:
                lo = mid + 1
        idx = lo if lo < len(self.ring) else 0
        return self.ring[idx][1]


def extract_delta_paragraphs(previous_hashes: Iterable[str], new_text: str) -> Tuple[str, List[str]]:
    """Secret #2 Delta-Only Extractor: keeps only changed/new paragraphs when content updates."""
    prev_set = set(previous_hashes)
    paragraphs = [re.sub(r"\s+", " ", p).strip() for p in re.split(r"\n+", new_text or "") if len(p.strip()) >= 25]
    new_hashes: List[str] = []
    delta_parts: List[str] = []
    for p in paragraphs:
        h = hashlib.sha256(p.encode("utf-8", errors="ignore")).hexdigest()[:16]
        new_hashes.append(h)
        if h not in prev_set:
            delta_parts.append(p)
    return "\n\n".join(delta_parts), new_hashes


def parse_sitemap_xml_urls(xml_bytes: bytes, max_urls: int = 150) -> Tuple[List[str], List[str]]:
    """Secret #3 Sitemap Parser: splits nested <sitemap> indices and <url><loc> entries (supports .xml.gz)."""
    raw = xml_bytes
    if raw[:2] == b"\x1f\x8b":
        try:
            raw = gzip.decompress(raw)
        except Exception:
            return [], []
    try:
        root = ET.fromstring(raw.decode("utf-8", errors="ignore"))
    except Exception:
        return [], []

    child_sitemaps: List[str] = []
    page_urls: List[str] = []
    for elem in root.iter():
        tag = elem.tag.split("}")[-1].lower()
        if tag == "loc" and elem.text:
            u = canonicalize_url(elem.text.strip())
            if not u:
                continue
            parent_hint = "sitemap" if u.endswith((".xml", ".xml.gz")) or "sitemap" in u.lower() else "url"
            if parent_hint == "sitemap":
                child_sitemaps.append(u)
            else:
                page_urls.append(u)
                if len(page_urls) >= max_urls:
                    break
    return page_urls, child_sitemaps[:12]


def discover_sitemaps_from_robots_txt(robots_txt: str, base_origin: str) -> List[str]:
    found: List[str] = []
    for line in (robots_txt or "").splitlines():
        clean = line.strip()
        if clean.lower().startswith("sitemap:"):
            candidate = clean.split(":", 1)[1].strip()
            abs_u = canonicalize_url(urllib.parse.urljoin(base_origin, candidate))
            if abs_u:
                found.append(abs_u)
    if not found:
        fallback = canonicalize_url(urllib.parse.urljoin(base_origin, "/sitemap.xml"))
        if fallback:
            found.append(fallback)
    return found[:8]


def adaptive_dwell_and_depth(text_len: int, code_blocks: int = 0, tables: int = 0) -> Dict[str, object]:
    """Secret #5 + v96.0: Allocates deeper crawl & dwell allowance for dense code/table scientific docs."""
    density_score = min(100, int(text_len / 120) + code_blocks * 12 + tables * 10)
    dwell_sec = round(min(2.5, max(0.25, 0.25 + density_score * 0.02)), 2)
    recommended_depth = 3 if density_score >= 35 else 2
    return {
        "density_score": density_score,
        "adaptive_dwell_s": dwell_sec,
        "recommended_depth": recommended_depth,
    }


class SelfRelayWatchdog:
    """Tracks cloud runner budget to trigger graceful checkpoint & shard relay before timeout."""

    def __init__(self, max_runtime_s: float = 1500.0) -> None:
        self.started_at = time.monotonic()
        self.max_runtime_s = max(5.0, float(max_runtime_s))

    def elapsed_s(self) -> float:
        return time.monotonic() - self.started_at

    def should_handover_baton(self) -> bool:
        return self.elapsed_s() >= self.max_runtime_s
