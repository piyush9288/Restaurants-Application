from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

def seed_rider():
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "rider@test.com").first()
    if existing:
        print("Rider already exists")
        return
        
    rider_user = User(
        email="rider@test.com", 
        hashed_password=get_password_hash("password"), 
        role=UserRole.DELIVERY_PARTNER, 
        is_active=True
    )
    db.add(rider_user)
    db.commit()
    print("Delivery Rider seeded successfully!")

if __name__ == "__main__":
    seed_rider()
