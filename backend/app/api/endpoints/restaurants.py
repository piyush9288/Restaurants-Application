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
