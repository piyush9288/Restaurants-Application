import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '../CartContext';
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';


export default function RestaurantMenuScreen() {
  const { id, name } = useLocalSearchParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToCart, cart } = useCart();

  useEffect(() => {
    fetch(`${API_URL}/api/restaurants/${id}/menu`)
      .then(res => res.json())
      .then(data => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleAdd = (item: any) => {
    addToCart(item, id as string);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{name}'s Menu</Text>
      </View>

      <View style={styles.cartBar}>
        <Text style={{fontWeight: 'bold'}}>Cart Items: {cart.reduce((a: any, b: any) => a + b.quantity, 0)}</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.checkoutBtn}>
          <Text style={{color: 'white', fontWeight: 'bold'}}>View Cart</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff5a5f" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={{height: 70, width: 70, backgroundColor: '#ffe5e5', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15}}>
                 <Text style={{fontSize: 24}}>🍽️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(item)}>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No menu items found.</Text>}
        />
      )}
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
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  checkoutBtn: {
    backgroundColor: '#ff5a5f',
    padding: 10,
    borderRadius: 8
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
  itemDesc: {
    color: '#6c757d',
    marginTop: 4,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#ff5a5f',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#6c757d',
  }
});
