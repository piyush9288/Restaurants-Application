from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from app.models.order import OrderStatus

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int

class OrderCreate(BaseModel):
    restaurant_id: int
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    restaurant_id: int
    delivery_partner_id: Optional[int] = None
    status: OrderStatus
    total_amount: float
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
