import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Image, TextInput, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState('ORDERS');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [editItemData, setEditItemData] = useState<any>(null);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editUpi, setEditUpi] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

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
        
        // Populate edit state if empty
        if (!editName && p.name) {
            setEditName(p.name);
            setEditDesc(p.description || '');
            setEditUpi(p.upi_id || '');
            setEditPhoto(p.photo_url || null);
          setEditCover(p.cover_url || null);
        }
        
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
  
  
  const handleUpdateItem = async () => {
      try {
          const res = await fetch(`${API_URL}/api/restaurants/menu/${editItemData.id}`, {
              method: 'PUT',
              headers: { 
                  'Authorization': `Bearer ${getToken()}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name: editItemData.name,
                  description: editItemData.description,
                  price: parseFloat(editItemData.price),
                  is_veg: editItemData.is_veg,
                  image_url: editItemData.image_url
              })
          });
          if (res.ok) {
              setEditItemData(null);
              fetchData();
          }
      } catch(e) {}
  };

  const pickImage = async (setter: any) => {
      let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.3,
          base64: true
      });
      if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          if (asset.base64) {
              setter(`data:image/jpeg;base64,${asset.base64}`);
          } else {
              setter(asset.uri); // fallback
          }
      }
  };

  const handleAddItem = async () => {
      if (!newItemName || !newItemPrice) {
          Alert.alert("Missing Details", "Please enter a name and price.");
          return;
      }
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
                  image_url: newItemImage,
                  is_available: true
              })
          });
          if (res.ok) {
              setNewItemName('');
              setNewItemDesc('');
              setNewItemPrice('');
              setNewItemImage(null);
              fetchData();
              if(Platform.OS === 'web') alert("Item Added");
          }
      } catch(e) {
          console.error(e);
      } finally {
          setAddingItem(false);
      }
  };

  const handleWithdraw = async () => {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
          Alert.alert("Invalid Amount", "Please enter a valid amount.");
          return;
      }
      setWithdrawing(true);
      try {
          const res = await fetch(`${API_URL}/api/restaurants/withdraw`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${getToken()}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ amount: parseFloat(withdrawAmount) })
          });
          if (res.ok) {
              setWithdrawAmount('');
              fetchData();
              if(Platform.OS === 'web') alert("Withdrawal Successful to UPI!");
              else Alert.alert("Success", "Money withdrawn to your UPI.");
          } else {
              const data = await res.json();
              if(Platform.OS === 'web') alert(data.detail);
              else Alert.alert("Error", data.detail);
          }
      } catch(e) {
          console.error(e);
      } finally {
          setWithdrawing(false);
      }
  };

  const handleSaveProfile = async () => {
      setSavingProfile(true);
      try {
          const res = await fetch(`${API_URL}/api/restaurants/me`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${getToken()}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name: editName,
                  description: editDesc,
                  upi_id: editUpi,
                  photo_url: editPhoto,
                  cover_url: editCover,
                  type: profile?.type || 'FOOD'
              })
          });
          if (res.ok) {
              fetchData();
              if(Platform.OS === 'web') alert("Profile Updated!");
              else Alert.alert("Success", "Profile updated!");
          }
      } catch(e) {
          console.error(e);
      } finally {
          setSavingProfile(false);
      }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('restaurant_token');
    router.replace('/login');
  };

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED');

  const availableBalance = (profile?.total_earnings || 0) - (profile?.withdrawn_amount || 0);

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
                <Text style={[styles.tabText, activeTab === 'MENU' && styles.tabTextActive]}>Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'EARNINGS' && styles.tabActive]}
                onPress={() => setActiveTab('EARNINGS')}
              >
                <Text style={[styles.tabText, activeTab === 'EARNINGS' && styles.tabTextActive]}>Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'PROFILE' && styles.tabActive]}
                onPress={() => setActiveTab('PROFILE')}
              >
                <Text style={[styles.tabText, activeTab === 'PROFILE' && styles.tabTextActive]}>Profile</Text>
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
                            <Text style={styles.actionText}>Accept</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'ACCEPTED' && (
                          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#3b82f6'}]} onPress={() => updateStatus(item.id, 'PREPARING')}>
                            <Text style={styles.actionText}>Prepare</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === 'PREPARING' && (
                          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10b981'}]} onPress={() => updateStatus(item.id, 'READY_FOR_PICKUP')}>
                            <Text style={styles.actionText}>Ready</Text>
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
                
                <TouchableOpacity onPress={() => pickImage(setNewItemImage)} style={{height: 120, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden'}}>
                    {newItemImage ? <Image source={{uri: newItemImage}} style={{width: '100%', height: '100%'}} /> : <Text style={{color: '#64748b'}}>+ Add Item Photo</Text>}
                </TouchableOpacity>

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
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    {item.image_url && <Image source={{uri: item.image_url}} style={{width: 50, height: 50, borderRadius: 8, marginRight: 15}} />}
                    <View style={{flex: 1}}>
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#0f172a'}}>{item.name}</Text>
                        {item.description ? <Text style={{fontSize: 13, color: '#64748b', marginTop: 2}} numberOfLines={1}>{item.description}</Text> : null}
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                      <Text style={{fontSize: 16, fontWeight: '900', color: '#10b981'}}>₹{item.price}</Text>
                      <TouchableOpacity onPress={() => setEditItemData(item)} style={{marginTop: 5, padding: 5, backgroundColor: '#f1f5f9', borderRadius: 4}}>
                          <Text style={{fontSize: 12, color: '#475569', fontWeight: 'bold'}}>Edit</Text>
                      </TouchableOpacity>
                  </View>
                </View>
              ))}

              {editItemData && (
                  <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'center', alignItems: 'center'}}>
                      <View style={{backgroundColor: 'white', padding: 20, borderRadius: 12, width: '90%'}}>
                          <Text style={{fontSize: 18, fontWeight: '900', marginBottom: 15}}>Edit Item</Text>
                          <TouchableOpacity onPress={() => pickImage((uri: string) => setEditItemData({...editItemData, image_url: uri}))} style={{height: 120, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden'}}>
                              {editItemData.image_url ? <Image source={{uri: editItemData.image_url}} style={{width: '100%', height: '100%'}} /> : <Text style={{color: '#64748b'}}>+ Change Photo</Text>}
                          </TouchableOpacity>
                          <TextInput style={styles.input} placeholder="Name" value={editItemData.name} onChangeText={t => setEditItemData({...editItemData, name: t})} />
                          <TextInput style={styles.input} placeholder="Description" value={editItemData.description} onChangeText={t => setEditItemData({...editItemData, description: t})} />
                          <TextInput style={styles.input} placeholder="Price" value={editItemData.price.toString()} onChangeText={t => setEditItemData({...editItemData, price: t})} keyboardType="number-pad" />
                          <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                              <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#3b82f6', alignItems: 'center'}]} onPress={handleUpdateItem}>
                                  <Text style={styles.actionText}>Save</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#cbd5e1', alignItems: 'center'}]} onPress={() => setEditItemData(null)}>
                                  <Text style={[styles.actionText, {color: '#334155'}]}>Cancel</Text>
                              </TouchableOpacity>
                          </View>
                      </View>
                  </View>
              )}
            </View>
          )
        }

        {
          activeTab === 'EARNINGS' && (
            <View>
              <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Available Balance</Text>
                <Text style={styles.earningsAmount}>₹{availableBalance}</Text>
                <Text style={{color: '#93c5fd', marginTop: 10, fontWeight: 'bold'}}>Total Earned: ₹{profile?.total_earnings || 0}</Text>
              </View>

              <View style={[styles.orderCard, {padding: 20}]}>
                  <Text style={{fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15}}>Withdraw Funds</Text>
                  <Text style={{color: '#64748b', marginBottom: 10, fontSize: 13}}>Withdraw directly to your UPI ID.</Text>
                  
                  {profile?.upi_id ? (
                      <View style={{backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0'}}>
                          <Text style={{fontWeight: 'bold', color: '#334155'}}>Linked UPI: {profile.upi_id}</Text>
                      </View>
                  ) : (
                      <Text style={{color: '#ef4444', marginBottom: 15, fontWeight: 'bold'}}>Please set your UPI ID in the Profile tab first.</Text>
                  )}

                  <TextInput style={styles.input} placeholder="Amount to withdraw (₹)" value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="number-pad" />
                  
                  <TouchableOpacity 
                      style={[styles.actionBtn, {backgroundColor: '#10b981', alignItems: 'center'}]} 
                      onPress={handleWithdraw} 
                      disabled={withdrawing || !profile?.upi_id}
                  >
                      <Text style={styles.actionText}>{withdrawing ? 'Processing...' : 'Withdraw to UPI'}</Text>
                  </TouchableOpacity>
              </View>
            </View>
          )
        }

        {
          activeTab === 'PROFILE' && (
            <View style={[styles.orderCard, {padding: 20}]}>
                <Text style={{fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15}}>Edit Profile</Text>
                <View style={{flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20}}>
                    <TouchableOpacity onPress={() => pickImage(setEditPhoto)} style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 12, color: '#64748b', marginBottom: 5}}>Profile Photo</Text>
                        {editPhoto ? (
                            <Image source={{uri: editPhoto}} style={{width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#e2e8f0'}} />
                        ) : (
                            <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{fontSize: 24}}>📷</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => pickImage(setEditCover)} style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 12, color: '#64748b', marginBottom: 5}}>Cover Photo</Text>
                        {editCover ? (
                            <Image source={{uri: editCover}} style={{width: 120, height: 80, borderRadius: 10, borderWidth: 3, borderColor: '#e2e8f0'}} />
                        ) : (
                            <View style={{width: 120, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{fontSize: 24}}>🖼️</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={{fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 5}}>Restaurant Name</Text>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Name" />
                
                <Text style={{fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 5}}>Description</Text>
                <TextInput style={styles.input} value={editDesc} onChangeText={setEditDesc} placeholder="Description" />
                
                <Text style={{fontSize: 13, fontWeight: 'bold', color: '#64748b', marginBottom: 5}}>Bank / UPI ID</Text>
                <TextInput style={styles.input} value={editUpi} onChangeText={setEditUpi} placeholder="example@upi" />

                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#020617', alignItems: 'center', marginTop: 10}]} onPress={handleSaveProfile} disabled={savingProfile}>
                  <Text style={styles.actionText}>{savingProfile ? 'Saving...' : 'Save Profile'}</Text>
                </TouchableOpacity>
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
