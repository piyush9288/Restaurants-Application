from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.profiles import RestaurantProfile
from app.models.menu import MenuItem

def seed_menu():
    db = SessionLocal()
    
    # Get restaurants
    r1 = db.query(RestaurantProfile).filter(RestaurantProfile.name == "Gourmet Burger Kitchen").first()
    r2 = db.query(RestaurantProfile).filter(RestaurantProfile.name == "Sushi Zen").first()
    r3 = db.query(RestaurantProfile).filter(RestaurantProfile.name == "Pizza Paradiso").first()

    if not r1 or not r2 or not r3:
        print("Please run seed.py first!")
        return
        
    existing_menu = db.query(MenuItem).count()
    if existing_menu > 0:
        print("Menu items already seeded.")
        return

    menus = [
        # Burgers
        MenuItem(restaurant_id=r1.id, name="Classic Cheeseburger", description="Juicy beef patty with cheddar cheese.", price=8.99, is_available=True),
        MenuItem(restaurant_id=r1.id, name="Bacon Double Burger", description="Two patties with crispy bacon.", price=12.99, is_available=True),
        MenuItem(restaurant_id=r1.id, name="French Fries", description="Golden crispy fries.", price=3.49, is_available=True),
        
        # Sushi
        MenuItem(restaurant_id=r2.id, name="Spicy Tuna Roll", description="Fresh tuna with spicy mayo.", price=10.50, is_available=True),
        MenuItem(restaurant_id=r2.id, name="Salmon Sashimi", description="6 pieces of fresh salmon.", price=14.00, is_available=True),
        MenuItem(restaurant_id=r2.id, name="Miso Soup", description="Traditional warm miso soup.", price=2.99, is_available=True),
        
        # Pizza
        MenuItem(restaurant_id=r3.id, name="Margherita Pizza", description="Classic tomato and mozzarella.", price=11.99, is_available=True),
        MenuItem(restaurant_id=r3.id, name="Pepperoni Pizza", description="Loaded with pepperoni.", price=13.99, is_available=True),
        MenuItem(restaurant_id=r3.id, name="Garlic Bread", description="Toasted bread with garlic butter.", price=4.99, is_available=True),
    ]

    db.add_all(menus)
    db.commit()
    print("Successfully seeded menu items!")

if __name__ == "__main__":
    seed_menu()
