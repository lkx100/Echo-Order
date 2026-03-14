"""Admin-facing tool definitions and executors for the LLM."""

import json
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import MenuItem, Order, OrderItem, OrderStatus


# ---------------------------------------------------------------------------
# Tool definitions (OpenAI function-calling schema for Groq)
# ---------------------------------------------------------------------------

ADMIN_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_menu_item",
            "description": "Add a new item to the restaurant menu. Requires name and price at minimum.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the menu item",
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the item",
                    },
                    "price": {
                        "type": "number",
                        "description": "Price in dollars",
                    },
                    "category": {
                        "type": "string",
                        "description": "Category (e.g. Pizza, Burger, Drink, Dessert)",
                    },
                },
                "required": ["name", "price"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_menu_item",
            "description": "Update an existing menu item's details (name, price, description, category, availability). You MUST call get_menu first to find the correct item_id before using this tool.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_id": {
                        "type": "integer",
                        "description": "ID of the menu item to update",
                    },
                    "name": {"type": "string", "description": "New name"},
                    "description": {"type": "string", "description": "New description"},
                    "price": {"type": "number", "description": "New price"},
                    "category": {"type": "string", "description": "New category"},
                    "is_available": {"type": "boolean", "description": "Whether the item is available"},
                },
                "required": ["item_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_menu_item",
            "description": "Remove a menu item by making it unavailable (soft delete). You MUST call get_menu first to find the correct item_id before using this tool.",
            "parameters": {
                "type": "object",
                "properties": {
                    "item_id": {
                        "type": "integer",
                        "description": "ID of the menu item to delete",
                    }
                },
                "required": ["item_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_orders",
            "description": "List all orders, optionally filtered by status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by order status: pending, confirmed, preparing, ready, delivered, cancelled",
                        "enum": ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_order_status",
            "description": "Update the status of an existing order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "ID of the order to update",
                    },
                    "status": {
                        "type": "string",
                        "description": "New status for the order",
                        "enum": ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
                    },
                },
                "required": ["order_id", "status"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_menu",
            "description": "Retrieve all menu items (including unavailable ones) for admin review.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Tool executors
# ---------------------------------------------------------------------------

async def execute_create_menu_item(
    db: AsyncSession,
    name: str,
    price: float,
    description: str = "",
    category: str = "General",
    **kwargs,
) -> str:
    item = MenuItem(
        name=name,
        description=description,
        price=price,
        category=category,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return json.dumps({"message": f"Menu item '{name}' created.", "item": item.to_dict()})


async def execute_update_menu_item(
    db: AsyncSession,
    item_id: int,
    **kwargs,
) -> str:
    item = await db.get(MenuItem, item_id)
    if not item:
        return json.dumps({"error": f"Menu item #{item_id} not found."})

    updatable = ["name", "description", "price", "category", "is_available"]
    for field in updatable:
        if field in kwargs and kwargs[field] is not None:
            setattr(item, field, kwargs[field])

    await db.commit()
    await db.refresh(item)
    return json.dumps({"message": f"Menu item #{item_id} updated.", "item": item.to_dict()})


async def execute_delete_menu_item(db: AsyncSession, item_id: int, **kwargs) -> str:
    item = await db.get(MenuItem, item_id)
    if not item:
        return json.dumps({"error": f"Menu item #{item_id} not found."})

    item.is_available = False
    await db.commit()
    return json.dumps({"message": f"Menu item '{item.name}' has been removed from the menu."})


async def execute_list_orders(db: AsyncSession, status: str | None = None, **kwargs) -> str:
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.menu_item)
    )
    if status:
        query = query.where(Order.status == OrderStatus(status))

    result = await db.execute(query)
    orders = result.scalars().all()
    return json.dumps({
        "orders": [o.to_dict() for o in orders],
        "count": len(orders),
    })


async def execute_update_order_status(
    db: AsyncSession, order_id: int, status: str, **kwargs
) -> str:
    order = await db.get(Order, order_id)
    if not order:
        return json.dumps({"error": f"Order #{order_id} not found."})

    order.status = OrderStatus(status)
    await db.commit()
    return json.dumps({
        "message": f"Order #{order_id} status updated to '{status}'.",
        "order_id": order_id,
        "new_status": status,
    })


async def execute_get_menu_admin(db: AsyncSession, **kwargs) -> str:
    """Admin version — shows ALL items including unavailable."""
    result = await db.execute(select(MenuItem))
    items = result.scalars().all()
    return json.dumps({"menu_items": [i.to_dict() for i in items], "count": len(items)})


# ---------------------------------------------------------------------------
# Registry mapping tool name → executor
# ---------------------------------------------------------------------------

ADMIN_TOOL_EXECUTORS = {
    "create_menu_item": execute_create_menu_item,
    "update_menu_item": execute_update_menu_item,
    "delete_menu_item": execute_delete_menu_item,
    "list_orders": execute_list_orders,
    "update_order_status": execute_update_order_status,
    "get_menu": execute_get_menu_admin,
}
