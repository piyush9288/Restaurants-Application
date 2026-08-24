import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';


export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('Please login to view your orders.');
        setLoading(false);
        return;
      }

      setLoading(true);
      fetch(API_URL + '/api/orders/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data.reverse()); // Newest first
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch orders.');
          setLoading(false);
        });
    }, [])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ff5a5f" style={{marginTop: 50}} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 20 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={styles.statusBadge}>{item.status}</Text>
              </View>
              <Text style={styles.total}>Total: ${item.total_amount.toFixed(2)}</Text>
              <Text style={styles.itemsCount}>{item.items?.length || 0} items included</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't placed any orders yet.</Text>}
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
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057'
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff5a5f',
    marginBottom: 5,
  },
  itemsCount: {
    color: '#6c757d',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#6c757d',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: 'red',
    fontSize: 16,
  }
});
