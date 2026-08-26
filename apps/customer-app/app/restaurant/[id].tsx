import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, ScrollView, SafeAreaView, Platform, Animated, Dimensions, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '../CartContext';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

const AddButton = ({ item, cart, addToCart, removeFromCart, restaurantId }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const cartItem = cart.find((i: any) => i.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    const onAdd = () => addToCart(item, restaurantId);
    const onRemove = () => removeFromCart(item.id);

    return (
        <Animated.View style={[styles.addButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
            {quantity > 0 ? (
                <View style={styles.quantitySelector}>
                    <TouchableOpacity onPress={onRemove} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity onPress={onAdd} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.qtyBtn}>
                        <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.addButton} onPress={onAdd} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
                    <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

export default function RestaurantMenuScreen() {
  const { id, name } = useLocalSearchParams();
  const [menu, setMenu] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  
  const router = useRouter();
  const { cart, addToCart, removeFromCart } = useCart();
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    try {
        const [menuRes, restRes, reviewsRes] = await Promise.all([
            fetch(`${API_URL}/api/restaurants/${id}/menu`),
            fetch(`${API_URL}/api/restaurants/${id}`),
            fetch(`${API_URL}/api/restaurants/${id}/reviews`)
        ]);
        
        if (menuRes.ok) {
            const data = await menuRes.json();
            if (Array.isArray(data)) {
                setMenu(data.map((item: any) => ({ ...item, originalPrice: item.price, price: item.price + 10 })));
            }
        }
        if (restRes.ok) {
            setRestaurant(await restRes.json());
        }
        if (reviewsRes.ok) {
            const revs = await reviewsRes.json();
            if (Array.isArray(revs)) setReviews(revs.reverse());
        }
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const submitReview = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
          Alert.alert("Login Required", "Please login to submit a review.");
          return;
      }
      try {
          const res = await fetch(`${API_URL}/api/restaurants/${id}/reviews`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ rating: parseInt(reviewRating), comment: reviewComment })
          });
          if(res.ok) {
              setReviewComment('');
              setReviewRating('5');
              fetchData();
              Alert.alert("Success", "Review submitted!");
          } else {
              const err = await res.json();
              Alert.alert("Error", err.detail || "Failed to submit review");
          }
      } catch(e) { console.error(e); }
  };

  const renderItem = (item: any, index: number) => {
    const foodImages = [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80'
    ];
    const imgUrl = item.image_url || foodImages[index % foodImages.length];
    
    return (
      <View key={item.id.toString()} style={styles.menuItemCard}>
        <View style={styles.menuItemInfo}>
            {item.is_veg ? (
                <View style={[styles.vegBadge, {borderColor: '#16a34a'}]}><View style={[styles.vegDot, {backgroundColor: '#16a34a'}]} /></View>
            ) : (
                <View style={[styles.vegBadge, {borderColor: '#dc2626'}]}><View style={[styles.vegDot, {backgroundColor: '#dc2626'}]} /></View>
            )}
            <Text style={styles.menuItemName}>{item.name}</Text>
            <Text style={styles.menuItemPrice}>₹{item.price}</Text>
            {item.description ? <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        <View style={styles.menuItemImageContainer}>
            <Image source={{ uri: imgUrl }} style={styles.menuItemImage} />
            <AddButton item={item} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} restaurantId={id} />
        </View>
      </View>
    );
  };

  const headerOpacity = scrollY.interpolate({ inputRange: [0, HEADER_HEIGHT - 100], outputRange: [0, 1], extrapolate: 'clamp' });
  const imageTranslateY = scrollY.interpolate({ inputRange: [-100, 0, HEADER_HEIGHT], outputRange: [-50, 0, HEADER_HEIGHT * 0.5], extrapolate: 'clamp' });
  const imageScale = scrollY.interpolate({ inputRange: [-100, 0], outputRange: [1.5, 1], extrapolate: 'clamp' });

  const displayImage = restaurant?.cover_url || restaurant?.photo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80';
  const displayName = restaurant?.name || name;
  const rating = restaurant?.rating > 0 ? restaurant.rating.toFixed(1) : 'New';
  const reviewCount = restaurant?.review_count || 0;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle}>{displayName}</Text>
      </Animated.View>
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Animated.ScrollView onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })} scrollEventThrottle={16}>
        <Animated.View style={[styles.heroContainer, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
           <Image source={{uri: displayImage}} style={styles.heroImage} />
           <View style={styles.heroGradient} />
        </Animated.View>

        <View style={styles.contentContainer}>
            <View style={styles.heroOverlayCard}>
                <Text style={styles.heroTitle}>{displayName}</Text>
                <Text style={styles.heroSub}>{restaurant?.description || 'Delicious Food Delivered Fast'}</Text>
                
                <View style={styles.metaCardsRow}>
                    <View style={styles.metaCard}>
                        <Text style={styles.metaCardValue}>{rating} ⭐</Text>
                        <Text style={styles.metaCardLabel}>{reviewCount} Ratings</Text>
                    </View>
                    <View style={styles.metaCardDivider} />
                    <View style={styles.metaCard}>
                        <Text style={styles.metaCardValue}>30 mins</Text>
                        <Text style={styles.metaCardLabel}>Delivery Time</Text>
                    </View>
                </View>
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Recommended</Text>
                {loading ? <ActivityIndicator size="large" color="#fc8019" /> : (
                    <View>{menu.map((item, index) => renderItem(item, index))}</View>
                )}
            </View>

            <View style={styles.reviewSection}>
                <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
                <View style={styles.addReviewBox}>
                    <Text style={{fontWeight: 'bold', marginBottom: 5}}>Leave a Review</Text>
                    <TextInput style={styles.input} placeholder="Rating (1-5)" value={reviewRating} onChangeText={setReviewRating} keyboardType="number-pad" />
                    <TextInput style={styles.input} placeholder="Share your experience..." value={reviewComment} onChangeText={setReviewComment} multiline />
                    <TouchableOpacity style={styles.reviewBtn} onPress={submitReview}>
                        <Text style={styles.reviewBtnText}>Submit Review</Text>
                    </TouchableOpacity>
                </View>
                {reviews.map(r => (
                    <View key={r.id} style={styles.reviewCard}>
                        <Text style={{fontWeight: 'bold', fontSize: 16}}>{r.customer_name} <Text style={{color: '#f59e0b'}}>⭐ {r.rating}</Text></Text>
                        {r.comment ? <Text style={{color: '#475569', marginTop: 5}}>{r.comment}</Text> : null}
                    </View>
                ))}
            </View>
        </View>
      </Animated.ScrollView>

      {cart.length > 0 && (
        <Animated.View style={styles.floatingCartContainer}>
          <TouchableOpacity style={styles.floatingCartBtn} onPress={() => router.push('/cart')}>
            <View>
              <Text style={styles.floatingCartText}>{cart.length} ITEM{cart.length > 1 ? 'S' : ''}</Text>
              <Text style={styles.floatingCartSubText}>View Cart ➔</Text>
            </View>
            <Text style={{fontSize: 20}}>🛍️</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 90, backgroundColor: '#fff', paddingTop: 45, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', zIndex: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  backButton: { position: 'absolute', top: 45, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  backButtonText: { fontSize: 24, fontWeight: '900', marginTop: -2 },
  heroContainer: { width: '100%', height: HEADER_HEIGHT, backgroundColor: '#fff' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'rgba(0,0,0,0.3)' },
  contentContainer: { backgroundColor: '#fcfcfc', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, minHeight: height },
  heroOverlayCard: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  heroTitle: { fontSize: 28, fontWeight: '900', marginBottom: 6 },
  heroSub: { fontSize: 14, color: '#6b7280', fontWeight: '500', marginBottom: 20 },
  metaCardsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metaCard: { flex: 1, alignItems: 'center' },
  metaCardValue: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  metaCardLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  metaCardDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb' },
  menuSection: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 25 },
  menuItemCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  menuItemInfo: { flex: 1, paddingRight: 15, justifyContent: 'center' },
  vegBadge: { width: 14, height: 14, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  menuItemName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  menuItemPrice: { fontSize: 15, fontWeight: '900', color: '#374151', marginBottom: 8 },
  menuItemDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  menuItemImageContainer: { width: 110, height: 110, position: 'relative' },
  menuItemImage: { width: '100%', height: '100%', borderRadius: 16 },
  addButtonContainer: { position: 'absolute', bottom: -12, alignSelf: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 25, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  addButtonText: { color: '#16a34a', fontWeight: '900', fontSize: 14 },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', height: 36, width: 90 },
  qtyBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  qtyBtnText: { color: '#16a34a', fontSize: 18, fontWeight: 'bold' },
  qtyText: { fontWeight: '800', fontSize: 14, color: '#111827', width: 24, textAlign: 'center' },
  floatingCartContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 20, left: 20, right: 20 },
  floatingCartBtn: { backgroundColor: '#16a34a', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#16a34a', shadowOffset: {width:0, height:6}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  floatingCartText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  floatingCartSubText: { color: '#dcfce7', fontSize: 12, fontWeight: '600', marginTop: 2 },
  reviewSection: { padding: 20 },
  addReviewBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  input: { backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 10 },
  reviewBtn: { backgroundColor: '#020617', padding: 12, borderRadius: 8, alignItems: 'center' },
  reviewBtnText: { color: '#fff', fontWeight: 'bold' },
  reviewCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 }
});
