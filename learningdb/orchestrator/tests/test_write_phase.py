from learningdb.orchestrator.write_phase import (
    build_action_preview,
    build_confirmation_token,
)


def test_build_confirmation_token_has_expected_format() -> None:
    token = build_confirmation_token(
        user_id=1, action_type="update_status", payload={"activity_id": 3}
    )
    expires_at, digest = token.split(".", maxsplit=1)
    assert expires_at.isdigit()
    assert len(digest) == 64


def test_build_action_preview_returns_confirmation_payload() -> None:
    preview = build_action_preview(
        user_id=99,
        action_type="update_prior",
        summary="Set PRIOR_PROB for activity 2 to 0.35",
        proposed_payload={"activity_id": 2, "prob": 0.35},
    )
    assert preview.requires_confirmation is True
    assert preview.action_type == "update_prior"
