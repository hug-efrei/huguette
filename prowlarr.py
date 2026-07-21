import logging
from collections import OrderedDict

import httpx

from config import settings

logger = logging.getLogger("huguette.prowlarr")

EBOOK_CATEGORY = 7020

NON_BOOK_CATS = set(range(1000, 7000)) | {8000, 8010, 8020}

_client: httpx.AsyncClient | None = None

# guid -> lien de téléchargement (magnet ou URL de proxy Prowlarr), peuplé à
# chaque recherche. Le client ne manipule jamais ce lien directement : il ne
# transmet que le guid, ce qui évite de lui laisser choisir la cible que
# qBittorrent ira récupérer (SSRF).
_MAX_CACHED_LINKS = 500
_download_links: "OrderedDict[str, str]" = OrderedDict()


def _cache_download_link(guid: str, link: str) -> None:
    if not guid:
        return
    _download_links[guid] = link
    _download_links.move_to_end(guid)
    while len(_download_links) > _MAX_CACHED_LINKS:
        _download_links.popitem(last=False)


def get_download_link(guid: str) -> str | None:
    return _download_links.get(guid)


def startup() -> None:
    global _client
    _client = httpx.AsyncClient(timeout=30.0)


async def shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("Client Prowlarr non initialisé (lifespan manquant)")
    return _client


def _is_ebook(item: dict) -> bool:
    cats = [c.get("id", 0) for c in item.get("categories", [])]
    if not cats:
        return True
    return not any(c in NON_BOOK_CATS for c in cats)


async def search_books(query: str) -> list[dict]:
    params = [
        ("query", query),
        ("type", "search"),
        ("categories[]", EBOOK_CATEGORY),
    ]

    try:
        resp = await _get_client().get(
            f"{settings.prowlarr_url}/api/v1/search",
            params=params,
            headers={"X-Api-Key": settings.prowlarr_api_key},
        )
        resp.raise_for_status()
        raw = resp.json()
    except httpx.HTTPError as exc:
        logger.warning("Prowlarr search error: %s", exc)
        raise

    results = []
    for item in raw:
        if not _is_ebook(item):
            continue
        link = item.get("magnetUrl") or item.get("downloadUrl") or ""
        if not link:
            continue
        guid = item.get("guid", "")
        _cache_download_link(guid, link)
        pub = item.get("publishDate") or ""
        pub_year = int(pub[:4]) if pub and pub[:4].isdigit() else None
        results.append({
            "guid":       guid,
            "title":      item.get("title", "Titre inconnu"),
            "size":       item.get("size", 0),
            "seeders":    item.get("seeders", 0),
            "leechers":   item.get("leechers", 0),
            "indexer":    item.get("indexer", ""),
            "categories": [c.get("name", "") for c in item.get("categories", [])],
            "pub_year":   pub_year,
        })

    results.sort(key=lambda r: r["seeders"], reverse=True)
    return results


async def ping() -> bool:
    try:
        resp = await _get_client().get(
            f"{settings.prowlarr_url}/api/v1/system/status",
            headers={"X-Api-Key": settings.prowlarr_api_key},
            timeout=2.0,
        )
        return resp.status_code == 200
    except Exception:
        return False
