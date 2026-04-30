import httpx
from config import settings


async def _login(client: httpx.AsyncClient) -> httpx.Cookies:
    resp = await client.post(
        f"{settings.qbit_url}/api/v2/auth/login",
        data={"username": settings.qbit_username, "password": settings.qbit_password},
        timeout=10.0,
    )
    if resp.text.strip() != "Ok.":
        raise RuntimeError("qBittorrent : échec de l'authentification")
    return resp.cookies


async def add_torrent(magnet: str, title: str = "") -> bool:
    async with httpx.AsyncClient() as client:
        cookies = await _login(client)
        resp = await client.post(
            f"{settings.qbit_url}/api/v2/torrents/add",
            data={
                "urls": magnet,
                "savepath": settings.calibre_watchfolder,
                "category": "calibre",
                "autoTMM": "true",
            },
            cookies=cookies,
            timeout=15.0,
        )
        return resp.text.strip() == "Ok."


async def get_torrents() -> list[dict]:
    async with httpx.AsyncClient() as client:
        cookies = await _login(client)
        resp = await client.get(
            f"{settings.qbit_url}/api/v2/torrents/info",
            params={"category": "calibre"},
            cookies=cookies,
            timeout=10.0,
        )
        resp.raise_for_status()
        raw = resp.json()

    return [
        {
            "name":      t.get("name", ""),
            "progress":  t.get("progress", 0),
            "dlspeed":   t.get("dlspeed", 0),
            "state":     t.get("state", ""),
            "added_on":  t.get("added_on", 0),
            "size":      t.get("size", 0),
            "ratio":     round(t.get("ratio", 0), 2),
        }
        for t in raw
    ]
