import React, { createContext, useState, useContext } from 'react';

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  
  const [martCart, setMartCart] = useState<any[]>([]);

  const addToCart = (item: any, restId: string) => {
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

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      let updated;
      if (existing.quantity > 1) {
        updated = prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      } else {
        updated = prev.filter((i) => i.id !== itemId);
      }
      if (updated.length === 0) setRestaurantId(null);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
  };

  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // MART CART LOGIC
  const addToMartCart = (item: any) => {
    setMartCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromMartCart = (itemId: string | number) => {
    setMartCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const clearMartCart = () => setMartCart([]);
  
  const getMartTotal = () => martCart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const [globalService, setGlobalService] = useState('FOOD');

  const [userProfile, setUserProfileState] = useState({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '9876543210',
      address: '',
      pincode: '',
      photoUri: ''
  });

  React.useEffect(() => {
      // Async dynamic import to avoid crashes if AsyncStorage is missing
        const loadProfile = async () => {
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                let token = null;
                try {
                    token = typeof window !== 'undefined' ? localStorage.getItem('token') : await AsyncStorage.getItem('token');
                } catch(e) {}
                
                if (token) {
                    try {
                        const res = await fetch(`${API_URL}/api/users/me/profile`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.name) {
                                setUserProfileState(data);
                                await AsyncStorage.setItem('globalUserProfile', JSON.stringify(data));
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('Failed fetching user profile from server', e);
                    }
                }
                
                const saved = await AsyncStorage.getItem('globalUserProfile');
                if (saved) {
                    setUserProfileState(JSON.parse(saved));
                }
            } catch (e) {
                console.log('No saved profile or async storage error');
            }
        };
        loadProfile();
  }, []);

  const setUserProfile = async (profile: any) => {
      setUserProfileState(profile);
      try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('globalUserProfile', JSON.stringify(profile));
      } catch(e) {}
  };

  return (
    <CartContext.Provider value={{ 
        cart, addToCart, clearCart, removeFromCart, getCartTotal, restaurantId,
        martCart, addToMartCart, removeFromMartCart, clearMartCart, getMartTotal,
        globalService, setGlobalService,
        userProfile, setUserProfile
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
