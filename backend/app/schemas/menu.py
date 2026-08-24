from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    is_available: bool = True
    image_url: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemResponse(MenuItemBase):
    id: int
    restaurant_id: int

    class Config:
        from_attributes = True
