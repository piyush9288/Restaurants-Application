from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.order import Order, OrderItem, OrderStatus
from app.models.menu import MenuItem
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Only customers can place orders")
        
    total = 0.0
    items_to_create = []
    for item in order_in.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
        if not menu_item or menu_item.restaurant_id != order_in.restaurant_id:
            raise HTTPException(status_code=400, detail=f"Invalid menu item {item.menu_item_id}")
        if not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"Item {menu_item.name} is not available")
            
        items_to_create.append(
            OrderItem(
                menu_item_id=menu_item.id,
                quantity=item.quantity,
                price=menu_item.price
            )
        )
        total += menu_item.price * item.quantity
        
    new_order = Order(
        customer_id=current_user.id,
        restaurant_id=order_in.restaurant_id,
        status=OrderStatus.PENDING,
        total_amount=total
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    for order_item in items_to_create:
        order_item.order_id = new_order.id
        db.add(order_item)
        
    db.commit()
    db.refresh(new_order)
    return new_order

from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

optional_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/login/access-token", auto_error=False)

def get_optional_user(db: Session = Depends(get_db), token: Optional[str] = Depends(optional_oauth2)):
    if not token:
        return None
    try:
        from app.core.config import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
        return user
    except JWTError:
        return None

@router.get("/", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_user)):
    if not current_user:
        return db.query(Order).all() # Admin view (unprotected for demo)
    
    if current_user.role == UserRole.CUSTOMER:
        return db.query(Order).filter(Order.customer_id == current_user.id).all()
    elif current_user.role == UserRole.RESTAURANT:
        from app.models.profiles import RestaurantProfile
        restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.user_id == current_user.id).first()
        if not restaurant:
            return []
        return db.query(Order).filter(Order.restaurant_id == restaurant.id).all()
    elif current_user.role == UserRole.DELIVERY_PARTNER:
        from sqlalchemy import or_
        return db.query(Order).filter(
            or_(
                Order.delivery_partner_id == current_user.id,
                (Order.status == 'READY_FOR_PICKUP') & (Order.delivery_partner_id == None)
            )
        ).all()
    return db.query(Order).all()

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int, 
    status: str, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # If transitioning to DELIVERED, add earnings (only once)
    if status == 'DELIVERED' and order.status != 'DELIVERED':
        from app.models.profiles import RestaurantProfile, DeliveryPartnerProfile
        restaurant = db.query(RestaurantProfile).filter(RestaurantProfile.id == order.restaurant_id).first()
        if restaurant:
            # Base price earnings (approx) or total amount. Using total_amount for simplicity.
            restaurant.total_earnings = getattr(restaurant, 'total_earnings', 0) + order.total_amount
            
        if order.delivery_partner_id:
            rider = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == order.delivery_partner_id).first()
            if rider:
                # Flat ₹40 delivery fee
                rider.total_earnings = getattr(rider, 'total_earnings', 0) + 40
                
    order.status = status
    
    # If a delivery rider accepts it, assign it to them
    if current_user and current_user.role == UserRole.DELIVERY_PARTNER:
        # Only assign if not already assigned
        if order.delivery_partner_id is None:
            order.delivery_partner_id = current_user.id
            
    db.commit()
    db.refresh(order)
    return order
