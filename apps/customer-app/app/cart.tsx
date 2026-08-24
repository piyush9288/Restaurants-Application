import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from './CartContext';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';


export default function CartScreen() {
  const { cart, clearCart, restaurantId } = useCart();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);

  const totalAmount = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      if (Platform.OS === 'web') alert("Please login first to place an order");
      else Alert.alert("Login Required", "Please login first to place an order");
      router.push('/login');
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        restaurant_id: restaurantId,
        items: cart.map((i: any) => ({
          menu_item_id: i.id,
          quantity: i.quantity
        }))
      };

      const response = await fetch(API_URL + '/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setPlacing(false);

      if (response.ok) {
        clearCart();
        if (Platform.OS === 'web') alert(`Order placed successfully! Order ID: ${data.id}`);
        else Alert.alert("Success", `Order placed successfully! Order ID: ${data.id}`);
        router.replace('/');
      } else {
        const errorMsg = Array.isArray(data.detail) ? data.detail.map((e: any) => e.msg).join(', ') : data.detail;
        if (Platform.OS === 'web') alert(errorMsg || "Checkout Failed");
        else Alert.alert("Error", errorMsg || "Checkout Failed");
      }
    } catch (err) {
      console.error(err);
      setPlacing(false);
      if (Platform.OS === 'web') alert("Network error during checkout.");
      else Alert.alert("Error", "Network error during checkout.");
    }
  };

  if (cart.length === 0) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{fontSize: 18, color: '#6c757d', marginBottom: 20}}>Your cart is empty.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</Text>
            </View>
            <Text style={{fontWeight: 'bold', fontSize: 16}}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15}}>
          <Text style={{fontSize: 18, fontWeight: 'bold'}}>Total:</Text>
          <Text style={{fontSize: 18, fontWeight: 'bold', color: '#ff5a5f'}}>${totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} disabled={placing}>
          <Text style={styles.checkoutText}>{placing ? "Placing Order..." : "Checkout"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: '#ff5a5f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemPrice: {
    color: '#6c757d',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: 40
  },
  checkoutBtn: {
    backgroundColor: '#ff5a5f',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
