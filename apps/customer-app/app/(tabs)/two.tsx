import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState('FOOD'); // 'FOOD' or 'MART'
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
      case 'PENDING': return orderType === 'MART' ? '#16a34a' : '#020617';
      case 'READY_FOR_PICKUP': return '#17a2b8';
      case 'OUT_FOR_DELIVERY': return '#007bff';
      case 'DELIVERED': return orderType === 'MART' ? '#15803d' : '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'PENDING': return orderType === 'MART' ? 'Packing items 🛒' : 'Preparing food 🍲';
      case 'READY_FOR_PICKUP': return 'Ready for pickup 🛍️';
      case 'OUT_FOR_DELIVERY': return 'On the way 🛵';
      case 'DELIVERED': return 'Delivered ✅';
      default: return status;
    }
  };

  // Filter mock logic: for now, separate by random id or just show all if backend doesn't support 'type'
  // Realistically we assume orders have 'is_mart' or we simulate it.
  const displayOrders = orders.filter(o => orderType === 'MART' ? o.is_mart === true : (o.is_mart !== true));

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.iconBox, { backgroundColor: orderType === 'MART' ? '#dcfce7' : '#f1f5f9' }]}>
                <Text style={{ fontSize: 20 }}>{orderType === 'MART' ? '🛒' : '🍽️'}</Text>
            </View>
            <View>
                <Text style={styles.restaurantName}>{orderType === 'MART' ? 'Instamart Store' : `Restaurant #${item.restaurant_id}`}</Text>
                <Text style={styles.orderDate}>Order #{item.id}</Text>
            </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: orderType === 'MART' ? '#dcfce7' : '#f1f5f9' }]}>
            <Text style={[{ fontSize: 12, fontWeight: '800' }, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
            </Text>
        </View>
      </View>
      
      <View style={styles.dashedLine} />
      
      <View style={styles.itemsList}>
        {item.items && item.items.map((orderItem: any, idx: number) => (
          <View key={idx} style={styles.itemRow}>
             <View style={[styles.qtyBox, { backgroundColor: orderType === 'MART' ? '#dcfce7' : '#f8fafc' }]}>
                 <Text style={[styles.qtyText, { color: orderType === 'MART' ? '#16a34a' : '#020617' }]}>{orderItem.quantity}</Text>
             </View>
             <Text style={styles.itemText}>x {orderItem.menu_item?.name || (orderType === 'MART' ? 'Grocery Item' : 'Food Item')}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dashedLine} />
      
      <View style={styles.orderFooter}>
        <View>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalText}>₹{item.total_amount}</Text>
        </View>
        <TouchableOpacity style={[styles.reorderBtn, { backgroundColor: orderType === 'MART' ? '#16a34a' : '#020617' }]} onPress={() => router.push('/')}>
          <Text style={styles.reorderText}>REORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Past Orders</Text>

        {/* Food / Instamart Toggle */}
        <View style={styles.toggleContainer}>
            <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.toggleBtn, orderType === 'FOOD' && styles.toggleActive]}
                onPress={() => setOrderType('FOOD')}
            >
                <Text style={[styles.toggleText, orderType === 'FOOD' && {color: '#020617', fontWeight: '900'}]}>Food Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.toggleBtn, orderType === 'MART' && styles.toggleActive]}
                onPress={() => setOrderType('MART')}
            >
                <Text style={[styles.toggleText, orderType === 'MART' && {color: '#16a34a', fontWeight: '900'}]}>Instamart</Text>
            </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={orderType === 'MART' ? '#16a34a' : '#020617'} style={{marginTop: 50}} />
      ) : displayOrders.length === 0 ? (
        <View style={styles.emptyState}>
           <Text style={{fontSize: 50, marginBottom: 15}}>{orderType === 'MART' ? '🛒' : '🍽️'}</Text>
           <Text style={styles.emptyTitle}>No {orderType === 'MART' ? 'Instamart' : 'Food'} Orders</Text>
           <Text style={styles.emptyText}>You haven't ordered anything from {orderType === 'MART' ? 'Instamart' : 'Food Delivery'} yet.</Text>
           <TouchableOpacity style={[styles.browseBtn, { backgroundColor: orderType === 'MART' ? '#16a34a' : '#020617' }]} onPress={() => router.push('/')}>
             <Text style={{color: '#fff', fontWeight: '900', letterSpacing: 0.5}}>BROWSE NOW</Text>
           </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayOrders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginTop: 20 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  toggleText: { fontWeight: '700', color: '#64748b' },

  orderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: '#f1f5f9' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  restaurantName: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  orderDate: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'center' },
  
  dashedLine: { height: 1, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed', borderRadius: 1, marginVertical: 15 },
  
  itemsList: { marginVertical: 5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qtyBox: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qtyText: { fontSize: 12, fontWeight: '800' },
  itemText: { fontSize: 15, color: '#0f172a', fontWeight: '600', flex: 1 },
  
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  totalLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  totalText: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  
  reorderBtn: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  reorderText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: -40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  browseBtn: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 }
});
