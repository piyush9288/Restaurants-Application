from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class RestaurantProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str

class RestaurantProfileCreate(RestaurantProfileBase):
    pass

class RestaurantProfileResponse(RestaurantProfileBase):
    id: int
    user_id: int
    is_verified: bool

    class Config:
        from_attributes = True
