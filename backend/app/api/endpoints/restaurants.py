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

@router.get("/", response_model=List[RestaurantProfileResponse])
def get_restaurants(all: bool = False, db: Session = Depends(get_db)):
    if all:
        return db.query(RestaurantProfile).all()
    return db.query(RestaurantProfile).filter(RestaurantProfile.is_verified == True).all()

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
