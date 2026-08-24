import React, { createContext, useState, useContext } from 'react';

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const addToCart = (item: any, restId: string) => {
    // If adding from a different restaurant, clear cart
    if (restaurantId && restaurantId !== restId) {
      setCart([{ ...item, quantity: 1 }]);
      setRestaurantId(restId);
      return;
    }
    
    setRestaurantId(restId);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart, restaurantId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
