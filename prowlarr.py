import httpx
from config import settings

EBOOK_CATEGORY = 7020

# IDs de catégories non-livre à exclure côté serveur (films, audio, TV, etc.)
NON_BOOK_CATS = set(range(1000, 7000)) | {8000, 8010, 8020}


def _is_ebook(item: dict) -> bool:
    """Vérifie côté client que le résultat est bien un ebook."""
    cats = [c.get("id", 0) for c in item.get("categories", [])]
    if not cats:
        return True  # pas de catégorie renseignée → on garde
    return not any(c in NON_BOOK_CATS for c in cats)


async def search_books(query: str) -> list[dict]:
    # Liste de tuples : encodage httpx garanti, brackets compris
    params = [
        ("query", query),
        ("type", "search"),
        ("categories[]", EBOOK_CATEGORY),
    ]

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{settings.prowlarr_url}/api/v1/search",
            params=params,
            headers={"X-Api-Key": settings.prowlarr_api_key},
        )
        resp.raise_for_status()
        raw = resp.json()

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
