#!/usr/bin/env python3
"""
HEYUKA v100.0 — 15 Priority Golden Open Knowledge & Dataset Sources ($0 Free)
Orders shard-partitioned high-density educational, scientific, code, encyclopedia,
and Moroccan/Arabic/Darija open corpora ahead of generic web links.
"""

from __future__ import annotations

from typing import Dict, List

GOLDEN_PRIORITY_SOURCES: List[Dict[str, object]] = [
    {
        "id": "golden_01_fineweb_edu",
        "name": "HuggingFace FineWeb-Edu",
        "category": "science_code_web",
        "priority": 100,
        "url": "https://datasets-server.huggingface.co/rows?dataset=HuggingFaceFW%2Ffineweb-edu&config=sample-10BT&split=train&offset=0&length=4",
        "homeUrl": "https://huggingface.co/datasets/HuggingFaceFW/fineweb-edu",
    },
    {
        "id": "golden_02_the_stack_v2",
        "name": "BigCode The Stack v2 (600+ Languages)",
        "category": "science_code_web",
        "priority": 98,
        "url": "https://huggingface.co/datasets/bigcode/the-stack-v2",
        "homeUrl": "https://huggingface.co/datasets/bigcode/the-stack-v2",
    },
    {
        "id": "golden_03_wikipedia_wikidata",
        "name": "Wikipedia & Wikidata (AR / FR / EN)",
        "category": "encyclopedia_books",
        "priority": 99,
        "url": "https://ar.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=4&prop=extracts|info&exintro=1&explaintext=1&inprop=url&format=json",
        "homeUrl": "https://www.wikipedia.org/",
    },
    {
        "id": "golden_04_arxiv_papers",
        "name": "arXiv Open Science Papers",
        "category": "science_code_web",
        "priority": 97,
        "url": "https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.SE+OR+cat:math.OC&start=0&max_results=5",
        "homeUrl": "https://arxiv.org/",
    },
    {
        "id": "golden_05_openalex",
        "name": "OpenAlex Global Works (250M+ Papers)",
        "category": "science_code_web",
        "priority": 97,
        "url": "https://api.openalex.org/works?search=software%20engineering%20OR%20machine%20learning&per-page=5&select=id,title,publication_year,doi,open_access",
        "homeUrl": "https://openalex.org/",
    },
    {
        "id": "golden_06_pubmed_central",
        "name": "PubMed Central & Europe PMC",
        "category": "medicine_bio",
        "priority": 96,
        "url": "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=clinical+evidence&format=json&pageSize=4",
        "homeUrl": "https://europepmc.org/",
    },
    {
        "id": "golden_07_mathlib4_oeis",
        "name": "Lean Mathlib4 & OEIS Formal Proofs",
        "category": "science_code_web",
        "priority": 95,
        "url": "https://leanprover-community.github.io/mathlib4_docs/",
        "homeUrl": "https://github.com/leanprover-community/mathlib4",
    },
    {
        "id": "golden_08_gutenberg_openlibrary",
        "name": "Project Gutenberg & Open Library",
        "category": "encyclopedia_books",
        "priority": 94,
        "url": "https://openlibrary.org/search.json?q=computer+science&limit=4&fields=key,title,author_name,first_publish_year",
        "homeUrl": "https://openlibrary.org/",
    },
    {
        "id": "golden_09_common_crawl",
        "name": "Common Crawl (110B+ Open Web Index)",
        "category": "web_archive",
        "priority": 99,
        "url": "https://index.commoncrawl.org/collinfo.json",
        "homeUrl": "https://commoncrawl.org/",
    },
    {
        "id": "golden_10_internet_archive",
        "name": "Internet Archive Open Library Collections",
        "category": "web_archive",
        "priority": 93,
        "url": "https://archive.org/advancedsearch.php?q=mediatype%3Atexts+AND+collection%3Aopensource&fl%5B%5D=identifier,title,subject&rows=5&page=1&output=json",
        "homeUrl": "https://archive.org/",
    },
    {
        "id": "golden_11_atlasia_darija",
        "name": "AtlasIA Moroccan Darija Open Corpus",
        "category": "arabic_darija_commerce",
        "priority": 98,
        "url": "https://huggingface.co/datasets/atlasia/AL-Atlas-Moroccan-Darija-Pretraining-Dataset",
        "homeUrl": "https://huggingface.co/atlasia",
    },
    {
        "id": "golden_12_camel_lab",
        "name": "CAMeL Lab Arabic NLP & Corpora",
        "category": "arabic_darija_commerce",
        "priority": 95,
        "url": "https://github.com/CAMeL-Lab/camel_tools",
        "homeUrl": "https://github.com/CAMeL-Lab",
    },
    {
        "id": "golden_13_openstreetmap",
        "name": "OpenStreetMap / Nominatim Geo Index",
        "category": "arabic_darija_commerce",
        "priority": 92,
        "url": "https://nominatim.openstreetmap.org/search?q=Morocco&format=json&limit=4",
        "homeUrl": "https://www.openstreetmap.org/",
    },
    {
        "id": "golden_14_openfoodfacts",
        "name": "OpenFoodFacts Retail & Barcode DB",
        "category": "arabic_darija_commerce",
        "priority": 94,
        "url": "https://world.openfoodfacts.org/api/v2/search?categories_tags=beverages&page_size=4&fields=code,product_name,brands",
        "homeUrl": "https://world.openfoodfacts.org/",
    },
    {
        "id": "golden_15_world_bank",
        "name": "World Bank Macro & Economic Indicators",
        "category": "arabic_darija_commerce",
        "priority": 93,
        "url": "https://api.worldbank.org/v2/country/MA/indicator/NY.GDP.MKTP.CD?format=json&per_page=5",
        "homeUrl": "https://data.worldbank.org/",
    },
]


def get_golden_sources_for_shard(shard_id: int = 0, total_shards: int = 1) -> List[Dict[str, object]]:
    """Returns rotated golden sources prioritized for the active shard without dropping global seeds."""
    total = max(1, int(total_shards))
    sid = int(shard_id) % total
    ordered = sorted(GOLDEN_PRIORITY_SOURCES, key=lambda s: int(s.get("priority", 0)), reverse=True)
    # Rotate starting point cleanly per shard so 20+ nodes diversify immediately across the 15 golden hubs
    offset = sid % len(ordered)
    return ordered[offset:] + ordered[:offset]
