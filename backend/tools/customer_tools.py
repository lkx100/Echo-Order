"""Customer-facing tool definitions and executors for the LLM."""

import json
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import MenuItem, Order, OrderItem


# ---------------------------------------------------------------------------
# Tool definitions (OpenAI function-calling schema for Groq)
# ---------------------------------------------------------------------------

CUSTOMER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_menu",
            "description": "Retrieve all available menu items with their names, descriptions, prices, and categories. Call this when the customer asks to see the menu or asks what's available.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "place_order",
            "description": "Place a new order for the customer. Only call this after you have confirmed the exact items and quantities with the customer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "description": "List of items to order",
                        "items": {
                            "type": "object",
                            "properties": {
                                "menu_item_id": {
                                    "type": "integer",
                                    "description": "ID of the menu item",
                                },
                                "quantity": {
                                    "type": "integer",
                                    "description": "Number of this item to order",
                                },
                            },
                            "required": ["menu_item_id", "quantity"],
                        },
                    }
                },
                "required": ["items"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_order_status",
            "description": "Check the current status of an existing order by its order ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "The order ID to look up",
                    }
                },
                "required": ["order_id"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Tool executors
# ---------------------------------------------------------------------------

async def execute_get_menu(db: AsyncSession, **kwargs) -> str:
    """Return all available menu items."""
    result = await db.execute(
        select(MenuItem).where(MenuItem.is_available == True)  # noqa: E712
    )
    items = result.scalars().all()
    menu = [item.to_dict() for item in items]
    return json.dumps({"menu_items": menu, "count": len(menu)})


async def execute_place_order(db: AsyncSession, items: list[dict], **kwargs) -> str:
    """Create an order from a list of {menu_item_id, quantity}."""
    order = Order()
    db.add(order)
    await db.flush()  # get order.id

    total = 0.0
    order_items_info = []

    for entry in items:
        menu_item = await db.get(MenuItem, entry["menu_item_id"])
        if not menu_item or not menu_item.is_available:
            return json.dumps({
                "error": f"Menu item with ID {entry['menu_item_id']} not found or unavailable."
            })

        qty = entry["quantity"]
        subtotal = menu_item.price * qty
        total += subtotal

        oi = OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=qty,
            subtotal=subtotal,
        )
        db.add(oi)
        order_items_info.append({
            "name": menu_item.name,
            "quantity": qty,
            "subtotal": subtotal,
        })

    order.total_amount = total
    await db.commit()

    return json.dumps({
        "order_id": order.id,
        "total_amount": total,
        "items_ordered": order_items_info,
        "status": "pending",
    })


async def execute_get_order_status(db: AsyncSession, order_id: int, **kwargs) -> str:
    """Look up an order by ID."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        return json.dumps({"error": f"Order #{order_id} not found."})

    return json.dumps(order.to_dict())


# ---------------------------------------------------------------------------
# Registry mapping tool name → executor
# ---------------------------------------------------------------------------

CUSTOMER_TOOL_EXECUTORS = {
    "get_menu": execute_get_menu,
    "place_order": execute_place_order,
    "get_order_status": execute_get_order_status,
}
