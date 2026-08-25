import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function EarningsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rider_token') : null;
    if (!token) return;

    try {
        const profRes = await fetch(API_URL + '/api/users/delivery/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profRes.ok) {
            const p = await profRes.json();
            setProfile(p);
            if (p.upi_id) setUpiId(p.upi_id);
        }

        const ordRes = await fetch(API_URL + '/api/orders/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordRes.ok) {
            const data = await ordRes.json();
            if (Array.isArray(data)) {
                setOrders(data.filter((o: any) => o.status === 'DELIVERED').reverse());
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleWithdraw = async () => {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !upiId) {
          Alert.alert("Missing Details", "Please enter a valid amount and UPI ID.");
          return;
      }
      setWithdrawing(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('rider_token') : null;
      try {
          const res = await fetch(`${API_URL}/api/users/delivery/withdraw`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ amount: parseFloat(withdrawAmount), upi_id: upiId })
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

  const totalEarnings = profile?.total_earnings || 0;
  const withdrawn = profile?.withdrawn_amount || 0;
  const availableBalance = totalEarnings - withdrawn;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet & Earnings</Text>
      </View>
      
      <View style={styles.earningsCard}>
         <Text style={{fontSize: 16, color: '#dbeafe', fontWeight: 'bold'}}>Available Balance</Text>
         <Text style={{fontSize: 40, fontWeight: '900', color: '#fff'}}>₹{availableBalance.toFixed(2)}</Text>
         <Text style={{color: '#93c5fd', marginTop: 10, fontWeight: 'bold'}}>Total Earned: ₹{totalEarnings.toFixed(2)}</Text>
         <Text style={{color: '#93c5fd', marginTop: 2, fontWeight: 'bold'}}>Total Withdrawn: ₹{withdrawn.toFixed(2)}</Text>
      </View>

      <View style={styles.withdrawCard}>
          <Text style={styles.sectionTitle}>Withdraw to UPI</Text>
          <TextInput 
              style={styles.input} 
              placeholder="Enter UPI ID (e.g. 9999999999@ybl)" 
              value={upiId} 
              onChangeText={setUpiId} 
          />
          <TextInput 
              style={styles.input} 
              placeholder="Amount (₹)" 
              value={withdrawAmount} 
              onChangeText={setWithdrawAmount} 
              keyboardType="number-pad" 
          />
          <TouchableOpacity 
              style={[styles.btn, (!upiId || !withdrawAmount || withdrawing) && {opacity: 0.7}]} 
              onPress={handleWithdraw}
              disabled={withdrawing}
          >
              <Text style={styles.btnText}>{withdrawing ? 'Processing...' : 'WITHDRAW MONEY'}</Text>
          </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, {marginHorizontal: 20, marginTop: 10}]}>Completed Deliveries</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={styles.statusBadge}>{item.status}</Text>
              </View>
              <Text style={{color: '#10b981', fontWeight: 'bold'}}>+ ₹40 earned (Delivery Fee)</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No deliveries completed yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  earningsCard: { backgroundColor: '#3b82f6', margin: 20, padding: 25, borderRadius: 24, alignItems: 'center', shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 8 },
  withdrawCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15, color: '#0f172a' },
  input: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, marginBottom: 12, fontSize: 15, color: '#0f172a' },
  btn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  orderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  statusBadge: { backgroundColor: '#d1fae5', color: '#065f46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: 'bold', overflow: 'hidden' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#64748b', fontWeight: '600' }
});
