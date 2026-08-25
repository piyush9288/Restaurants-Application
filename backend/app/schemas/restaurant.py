from pydantic import BaseModel
from typing import Optional

class RestaurantProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    type: str = "FOOD"
    photo_url: Optional[str] = None
    upi_id: Optional[str] = None

class RestaurantProfileCreate(RestaurantProfileBase):
    pass

class RestaurantProfileUpdate(RestaurantProfileBase):
    pass

class RestaurantProfileResponse(RestaurantProfileBase):
    id: int
    user_id: int
    is_verified: bool
    total_earnings: int
    withdrawn_amount: int

    class Config:
        from_attributes = True
