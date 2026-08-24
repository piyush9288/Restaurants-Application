import { StyleSheet, Text, View, FlatList, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';


export default function EarningsScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rider_token') : null;
    if (!token) return;

    fetch(API_URL + '/api/orders/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Show only delivered orders
          setOrders(data.filter((o: any) => o.status === 'DELIVERED').reverse());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const totalEarnings = orders.length * 5.0; // Flat $5 per delivery mock

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Earnings</Text>
      </View>
      
      <View style={styles.earningsCard}>
         <Text style={{fontSize: 16, color: '#6c757d'}}>Total Earned Today</Text>
         <Text style={{fontSize: 40, fontWeight: 'bold', color: '#28a745'}}>${totalEarnings.toFixed(2)}</Text>
         <Text style={{color: '#6c757d', marginTop: 10}}>{orders.length} deliveries completed</Text>
      </View>

      <Text style={styles.sectionTitle}>Completed Deliveries</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={styles.statusBadge}>{item.status}</Text>
              </View>
              <Text style={{color: '#28a745', fontWeight: 'bold'}}>+ $5.00 earned</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No deliveries completed yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold' },
  earningsCard: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10 },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { backgroundColor: '#e9ecef', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 10, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#6c757d' }
});
