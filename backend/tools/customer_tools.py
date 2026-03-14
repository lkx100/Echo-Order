"""Customer-facing tool definitions and executors for the LLM."""

import json
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import MenuItem, Order, OrderItem, OrderStatus


# ---------------------------------------------------------------------------
# Tool definitions (OpenAI function-calling schema for Groq)
# ---------------------------------------------------------------------------

CUSTOMER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_menu",
            "description": "Retrieve all currently available menu items with their IDs, names, descriptions, prices, and categories. IMPORTANT: Call this BEFORE placing any order to get current availability and menu_item_id values. Menu availability changes frequently.",
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
            "description": "Place a new order for the customer. IMPORTANT: Only call this with menu_item_id values from the current get_menu response. NEVER use IDs from memory or previous conversations. Only call after confirming exact items and quantities with the customer.",
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
    {
        "type": "function",
        "function": {
            "name": "cancel_order",
            "description": "Cancel a pending order. Only works if the order is still in pending status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "The order ID to cancel",
                    }
                },
                "required": ["order_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "modify_order",
            "description": "Modify a pending order by replacing its items with a new list. Only works if the order is still pending. Use get_order_status first to see current items, then call this with the full updated item list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "The order ID to modify",
                    },
                    "items": {
                        "type": "array",
                        "description": "The complete new list of items for the order (replaces all existing items)",
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
                    },
                },
                "required": ["order_id", "items"],
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

    print(f"[GET_MENU] Returning {len(menu)} available menu items:")
    for item in menu:
        print(f"  - ID {item['id']:2d}: {item['name']:30s} ${item['price']:.2f}")

    return json.dumps({"menu_items": menu, "count": len(menu)})


async def execute_place_order(db: AsyncSession, items: list[dict], **kwargs) -> str:
    """Create an order from a list of {menu_item_id, quantity}."""
    print(f"[PLACE_ORDER] Received order request:")
    print(f"[PLACE_ORDER] Items: {json.dumps(items, indent=2)}")

    order = Order()
    db.add(order)
    await db.flush()  # get order.id

    total = 0.0
    order_items_info = []

    for entry in items:
        menu_item_id = entry["menu_item_id"]
        menu_item = await db.get(MenuItem, menu_item_id)

        if not menu_item:
            error_msg = f"Item with ID {menu_item_id} does not exist in the database."
            print(f"[PLACE_ORDER] ❌ ERROR: {error_msg}")
            return json.dumps({
                "error": error_msg,
                "message": "This item is not in our system. Please check the menu and try again."
            })

        if not menu_item.is_available:
            error_msg = f"'{menu_item.name}' is currently not available."
            print(f"[PLACE_ORDER] ❌ ERROR: {error_msg}")
            return json.dumps({
                "error": error_msg,
                "item_name": menu_item.name,
                "message": f"Sorry, {menu_item.name} is not available right now. Please choose a different item from the menu."
            })

        print(f"[PLACE_ORDER] ✅ Matched ID {menu_item_id} → {menu_item.name} (${menu_item.price})")

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

    print(f"[PLACE_ORDER] ✅ Order #{order.id} created successfully! Total: ${total:.2f}")
    print(f"[PLACE_ORDER] Items: {order_items_info}")

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


async def execute_cancel_order(db: AsyncSession, order_id: int, **kwargs) -> str:
    """Cancel a pending order."""
    order = await db.get(Order, order_id)
    if not order:
        return json.dumps({"error": f"Order #{order_id} not found."})

    if order.status != OrderStatus.PENDING:
        return json.dumps({"error": f"Order #{order_id} cannot be cancelled — it's already {order.status.value}."})

    order.status = OrderStatus.CANCELLED
    await db.commit()
    return json.dumps({"message": f"Order #{order_id} has been cancelled.", "order_id": order_id})


async def execute_modify_order(db: AsyncSession, order_id: int, items: list[dict], **kwargs) -> str:
    """Replace all items in a pending order with a new list."""
    order = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = order.scalar_one_or_none()
    if not order:
        return json.dumps({"error": f"Order #{order_id} not found."})

    if order.status != OrderStatus.PENDING:
        return json.dumps({"error": f"Order #{order_id} can't be modified — it's already {order.status.value}."})

    # Remove old items
    for old_item in order.items:
        await db.delete(old_item)

    # Add new items
    total = 0.0
    order_items_info = []
    for entry in items:
        menu_item = await db.get(MenuItem, entry["menu_item_id"])
        if not menu_item or not menu_item.is_available:
            return json.dumps({"error": f"Menu item with ID {entry['menu_item_id']} not found or unavailable."})

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
        "items": order_items_info,
        "status": "pending",
    })


# ---------------------------------------------------------------------------
# Registry mapping tool name → executor
# ---------------------------------------------------------------------------

CUSTOMER_TOOL_EXECUTORS = {
    "get_menu": execute_get_menu,
    "place_order": execute_place_order,
    "get_order_status": execute_get_order_status,
    "cancel_order": execute_cancel_order,
    "modify_order": execute_modify_order,
}
