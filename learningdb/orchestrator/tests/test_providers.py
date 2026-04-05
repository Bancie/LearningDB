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


def test_supported_ollama_models() -> None:
    assert is_supported_model("ollama", "gemma4:31b-cloud")
    assert is_supported_model("ollama", "gemma4:e4b")
    assert not is_supported_model("ollama", "unknown-model")


def test_provider_catalog_ollama_availability() -> None:
    catalog = provider_catalog_for_ui(
        {
            "OLLAMA_API_KEY": "cloud-key",
            "ORCH_OLLAMA_API_KEY": None,
            "ORCH_OLLAMA_ENABLE_LOCAL": "1",
        }
    )
    ollama_entry = next(item for item in catalog if item["id"] == "ollama")
    assert ollama_entry["available"] is True
    by_id = {m["id"]: m["available"] for m in ollama_entry["models"]}
    assert by_id["gemma4:31b-cloud"] is True
    assert by_id["gemma4:e4b"] is True


def test_provider_catalog_ollama_cloud_only() -> None:
    catalog = provider_catalog_for_ui(
        {
            "OLLAMA_API_KEY": "k",
            "ORCH_OLLAMA_ENABLE_LOCAL": None,
        }
    )
    ollama_entry = next(item for item in catalog if item["id"] == "ollama")
    by_id = {m["id"]: m["available"] for m in ollama_entry["models"]}
    assert by_id["gemma4:31b-cloud"] is True
    assert by_id["gemma4:e4b"] is False
