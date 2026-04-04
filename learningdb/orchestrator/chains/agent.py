"""LangChain orchestration loop for read-only tool calling."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError

from ..audit import logger, mask_sensitive
from ..config import Settings
from ..exceptions import GuardrailViolation
from ..guardrails import enforce_tool_allowlist, is_write_tool, require_user_id
from ..llm_factory import build_chat_model
from ..providers import get_default_model_for_provider, is_supported_model
from ..schemas import ChatRequest, ChatResponse, ToolInvocation
from ..tools import BackendApiClient, build_tool_registry, run_tool
from ..write_phase import (
    build_action_preview,
    extract_confirmed_action,
    verify_confirmation_token,
)

READ_ONLY_SYSTEM_PROMPT = (
    "You are the LearningDB assistant. "
    "You must use tools for factual database answers. "
    "Only use read-only tools. Never execute or suggest write actions. "
    "If required data is missing, ask a short clarifying question."
)

WRITE_ENABLED_SYSTEM_PROMPT = (
    "You are the LearningDB assistant. "
    "You can use both read and write tools to add or update data when explicitly requested. "
    "Never use or suggest any delete/remove operation. "
    "Before write actions, ask short clarification if required fields are missing."
)


@dataclass
class OrchestratorRuntime:
    settings: Settings
    backend_client: BackendApiClient


class ChatOrchestrator:
    """Executes a tool-calling loop using LangChain chat model."""

    def __init__(self, runtime: OrchestratorRuntime) -> None:
        self._settings = runtime.settings
        self._backend_client = runtime.backend_client
        self._registry = build_tool_registry(runtime.backend_client, runtime.settings)
        self._langchain_tools = self._build_langchain_tools()

    def _build_langchain_tools(self) -> list[Any]:
        """Build StructuredTool list from registry definitions."""
        from langchain_core.tools import StructuredTool

        tools: list[Any] = []
        for definition in self._registry.values():
            tools.append(
                StructuredTool.from_function(
                    name=definition.name,
                    description=definition.description,
                    args_schema=definition.input_schema,
                    coroutine=self._tool_coro_factory(definition.name),
                )
            )
        return tools

    def _tool_coro_factory(self, tool_name: str):
        async def _runner(**kwargs):
            payload, _ = await run_tool(self._registry, tool_name, kwargs)
            return json.dumps(payload, ensure_ascii=True)

        return _runner

    def _build_write_summary(self, tool_name: str, args: dict[str, Any]) -> str:
        if tool_name == "insert_record":
            return f"Insert 1 row into table '{args.get('table_name', '')}'."
        if tool_name == "patch_table_row":
            return (
                f"Update 1 row in table '{args.get('table_name', '')}' "
                f"with key {args.get('primary_key', {})}."
            )
        if tool_name == "update_prior":
            return (
                f"Set prior probability for activity_id={args.get('activity_id')} "
                f"to {args.get('prob')}."
            )
        if tool_name == "update_posterior":
            return (
                "Set posterior probability "
                f"(column_choice={args.get('column_choice')}) for activity_id={args.get('activity_id')} "
                f"to {args.get('prob')}."
            )
        if tool_name == "update_status":
            return (
                f"Set status for activity_id={args.get('activity_id')} "
                f"to '{args.get('status', '')}'."
            )
        return f"Execute write action '{tool_name}'."

    def _build_confirmation_response(
        self,
        request_id: str,
        conversation_id: str,
        resolved_provider: str,
        resolved_model: str,
        chat: ChatRequest,
        tool_name: str,
        raw_args: dict[str, Any],
    ) -> ChatResponse:
        preview = build_action_preview(
            user_id=chat.user_id,
            action_type=tool_name,
            summary=self._build_write_summary(tool_name, raw_args),
            proposed_payload=raw_args,
            secret=self._settings.write_confirmation_secret,
            ttl_seconds=self._settings.write_confirmation_ttl_seconds,
        )
        answer = (
            "This action will modify data. Please confirm to continue by sending "
            "a follow-up message with the confirmation token."
        )
        return ChatResponse(
            request_id=request_id,
            conversation_id=conversation_id,
            answer=answer,
            resolved_provider=resolved_provider,
            resolved_model=resolved_model,
            tool_invocations=[],
            warnings=["write_confirmation_required"],
            action_preview=preview,
        )

    async def respond(self, request_id: str, chat: ChatRequest) -> ChatResponse:
        """Process one chat request with bounded tool round trips."""
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

        preference = await self._get_user_preference(chat.user_id)
        resolved_provider, resolved_model = self._resolve_provider_and_model(chat, preference)
        llm, _, _ = build_chat_model(
            self._settings, provider=resolved_provider, model=resolved_model
        )
        llm_with_tools = llm.bind_tools(self._langchain_tools)

        if (
            resolved_provider != preference.get("provider")
            or resolved_model != preference.get("model")
        ):
            await self._set_user_preference(
                chat.user_id, resolved_provider, resolved_model
            )
        conversation_id = await self._ensure_conversation_id(
            chat=chat,
            provider=resolved_provider,
            model=resolved_model,
            fallback_id=request_id,
        )

        if chat.allow_write and chat.confirmation_token:
            confirmed = extract_confirmed_action(
                token=chat.confirmation_token,
                secret=self._settings.write_confirmation_secret,
            )
            if not confirmed:
                answer = (
                    "Confirmation token is invalid or expired. "
                    "Please request the action again."
                )
                await self._persist_chat_turn(
                    user_id=chat.user_id,
                    conversation_id=conversation_id,
                    user_message=chat.message,
                    assistant_message=answer,
                    request_id=request_id,
                )
                return ChatResponse(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    answer=answer,
                    resolved_provider=resolved_provider,
                    resolved_model=resolved_model,
                    tool_invocations=[],
                    warnings=["write_confirmation_invalid"],
                )
            action_type, token_user_id, token_payload = confirmed
            if token_user_id != chat.user_id:
                answer = "Confirmation token does not belong to this user."
                await self._persist_chat_turn(
                    user_id=chat.user_id,
                    conversation_id=conversation_id,
                    user_message=chat.message,
                    assistant_message=answer,
                    request_id=request_id,
                )
                return ChatResponse(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    answer=answer,
                    resolved_provider=resolved_provider,
                    resolved_model=resolved_model,
                    tool_invocations=[],
                    warnings=["write_confirmation_invalid"],
                )
            try:
                enforce_tool_allowlist(action_type, allow_write=True)
                if not is_write_tool(action_type):
                    raise GuardrailViolation(
                        "Confirmation token must target a write-capable tool."
                    )
                if action_type not in self._registry:
                    raise GuardrailViolation(
                        f"Confirmed action '{action_type}' is not registered."
                    )
                write_args = dict(token_payload)
                if (
                    "user_id"
                    in self._registry[action_type].input_schema.model_fields
                ):
                    write_args = require_user_id(write_args, chat.user_id)
                payload, latency_ms = await run_tool(
                    self._registry, action_type, write_args
                )
                if self._settings.enable_audit_logs:
                    logger.info(
                        "request_id=%s tool=%s write=%s input=%s latency_ms=%s confirmed=true",
                        request_id,
                        action_type,
                        True,
                        mask_sensitive(write_args),
                        latency_ms,
                    )
                invocation = ToolInvocation(
                    name=action_type,
                    status="ok",
                    input=write_args,
                    source_endpoint=payload.get("source_endpoint", ""),
                    latency_ms=latency_ms,
                )
                answer = "Write action confirmed and executed successfully."
                await self._persist_chat_turn(
                    user_id=chat.user_id,
                    conversation_id=conversation_id,
                    user_message=chat.message,
                    assistant_message=answer,
                    request_id=request_id,
                )
                return ChatResponse(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    answer=answer,
                    resolved_provider=resolved_provider,
                    resolved_model=resolved_model,
                    tool_invocations=[invocation],
                    warnings=[],
                )
            except Exception as exc:
                answer = f"Confirmed write action failed: {exc}"
                await self._persist_chat_turn(
                    user_id=chat.user_id,
                    conversation_id=conversation_id,
                    user_message=chat.message,
                    assistant_message=answer,
                    request_id=request_id,
                )
                return ChatResponse(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    answer=answer,
                    resolved_provider=resolved_provider,
                    resolved_model=resolved_model,
                    tool_invocations=[
                        ToolInvocation(
                            name=action_type,
                            status="error",
                            input=token_payload,
                            source_endpoint="",
                            latency_ms=0,
                            error=str(exc),
                        )
                    ],
                    warnings=["write_confirmation_execution_failed"],
                )

        system_prompt = (
            WRITE_ENABLED_SYSTEM_PROMPT if chat.allow_write else READ_ONLY_SYSTEM_PROMPT
        )
        messages: list[Any] = [SystemMessage(content=system_prompt)]
        for item in chat.history:
            if item.role.value == "system":
                messages.append(SystemMessage(content=item.content))
            elif item.role.value == "assistant":
                messages.append(AIMessage(content=item.content))
            else:
                messages.append(HumanMessage(content=item.content))
        messages.append(HumanMessage(content=chat.message))

        tool_invocations: list[ToolInvocation] = []

        for _ in range(self._settings.max_tool_round_trips):
            ai_response = await llm_with_tools.ainvoke(messages)
            messages.append(ai_response)
            tool_calls = getattr(ai_response, "tool_calls", None) or []
            if not tool_calls:
                if isinstance(ai_response.content, str):
                    answer = ai_response.content
                else:
                    answer = json.dumps(ai_response.content, ensure_ascii=True)
                if not answer.strip():
                    answer = "I could not produce a final answer. Please try again."
                await self._persist_chat_turn(
                    user_id=chat.user_id,
                    conversation_id=conversation_id,
                    user_message=chat.message,
                    assistant_message=answer,
                    request_id=request_id,
                )
                return ChatResponse(
                    request_id=request_id,
                    conversation_id=conversation_id,
                    answer=answer,
                    resolved_provider=resolved_provider,
                    resolved_model=resolved_model,
                    tool_invocations=tool_invocations,
                    warnings=[],
                )

            for call in tool_calls:
                tool_name = call.get("name", "")
                raw_args = call.get("args") or {}
                if not isinstance(raw_args, dict):
                    raw_args = {}

                try:
                    enforce_tool_allowlist(tool_name, allow_write=chat.allow_write)
                    if "user_id" in self._registry[tool_name].input_schema.model_fields:
                        raw_args = require_user_id(raw_args, chat.user_id)
                    if chat.allow_write and is_write_tool(tool_name):
                        token = (chat.confirmation_token or "").strip()
                        if not token:
                            response = self._build_confirmation_response(
                                request_id=request_id,
                                conversation_id=conversation_id,
                                resolved_provider=resolved_provider,
                                resolved_model=resolved_model,
                                chat=chat,
                                tool_name=tool_name,
                                raw_args=raw_args,
                            )
                            await self._persist_chat_turn(
                                user_id=chat.user_id,
                                conversation_id=conversation_id,
                                user_message=chat.message,
                                assistant_message=response.answer,
                                request_id=request_id,
                            )
                            return response
                        if not verify_confirmation_token(
                            token=token,
                            user_id=chat.user_id,
                            action_type=tool_name,
                            payload=raw_args,
                            secret=self._settings.write_confirmation_secret,
                        ):
                            response = ChatResponse(
                                request_id=request_id,
                                conversation_id=conversation_id,
                                answer=(
                                    "Confirmation token is invalid or expired. "
                                    "Please request the action again."
                                ),
                                resolved_provider=resolved_provider,
                                resolved_model=resolved_model,
                                tool_invocations=[],
                                warnings=["write_confirmation_invalid"],
                                action_preview=None,
                            )
                            await self._persist_chat_turn(
                                user_id=chat.user_id,
                                conversation_id=conversation_id,
                                user_message=chat.message,
                                assistant_message=response.answer,
                                request_id=request_id,
                            )
                            return response
                    payload, latency_ms = await run_tool(self._registry, tool_name, raw_args)
                    content = json.dumps(payload, ensure_ascii=True)
                    tool_invocations.append(
                        ToolInvocation(
                            name=tool_name,
                            status="ok",
                            input=raw_args,
                            source_endpoint=payload.get("source_endpoint", ""),
                            latency_ms=latency_ms,
                        )
                    )
                    if self._settings.enable_audit_logs:
                        logger.info(
                            "request_id=%s tool=%s write=%s input=%s latency_ms=%s",
                            request_id,
                            tool_name,
                            is_write_tool(tool_name),
                            mask_sensitive(raw_args),
                            latency_ms,
                        )
                except (GuardrailViolation, ValidationError, KeyError) as exc:
                    content = json.dumps({"error": str(exc)}, ensure_ascii=True)
                    tool_invocations.append(
                        ToolInvocation(
                            name=tool_name or "unknown",
                            status="blocked",
                            input=raw_args,
                            source_endpoint="",
                            latency_ms=0,
                            error=str(exc),
                        )
                    )
                    if self._settings.enable_audit_logs:
                        logger.warning(
                            "request_id=%s tool=%s write=%s blocked_error=%s",
                            request_id,
                            tool_name or "unknown",
                            is_write_tool(tool_name or ""),
                            str(exc),
                        )
                except Exception as exc:  # pragma: no cover - safety net
                    content = json.dumps({"error": str(exc)}, ensure_ascii=True)
                    tool_invocations.append(
                        ToolInvocation(
                            name=tool_name or "unknown",
                            status="error",
                            input=raw_args,
                            source_endpoint="",
                            latency_ms=0,
                            error=str(exc),
                        )
                    )
                    if self._settings.enable_audit_logs:
                        logger.error(
                            "request_id=%s tool=%s write=%s execution_error=%s",
                            request_id,
                            tool_name or "unknown",
                            is_write_tool(tool_name or ""),
                            str(exc),
                        )

                messages.append(
                    ToolMessage(
                        content=content,
                        tool_call_id=call.get("id", "unknown"),
                    )
                )

        final_answer = (
            "I reached the tool execution limit for this request. "
            "Please narrow the question or try again."
        )
        await self._persist_chat_turn(
            user_id=chat.user_id,
            conversation_id=conversation_id,
            user_message=chat.message,
            assistant_message=final_answer,
            request_id=request_id,
        )
        return ChatResponse(
            request_id=request_id,
            conversation_id=conversation_id,
            answer=final_answer,
            resolved_provider=resolved_provider,
            resolved_model=resolved_model,
            tool_invocations=tool_invocations,
            warnings=["tool_round_trip_limit_reached"],
        )

    async def _get_user_preference(self, user_id: int) -> dict[str, str]:
        try:
            payload = await self._backend_client.get_json(
                f"/users/{user_id}/chat-preferences"
            )
            data = payload.get("data")
            if isinstance(data, dict):
                provider = str(data.get("provider", "")).strip().lower()
                model = str(data.get("model", "")).strip()
                if provider and model:
                    return {"provider": provider, "model": model}
        except Exception as exc:  # pragma: no cover - fallback path
            logger.warning("preference_load_failed user_id=%s reason=%s", user_id, exc)
        return {
            "provider": self._settings.default_provider,
            "model": self._settings.default_model,
        }

    async def _set_user_preference(self, user_id: int, provider: str, model: str) -> None:
        await self._backend_client.put_json(
            f"/users/{user_id}/chat-preferences",
            {"provider": provider, "model": model},
        )

    async def _ensure_conversation_id(
        self, chat: ChatRequest, provider: str, model: str, fallback_id: str
    ) -> str:
        if chat.conversation_id:
            return chat.conversation_id
        payload = await self._backend_client.post_json(
            f"/users/{chat.user_id}/conversations",
            {
                "provider": provider,
                "model": model,
                "first_user_message": chat.message,
            },
        )
        data = payload.get("data")
        if isinstance(data, dict):
            conversation_id = str(data.get("id", "")).strip()
            if conversation_id:
                return conversation_id
        return chat.conversation_id or fallback_id

    async def _persist_chat_turn(
        self,
        user_id: int,
        conversation_id: str,
        user_message: str,
        assistant_message: str,
        request_id: str,
    ) -> None:
        if not conversation_id:
            return
        try:
            await self._backend_client.post_json(
                f"/users/{user_id}/conversations/{conversation_id}/messages",
                {
                    "role": "user",
                    "content": user_message,
                    "request_id": request_id,
                },
            )
            await self._backend_client.post_json(
                f"/users/{user_id}/conversations/{conversation_id}/messages",
                {
                    "role": "assistant",
                    "content": assistant_message,
                    "request_id": request_id,
                },
            )
        except Exception as exc:  # pragma: no cover - persistence fallback
            logger.warning(
                "conversation_persist_failed user_id=%s conversation_id=%s reason=%s",
                user_id,
                conversation_id,
                exc,
            )

    def _resolve_provider_and_model(
        self, chat: ChatRequest, preference: dict[str, str]
    ) -> tuple[str, str]:
        provider = (
            (chat.provider or preference.get("provider") or self._settings.default_provider)
            .strip()
            .lower()
        )
        model = (
            chat.model or preference.get("model") or self._settings.default_model
        ).strip()

        if not provider:
            provider = self._settings.default_provider
        try:
            default_for_provider = get_default_model_for_provider(provider)
        except ValueError:
            provider = self._settings.default_provider
            default_for_provider = get_default_model_for_provider(provider)

        if not model:
            model = default_for_provider

        if not is_supported_model(provider, model):
            model = default_for_provider
        return provider, model
