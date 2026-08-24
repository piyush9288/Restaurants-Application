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
    except Exception as e:
        print("Column might already exist or error:", e)

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
