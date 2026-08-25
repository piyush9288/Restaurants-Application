import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Image, ScrollView, SafeAreaView, Platform, Animated, Dimensions } from 'react-native';
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

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    const onAdd = () => {
        addToCart(item, restaurantId);
    };

    const onRemove = () => {
        removeFromCart(item.id);
    };

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
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={onAdd}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                >
                    <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

export default function RestaurantMenuScreen() {
  const { id, name } = useLocalSearchParams();
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { cart, addToCart, removeFromCart } = useCart();
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetch(`${API_URL}/api/restaurants/${id}/menu`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            // Add ₹10 markup (Platform fee + GST) to the base price before displaying to customer
            const markedUpMenu = data.map(item => ({
                ...item,
                originalPrice: item.price,
                price: item.price + 10 
            }));
            setMenu(markedUpMenu);
        } else {
            setMenu([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const renderItem = (item: any, index: number) => {
    const foodImages = [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80'
    ];
    const imgUrl = item.image_url || foodImages[index % foodImages.length];
    
    // Simple staggered fade in for items
    const inputRange = [-1, 0, (index * 80) + 100];
    const opacity = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1], extrapolate: 'clamp' }); // Always 1 for simplicity in ScrollView, but ready for advanced flatlist

    return (
      <Animated.View key={item.id} style={[styles.menuItem, { opacity }]}>
        <View style={styles.menuInfo}>
          <View style={styles.vegBadge}><View style={styles.vegDot} /></View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={styles.menuImageContainer}>
          <Image source={{ uri: imgUrl }} style={styles.menuImage} />
          <AddButton item={item} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} restaurantId={Number(id)} />
        </View>
      </Animated.View>
    );
  };

  const imageScale = scrollY.interpolate({
      inputRange: [-100, 0, 100],
      outputRange: [1.2, 1, 1],
      extrapolate: 'clamp'
  });
  const imageTranslateY = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [0, -HEADER_HEIGHT / 2],
      extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
      inputRange: [HEADER_HEIGHT - 100, HEADER_HEIGHT - 50],
      outputRange: [0, 1],
      extrapolate: 'clamp'
  });

  return (
    <View style={styles.container}>
      {/* Sticky Top Bar (fades in on scroll) */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
      </Animated.View>
      
      {/* Absolute Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 100}}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.heroContainer, { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }]}>
           <Image source={{uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80'}} style={styles.heroImage} />
           <View style={styles.heroGradient} />
        </Animated.View>

        <View style={styles.contentContainer}>
            <View style={styles.heroOverlayCard}>
                <Text style={styles.heroTitle}>{name}</Text>
                <Text style={styles.heroSub}>North Indian • Chinese • Fast Food</Text>
                
                <View style={styles.metaCardsRow}>
                    <View style={styles.metaCard}>
                        <Text style={styles.metaCardValue}>4.2 ⭐</Text>
                        <Text style={styles.metaCardLabel}>1K+ Ratings</Text>
                    </View>
                    <View style={styles.metaCardDivider} />
                    <View style={styles.metaCard}>
                        <Text style={styles.metaCardValue}>30 mins</Text>
                        <Text style={styles.metaCardLabel}>Delivery Time</Text>
                    </View>
                    <View style={styles.metaCardDivider} />
                    <View style={styles.metaCard}>
                        <Text style={styles.metaCardValue}>2.5 km</Text>
                        <Text style={styles.metaCardLabel}>Distance</Text>
                    </View>
                </View>
                
                <View style={styles.offerBanner}>
                    <Text style={styles.offerBannerIcon}>🎉</Text>
                    <Text style={styles.offerBannerText}>{restaurant?.offer_text || '60% OFF up to ₹120 on orders above ₹199'}</Text>
                </View>
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Recommended</Text>
                <Text style={{fontSize: 12, color: '#94a3b8', marginBottom: 15, fontStyle: 'italic'}}>Note: Menu prices include a ₹10 Platform & GST markup.</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#fc8019" style={{marginTop: 50}} />
                ) : (
                    <View>
                        {menu.length === 0 ? (
                             <Text style={styles.emptyText}>Menu is currently empty.</Text>
                        ) : (
                             menu.map((item, index) => renderItem(item, index))
                        )}
                    </View>
                )}
            </View>
        </View>
      </Animated.ScrollView>

      {/* Floating View Cart Button */}
      {cart.length > 0 && (
        <Animated.View style={styles.floatingCartContainer}>
          <TouchableOpacity style={styles.floatingCartBtn} activeOpacity={0.9} onPress={() => router.push('/cart')}>
            <View>
              <Text style={styles.floatingCartText}>{cart.length} ITEM{cart.length > 1 ? 'S' : ''}</Text>
              <Text style={styles.floatingCartSubText}>View Premium Cart ➔</Text>
            </View>
            <View style={styles.cartIconWrapper}>
                <Text style={{fontSize: 20}}>🛍️</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: Platform.OS === 'android' ? 90 : 100, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 45 : 45, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, elevation: 5, zIndex: 10 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: -0.3 },
  
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? 45 : 55, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10, zIndex: 20 },
  backButtonText: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: -2 },
  
  heroContainer: { width: '100%', height: HEADER_HEIGHT, backgroundColor: '#fff' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'rgba(0,0,0,0.3)' },
  
  contentContainer: { backgroundColor: '#fcfcfc', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, minHeight: height },
  heroOverlayCard: { padding: 25, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 6, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: '#6b7280', fontWeight: '500', marginBottom: 20 },
  
  metaCardsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  metaCard: { flex: 1, alignItems: 'center' },
  metaCardValue: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 },
  metaCardLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaCardDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb' },
  
  offerBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3ed', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(252, 128, 25, 0.2)' },
  offerBannerIcon: { fontSize: 20, marginRight: 12 },
  offerBannerText: { flex: 1, color: '#fc8019', fontWeight: '800', fontSize: 13, letterSpacing: -0.2 },

  menuSection: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 22, fontWeight: '900', marginBottom: 25, color: '#111827', letterSpacing: -0.5 },
  
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 25, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuInfo: { flex: 1, paddingRight: 20 },
  vegBadge: { width: 16, height: 16, borderWidth: 1, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center', borderRadius: 4, marginBottom: 10 },
  vegDot: { width: 8, height: 8, backgroundColor: '#22c55e', borderRadius: 4 },
  itemName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6, letterSpacing: -0.2 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: '#4b5563', marginBottom: 10 },
  itemDescription: { fontSize: 13, color: '#6b7280', lineHeight: 20, fontWeight: '500' },
  
  menuImageContainer: { alignItems: 'center', position: 'relative' },
  menuImage: { width: 140, height: 140, borderRadius: 20, backgroundColor: '#f3f4f6' },
  
  addButtonContainer: { position: 'absolute', bottom: -18, width: 110, height: 42, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#fc8019', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#fff3ed' },
  addButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fc8019', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  
  quantitySelector: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBtn: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff3ed' },
  qtyBtnText: { fontSize: 20, color: '#fc8019', fontWeight: 'bold' },
  qtyText: { fontSize: 16, fontWeight: '900', color: '#111827', paddingHorizontal: 10 },
  
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20, fontWeight: '600' },
  
  floatingCartContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  floatingCartBtn: { backgroundColor: '#111827', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.25, shadowRadius: 15, elevation: 15 },
  floatingCartText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5, marginBottom: 2, opacity: 0.8 },
  floatingCartSubText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: -0.2 },
  cartIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }
});
