import logging

import httpx

from config import settings

logger = logging.getLogger("huguette.qbit")

_client: httpx.AsyncClient | None = None
_cookies: httpx.Cookies | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0))
    return _client


async def _login() -> None:
    global _cookies
    client = _get_client()
    resp = await client.post(
        f"{settings.qbit_url}/api/v2/auth/login",
        data={"username": settings.qbit_username, "password": settings.qbit_password},
    )
    if resp.text.strip() != "Ok.":
        raise RuntimeError("qBittorrent : échec de l'authentification")
    _cookies = resp.cookies
    logger.info("session qBittorrent renouvelée")


async def _request(method: str, path: str, **kwargs) -> httpx.Response:
    global _cookies
    if _cookies is None:
        await _login()
    client = _get_client()
    resp = await client.request(method, f"{settings.qbit_url}{path}", cookies=_cookies, **kwargs)
    if resp.status_code == 403:
        _cookies = None
        await _login()
        resp = await client.request(method, f"{settings.qbit_url}{path}", cookies=_cookies, **kwargs)
    return resp


async def add_torrent(magnet: str, title: str = "") -> bool:
    resp = await _request(
        "POST",
        "/api/v2/torrents/add",
        data={"urls": magnet, "category": "huguette", "autoTMM": "true"},
        timeout=15.0,
    )
    return resp.text.strip() == "Ok."


async def get_torrents() -> list[dict]:
    resp = await _request("GET", "/api/v2/torrents/info", params={"category": "huguette"})
    resp.raise_for_status()
    return [
        {
            "name":     t.get("name", ""),
            "progress": t.get("progress", 0),
            "dlspeed":  t.get("dlspeed", 0),
            "state":    t.get("state", ""),
            "added_on": t.get("added_on", 0),
            "size":     t.get("size", 0),
            "ratio":    round(t.get("ratio", 0), 2),
        }
        for t in resp.json()
    ]


async def ping() -> bool:
    try:
        resp = await _get_client().get(
            f"{settings.qbit_url}/api/v2/app/version",
            timeout=2.0,
        )
        return resp.status_code in (200, 403)
    except Exception:
        return False
