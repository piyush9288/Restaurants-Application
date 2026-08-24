import os

files = {
    'app/models/user.py': '''from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    RESTAURANT = "RESTAURANT"
    DELIVERY_PARTNER = "DELIVERY_PARTNER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
''',
    'app/models/profiles.py': '''from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)

class RestaurantProfile(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    
class DeliveryPartnerProfile(Base):
    __tablename__ = "delivery_partners"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_online = Column(Boolean, default=False)
''',
    'app/models/menu.py': '''from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
''',
    'app/models/order.py': '''from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    delivery_partner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="PLACED")
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
''',
    'app/db/base_class.py': '''from app.db.base import Base
from app.models.user import User
from app.models.profiles import CustomerProfile, RestaurantProfile, DeliveryPartnerProfile
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
'''
}

for filepath, content in files.items():
    with open(filepath, 'w') as f:
        f.write(content)
