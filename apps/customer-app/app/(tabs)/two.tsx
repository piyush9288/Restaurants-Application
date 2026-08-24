import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/orders/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data.reverse() : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return '#f0ad4e';
      case 'READY_FOR_PICKUP': return '#17a2b8';
      case 'OUT_FOR_DELIVERY': return '#007bff';
      case 'DELIVERED': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Preparing your food 🍲';
      case 'READY_FOR_PICKUP': return 'Food is ready 🛍️';
      case 'OUT_FOR_DELIVERY': return 'On the way 🛵';
      case 'DELIVERED': return 'Delivered ✅';
      default: return status;
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.restaurantName}>Restaurant #{item.restaurant_id}</Text>
          <Text style={styles.orderId}>Order #{item.id}</Text>
        </View>
        <Text style={[styles.statusBadge, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      
      <View style={styles.separator} />
      
      <View style={styles.itemsList}>
        {item.items && item.items.map((orderItem: any, idx: number) => (
          <Text key={idx} style={styles.itemText}>{orderItem.quantity} x {orderItem.menu_item?.name || 'Item'}</Text>
        ))}
      </View>

      <View style={styles.separator} />
      
      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>Total: ₹{item.total_amount}</Text>
        <TouchableOpacity style={styles.reorderBtn} onPress={() => router.push('/')}>
          <Text style={styles.reorderText}>REORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Past Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#fc8019" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 15 }}
          renderItem={renderOrder}
          ListEmptyComponent={
            <View style={styles.emptyState}>
               <Text style={{fontSize: 50, marginBottom: 15}}>🍽️</Text>
               <Text style={styles.emptyText}>You haven't ordered anything yet.</Text>
               <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
                 <Text style={{color: '#fff', fontWeight: 'bold'}}>Browse Restaurants</Text>
               </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1c1c1c' },
  
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#3e4152', marginBottom: 4 },
  orderId: { fontSize: 12, color: '#686b78' },
  statusBadge: { fontSize: 13, fontWeight: '700', backgroundColor: '#f9f9f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  
  separator: { height: 1, backgroundColor: '#e9e9eb', marginVertical: 12, borderStyle: 'dashed' },
  
  itemsList: { marginVertical: 5 },
  itemText: { fontSize: 14, color: '#535665', marginBottom: 4 },
  
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 15, fontWeight: '700', color: '#3e4152' },
  reorderBtn: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fc8019', borderRadius: 6 },
  reorderText: { color: '#fc8019', fontWeight: '700', fontSize: 12 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#686b78', fontSize: 16, marginBottom: 20 },
  browseBtn: { backgroundColor: '#fc8019', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }
});
