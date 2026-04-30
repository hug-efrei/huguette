from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from prowlarr import search_books
from qbittorrent import add_torrent, get_torrents

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
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/api/download")
async def api_download(req: DownloadRequest):
    if not req.magnet.strip():
        raise HTTPException(status_code=400, detail="Magnet manquant")
    try:
        ok = await add_torrent(req.magnet, req.title)
        return {"success": ok}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.get("/api/status")
async def api_status():
    try:
        torrents = await get_torrents()
        return {"torrents": torrents}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "service": "Huguette"}


app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
