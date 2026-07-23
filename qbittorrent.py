import asyncio
import logging

import httpx

from config import settings

logger = logging.getLogger("huguette.qbit")

_client: httpx.AsyncClient | None = None
_authenticated = False
_login_lock: asyncio.Lock | None = None


def startup() -> None:
    global _client, _login_lock, _authenticated
    _client = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0))
    _login_lock = asyncio.Lock()
    _authenticated = False


async def shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("Client qBittorrent non initialisé (lifespan manquant)")
    return _client


async def _login() -> None:
    global _authenticated
    assert _login_lock is not None, "Client qBittorrent non initialisé (lifespan manquant)"
    async with _login_lock:
        if _authenticated:
            return
        client = _get_client()
        resp = await client.post(
            f"{settings.qbit_url}/api/v2/auth/login",
            data={"username": settings.qbit_username, "password": settings.qbit_password},
        )
        # Les versions récentes de qBittorrent renvoient 204 (corps vide) au
        # lieu de 200 + "Ok." : on se fie au statut HTTP plutôt qu'au corps,
        # qui reste compatible avec les deux comportements.
        if not resp.is_success:
            raise RuntimeError("qBittorrent : échec de l'authentification")
        _authenticated = True
        logger.info("session qBittorrent renouvelée")


async def _force_relogin() -> None:
    global _authenticated
    assert _login_lock is not None, "Client qBittorrent non initialisé (lifespan manquant)"
    async with _login_lock:
        _authenticated = False
    await _login()


async def _request(method: str, path: str, **kwargs) -> httpx.Response:
    if not _authenticated:
        await _login()
    client = _get_client()
    resp = await client.request(method, f"{settings.qbit_url}{path}", **kwargs)
    if resp.status_code == 403:
        await _force_relogin()
        resp = await client.request(method, f"{settings.qbit_url}{path}", **kwargs)
    return resp


async def add_torrent(magnet: str, title: str = "") -> bool:
    resp = await _request(
        "POST",
        "/api/v2/torrents/add",
        data={"urls": magnet, "category": "huguette", "autoTMM": "true"},
        timeout=15.0,
    )
    if not resp.is_success:
        return False
    # Les versions récentes de qBittorrent renvoient un JSON
    # {"success_count":...,"failure_count":...} au lieu du texte "Ok." des
    # anciennes versions — on gère les deux.
    try:
        return resp.json().get("failure_count", 0) == 0
    except ValueError:
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
