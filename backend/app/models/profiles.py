from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)

class RestaurantProfile(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    type = Column(String, default="FOOD") # 'FOOD' or 'MART'
    photo_url = Column(String, nullable=True)
    offer_text = Column(String, default="🎉 Flat ₹150 OFF")
    is_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    
    # Financials
    total_earnings = Column(Integer, default=0)
    upi_id = Column(String, nullable=True)
    withdrawn_amount = Column(Integer, default=0)
    
class DeliveryPartnerProfile(Base):
    __tablename__ = "delivery_partners"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_online = Column(Boolean, default=False)
    
    # Financials
    total_earnings = Column(Integer, default=0)
    upi_id = Column(String, nullable=True)
    withdrawn_amount = Column(Integer, default=0)
