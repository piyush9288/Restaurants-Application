from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Food Delivery Platform"
    SECRET_KEY: str = "supersecretkey_please_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return "postgresql+psycopg://food_user:food_password@localhost:5432/food_delivery"

settings = Settings()
