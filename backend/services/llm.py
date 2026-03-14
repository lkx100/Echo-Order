"""Core LLM orchestrator — role-aware system prompts + tool-calling loop."""

import json
import asyncio

from groq import Groq
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from tools.customer_tools import CUSTOMER_TOOLS, CUSTOMER_TOOL_EXECUTORS
from tools.admin_tools import ADMIN_TOOLS, ADMIN_TOOL_EXECUTORS


_client = Groq(api_key=settings.GROQ_API_KEY)

MAX_TOOL_ROUNDS = 5

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

CUSTOMER_SYSTEM_PROMPT = """You are Echo, a friendly and helpful voice-based restaurant ordering assistant.
Your job is to help customers browse the menu and place orders through natural conversation.

RULES:
1. Always greet the customer warmly if it's the start of a conversation.
2. When a customer asks about the menu, use the get_menu tool to fetch current items.
3. NEVER place an order without first confirming the EXACT items and quantities with the customer.
   - Example: "So that's 2 Margherita Pizzas and 1 Coke. Shall I place this order?"
   - Only call place_order AFTER the customer confirms (says yes, correct, sure, etc.)
4. After placing an order, tell them their order ID and the total.
5. If the customer asks about an order status, use get_order_status.
6. Keep responses concise and conversational — this is a voice interface.
7. If something is unclear, ask for clarification rather than guessing.
8. Do NOT make up menu items or prices — only use what get_menu returns."""

ADMIN_SYSTEM_PROMPT = """You are Echo Admin Assistant, a helpful system for managing the restaurant menu and orders.
You help the admin perform operations on the menu and view/manage orders.

RULES:
1. When the admin wants to add an item, use create_menu_item with the provided details.
2. When updating or removing items, ALWAYS confirm the action before executing.
   - Example: "I'll update the price of Margherita Pizza to $14.99. Confirm?"
3. When listing orders or menu items, present them in a clear, organized way.
4. For order status updates, use update_order_status.
5. Keep responses professional but concise — state what action was taken and the result.
6. If the admin's request is ambiguous, ask for clarification.
7. Use get_menu to show current items when needed for context."""


def _get_role_config(role: str) -> tuple[str, list[dict], dict]:
    """Return (system_prompt, tools, executors) based on role."""
    if role == "admin":
        return ADMIN_SYSTEM_PROMPT, ADMIN_TOOLS, ADMIN_TOOL_EXECUTORS
    return CUSTOMER_SYSTEM_PROMPT, CUSTOMER_TOOLS, CUSTOMER_TOOL_EXECUTORS


def _call_llm_sync(messages: list[dict], tools: list[dict] | None):
    """Blocking Groq call — runs in thread pool."""
    return _client.chat.completions.create(
        model=settings.GROQ_LLM_MODEL,
        messages=messages,
        tools=tools if tools else None,
        tool_choice="auto",
        max_tokens=1024,
    )


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

async def orchestrate(
    transcript: str,
    role: str,
    history: list[dict],
    db: AsyncSession,
) -> tuple[str, list[str]]:
    """
    Run the LLM orchestration loop.

    Args:
        transcript: The user's spoken text (from STT).
        role: "customer" or "admin".
        history: Previous conversation messages.
        db: Active async DB session.

    Returns:
        (response_text, actions_taken) — the final LLM text and a list of
        action descriptions for logging.
    """
    system_prompt, tools, executors = _get_role_config(role)
    actions_taken: list[str] = []

    # Build the messages list
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": transcript})

    loop = asyncio.get_event_loop()

    for _round in range(MAX_TOOL_ROUNDS):
        print(f"[LLM] Round {_round + 1} — sending {len(messages)} messages to Groq...")

        try:
            response = await loop.run_in_executor(None, _call_llm_sync, messages, tools)
        except Exception as e:
            # Groq sometimes fails when the LLM generates malformed tool call syntax
            # Retry without tools so it gives a plain text answer
            print(f"[LLM] ⚠ Tool call failed ({e}), retrying without tools...")
            response = await loop.run_in_executor(None, _call_llm_sync, messages, None)

        choice = response.choices[0]
        print(f"[LLM] finish_reason={choice.finish_reason}")

        # If the model wants to call tools
        if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
            # Append the assistant message with tool calls
            messages.append({
                "role": "assistant",
                "content": choice.message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in choice.message.tool_calls
                ],
            })

            # Execute each tool call
            for tool_call in choice.message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments) or {}
                print(f"[LLM] 🔧 Tool call: {fn_name}({json.dumps(fn_args)})")

                executor = executors.get(fn_name)
                if executor:
                    result = await executor(db=db, **fn_args)
                    actions_taken.append(f"{fn_name}({fn_args})")
                    print(f"[LLM] 🔧 Tool result: {result[:200]}...")
                else:
                    result = json.dumps({"error": f"Unknown tool: {fn_name}"})
                    print(f"[LLM] ❌ Unknown tool: {fn_name}")

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                })

            # Continue the loop — the model may make more tool calls
            continue

        # No tool calls — we have the final response
        final_text = choice.message.content or "I'm sorry, I didn't catch that."
        print(f"[LLM] ✅ Final response: \"{final_text[:100]}...\"")
        return final_text, actions_taken

    # Safety net: if we hit max rounds, return whatever we have
    return "I've processed your request. Is there anything else I can help with?", actions_taken
