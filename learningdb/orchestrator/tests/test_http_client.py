import asyncio

import httpx

from learningdb.orchestrator.config import Settings
from learningdb.orchestrator.tools.http_client import BackendApiClient


def test_get_json_retries_and_returns_payload() -> None:
    settings = Settings(
        backend_base_url="http://test.local/api",
        backend_max_retries=2,
        backend_retry_backoff_seconds=0.001,
    )
    client = BackendApiClient(settings)
    call_count = {"value": 0}

    async def handler(request: httpx.Request) -> httpx.Response:
        call_count["value"] += 1
        if call_count["value"] < 2:
            return httpx.Response(status_code=503, json={"error": "temporary"})
        return httpx.Response(status_code=200, json={"ok": True})

    client._client = httpx.AsyncClient(  # type: ignore[attr-defined]
        base_url=settings.backend_base_url,
        transport=httpx.MockTransport(handler),
    )

    payload = asyncio.run(client.get_json("/health"))
    assert payload == {"ok": True}
    assert call_count["value"] == 2
    asyncio.run(client.close())


def test_patch_json_uses_patch_method() -> None:
    settings = Settings(backend_base_url="http://test.local/api")
    client = BackendApiClient(settings)

    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "PATCH"
        return httpx.Response(status_code=200, json={"ok": True})

    client._client = httpx.AsyncClient(  # type: ignore[attr-defined]
        base_url=settings.backend_base_url,
        transport=httpx.MockTransport(handler),
    )

    payload = asyncio.run(client.patch_json("/tables/activity/rows", {"updates": {"x": 1}}))
    assert payload == {"ok": True}
    asyncio.run(client.close())
