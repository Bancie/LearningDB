"""Provider and model catalog for orchestrator LLM routing."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelDescriptor:
    provider: str
    model: str
    label: str
    env_key: str


SUPPORTED_MODELS: dict[str, list[ModelDescriptor]] = {
    "openai": [
        ModelDescriptor(
            provider="openai",
            model="gpt-4.1-mini",
            label="GPT-4.1 Mini",
            env_key="OPENAI_API_KEY",
        ),
        ModelDescriptor(
            provider="openai",
            model="gpt-4.1",
            label="GPT-4.1",
            env_key="OPENAI_API_KEY",
        ),
    ],
    "anthropic": [
        ModelDescriptor(
            provider="anthropic",
            model="claude-sonnet-4-6",
            label="Claude Sonnet 4.6",
            env_key="ANTHROPIC_API_KEY",
        ),
        ModelDescriptor(
            provider="anthropic",
            model="claude-opus-4-6",
            label="Claude Opus 4.6",
            env_key="ANTHROPIC_API_KEY",
        ),
    ],
}


def is_supported_model(provider: str, model: str) -> bool:
    """Return whether the provider/model pair is allowlisted."""
    options = SUPPORTED_MODELS.get(provider, [])
    return any(item.model == model for item in options)


def get_default_model_for_provider(provider: str) -> str:
    """Get default model for provider."""
    options = SUPPORTED_MODELS.get(provider)
    if not options:
        raise ValueError(f"Unsupported provider: {provider}")
    return options[0].model


def provider_catalog_for_ui(env: dict[str, str | None]) -> list[dict[str, object]]:
    """Build UI payload showing available providers/models."""
    payload: list[dict[str, object]] = []
    for provider, options in SUPPORTED_MODELS.items():
        models = []
        provider_available = False
        for item in options:
            available = bool(env.get(item.env_key))
            provider_available = provider_available or available
            models.append(
                {
                    "id": item.model,
                    "label": item.label,
                    "available": available,
                }
            )
        payload.append(
            {
                "id": provider,
                "label": provider.capitalize(),
                "available": provider_available,
                "models": models,
            }
        )
    return payload
