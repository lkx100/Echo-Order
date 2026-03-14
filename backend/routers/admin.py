"""Admin-only API endpoints for the Echo-Order dashboard."""

import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from database.engine import get_db
from database.models import MenuItem, Order, OrderItem, User, OrderStatus, RestaurantProfile
from auth import require_admin

router = APIRouter(prefix="/admin-api", tags=["Admin"])


# ---------------------------------------------------------------------------
# Restaurant Profile
# ---------------------------------------------------------------------------

class ProfileIn(BaseModel):
    restaurant_name: str
    tagline: str = ""
    phone: str = ""
    address: str = ""


@router.get("/profile")
async def get_profile(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return the restaurant profile (or null if not set up yet)."""
    result = await db.execute(select(RestaurantProfile).limit(1))
    profile = result.scalars().first()
    return {"profile": profile.to_dict() if profile else None}


@router.post("/profile")
async def save_profile(
    data: ProfileIn,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the restaurant profile (singleton row)."""
    result = await db.execute(select(RestaurantProfile).limit(1))
    profile = result.scalars().first()

    if profile:
        profile.restaurant_name = data.restaurant_name
        profile.tagline = data.tagline
        profile.phone = data.phone
        profile.address = data.address
        profile.updated_at = datetime.datetime.utcnow()
    else:
        profile = RestaurantProfile(
            restaurant_name=data.restaurant_name,
            tagline=data.tagline,
            phone=data.phone,
            address=data.address,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return {"profile": profile.to_dict()}


@router.get("/stats")
async def get_stats(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return high-level counts and revenue figures."""
    total_orders = await db.scalar(select(func.count()).select_from(Order))
    total_revenue = await db.scalar(select(func.sum(Order.total_amount))) or 0.0
    pending_orders = await db.scalar(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.PENDING)
    )
    total_menu_items = await db.scalar(select(func.count()).select_from(MenuItem))
    available_items = await db.scalar(
        select(func.count()).select_from(MenuItem).where(MenuItem.is_available == True)  # noqa: E712
    )
    total_users = await db.scalar(select(func.count()).select_from(User))

    return {
        "total_orders": total_orders or 0,
        "total_revenue": round(total_revenue, 2),
        "pending_orders": pending_orders or 0,
        "total_menu_items": total_menu_items or 0,
        "available_menu_items": available_items or 0,
        "total_users": total_users or 0,
    }


@router.get("/orders")
async def get_all_orders(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all orders with their items, newest first."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return {"orders": [o.to_dict() for o in orders]}


@router.get("/menu-items")
async def get_all_menu_items(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all menu items (including unavailable ones)."""
    result = await db.execute(
        select(MenuItem).order_by(MenuItem.category, MenuItem.name)
    )
    items = result.scalars().all()
    return {"menu_items": [i.to_dict() for i in items]}


@router.get("/users")
async def get_all_users(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all registered users (passwords excluded)."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {"users": [u.to_dict() for u in users]}
