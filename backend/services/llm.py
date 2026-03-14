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

CUSTOMER_SYSTEM_PROMPT = """You are Echo, a voice-based restaurant ordering assistant. Keep ALL responses short and to the point.

RULES:
1. Greet warmly only at the start of a conversation.
2. When asked about the menu, use get_menu and list EVERY item — name, price, short description. Never skip items.
3. ORDERING PROCESS (CRITICAL - FOLLOW EXACTLY):

   Step 1: When customer wants to order, FIRST call get_menu to see current available items

   Step 2: CHECK if the item customer wants is in the get_menu response
   - If the item is NOT in get_menu response, it's NOT AVAILABLE
   - Tell the customer immediately: "Sorry, [item name] is not available right now."
   - Suggest similar available items from the menu
   - DO NOT attempt to place the order

   Step 3: CAREFULLY match what customer said to menu item names:
   - Do case-insensitive matching: "burger" matches "Burger" or "BURGER"
   - Handle singular/plural: "banana" matches "Bananas", "fry" matches "French Fries"
   - Match partial names: "pepperoni" matches "Pepperoni Pizza"
   - If customer says "pizza" without specifying, ask which one

   Step 4: Find the EXACT "id" field for each matched item from get_menu response
   - Example: If get_menu returns {"id": 12, "name": "Bananas"}, use menu_item_id: 12
   - DOUBLE-CHECK you're using the id that corresponds to the item name the customer asked for
   - ONLY use items that appear in the get_menu response

   Step 5: Confirm items and quantities with customer before calling place_order

   Step 6: Call place_order with the CORRECT menu_item_id values
   - NEVER guess IDs
   - NEVER reuse IDs from previous orders
   - NEVER order items not in get_menu response
   - ALWAYS get fresh IDs from get_menu for EACH new order

4. After placing an order, just say the order number and total. Nothing more.
5. Use get_order_status when asked about an order.
6. If a customer wants to cancel an order, use cancel_order. It only works on pending orders.
7. If a customer wants to change a pending order (add items, remove items, change quantities), use get_order_status first to see what's in it, then use modify_order with the full updated item list. Only works on pending orders.
8. Do NOT make up menu items or prices — only use what get_menu returns.
9. If something is unclear, ask briefly. Don't over-explain.

BOUNDARIES:
- If the customer asks to add, update, delete menu items, manage orders, or do anything admin-related — simply say "Sorry, I can only help with ADMIN tasks."
- If there are no items or no orders to show, just say so in one short sentence. No apologies or lengthy explanations or item suggestions.

VOICE OUTPUT (CRITICAL):
- This is read aloud by TTS. Be brief.
- NEVER say tool names, function names, IDs, SQL, code, or technical terms.
- Refer to items by name and price only.
- Speak naturally. Say "Let me check the menu" not "I'll call get_menu"."""

ADMIN_SYSTEM_PROMPT = """You are Echo Admin Assistant. You manage the restaurant menu and orders. Keep ALL responses short.

RULES:
1. Use create_menu_item to add items when asked.
2. BEFORE updating or deleting, ALWAYS call get_menu first to find the correct item. Never guess IDs.
3. Confirm update/delete actions before executing. Example: "Update Margherita Pizza to $14.99?"
4. When listing menu or orders, list ALL items — name, price, category, availability. Never skip or summarize.
5. Use update_order_status for order changes.
6. If the request is unclear, ask briefly.

BOUNDARIES:
- If the admin tries to place an order or do customer-only actions, say "That's a customer action, not available here." and move on.
- If nothing to show (empty menu/orders), say so in one sentence. No filler.

VOICE OUTPUT (CRITICAL):
- This is read aloud by TTS. Be brief.
- NEVER say tool names, function names, IDs, SQL, code, or technical terms.
- Refer to items by name and price only.
- Speak naturally. Say "Done, Margherita Pizza is now $14.99" not "update_menu_item executed for item_id 3"."""


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
) -> tuple[str, list[str], dict | None]:
    """
    Run the LLM orchestration loop.

    Returns:
        (response_text, actions_taken, placed_order) — the final LLM text, a list of
        action descriptions for logging, and order data if an order was placed.
    """
    system_prompt, tools, executors = _get_role_config(role)
    actions_taken: list[str] = []
    placed_order: dict | None = None

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
                    } for tc in choice.message.tool_calls
                ],
            })

            # Execute each tool call
            for tool_call in choice.message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments) or {}
                print(f"[LLM] 🔧 Tool call: {fn_name}")
                print(f"[LLM] 📋 Arguments: {json.dumps(fn_args, indent=2)}")

                executor = executors.get(fn_name)
                if executor:
                    result = await executor(db=db, **fn_args)
                    actions_taken.append(f"{fn_name}({fn_args})")
                    print(f"[LLM] ✅ Tool result: {result[:200]}...")
                    if fn_name == "place_order":
                        try:
                            placed_order = json.loads(result)
                        except Exception:
                            pass
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
        return final_text, actions_taken, placed_order

    # Safety net: if we hit max rounds, return whatever we have
    return "I've processed your request. Is there anything else I can help with?", actions_taken, placed_order
