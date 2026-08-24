import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Platform, SafeAreaView, Animated, TextInput, Modal, KeyboardAvoidingView } from 'react-native';
import { useCart } from '../CartContext';
import { useRouter } from 'expo-router';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, getCartTotal, restaurantId } = useCart();
  const router = useRouter();
  
  // Animation states
  const slideUp = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, []);

  const handleCheckoutInit = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      if (Platform.OS === 'web') alert('Please login to checkout.');
      else Alert.alert('Login Required', 'Please login to checkout.');
      router.push('/login');
      return;
    }
    
    if (cart.length === 0) return;

    try {
      // Check if profile is complete
      const profileRes = await fetch(`${API_URL}/api/users/me/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (!profileData.name || !profileData.phone || !profileData.address || !profileData.pincode) {
        if (Platform.OS === 'web') alert("Please complete your profile (Name, Phone, Address, Pincode) before ordering!");
        else Alert.alert("Profile Incomplete", "Please complete your profile before ordering!");
        router.push('/profile');
        return;
      }
      
      // If profile complete, show payment modal
      setShowPaymentModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const processPaymentAndOrder = async () => {
    if (paymentMethod === 'UPI' && upiId.trim() === '') {
        if (Platform.OS === 'web') alert('Please enter a valid UPI ID');
        else Alert.alert('Error', 'Please enter a valid UPI ID');
        return;
    }
    
    setIsProcessing(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Simulate payment delay for premium feel
    setTimeout(async () => {
        try {
          const orderPayload = {
            restaurant_id: Number(restaurantId),
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
            setShowPaymentModal(false);
            if (Platform.OS === 'web') alert('Order placed successfully!');
            else Alert.alert('Success', 'Payment Successful! Order placed.');
            router.replace('/two');
          } else {
            const errorData = await res.json();
            if (Platform.OS === 'web') alert(errorData.detail || 'Checkout failed');
            else Alert.alert('Error', errorData.detail || 'Checkout failed');
          }
        } catch (err) {
          if (Platform.OS === 'web') alert('Network error during checkout.');
          else Alert.alert('Error', 'Network error during checkout.');
        } finally {
            setIsProcessing(false);
        }
    }, 1500);
  };

  const total = getCartTotal();
  const taxes = total * 0.05; // 5% GST
  const delivery = total > 0 ? 40 : 0;
  const grandTotal = total + taxes + delivery;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{width: 40}} />
      </View>

      {cart.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
          <Text style={{fontSize: 80, marginBottom: 20}}>🛍️</Text>
          <Text style={styles.emptyTitle}>Good food is always cooking!</Text>
          <Text style={styles.emptySub}>Your cart is empty. Add something from the menu.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Browse Restaurants</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
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
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>X</Text>
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
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckoutInit}>
              <Text style={styles.checkoutBtnText}>Select Payment ➔</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Payment Method</Text>
                    <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                        <Text style={styles.closeModalText}>✕</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.payAmountDisplay}>Amount to Pay: ₹{grandTotal.toFixed(2)}</Text>

                <View style={styles.paymentOptions}>
                    <TouchableOpacity 
                        style={[styles.payOption, paymentMethod === 'UPI' && styles.payOptionActive]} 
                        onPress={() => setPaymentMethod('UPI')}
                    >
                        <Text style={[styles.payOptionText, paymentMethod === 'UPI' && styles.payOptionTextActive]}>UPI</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionActive]} 
                        onPress={() => setPaymentMethod('COD')}
                    >
                        <Text style={[styles.payOptionText, paymentMethod === 'COD' && styles.payOptionTextActive]}>Cash on Delivery</Text>
                    </TouchableOpacity>
                </View>

                {paymentMethod === 'UPI' && (
                    <View style={styles.upiInputContainer}>
                        <Text style={styles.inputLabel}>Enter UPI ID</Text>
                        <TextInput 
                            style={styles.upiInput}
                            placeholder="e.g. mobile@upi"
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                        />
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.paySubmitBtn, isProcessing && {backgroundColor: '#ccc'}]} 
                    onPress={processPaymentAndOrder}
                    disabled={isProcessing}
                >
                    <Text style={styles.paySubmitBtnText}>
                        {isProcessing ? 'Processing Payment...' : `Pay ₹${grandTotal.toFixed(2)}`}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 65, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 25 : 0, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 3 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  backButtonText: { fontSize: 20, fontWeight: 'bold', color: '#1c1c1c' },
  title: { fontSize: 18, fontWeight: '800', color: '#1c1c1c', letterSpacing: 0.5 },
  
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 18, marginBottom: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemVeg: { fontSize: 10, marginRight: 10 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1c1c1c' },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  qtyBox: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 15 },
  qtyText: { fontWeight: 'bold', color: '#60b246', fontSize: 14 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#3e4152', width: 55, textAlign: 'right' },
  removeBtn: { marginLeft: 15, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 12 },
  
  billDetails: { backgroundColor: '#fff', margin: 15, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  billHeader: { fontSize: 18, fontWeight: '800', color: '#1c1c1c', marginBottom: 20 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billText: { color: '#686b78', fontSize: 14, fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#e9e9eb', marginVertical: 15 },
  grandTotalText: { fontSize: 18, fontWeight: '900', color: '#1c1c1c' },
  
  checkoutFooter: { backgroundColor: '#fff', padding: 20, paddingBottom: Platform.OS === 'ios' ? 100 : 80, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  payTotal: { fontSize: 22, fontWeight: '900', color: '#1c1c1c' },
  paySub: { fontSize: 12, fontWeight: '800', color: '#60b246', letterSpacing: 1 },
  checkoutBtn: { backgroundColor: '#fc8019', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 12, shadowColor: '#fc8019', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  checkoutBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20, paddingBottom: 100 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#1c1c1c', marginBottom: 10, textAlign: 'center' },
  emptySub: { fontSize: 15, color: '#686b78', textAlign: 'center', marginBottom: 35, lineHeight: 22 },
  browseBtn: { backgroundColor: '#fc8019', paddingVertical: 16, paddingHorizontal: 35, borderRadius: 12, shadowColor: '#fc8019', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25, shadowColor: '#000', shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1c1c1c' },
  closeModalText: { fontSize: 22, color: '#6b7280', fontWeight: 'bold' },
  payAmountDisplay: { fontSize: 24, fontWeight: '900', color: '#fc8019', textAlign: 'center', marginBottom: 25 },
  
  paymentOptions: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  payOption: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center' },
  payOptionActive: { borderColor: '#fc8019', backgroundColor: '#fff3ed' },
  payOptionText: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  payOptionTextActive: { color: '#fc8019' },
  
  upiInputContainer: { marginBottom: 25 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#4b5563', marginBottom: 8 },
  upiInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 15, fontSize: 16, color: '#111827' },
  
  paySubmitBtn: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#22c55e', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  paySubmitBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 }
});
