import pytest
import respx
from httpx import Response

import prowlarr
from config import settings


@pytest.fixture(autouse=True)
async def _client_lifecycle():
    prowlarr.startup()
    yield
    await prowlarr.shutdown()


@respx.mock
async def test_search_books_filters_non_ebook_categories():
    respx.get(f"{settings.prowlarr_url}/api/v1/search").mock(
        return_value=Response(
            200,
            json=[
                {
                    "guid": "1",
                    "title": "Un Livre EPUB",
                    "size": 1000,
                    "seeders": 5,
                    "leechers": 1,
                    "indexer": "TestIndexer",
                    "magnetUrl": "magnet:?xt=urn:btih:aaa",
                    "categories": [{"id": 7020, "name": "Ebooks"}],
                    "publishDate": "2020-01-01",
                },
                {
                    "guid": "2",
                    "title": "Un Film",
                    "size": 5000,
                    "seeders": 50,
                    "leechers": 2,
                    "indexer": "TestIndexer",
                    "magnetUrl": "magnet:?xt=urn:btih:bbb",
                    "categories": [{"id": 2000, "name": "Movies"}],
                    "publishDate": "2021-01-01",
                },
            ],
        )
    )

    results = await prowlarr.search_books("test")

    assert [r["title"] for r in results] == ["Un Livre EPUB"]


@respx.mock
async def test_search_books_sorts_by_seeders_desc():
    def item(guid, title, seeders):
        return {
            "guid": guid,
            "title": title,
            "size": 1,
            "seeders": seeders,
            "leechers": 0,
            "indexer": "I",
            "magnetUrl": f"magnet:?xt=urn:btih:{guid}",
            "categories": [],
            "publishDate": "",
        }

    respx.get(f"{settings.prowlarr_url}/api/v1/search").mock(
        return_value=Response(
            200,
            json=[
                item("aaa", "Livre A", 2),
                item("bbb", "Livre B", 20),
                item("ccc", "Livre C", 10),
            ],
        )
    )

    results = await prowlarr.search_books("test")

    assert [r["title"] for r in results] == ["Livre B", "Livre C", "Livre A"]


@respx.mock
async def test_search_books_skips_items_without_magnet():
    respx.get(f"{settings.prowlarr_url}/api/v1/search").mock(
        return_value=Response(
            200,
            json=[
                {
                    "guid": "1",
                    "title": "Sans magnet",
                    "size": 1,
                    "seeders": 1,
                    "leechers": 0,
                    "indexer": "I",
                    "categories": [],
                    "publishDate": "",
                },
            ],
        )
    )

    results = await prowlarr.search_books("test")

    assert results == []
