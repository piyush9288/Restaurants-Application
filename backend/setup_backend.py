import os

files = {
    'app/core/config.py': '''from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Food Delivery Platform"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "food_user"
    POSTGRES_PASSWORD: str = "food_password"
    POSTGRES_DB: str = "food_delivery"
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

settings = Settings()
''',
    'app/db/session.py': '''from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
''',
    'app/db/base.py': '''from sqlalchemy.orm import declarative_base

Base = declarative_base()
''',
    'app/main.py': '''from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Food Delivery Platform API"}
'''
}

for filepath, content in files.items():
    with open(filepath, 'w') as f:
        f.write(content)
