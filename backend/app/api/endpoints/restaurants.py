from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.profiles import RestaurantProfile
from app.models.menu import MenuItem
from app.schemas.restaurant import RestaurantProfileResponse, RestaurantProfileCreate, RestaurantProfileUpdate
from app.schemas.menu import MenuItemResponse, MenuItemCreate

router = APIRouter()

@router.get("/me", response_model=RestaurantProfileResponse)
def get_my_restaurant(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Not authorized")
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.user_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant profile not found")
    return restaurant

@router.post("/me", response_model=RestaurantProfileResponse)
def update_my_restaurant(
    profile_data: RestaurantProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.user_id == current_user.id).first()
    if restaurant:
        for key, value in profile_data.model_dump().items():
            setattr(restaurant, key, value)
    else:
        restaurant = RestaurantProfile(user_id=current_user.id, **profile_data.model_dump())
        db.add(restaurant)
        
    db.commit()
    db.refresh(restaurant)
    return restaurant

from pydantic import BaseModel
class WithdrawRequest(BaseModel):
    amount: float

@router.post("/withdraw")
def withdraw_earnings(
    request: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.user_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    available = restaurant.total_earnings - restaurant.withdrawn_amount
    if request.amount > available or request.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid withdrawal amount")
        
    if not restaurant.upi_id:
        raise HTTPException(status_code=400, detail="Please set UPI ID in profile first")
        
    restaurant.withdrawn_amount += request.amount
    db.commit()
    return {"message": "Withdrawal successful", "withdrawn_amount": restaurant.withdrawn_amount}

@router.get("/", response_model=List[RestaurantProfileResponse])
def get_restaurants(all: bool = False, db: Session = Depends(get_db)):
    from app.models.review import Review
    from sqlalchemy import func
    
    if all:
        restaurants = db.query(RestaurantProfile).all()
    else:
        restaurants = db.query(RestaurantProfile).filter(RestaurantProfile.is_verified == True, RestaurantProfile.is_banned == False).all()
        
    for r in restaurants:
        stats = db.query(func.avg(Review.rating), func.count(Review.id)).filter(Review.restaurant_id == r.id).first()
        r.rating = float(stats[0]) if stats[0] else 0.0
        r.review_count = stats[1] if stats[1] else 0
        
    return restaurants

@router.put("/{restaurant_id}/verify")
def verify_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Not found")
    restaurant.is_verified = True
    db.commit()
    return {"message": "Verified successfully"}

@router.get("/{restaurant_id}/menu", response_model=List[MenuItemResponse])
def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).all()

@router.post("/menu", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def add_menu_item(
    item: MenuItemCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.user_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant profile not found")

    new_item = MenuItem(
        restaurant_id=restaurant.id,
        **item.model_dump()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

from app.models.review import Review
from app.schemas.restaurant import ReviewCreate, ReviewResponse
from sqlalchemy import func

@router.put("/{restaurant_id}/ban")
def ban_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Not found")
    restaurant.is_banned = True
    db.commit()
    return {"message": "Banned successfully"}

@router.put("/{restaurant_id}/unban")
def unban_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Not found")
    restaurant.is_banned = False
    db.commit()
    return {"message": "Unbanned successfully"}

@router.post("/{restaurant_id}/reviews", response_model=ReviewResponse)
def add_review(restaurant_id: int, review: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.profiles import CustomerProfile
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only customers can leave reviews")
    new_review = Review(
        restaurant_id=restaurant_id,
        customer_id=current_user.id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    cust = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    name = cust.name if cust else "Customer"
    setattr(new_review, "customer_name", name)
    return new_review

@router.get("/{restaurant_id}/reviews", response_model=List[ReviewResponse])
def get_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    from app.models.profiles import CustomerProfile
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).all()
    for r in reviews:
        cust = db.query(CustomerProfile).filter(CustomerProfile.user_id == r.customer_id).first()
        r.customer_name = cust.name if cust else "Customer"
    return reviews

@router.get("/{restaurant_id}", response_model=RestaurantProfileResponse)
def get_restaurant_by_id(restaurant_id: int, db: Session = Depends(get_db)):
    from app.models.review import Review
    from sqlalchemy import func
    
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Not found")
        
    stats = db.query(func.avg(Review.rating), func.count(Review.id)).filter(Review.restaurant_id == restaurant.id).first()
    restaurant.rating = float(stats[0]) if stats[0] else 0.0
    restaurant.review_count = stats[1] if stats[1] else 0
    
    return restaurant

@router.delete("/{restaurant_id}")
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Not found")
    # cascading deletes would normally happen here or via DB constraints
    db.delete(restaurant)
    db.commit()
    return {"message": "Deleted successfully"}

@router.put("/{restaurant_id}", response_model=RestaurantProfileResponse)
def admin_update_restaurant(restaurant_id: int, profile_data: RestaurantProfileUpdate, db: Session = Depends(get_db)):
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Not found")
    
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(restaurant, key, value)
        
    db.commit()
    db.refresh(restaurant)
    return restaurant

@router.put("/menu/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    item_data: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.RESTAURANT:
        raise HTTPException(status_code=403, detail="Not authorized")
    restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.user_id == current_user.id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant profile not found")
        
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.restaurant_id == restaurant.id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    for key, value in item_data.model_dump().items():
        setattr(menu_item, key, value)
        
    db.commit()
    db.refresh(menu_item)
    return menu_item

from pydantic import BaseModel
from typing import List, Optional

class OfferBase(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    discount_amount: str = "50%"
    bg_color: str = "#fc8019"
    type: str = "FOOD"

class OfferCreate(OfferBase):
    pass

class OfferResponse(OfferBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

from app.models.profiles import Offer

@router.get("/offers/all", response_model=List[OfferResponse])
def get_all_offers(db: Session = Depends(get_db)):
    return db.query(Offer).all()

@router.post("/offers", response_model=OfferResponse)
def create_offer(offer: OfferCreate, db: Session = Depends(get_db)):
    db_offer = Offer(**offer.model_dump())
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer

@router.delete("/offers/{offer_id}")
def delete_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if offer:
        db.delete(offer)
        db.commit()
    return {"message": "Deleted"}
