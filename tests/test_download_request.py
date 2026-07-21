import pytest
from pydantic import ValidationError

from main import DownloadRequest


def test_guid_is_required():
    req = DownloadRequest(guid="abc123", title="Un Livre")
    assert req.guid == "abc123"
    assert req.title == "Un Livre"


def test_title_defaults_to_empty_string():
    req = DownloadRequest(guid="abc123")
    assert req.title == ""


def test_missing_guid_is_rejected():
    with pytest.raises(ValidationError):
        DownloadRequest(title="Un Livre")
