from fastapi import FastAPI
from app.core.config import settings
from app.api.auth import router as auth_router

app = FastAPI(title=settings.PROJECT_NAME)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from app.api.endpoints import restaurants, orders

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
@app.get("/")
def read_root():
    return {"message": "Welcome to the Food Delivery Platform API"}
