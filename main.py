import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

import prowlarr
import qbittorrent
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

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    prowlarr.startup()
    qbittorrent.startup()
    yield
    await prowlarr.shutdown()
    await qbittorrent.shutdown()


app = FastAPI(title="Huguette", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class DownloadRequest(BaseModel):
    guid: str
    title: str = ""


@app.get("/api/search")
@limiter.limit("10/minute")
async def api_search(request: Request, q: str):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Requête vide")
    try:
        results = await search_books(q.strip())
        return {"results": results, "count": len(results)}
    except Exception:
        logger.exception("Erreur recherche Prowlarr")
        raise HTTPException(status_code=502, detail="Prowlarr indisponible")


@app.post("/api/download")
async def api_download(req: DownloadRequest):
    link = prowlarr.get_download_link(req.guid)
    if link is None:
        raise HTTPException(
            status_code=404,
            detail="Résultat de recherche introuvable ou expiré, relancez la recherche",
        )
    try:
        ok = await add_torrent(link, req.title)
        return {"success": ok}
    except Exception:
        logger.exception("Erreur ajout torrent qBittorrent")
        raise HTTPException(status_code=502, detail="qBittorrent indisponible")


@app.get("/api/status")
async def api_status():
    try:
        torrents = await get_torrents()
        return {"torrents": torrents}
    except Exception:
        logger.exception("Erreur récupération torrents")
        raise HTTPException(status_code=502, detail="qBittorrent indisponible")


@app.get("/api/health")
async def api_health():
    """Liveness : renvoie toujours 200 si le process tourne."""
    return {"status": "ok"}


@app.get("/api/health/deps")
async def api_health_deps():
    """Readiness : état réel des dépendances (Prowlarr/qBittorrent) pour le monitoring."""
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
