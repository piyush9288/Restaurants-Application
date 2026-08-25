import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState('ORDERS');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const router = useRouter();

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('restaurant_token') : null;

  const fetchData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const profileRes = await fetch(`${API_URL}/api/restaurants/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
        
        // Fetch Menu
        if (p.id) {
            const menuRes = await fetch(`${API_URL}/api/restaurants/${p.id}/menu`);
            if (menuRes.ok) {
                setMenuItems(await menuRes.json());
            }
        }
      }

      const ordersRes = await fetch(`${API_URL}/api/orders/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data)) {
          setOrders(data.reverse());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (orderId: number, status: string) => {
    fetch(`${API_URL}/api/orders/${orderId}/status?status=${status}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }).then(() => fetchData());
  };
  
  const handleAddItem = async () => {
      if (!newItemName || !newItemPrice) return;
      setAddingItem(true);
      try {
          const res = await fetch(`${API_URL}/api/restaurants/menu`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${getToken()}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name: newItemName,
                  description: newItemDesc,
                  price: parseFloat(newItemPrice),
                  is_available: true
              })
          });
          if (res.ok) {
              setNewItemName('');
              setNewItemDesc('');
              setNewItemPrice('');
              fetchData();
          }
      } catch(e) {
          console.error(e);
      } finally {
          setAddingItem(false);
      }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('restaurant_token');
    router.replace('/login');
  };

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED');

  const todaysEarnings = pastOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {profile?.photo_url ? (
              <Image source={{uri: profile.photo_url}} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: '#e1e7eb', justifyContent: 'center', alignItems: 'center'}]}>
                <Text style={{fontSize: 20}}>🍔</Text>
              </View>
            )}
            <View style={{marginLeft: 12}}>
              <Text style={styles.headerName}>{profile?.name || 'Partner'}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 2}}>
                <View style={[styles.onlineDot, !profile?.is_verified && {backgroundColor: '#f59e0b'}]} />
                <Text style={[styles.onlineText, !profile?.is_verified && {color: '#f59e0b'}]}>
                    {profile?.is_verified ? 'Accepting Orders' : 'Pending Approval'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'ORDERS' && styles.tabActive]}
                onPress={() => setActiveTab('ORDERS')}
              >
                <Text style={[styles.tabText, activeTab === 'ORDERS' && styles.tabTextActive]}>Live Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'MENU' && styles.tabActive]}
                onPress={() => setActiveTab('MENU')}
              >
                <Text style={[styles.tabText, activeTab === 'MENU' && styles.tabTextActive]}>Menu Items</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'EARNINGS' && styles.tabActive]}
                onPress={() => setActiveTab('EARNINGS')}
              >
                <Text style={[styles.tabText, activeTab === 'EARNINGS' && styles.tabTextActive]}>Money & Earnings</Text>
              </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {
          activeTab === 'ORDERS' && (
            <View>
              {loading && activeOrders.length === 0 ? (
                <ActivityIndicator size="large" color="#1e293b" style={{marginTop: 50}} />
              ) : activeOrders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={{fontSize: 50, marginBottom: 10}}>🛵</Text>
                  <Text style={styles.emptyTitle}>No Active Orders</Text>
                  <Text style={styles.emptySub}>Your restaurant is online, waiting for orders!</Text>
                </View>
              ) : (
                activeOrders.map((item: any) => (
                  <View key={item.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderId}>Order #{item.id}</Text>
                        <Text style={styles.orderTime}>Just now</Text>
                      </View>
                      <View style={[
                        styles.statusBadge, 
                        item.status === 'PENDING' ? {backgroundColor: '#fef3c7'} : 
                        item.status === 'ACCEPTED' ? {backgroundColor: '#dbeafe'} : 
                        {backgroundColor: '#dcfce7'}
                      ]}>
                        <Text style={[
                          styles.statusText, 
                          item.status === 'PENDING' ? {color: '#d97706'} : 
                          item.status === 'ACCEPTED' ? {color: '#2563eb'} : 
                          {color: '#16a34a'}
                        ]}>{item.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.dashedLine} />
                    
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <View>
                        <Text style={styles.itemsCount}>{item.items?.length || 1} Item(s)</Text>
                        <Text style={styles.totalAmount}>₹{item.total_amount}</Text>
                      </View>
                      
                      <View style={{flexDirection: 'row'}}>
                        {item.status === 'PENDING' && (
                          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#020617'}]} onPress={() => updateStatus(item.id, 'ACCEPTED')}>
                            <Text style={styles.actionText}>Accept Order</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'ACCEPTED' && (
                          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#3b82f6'}]} onPress={() => updateStatus(item.id, 'PREPARING')}>
                            <Text style={styles.actionText}>Start Preparing</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'PREPARING' && (
                          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10b981'}]} onPress={() => updateStatus(item.id, 'READY_FOR_PICKUP')}>
                            <Text style={styles.actionText}>Mark as Ready</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )
        }

        {
          activeTab === 'MENU' && (
            <View>
              <View style={[styles.orderCard, {padding: 20}]}>
                <Text style={{fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15}}>Add New Item</Text>
                
                <TextInput style={styles.input} placeholder="Item Name (e.g. Burger)" value={newItemName} onChangeText={setNewItemName} />
                <TextInput style={styles.input} placeholder="Description" value={newItemDesc} onChangeText={setNewItemDesc} />
                <TextInput style={styles.input} placeholder="Base Price (₹)" value={newItemPrice} onChangeText={setNewItemPrice} keyboardType="number-pad" />
                
                <Text style={{fontSize: 12, color: '#64748b', marginBottom: 15, fontStyle: 'italic'}}>Note: Platform will automatically add markup (₹5-10) + GST on the customer app.</Text>

                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#3b82f6', alignItems: 'center'}]} onPress={handleAddItem} disabled={addingItem}>
                  <Text style={styles.actionText}>{addingItem ? 'Adding...' : '+ Add to Menu'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={{fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 10, marginBottom: 15}}>Your Menu</Text>
              {menuItems.map((item: any) => (
                <View key={item.id} style={[styles.orderCard, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15}]}>
                  <View>
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: '#0f172a'}}>{item.name}</Text>
                    {item.description ? <Text style={{fontSize: 13, color: '#64748b', marginTop: 2}}>{item.description}</Text> : null}
                  </View>
                  <Text style={{fontSize: 16, fontWeight: '900', color: '#10b981'}}>₹{item.price}</Text>
                </View>
              ))}
            </View>
          )
        }

        {
          activeTab === 'EARNINGS' && (
            <View>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
                <Text style={styles.earningsAmount}>₹{todaysEarnings}</Text>
              </View>

              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={styles.statCard}>
                  <Text style={styles.statSub }>Orders Today</Text>
                  <Text style={styles.statMain}>{pastOrders.length}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statSub }>All Time Total</Text>
                  <Text style={styles.statMain}>₹{profile?.total_earnings || 0}</Text>
                </View>
              </View>

              <Text style={{fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 30, marginBottom: 15}}>Recent Past Orders</Text>
              {pastOrders.map((item: any) => (
                <View key={item.id} style={[styles.orderCard, {padding: 15}]}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <View>
                      <Text style={styles.orderId}>Order #{item.id}</Text>
                      <Text style={styles.orderTime}>Delivered</Text>
                    </View>
                    <Text style={{fontSize: 16, fontWeight: '800', color: '#10b981'}}>+₹{item.total_amount}</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  profileAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#3b82f6', overflow: 'hidden' },
  headerName: { fontSize: 19, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  onlineDot: { width: 8, height: 8, backgroundColor: '#10b981', borderRadius: 4, marginRight: 6 },
  onlineText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  logoutText: { color: '#ef4444', fontWeight: '700' },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20 },
  tab: { paddingVertical: 12, marginRight: 30, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#3b82f6' },
  tabText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
  tabTextActive: { color: '#3b82f6', fontWeight: '900' },

  scrollContent: { padding: 20, paddingBottom: 100 },
  
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 23, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  emptySub: { color: '#64748b', fontSize: 15, fontWeight: '500' },

  orderCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  orderTime: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '800' },

  dashedLine: { height: 1, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed', marginVertical: 15 },
 
  itemsCount: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  totalAmount: { fontSize: 19, fontWeight: '900', color: '#0f172a' },

  actionBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },

  earningsCard: { backgroundColor: '#3b82f6', padding: 25, borderRadius: 24, marginBottom: 15, shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  earningsLabel: { color: '#dbeafe', fontSize: 15, fontWeight: 'bold' },
  earningsAmount: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 5 },
  
  statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 24, marginHorizontal: 7, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10},
  statSub: { color: '#64748b', fontSize: 13, fontWeight: 'bold' },
  statMain: { color: '#0f172a', fontSize: 24, fontWeight: '900', marginTop: 5 },
  input: { height: 50, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, marginBottom: 12, fontSize: 15, color: '#0f172a' }
});
