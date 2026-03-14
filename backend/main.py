"""Echo-Order — FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database.engine import init_db, async_session
from database.models import MenuItem
from routers.voice import router as voice_router

from sqlalchemy import select


# ---------------------------------------------------------------------------
# Lifespan — runs on startup / shutdown
# ---------------------------------------------------------------------------

async def _seed_menu(session):
    """Insert sample menu items if the table is empty."""
    result = await session.execute(select(MenuItem))
    if result.scalars().first() is not None:
        return  # already seeded

    sample_items = [
        MenuItem(name="Margherita Pizza", description="Classic tomato sauce, mozzarella, and fresh basil", price=12.99, category="Pizza"),
        MenuItem(name="Pepperoni Pizza", description="Loaded with pepperoni and cheese", price=14.99, category="Pizza"),
        MenuItem(name="Veggie Burger", description="Grilled veggie patty with lettuce, tomato, and special sauce", price=10.99, category="Burger"),
        MenuItem(name="Classic Cheeseburger", description="Beef patty with cheddar, pickles, and onion", price=11.99, category="Burger"),
        MenuItem(name="Caesar Salad", description="Romaine lettuce, parmesan, croutons, caesar dressing", price=8.99, category="Salad"),
        MenuItem(name="Garlic Bread", description="Toasted bread with garlic butter and herbs", price=4.99, category="Sides"),
        MenuItem(name="French Fries", description="Crispy golden fries with sea salt", price=3.99, category="Sides"),
        MenuItem(name="Coca-Cola", description="Classic Coke, 330ml", price=1.99, category="Drinks"),
        MenuItem(name="Lemonade", description="Fresh squeezed lemonade", price=2.99, category="Drinks"),
        MenuItem(name="Chocolate Brownie", description="Warm chocolate brownie with vanilla ice cream", price=6.99, category="Dessert"),
    ]

    session.add_all(sample_items)
    await session.commit()
    print(f"[Seed] Inserted {len(sample_items)} sample menu items.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    await init_db()
    async with async_session() as session:
        await _seed_menu(session)
    print("[Echo-Order] Server started. Visit /docs for API documentation.")
    yield
    # --- Shutdown ---
    print("[Echo-Order] Server shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Echo-Order API",
    description="AI Voice Order Management System — backend API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for TTS audio
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Routers
app.include_router(voice_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "echo-order"}
