import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('rider_token') : null;

  const fetchOrders = () => {
    const token = getToken();
    if (!token) return;

    fetch('http://127.0.0.1:8000/api/orders/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // In real app, only unassigned READY orders or ASSIGNED to this rider.
          // Since we skipped assignment logic for demo, rider sees all READY_FOR_PICKUP and OUT_FOR_DELIVERY
          setOrders(data.filter((o: any) => o.status === 'READY_FOR_PICKUP' || o.status === 'OUT_FOR_DELIVERY').reverse());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (orderId: number, status: string) => {
    fetch(`http://127.0.0.1:8000/api/orders/${orderId}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }).then(() => fetchOrders());
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('rider_token');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.title}>Rider Dashboard</Text>
          <TouchableOpacity onPress={handleLogout}><Text style={{color: 'red', fontWeight: 'bold'}}>Logout</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
          <Text style={styles.subtitle}>Available deliveries near you</Text>
          <TouchableOpacity onPress={() => setIsOnline(!isOnline)} style={[styles.statusToggle, {backgroundColor: isOnline ? '#28a745' : '#dc3545'}]}>
             <Text style={{color: '#fff', fontWeight: 'bold'}}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isOnline ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <Text style={{fontSize: 20, color: '#6c757d'}}>You are offline.</Text>
           <Text style={{color: '#6c757d'}}>Go online to receive deliveries.</Text>
        </View>
      ) : loading && orders.length === 0 ? (
        <ActivityIndicator size="large" color="#007bff" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={styles.statusBadge}>{item.status}</Text>
              </View>
              
              <View style={styles.mapMock}>
                 <Text style={{fontSize: 24, marginBottom: 5}}>🗺️</Text>
                 <Text style={{color: '#007bff', fontWeight: 'bold'}}>Route mapped automatically</Text>
              </View>

              <Text style={{marginBottom: 5, color: '#495057'}}>🏪 Pickup: Restaurant #{item.restaurant_id}</Text>
              <Text style={{marginBottom: 10, fontWeight: 'bold'}}>🏠 Dropoff: Customer #{item.customer_id}</Text>
              
              <View style={styles.actions}>
                {item.status === 'READY_FOR_PICKUP' && (
                  <TouchableOpacity style={[styles.btn, {backgroundColor: '#007bff'}]} onPress={() => updateStatus(item.id, 'OUT_FOR_DELIVERY')}>
                    <Text style={styles.btnText}>Pick Up Order</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'OUT_FOR_DELIVERY' && (
                  <TouchableOpacity style={[styles.btn, {backgroundColor: '#28a745'}]} onPress={() => updateStatus(item.id, 'DELIVERED')}>
                    <Text style={styles.btnText}>Mark Delivered</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No deliveries available right now.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#007bff' },
  subtitle: { color: '#6c757d' },
  statusToggle: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { backgroundColor: '#e9ecef', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: 'bold' },
  mapMock: { height: 100, backgroundColor: '#e9ecef', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  actions: { flexDirection: 'row', marginTop: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#6c757d' }
});
