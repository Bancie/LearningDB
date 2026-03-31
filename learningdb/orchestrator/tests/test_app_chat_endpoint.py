from fastapi.testclient import TestClient

from learningdb.orchestrator.app import app
from learningdb.orchestrator.schemas import ChatResponse


class _FakeOrchestrator:
    async def respond(self, request_id: str, chat):
        return ChatResponse(
            request_id=request_id,
            conversation_id=chat.conversation_id or request_id,
            answer="ok",
            resolved_provider="openai",
            resolved_model="gpt-4.1-mini",
            tool_invocations=[],
            warnings=[],
        )


def test_chat_returns_503_when_orchestrator_not_ready() -> None:
    with TestClient(app) as client:
        app.state.orchestrator = None
        response = client.post(
            "/chat",
            json={"user_id": 1, "message": "xin chao", "history": []},
        )
        assert response.status_code == 503
        detail = response.json()["detail"]
        assert detail["error_code"] == "ORCHESTRATOR_NOT_READY"


def test_chat_success_with_fake_orchestrator() -> None:
    with TestClient(app) as client:
        app.state.orchestrator = _FakeOrchestrator()
        response = client.post(
            "/chat",
            json={"user_id": 1, "message": "show list", "history": []},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["answer"] == "ok"
