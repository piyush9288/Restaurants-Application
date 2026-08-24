import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('restaurant_token') : null;

  const fetchOrders = () => {
    const token = getToken();
    if (!token) return;

    fetch('http://127.0.0.1:8000/api/orders/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data.filter((o: any) => o.status !== 'DELIVERED').reverse());
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
    if (typeof window !== 'undefined') localStorage.removeItem('restaurant_token');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.title}>Restaurant Partner Dashboard</Text>
          <TouchableOpacity onPress={handleLogout}><Text style={{color: 'red', fontWeight: 'bold'}}>Logout</Text></TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Manage your incoming orders</Text>
      </View>

      {loading && orders.length === 0 ? (
        <ActivityIndicator size="large" color="#e7a700" style={{marginTop: 50}} />
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
              
              <Text style={{fontWeight: 'bold', marginBottom: 10}}>${item.total_amount.toFixed(2)}</Text>
              
              <View style={styles.actions}>
                {item.status === 'PENDING' && (
                  <TouchableOpacity style={[styles.btn, {backgroundColor: '#28a745'}]} onPress={() => updateStatus(item.id, 'ACCEPTED')}>
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'ACCEPTED' && (
                  <TouchableOpacity style={[styles.btn, {backgroundColor: '#ffc107'}]} onPress={() => updateStatus(item.id, 'PREPARING')}>
                    <Text style={styles.btnText}>Start Preparing</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'PREPARING' && (
                  <TouchableOpacity style={[styles.btn, {backgroundColor: '#17a2b8'}]} onPress={() => updateStatus(item.id, 'READY_FOR_PICKUP')}>
                    <Text style={styles.btnText}>Ready for Pickup</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No active orders right now.</Text>}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e7a700'
  },
  subtitle: {
    color: '#6c757d',
    marginTop: 5,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#6c757d',
  }
});
