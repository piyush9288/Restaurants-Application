import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image, TextInput, SafeAreaView, Platform, Animated, Easing, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

const CATEGORIES = [
  { id: '1', name: 'Offers', img: 'https://cdn-icons-png.flaticon.com/512/879/879859.png' },
  { id: '2', name: 'Pizza', img: 'https://cdn-icons-png.flaticon.com/512/3595/3595458.png' },
  { id: '3', name: 'Burger', img: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
  { id: '4', name: 'Healthy', img: 'https://cdn-icons-png.flaticon.com/512/2318/2318055.png' },
  { id: '5', name: 'Desserts', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081832.png' },
  { id: '6', name: 'Chicken', img: 'https://cdn-icons-png.flaticon.com/512/1046/1046786.png' },
];

const BANNERS = [
  { id: 'b1', title: 'PIZZA PARTY', discount: '70% OFF', sub: 'UP TO ₹140 OFF', desc: 'Craving something cheesy?', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80', color: '#ff4b4b' },
  { id: 'b2', title: 'BURGER BONANZA', discount: '60% OFF', sub: 'UP TO ₹120 OFF', desc: 'Juicy burgers wait for you.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', color: '#fc8019' },
  { id: 'b3', title: 'HEALTHY BITES', discount: 'FLAT 50%', sub: 'NO MINIMUM', desc: 'Eat fresh, feel fresh.', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80', color: '#10b981' }
];

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchWidth = useRef(new Animated.Value(width - 40)).current;

  // Search Placeholder Animation
  const placeholders = ["Search for pizza...", "Search for burgers...", "Search for biryani...", "Search for desserts..."];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Auto-slide banner logic
  const flatListRef = useRef<FlatList>(null);
  const currentSlide = useRef(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      if (flatListRef.current) {
        currentSlide.current = (currentSlide.current + 1) % BANNERS.length;
        flatListRef.current.scrollToOffset({
          offset: currentSlide.current * (width - 20),
          animated: true,
        });
      }
    }, 3000); // 3 seconds per slide

    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
    ]).start();

    const interval = setInterval(() => {
        setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      setIsAuthenticated(!!token);
      
      const fetchProfileAndLocation = async () => {
        let loadedProfile = null;
        if (token) {
          try {
            const res = await fetch(API_URL + '/api/users/me/profile', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data && data.pincode) {
              loadedProfile = data;
              setUserProfile(data);
            }
          } catch (e) {}
        }
        
        if (Platform.OS !== 'web') {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({});
                    const reverseGeocode = await Location.reverseGeocodeAsync({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    });
                    
                    if (reverseGeocode && reverseGeocode.length > 0) {
                        const loc = reverseGeocode[0];
                        const livePincode = loc.postalCode || loadedProfile?.pincode;
                        const liveAddress = `${loc.name ? loc.name + ', ' : ''}${loc.city ? loc.city : ''}`;
                        
                        setUserProfile((prev: any) => ({
                            ...(prev || {}),
                            pincode: livePincode,
                            address: liveAddress || prev?.address
                        }));
                    }
                }
            } catch (e) {
                console.log("GPS fetch failed silently");
            }
        }
      };

      fetchProfileAndLocation();
    }, [])
  );

  useEffect(() => {
    fetch(API_URL + '/api/restaurants/')
      .then((res) => res.json())
      .then((data) => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredRestaurants = restaurants.filter((r: any) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (activeCategory && activeCategory !== 'Offers') {
      matchesCategory = r.description.toLowerCase().includes(activeCategory.toLowerCase()) || r.name.toLowerCase().includes(activeCategory.toLowerCase());
    }
    let matchesPincode = true;
    if (userProfile?.pincode && r.pincode) {
        matchesPincode = userProfile.pincode === r.pincode;
    }
    return matchesSearch && matchesCategory && matchesPincode;
  });

  const handleSearchFocus = () => {
      Animated.spring(searchWidth, { toValue: width - 20, useNativeDriver: false, tension: 100, friction: 10 }).start();
  };
  const handleSearchBlur = () => {
      Animated.spring(searchWidth, { toValue: width - 40, useNativeDriver: false, tension: 100, friction: 10 }).start();
  };

  const renderBanner = ({ item }: { item: any }) => (
      <View style={[styles.bannerCard, { backgroundColor: item.color }]}>
          <Image source={{ uri: item.img }} style={styles.bannerImg} />
          <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerDiscount}>{item.discount}</Text>
              <Text style={styles.bannerSub}>{item.sub}</Text>
              <Text style={styles.bannerDesc}>{item.desc}</Text>
              <TouchableOpacity style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>ORDER NOW</Text>
              </TouchableOpacity>
          </View>
      </View>
  );

  const renderRestaurant = ({ item, index }: { item: any, index: number }) => {
    const images = [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80'
    ];
    const imgUrl = images[index % images.length];
    const rating = (4 + (index % 10) * 0.1).toFixed(1);
    const time = 25 + (index % 3) * 10;
    
    // Staggered entrance
    const inputRange = [-1, 0, (index * 120) + 150];
    const opacity = scrollY.interpolate({ inputRange, outputRange: [1, 1, 1], extrapolate: 'clamp' }); 
    // Usually we would use scrollY to fade items in as they enter view, but for simplicity we'll just render them.

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity 
            style={styles.restaurantCard}
            activeOpacity={0.9}
            onPress={() => router.push(`/restaurant/${item.id}?name=${encodeURIComponent(item.name)}`)}
          >
            <Image source={{ uri: imgUrl }} style={styles.cardImage} />
            <View style={styles.cardOverlay}>
              <Text style={styles.offerText}>50% OFF</Text>
              <Text style={styles.offerSubtext}>Up to ₹120</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{rating} ⭐</Text>
                </View>
              </View>
              <Text style={styles.cuisineText}>{item.description} • ₹200 for one</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}><Text style={styles.metaText}>⏱ {time} min</Text></View>
                <View style={styles.metaBadge}><Text style={styles.metaText}>📍 {item.address}</Text></View>
              </View>
            </View>
          </TouchableOpacity>
      </Animated.View>
    );
  };

  const SkeletonLoader = () => (
      <View style={{marginHorizontal: 15, marginTop: 10}}>
          <View style={{width: '100%', height: 180, backgroundColor: '#e5e7eb', borderRadius: 16, marginBottom: 15}} />
          <View style={{width: '60%', height: 20, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 10}} />
          <View style={{width: '40%', height: 15, backgroundColor: '#e5e7eb', borderRadius: 4}} />
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationLabel}>Delivery to</Text>
          </View>
          <View style={styles.addressRow}>
              <Text style={styles.locationValue} numberOfLines={1}>
                {userProfile?.pincode ? `${userProfile.address.split(',')[0]}, ${userProfile.pincode}` : 'Fetching location...'}
              </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {isAuthenticated ? (
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarWrapper}>
               <Image source={{uri: 'https://i.pravatar.cc/100?img=33'}} style={styles.avatar} />
               <View style={styles.onlineDot} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{paddingBottom: 120}}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        
        {/* Premium Search Bar */}
        <View style={{alignItems: 'center'}}>
            <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
                style={styles.searchInput} 
                placeholder={placeholders[placeholderIdx]} 
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
            />
            <View style={styles.searchDivider} />
            <TouchableOpacity><Text style={styles.micIcon}>🎤</Text></TouchableOpacity>
            </Animated.View>
        </View>

        {/* Hero Banners */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <FlatList 
                ref={flatListRef}
                data={BANNERS}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 20}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const contentOffset = e.nativeEvent.contentOffset.x;
                  currentSlide.current = Math.round(contentOffset / (width - 20));
                }}
                contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 25 }}
                renderItem={renderBanner}
                keyExtractor={item => item.id}
            />
        </Animated.View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map((cat, idx) => {
              const isActive = activeCategory === cat.name;
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.categoryItem, { marginLeft: idx === 0 ? 0 : 20 }]}
                  activeOpacity={0.7}
                  onPress={() => setActiveCategory(isActive ? null : cat.name)}
                >
                  <View style={[styles.categoryIconCircle, isActive && { backgroundColor: '#fff3ed', borderColor: '#fc8019', borderWidth: 2 }]}>
                    <Image source={{uri: cat.img}} style={{width: 45, height: 45, resizeMode: 'contain'}} />
                  </View>
                  <Text style={[styles.categoryName, isActive && { color: '#fc8019', fontWeight: 'bold' }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Restaurant List */}
        <View style={[styles.sectionContainer, {marginTop: 10}]}>
          <Text style={styles.sectionTitle}>
            {activeCategory ? `Top ${activeCategory} places` : 'Restaurants to explore'}
          </Text>
          
          {loading ? (
             <View>
                 <SkeletonLoader />
                 <SkeletonLoader />
             </View>
          ) : (
            <FlatList
              data={filteredRestaurants}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={renderRestaurant}
              scrollEnabled={false}
              ListEmptyComponent={
                  <View style={styles.emptyState}>
                      <Text style={{fontSize: 50, marginBottom: 15}}>🍽️</Text>
                      <Text style={styles.emptyTitle}>Looks a little quiet here</Text>
                      <Text style={styles.emptySub}>Try changing your location or search query.</Text>
                  </View>
              }
            />
          )}
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 15, paddingBottom: 15, backgroundColor: '#fcfcfc' },
  locationContainer: { flex: 1, paddingRight: 15 },
  locationPin: { fontSize: 18, marginRight: 4 },
  locationLabel: { fontSize: 13, color: '#fc8019', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationValue: { fontSize: 18, fontWeight: '900', color: '#111827', flexShrink: 1, letterSpacing: -0.3 },
  
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, elevation: 3 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
  
  loginBtn: { backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 18, borderRadius: 18, height: 58, marginTop: 10, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  searchIcon: { fontSize: 20, marginRight: 12, color: '#fc8019' },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  searchDivider: { width: 1, height: 28, backgroundColor: '#e5e7eb', marginHorizontal: 15 },
  micIcon: { fontSize: 20, color: '#fc8019' },
  
  bannerCard: { width: width - 40, height: 180, borderRadius: 24, marginHorizontal: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 },
  bannerImg: { width: '100%', height: '100%', position: 'absolute', opacity: 0.4, resizeMode: 'cover' },
  bannerOverlay: { flex: 1, padding: 25, justifyContent: 'center' },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  bannerDiscount: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 2 },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5 },
  bannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 15 },
  bannerBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  bannerBtnText: { color: '#111827', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

  sectionContainer: { marginHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 20, letterSpacing: -0.5 },
  
  categoriesScroll: { flexDirection: 'row', overflow: 'visible' },
  categoryItem: { alignItems: 'center' },
  categoryIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#4b5563' },
  
  restaurantCard: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, overflow: 'hidden' },
  cardImage: { width: '100%', height: 200, resizeMode: 'cover' },
  cardOverlay: { position: 'absolute', top: 145, left: 0, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.75)', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  offerText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  offerSubtext: { color: '#fff', fontSize: 11, fontWeight: '700', opacity: 0.9 },
  cardInfo: { padding: 18 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  restaurantName: { fontSize: 20, fontWeight: '900', color: '#111827', flex: 1, marginRight: 15, letterSpacing: -0.3 },
  ratingBadge: { backgroundColor: '#24963f', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  ratingText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  cuisineText: { color: '#6b7280', fontSize: 14, marginBottom: 12, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  metaText: { color: '#4b5563', fontSize: 13, fontWeight: '700' },

  emptyState: { alignItems: 'center', marginTop: 30, padding: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 10 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center' }
});
