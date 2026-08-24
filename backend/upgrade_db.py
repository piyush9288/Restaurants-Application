import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def upgrade_db():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE customer_profiles ADD COLUMN address VARCHAR;"))
            conn.commit()
            print("Successfully added address column to customer_profiles")
        except Exception as e:
            print(f"Error (maybe column already exists): {e}")

if __name__ == "__main__":
    upgrade_db()
