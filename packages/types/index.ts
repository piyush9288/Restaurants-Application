export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_STAFF = 'RESTAURANT_STAFF',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantProfile {
  id: string;
  user_id: string;
  restaurant_name: string;
  description?: string;
  address: string;
  is_verified: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  phone_number?: string;
  saved_addresses?: any; // could be typed further
}

export interface DeliveryPartnerProfile {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_number: string;
  is_active: boolean;
  current_latitude?: number;
  current_longitude?: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  image_url?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  delivery_partner_id?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
}
