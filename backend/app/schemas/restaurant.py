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
    is_banned: bool = False
    total_earnings: int = 0
    withdrawn_amount: int = 0
    rating: float = 0.0
    review_count: int = 0

    class Config:
        from_attributes = True

from datetime import datetime
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    restaurant_id: int
    customer_id: int
    created_at: datetime
    customer_name: Optional[str] = "Customer"

    class Config:
        from_attributes = True
