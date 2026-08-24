from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.profiles import RestaurantProfile
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_data():
    db = SessionLocal()
    
    # Check if we already have restaurants
    existing = db.query(RestaurantProfile).count()
    if existing > 0:
        print("Data already seeded.")
        return

    # Create dummy users for restaurants
    r1_user = User(email="burger@test.com", hashed_password=get_password_hash("password"), role=UserRole.RESTAURANT, is_active=True)
    r2_user = User(email="sushi@test.com", hashed_password=get_password_hash("password"), role=UserRole.RESTAURANT, is_active=True)
    r3_user = User(email="pizza@test.com", hashed_password=get_password_hash("password"), role=UserRole.RESTAURANT, is_active=True)
    
    db.add_all([r1_user, r2_user, r3_user])
    db.commit()
    db.refresh(r1_user)
    db.refresh(r2_user)
    db.refresh(r3_user)

    # Create profiles
    r1 = RestaurantProfile(user_id=r1_user.id, name="Gourmet Burger Kitchen", description="American, Burgers", address="123 Main St", is_verified=True)
    r2 = RestaurantProfile(user_id=r2_user.id, name="Sushi Zen", description="Japanese, Sushi", address="456 Oak St", is_verified=True)
    r3 = RestaurantProfile(user_id=r3_user.id, name="Pizza Paradiso", description="Italian, Pizza", address="789 Pine St", is_verified=True)
    
    db.add_all([r1, r2, r3])
    db.commit()
    
    print("Successfully seeded 3 restaurants!")

if __name__ == "__main__":
    seed_data()
