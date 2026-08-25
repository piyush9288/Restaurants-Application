import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Platform, SafeAreaView, Animated, TextInput, Modal, KeyboardAvoidingView, Image } from 'react-native';
import { useCart } from '../CartContext';
import { useRouter } from 'expo-router';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

const CartItem = ({ item, onAdd, onRemove }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();

    return (
        <Animated.View style={[styles.cartItem, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.itemInfo}>
                <View style={styles.vegBadge}><View style={styles.vegDot} /></View>
                <View style={{flex: 1}}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                </View>
            </View>
            <View style={styles.itemActions}>
                <View style={styles.quantitySelector}>
                    <TouchableOpacity onPress={() => onRemove(item.id)} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => onAdd(item, item.restaurantId)} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

export default function CartScreen() {
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal, restaurantId, martCart, addToMartCart, removeFromMartCart, clearMartCart, getMartTotal } = useCart();
  const router = useRouter();
  
  const [cartType, setCartType] = useState('FOOD'); // 'FOOD' or 'MART'

  const activeCart = cartType === 'FOOD' ? cart : martCart;
  const activeAdd = cartType === 'FOOD' ? addToCart : addToMartCart;
  const activeRemove = cartType === 'FOOD' ? removeFromCart : removeFromMartCart;
  const activeClear = cartType === 'FOOD' ? clearCart : clearMartCart;
  const activeTotal = cartType === 'FOOD' ? getCartTotal() : getMartTotal();

  const slideUp = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState({ code: '', amount: 0 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, [cartType]);

  const handleCheckoutInit = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      if (Platform.OS === 'web') alert('Please login to checkout.');
      else Alert.alert('Login Required', 'Please login to checkout.');
      router.push('/login');
      return;
    }
    
    if (activeCart.length === 0) return;

    try {
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
    
    setTimeout(async () => {
        try {
          const orderPayload = {
            restaurant_id: cartType === 'FOOD' ? Number(restaurantId) : 999, // Fallback ID for Mart
            is_mart: cartType === 'MART',
            items: activeCart.map((item: any) => ({
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
            activeClear();
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

  const handleApplyCoupon = () => {
      const code = couponCode.toUpperCase().trim();
      if (code === 'WELCOME50') {
          const discount = Math.min(activeTotal * 0.5, 150);
          setAppliedDiscount({ code, amount: discount });
      } else if (code === 'PAYTM100') {
          if (activeTotal >= 399) {
              setAppliedDiscount({ code, amount: 100 });
          } else {
              setAppliedDiscount({ code: '', amount: 0 });
          }
      } else {
          setAppliedDiscount({ code: '', amount: 0 });
      }
  };

  const taxes = activeTotal * 0.05;
  const delivery = activeTotal > 0 ? 40 : 0;
  const grandTotal = Math.max(0, activeTotal + taxes + delivery - appliedDiscount.amount);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerSubtitle}>YOUR BASKET</Text>
        <Text style={styles.title}>Checkout</Text>
        
        {/* Toggle Cart Type */}
        <View style={{flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginTop: 15, zIndex: 100}}>
            <TouchableOpacity 
                activeOpacity={0.7}
                style={[{flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10}, cartType === 'FOOD' && {backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2}]}
                onPress={() => setCartType('FOOD')}
            >
                <Text style={[{fontWeight: '700', color: '#64748b'}, cartType === 'FOOD' && {color: '#020617', fontWeight: '900'}]}>Food Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                activeOpacity={0.7}
                style={[{flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10}, cartType === 'MART' && {backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2}]}
                onPress={() => setCartType('MART')}
            >
                <Text style={[{fontWeight: '700', color: '#64748b'}, cartType === 'MART' && {color: '#16a34a', fontWeight: '900'}]}>Instamart</Text>
            </TouchableOpacity>
        </View>
      </View>

      {activeCart.length === 0 ? (
        <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
          <Text style={{fontSize: 50, marginBottom: 15}}>{cartType === 'MART' ? '🛒' : '🍽️'}</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added anything to your {cartType === 'MART' ? 'Instamart' : 'Food'} cart yet.</Text>
          <TouchableOpacity style={[styles.browseBtn, { backgroundColor: cartType === 'MART' ? '#16a34a' : '#020617' }]} onPress={() => router.push('/')}>
            <Text style={{color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1}}>EXPLORE NOW</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideUp }] }}>
          <FlatList
            data={activeCart}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={{ padding: 15, paddingBottom: 150 }}
            renderItem={({ item }) => <CartItem item={item} onAdd={activeAdd} onRemove={activeRemove} />}
            ListFooterComponent={
              <View>
                {/* Coupon Code Section */}
                <View style={[styles.couponSection, cartType === 'MART' && { shadowColor: '#16a34a' }]}>
                    <Text style={[styles.couponTitle, cartType === 'MART' && { color: '#16a34a' }]}>Apply Coupon</Text>
                    <View style={styles.couponInputRow}>
                        <TextInput 
                            style={styles.couponInput}
                            placeholder="Enter WELCOME50 or PAYTM100"
                            placeholderTextColor="#9ca3af"
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={[styles.couponApplyBtn, cartType === 'MART' && { backgroundColor: '#16a34a', shadowColor: '#16a34a' }]} onPress={handleApplyCoupon}>
                            <Text style={styles.couponApplyText}>APPLY</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bill Summary */}
                <View style={styles.billDetails}>
                  <Text style={[styles.billHeader, cartType === 'MART' && { color: '#16a34a' }]}>Bill Summary</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billText}>Item Total</Text>
                    <Text style={styles.billText}>₹{activeTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billText}>Delivery Partner Fee</Text>
                    <Text style={styles.billText}>₹{delivery.toFixed(2)}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billText}>Taxes & Charges</Text>
                    <Text style={styles.billText}>₹{taxes.toFixed(2)}</Text>
                  </View>
                  {appliedDiscount.amount > 0 && (
                      <View style={styles.billRow}>
                          <Text style={[styles.billText, {color: cartType === 'MART' ? '#16a34a' : '#10b981'}]}>Discount ({appliedDiscount.code})</Text>
                          <Text style={[styles.billText, {color: cartType === 'MART' ? '#16a34a' : '#10b981'}]}>- ₹{appliedDiscount.amount.toFixed(2)}</Text>
                      </View>
                  )}
                  <View style={styles.separator} />
                  <View style={styles.billRow}>
                    <Text style={[styles.grandTotalText, cartType === 'MART' && { color: '#16a34a' }]}>To Pay</Text>
                    <Text style={[styles.grandTotalText, cartType === 'MART' && { color: '#16a34a' }]}>₹{grandTotal.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            }
          />

          <View style={styles.checkoutFooter}>
            <View>
               <Text style={styles.payTotal}>₹{grandTotal.toFixed(2)}</Text>
               <Text style={[styles.paySub, cartType === 'MART' && { color: '#16a34a' }]}>TOTAL</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutBtn, cartType === 'MART' && { backgroundColor: '#16a34a', shadowColor: '#16a34a' }]} onPress={handleCheckoutInit}>
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
                    style={[styles.paySubmitBtn, isProcessing && {backgroundColor: '#10b981'}]} 
                    onPress={processPaymentAndOrder}
                    disabled={isProcessing}
                >
                    <Text style={styles.paySubmitBtnText}>
                        {isProcessing ? 'Processing...' : `Pay ₹${grandTotal.toFixed(2)}`}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBlock: { backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 50 : 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerSubtitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, marginBottom: 15, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.06, shadowRadius: 15, elevation: 4 },
  itemInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  vegBadge: { width: 14, height: 14, borderWidth: 1, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center', borderRadius: 4, marginRight: 12, marginTop: 4 },
  vegDot: { width: 6, height: 6, backgroundColor: '#22c55e', borderRadius: 3 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4, letterSpacing: -0.2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#4b5563' },
  
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  quantitySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 90, height: 36, backgroundColor: '#f1f5f9', borderRadius: 8 },
  qtyBtn: { width: 30, height: '100%', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: '#0f172a', fontWeight: 'bold' },
  qtyText: { fontSize: 15, fontWeight: '900', color: '#111827' },
  
  couponSection: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  couponTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 15 },
  couponInputRow: { flexDirection: 'row', alignItems: 'center' },
  couponInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 15, height: 48, marginRight: 10, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  couponApplyBtn: { backgroundColor: '#020617', paddingHorizontal: 20, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, shadowColor: '#020617', shadowOffset: {width:0, height:4}, shadowOpacity:0.2, shadowRadius:8, elevation:4 },
  couponApplyText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  billDetails: { backgroundColor: '#fff', marginTop: 5, borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  billHeader: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  billText: { color: '#4b5563', fontSize: 14, fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
  grandTotalText: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  checkoutFooter: { position: 'absolute', bottom: Platform.OS === 'ios' ? 85 : 65, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: {width: 0, height: -10}, shadowOpacity: 0.05, shadowRadius: 20, elevation: 15 },
  payTotal: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  paySub: { fontSize: 11, fontWeight: '800', color: '#020617', letterSpacing: 1, marginTop: 2 },
  checkoutBtn: { backgroundColor: '#020617', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 16, shadowColor: '#020617', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  checkoutBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20, paddingBottom: 100 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 35, lineHeight: 22, fontWeight: '500' },
  browseBtn: { backgroundColor: '#020617', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, shadowColor: '#020617', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30, shadowColor: '#000', shadowOffset: {width: 0, height: -10}, shadowOpacity: 0.15, shadowRadius: 20, elevation: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  closeModalText: { fontSize: 22, color: '#6b7280', fontWeight: 'bold' },
  payAmountDisplay: { fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 30, letterSpacing: -0.5 },
  
  paymentOptions: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  payOption: { flex: 1, padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#f3f4f6', alignItems: 'center', backgroundColor: '#fff' },
  payOptionActive: { borderColor: '#fc8019', backgroundColor: '#fff3ed' },
  payOptionText: { fontSize: 15, fontWeight: '800', color: '#6b7280' },
  payOptionTextActive: { color: '#fc8019' },
  
  upiInputContainer: { marginBottom: 30 },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#4b5563', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  upiInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827', fontWeight: '600' },
  
  paySubmitBtn: { backgroundColor: '#10b981', paddingVertical: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#10b981', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  paySubmitBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 }
});
