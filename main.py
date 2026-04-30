import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import settings
from prowlarr import ping as ping_prowlarr
from prowlarr import search_books
from qbittorrent import add_torrent, get_torrents
from qbittorrent import ping as ping_qbit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("huguette")

app = FastAPI(title="Huguette", version="1.0.0")


class DownloadRequest(BaseModel):
    magnet: str
    title: str = ""


@app.get("/api/search")
async def api_search(q: str):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Requête vide")
    try:
        results = await search_books(q.strip())
        return {"results": results, "count": len(results)}
    except Exception as exc:
        logger.exception("Erreur recherche Prowlarr")
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/api/download")
async def api_download(req: DownloadRequest):
    if not req.magnet.strip():
        raise HTTPException(status_code=400, detail="Magnet manquant")
    try:
        ok = await add_torrent(req.magnet, req.title)
        return {"success": ok}
    except Exception as exc:
        logger.exception("Erreur ajout torrent qBittorrent")
        raise HTTPException(status_code=502, detail=str(exc))


@app.get("/api/status")
async def api_status():
    try:
        torrents = await get_torrents()
        return {"torrents": torrents}
    except Exception as exc:
        logger.exception("Erreur récupération torrents")
        raise HTTPException(status_code=502, detail=str(exc))


@app.get("/api/health")
async def api_health():
    prowlarr_ok, qbit_ok = await ping_prowlarr(), await ping_qbit()
    ok = prowlarr_ok and qbit_ok
    return JSONResponse(
        status_code=200 if ok else 503,
        content={"status": "ok" if ok else "degraded", "prowlarr": prowlarr_ok, "qbit": qbit_ok},
    )


@app.get("/api/config")
async def api_config():
    return {"library_url": settings.library_url}


app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
