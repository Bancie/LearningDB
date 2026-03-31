from learningdb.orchestrator.providers import (
    is_supported_model,
    provider_catalog_for_ui,
)


def test_supported_model_lookup() -> None:
    assert is_supported_model("openai", "gpt-4.1-mini")
    assert not is_supported_model("openai", "unknown-model")


def test_provider_catalog_marks_availability() -> None:
    catalog = provider_catalog_for_ui(
        {"OPENAI_API_KEY": "x", "ANTHROPIC_API_KEY": None}
    )
    openai_entry = next(item for item in catalog if item["id"] == "openai")
    anthropic_entry = next(item for item in catalog if item["id"] == "anthropic")
    assert openai_entry["available"] is True
    assert anthropic_entry["available"] is False
