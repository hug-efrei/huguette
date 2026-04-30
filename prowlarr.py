import logging

import httpx

from config import settings

logger = logging.getLogger("huguette.prowlarr")

EBOOK_CATEGORY = 7020

NON_BOOK_CATS = set(range(1000, 7000)) | {8000, 8010, 8020}


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
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
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
        magnet = item.get("magnetUrl") or item.get("downloadUrl") or ""
        if not magnet:
            continue
        pub = item.get("publishDate") or ""
        pub_year = int(pub[:4]) if pub and pub[:4].isdigit() else None
        results.append({
            "guid":       item.get("guid", ""),
            "title":      item.get("title", "Titre inconnu"),
            "size":       item.get("size", 0),
            "seeders":    item.get("seeders", 0),
            "leechers":   item.get("leechers", 0),
            "indexer":    item.get("indexer", ""),
            "magnet":     magnet,
            "categories": [c.get("name", "") for c in item.get("categories", [])],
            "pub_year":   pub_year,
        })

    results.sort(key=lambda r: r["seeders"], reverse=True)
    return results


async def ping() -> bool:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"{settings.prowlarr_url}/api/v1/system/status",
                headers={"X-Api-Key": settings.prowlarr_api_key},
            )
            return resp.status_code == 200
    except Exception:
        return False
