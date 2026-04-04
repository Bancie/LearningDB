"""HTTP client wrapper for calling LearningDB backend API."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from ..config import Settings
from ..exceptions import BackendNotFoundError, BackendServiceError


class BackendApiClient:
    """Resilient async client for backend read-only endpoints."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.backend_base_url,
            timeout=settings.request_timeout_seconds,
            headers={"Content-Type": "application/json"},
        )

    async def close(self) -> None:
        """Close underlying HTTP transport."""
        await self._client.aclose()

    async def _request_json(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Issue JSON HTTP request with retry and standardized error mapping."""
        attempts = self._settings.backend_max_retries + 1
        backoff = self._settings.backend_retry_backoff_seconds

        last_error: Exception | None = None
        for attempt in range(attempts):
            try:
                response = await self._client.request(
                    method=method,
                    url=path,
                    params=params,
                    json=json_payload,
                )
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, dict):
                    raise BackendServiceError(
                        f"Backend returned invalid payload type for {path}."
                    )
                return payload
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    break
                await asyncio.sleep(backoff * (attempt + 1))

        raise BackendServiceError(
            f"Backend API call failed for {path}: {last_error}"
        ) from last_error

    async def get_json(
        self, path: str, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """Issue GET request with retry."""
        return await self._request_json(method="GET", path=path, params=params)

    async def put_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Issue PUT request with retry."""
        return await self._request_json(
            method="PUT", path=path, json_payload=payload
        )

    async def post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Issue POST request with retry."""
        return await self._request_json(
            method="POST", path=path, json_payload=payload
        )

    async def patch_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Issue PATCH request with retry."""
        return await self._request_json(
            method="PATCH", path=path, json_payload=payload
        )

    async def delete_json(self, path: str) -> dict[str, Any]:
        """Issue DELETE request; do not retry on 404."""
        attempts = self._settings.backend_max_retries + 1
        backoff = self._settings.backend_retry_backoff_seconds

        last_error: Exception | None = None
        for attempt in range(attempts):
            try:
                response = await self._client.request(method="DELETE", url=path)
                if response.status_code == 404:
                    raise BackendNotFoundError(f"Backend returned 404 for {path}.")
                response.raise_for_status()
                if not response.content:
                    return {}
                payload = response.json()
                if not isinstance(payload, dict):
                    raise BackendServiceError(
                        f"Backend returned invalid payload type for {path}."
                    )
                return payload
            except BackendNotFoundError:
                raise
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    break
                await asyncio.sleep(backoff * (attempt + 1))

        raise BackendServiceError(
            f"Backend API call failed for {path}: {last_error}"
        ) from last_error
