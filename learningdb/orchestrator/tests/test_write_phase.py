from learningdb.orchestrator.write_phase import (
    build_action_preview,
    build_confirmation_token,
    extract_confirmed_action,
    verify_confirmation_token,
)


def test_build_confirmation_token_has_expected_format() -> None:
    token = build_confirmation_token(
        user_id=1,
        action_type="update_status",
        payload={"activity_id": 3},
        secret="secret",
    )
    body, digest = token.split(".", maxsplit=1)
    assert len(body) > 10
    assert len(digest) == 64


def test_build_action_preview_returns_confirmation_payload() -> None:
    preview = build_action_preview(
        user_id=99,
        action_type="update_prior",
        summary="Set PRIOR_PROB for activity 2 to 0.35",
        proposed_payload={"activity_id": 2, "prob": 0.35},
        secret="secret",
    )
    assert preview.requires_confirmation is True
    assert preview.action_type == "update_prior"


def test_verify_confirmation_token_accepts_matching_envelope() -> None:
    token = build_confirmation_token(
        user_id=9,
        action_type="update_status",
        payload={"activity_id": 1, "status": "done"},
        secret="secret",
    )
    assert (
        verify_confirmation_token(
            token=token,
            user_id=9,
            action_type="update_status",
            payload={"activity_id": 1, "status": "done"},
            secret="secret",
        )
        is True
    )


def test_verify_confirmation_token_rejects_mismatch() -> None:
    token = build_confirmation_token(
        user_id=9,
        action_type="update_status",
        payload={"activity_id": 1, "status": "done"},
        secret="secret",
    )
    assert (
        verify_confirmation_token(
            token=token,
            user_id=9,
            action_type="update_status",
            payload={"activity_id": 2, "status": "done"},
            secret="secret",
        )
        is False
    )


def test_extract_confirmed_action_returns_envelope() -> None:
    token = build_confirmation_token(
        user_id=3,
        action_type="update_status",
        payload={"activity_id": 7, "status": "done"},
        secret="secret",
    )
    extracted = extract_confirmed_action(token=token, secret="secret")
    assert extracted is not None
    action_type, user_id, payload = extracted
    assert action_type == "update_status"
    assert user_id == 3
    assert payload == {"activity_id": 7, "status": "done"}
