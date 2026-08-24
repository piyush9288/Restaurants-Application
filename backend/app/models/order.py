from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base
import enum

class OrderStatus(str, enum.Enum):
    PENDING = 'PENDING'
    ACCEPTED = 'ACCEPTED'
    PREPARING = 'PREPARING'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP'
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY'
    DELIVERED = 'DELIVERED'
    CANCELLED = 'CANCELLED'


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    delivery_partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="PENDING")
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
