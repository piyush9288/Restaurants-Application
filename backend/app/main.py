from fastapi import FastAPI
from app.core.config import settings
from app.api.auth import router as auth_router
from sqlalchemy import text
from app.db.session import engine

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
def on_startup():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE customer_profiles ADD COLUMN address VARCHAR;"))
            conn.commit()
            print("Added address column to customer_profiles")
    except Exception:
        pass
        
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE customer_profiles ADD COLUMN pincode VARCHAR;"))
            conn.execute(text("ALTER TABLE restaurants ADD COLUMN pincode VARCHAR;"))
            conn.commit()
            print("Added pincode columns")
    except Exception as e:
        print("Column might already exist or error:", e)
        
    try:
        from app.db.session import SessionLocal
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        
        db = SessionLocal()
        admin_user = db.query(User).filter(User.email == "admin").first()
        if not admin_user:
            hashed_pw = get_password_hash("admin12")
            new_admin = User(email="admin", hashed_password=hashed_pw, role=UserRole.ADMIN, is_active=True)
            db.add(new_admin)
            db.commit()
            print("Successfully created default admin user: admin / admin12")
        db.close()
    except Exception as e:
        print("Failed to seed admin user:", e)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from app.api.endpoints import restaurants, orders, users

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
@app.get("/")
def read_root():
    return {"message": "Welcome to the Food Delivery Platform API"}
