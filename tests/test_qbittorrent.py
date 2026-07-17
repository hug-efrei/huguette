import pytest
import respx
from httpx import Response

import qbittorrent
from config import settings


@pytest.fixture(autouse=True)
async def _client_lifecycle():
    qbittorrent.startup()
    yield
    await qbittorrent.shutdown()


@respx.mock
async def test_get_torrents_relogins_on_403():
    login_route = respx.post(f"{settings.qbit_url}/api/v2/auth/login").mock(
        return_value=Response(200, text="Ok.")
    )

    responses = iter([Response(403, text="Forbidden"), Response(200, json=[])])
    info_route = respx.get(f"{settings.qbit_url}/api/v2/torrents/info").mock(
        side_effect=lambda request: next(responses)
    )

    torrents = await qbittorrent.get_torrents()

    assert torrents == []
    assert login_route.call_count == 2
    assert info_route.call_count == 2


@respx.mock
async def test_get_torrents_logs_in_once_when_no_session():
    respx.post(f"{settings.qbit_url}/api/v2/auth/login").mock(
        return_value=Response(200, text="Ok.")
    )
    respx.get(f"{settings.qbit_url}/api/v2/torrents/info").mock(
        return_value=Response(
            200,
            json=[
                {
                    "name": "Un Livre",
                    "progress": 0.5,
                    "dlspeed": 1024,
                    "state": "downloading",
                    "added_on": 1700000000,
                    "size": 2048,
                    "ratio": 0.123456,
                }
            ],
        )
    )

    torrents = await qbittorrent.get_torrents()

    assert torrents == [
        {
            "name": "Un Livre",
            "progress": 0.5,
            "dlspeed": 1024,
            "state": "downloading",
            "added_on": 1700000000,
            "size": 2048,
            "ratio": 0.12,
        }
    ]


@respx.mock
async def test_login_failure_raises():
    respx.post(f"{settings.qbit_url}/api/v2/auth/login").mock(
        return_value=Response(200, text="Fails.")
    )

    with pytest.raises(RuntimeError):
        await qbittorrent._login()
