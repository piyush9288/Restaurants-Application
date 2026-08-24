import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Platform, SafeAreaView } from 'react-native';
import { useCart } from './CartContext';
import { useRouter } from 'expo-router';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
  const router = useRouter();

  const handleCheckout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      if (Platform.OS === 'web') alert('Please login to checkout.');
      else Alert.alert('Login Required', 'Please login to checkout.');
      router.push('/login');
      return;
    }
    
    if (cart.length === 0) return;

    try {
      const orderPayload = {
        restaurant_id: cart[0].restaurantId,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity
        }))
      };

      const res = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        clearCart();
        if (Platform.OS === 'web') alert('Order placed successfully!');
        else Alert.alert('Success', 'Order placed successfully!');
        router.replace('/two');
      } else {
        const errorData = await res.json();
        if (Platform.OS === 'web') alert(errorData.detail || 'Checkout failed');
        else Alert.alert('Error', errorData.detail || 'Checkout failed');
      }
    } catch (err) {
      if (Platform.OS === 'web') alert('Network error during checkout.');
      else Alert.alert('Error', 'Network error during checkout.');
    }
  };

  const total = getCartTotal();
  const taxes = total * 0.05; // 5% GST
  const delivery = total > 0 ? 40 : 0;
  const grandTotal = total + taxes + delivery;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{padding: 5}}>
          <Text style={{fontSize: 24, fontWeight: 'bold'}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{width: 30}} />
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{fontSize: 80, marginBottom: 20}}>🛒</Text>
          <Text style={styles.emptyTitle}>Good food is always cooking!</Text>
          <Text style={styles.emptySub}>Your cart is empty. Add something from the menu.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemVeg}>🟢</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                    <Text style={{color: '#ff4b4b', fontWeight: 'bold', marginLeft: 15}}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.billDetails}>
            <Text style={styles.billHeader}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billText}>Item Total</Text>
              <Text style={styles.billText}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billText}>Delivery Fee</Text>
              <Text style={styles.billText}>₹{delivery.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billText}>Taxes & Charges</Text>
              <Text style={styles.billText}>₹{taxes.toFixed(2)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.billRow}>
              <Text style={styles.grandTotalText}>To Pay</Text>
              <Text style={styles.grandTotalText}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.checkoutFooter}>
            <View>
               <Text style={styles.payTotal}>₹{grandTotal.toFixed(2)}</Text>
               <Text style={styles.paySub}>TOTAL</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Place Order ➔</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 25 : 0, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 3 },
  title: { fontSize: 18, fontWeight: '800', color: '#1c1c1c' },
  
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 12 },
  itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemVeg: { fontSize: 10, marginRight: 8 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#3e4152' },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  qtyBox: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginRight: 15 },
  qtyText: { fontWeight: 'bold', color: '#60b246' },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#3e4152', width: 50, textAlign: 'right' },
  
  billDetails: { backgroundColor: '#fff', margin: 15, borderRadius: 12, padding: 15 },
  billHeader: { fontSize: 16, fontWeight: '800', color: '#1c1c1c', marginBottom: 15 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billText: { color: '#686b78', fontSize: 13 },
  separator: { height: 1, backgroundColor: '#e9e9eb', marginVertical: 10 },
  grandTotalText: { fontSize: 16, fontWeight: '800', color: '#1c1c1c' },
  
  checkoutFooter: { backgroundColor: '#fff', padding: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  payTotal: { fontSize: 18, fontWeight: '900', color: '#1c1c1c' },
  paySub: { fontSize: 11, fontWeight: '700', color: '#60b246' },
  checkoutBtn: { backgroundColor: '#fc8019', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 8 },
  checkoutBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1c1c1c', marginBottom: 10, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#686b78', textAlign: 'center', marginBottom: 30 },
  browseBtn: { backgroundColor: '#fc8019', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 8 }
});
