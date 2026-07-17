import pytest
from pydantic import ValidationError

from main import DownloadRequest


def test_valid_magnet_is_accepted():
    magnet = "magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678"
    req = DownloadRequest(magnet=magnet, title="Un Livre")
    assert req.magnet == magnet


@pytest.mark.parametrize(
    "bad_magnet",
    [
        "http://example.com/file.torrent",
        "http://192.168.1.203:9696/evil",
        "not-a-magnet",
        "",
        "magnet:?xt=urn:sha1:abcdef",
    ],
)
def test_invalid_magnet_is_rejected(bad_magnet):
    with pytest.raises(ValidationError):
        DownloadRequest(magnet=bad_magnet)
