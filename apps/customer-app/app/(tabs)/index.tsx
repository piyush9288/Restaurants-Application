import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image, TextInput, SafeAreaView, Platform } from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

const CATEGORIES = [
  { id: '1', name: 'Offers', icon: '🏷️' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Burger', icon: '🍔' },
  { id: '4', name: 'Healthy', icon: '🥗' },
  { id: '5', name: 'Desserts', icon: '🍩' },
];

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

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
        
        // Auto-fetch GPS live location if on mobile
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
                        
                        setUserProfile(prev => ({
                            ...(prev || {}),
                            pincode: livePincode,
                            address: liveAddress || prev?.address
                        }));
                    }
                }
            } catch (e) {
                console.log("GPS fetch failed silently", e);
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserProfile(null);
      alert("Logged out successfully");
    }
  };

  const filteredRestaurants = restaurants.filter((r: any) => {
    // Basic search filtering
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filtering
    let matchesCategory = true;
    if (activeCategory && activeCategory !== 'Offers') {
      matchesCategory = r.description.toLowerCase().includes(activeCategory.toLowerCase()) || r.name.toLowerCase().includes(activeCategory.toLowerCase());
    }
    
    // Pincode matching (if user has pincode and restaurant has pincode)
    let matchesPincode = true;
    if (userProfile?.pincode && r.pincode) {
        matchesPincode = userProfile.pincode === r.pincode;
    }

    return matchesSearch && matchesCategory && matchesPincode;
  });

  const renderRestaurant = ({ item, index }: { item: any, index: number }) => {
    const images = [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80'
    ];
    const imgUrl = images[index % images.length];
    const rating = (4 + (index % 10) * 0.1).toFixed(1);
    const time = 25 + (index % 3) * 10;

    return (
      <TouchableOpacity 
        style={styles.restaurantCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/restaurant/${item.id}?name=${encodeURIComponent(item.name)}`)}
      >
        <Image source={{ uri: imgUrl }} style={styles.cardImage} />
        <View style={styles.cardOverlay}>
          <Text style={styles.offerText}>50% OFF</Text>
          <Text style={styles.offerSubtext}>Up to $5</Text>
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
            <Text style={styles.metaText}>⏱ {time} mins</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>📍 {item.address}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationLabel}>Delivery to</Text>
          </View>
          <View style={styles.addressRow}>
              <Text style={styles.locationValue} numberOfLines={1}>
                {userProfile?.pincode ? `${userProfile.address.split(',')[0]}, ${userProfile.pincode}` : 'Home, New Delhi, India'}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 90}}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search for restaurants, cuisines, or dishes..." 
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.searchDivider} />
          <TouchableOpacity>
            <Text style={styles.micIcon}>🎤</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Eat what makes you happy</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.name;
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.categoryItem}
                  onPress={() => setActiveCategory(isActive ? null : cat.name)}
                >
                  <View style={[styles.categoryIconCircle, isActive && { borderColor: '#fc8019', borderWidth: 2 }]}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  </View>
                  <Text style={[styles.categoryName, isActive && { color: '#fc8019', fontWeight: 'bold' }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* Restaurant List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {activeCategory ? `Top ${activeCategory} places` : 'Top restaurants near you'}
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#fc8019" style={{marginTop: 40}} />
          ) : (
            <FlatList
              data={filteredRestaurants}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={renderRestaurant}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No restaurants found.</Text>}
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 15, paddingBottom: 15, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, zIndex: 10 },
  locationContainer: { flex: 1, paddingRight: 15 },
  locationPin: { fontSize: 16, marginRight: 4 },
  locationLabel: { fontSize: 13, color: '#fc8019', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationValue: { fontSize: 17, fontWeight: '800', color: '#111827', flexShrink: 1 },
  chevron: { fontSize: 20, color: '#6b7280', marginLeft: 4, marginTop: -6, fontWeight: '300' },
  
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 18 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
  
  loginBtn: { backgroundColor: '#111827', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 5, elevation: 4 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 16, height: 55, marginTop: 15, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, borderWidth: 1, borderColor: '#f3f4f6' },
  searchIcon: { fontSize: 20, marginRight: 10, color: '#fc8019' },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  searchDivider: { width: 1, height: 25, backgroundColor: '#e5e7eb', marginHorizontal: 15 },
  micIcon: { fontSize: 18, color: '#fc8019' },
  
  sectionContainer: { marginHorizontal: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1c1c1c', marginBottom: 15, letterSpacing: -0.5 },
  
  categoriesScroll: { flexDirection: 'row' },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  categoryIcon: { fontSize: 30 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#4a4a4a' },
  
  divider: { height: 8, backgroundColor: '#f0f0f5', marginBottom: 20 },
  
  restaurantCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  cardOverlay: { position: 'absolute', top: 120, left: 0, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  offerText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  offerSubtext: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardInfo: { padding: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  restaurantName: { fontSize: 18, fontWeight: '800', color: '#1c1c1c', flex: 1, marginRight: 10 },
  ratingBadge: { backgroundColor: '#24963f', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cuisineText: { color: '#686b78', fontSize: 14, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#535665', fontSize: 13, fontWeight: '600' },
  metaDot: { color: '#535665', fontSize: 13, marginHorizontal: 8 }
});
