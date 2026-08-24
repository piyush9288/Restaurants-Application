# Food Delivery Platform 🍔🚀

A complete End-to-End Food Delivery Ecosystem built with a modern stack!

## Architecture

This Monorepo contains 4 main applications, all powered by a single scalable backend.

### 1. Backend (`/backend`)
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (running via Docker)
- **Features:** JWT Authentication, Role-based Access Control (Customer, Restaurant, Rider, Admin), Endpoints for Orders, Restaurants, and Menu.

### 2. Customer App (`/apps/customer-app`)
- **Framework:** Expo React Native
- **Features:** Browse restaurants, add items to Cart, Checkout system, and track "My Orders" in real-time.

### 3. Restaurant Partner App (`/apps/restaurant-app`)
- **Framework:** Expo React Native
- **Features:** Secure login, real-time incoming order dashboard. Accept, prepare, and mark orders "Ready for pickup".

### 4. Delivery Rider App (`/apps/delivery-app`)
- **Framework:** Expo React Native
- **Features:** Secure login, Online/Offline tracking toggle, accept assigned deliveries, route mapping mock, and Earnings dashboard calculation ($5/delivery).

### 5. Admin Dashboard Web (`/apps/admin-web`)
- **Framework:** Vite + React (TypeScript)
- **Features:** Monitor all global orders and manage restaurant onboardings from a single pane of glass.

## How to Run

1. **Start Backend & Database:**
   ```bash
   docker compose up -d
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. **Run the Apps (in separate terminals):**
   ```bash
   # Admin Panel
   cd apps/admin-web && npm run dev
   
   # Customer App
   cd apps/customer-app && npm run web
   
   # Restaurant App
   cd apps/restaurant-app && npm run web
   
   # Delivery App
   cd apps/delivery-app && npm run web
   ```

## Test Accounts
- **Customer:** Any registered email or `test@test.com`
- **Restaurant:** `pizza@test.com`, `burger@test.com`, `sushi@test.com` (Pass: `password`)
- **Delivery Rider:** `rider@test.com` (Pass: `password`)
