"""Pydantic schemas for API request / response models."""

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Voice pipeline
# ---------------------------------------------------------------------------

class VoiceInputResponse(BaseModel):
    status: str
    session_id: str


class TextOutputResponse(BaseModel):
    session_id: str
    transcript: str
    response_text: str
    audio_url: str | None = None


# ---------------------------------------------------------------------------
# Menu
# ---------------------------------------------------------------------------

class MenuItemSchema(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str
    is_available: bool


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------

class OrderItemSchema(BaseModel):
    menu_item_id: int
    menu_item_name: str | None = None
    quantity: int
    subtotal: float


class OrderSchema(BaseModel):
    id: int
    status: str
    total_amount: float
    created_at: str
    items: list[OrderItemSchema]
