import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image, TextInput, SafeAreaView, Platform } from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';

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
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setIsAuthenticated(typeof window !== 'undefined' && !!localStorage.getItem('token'));
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
      alert("Logged out successfully");
    }
  };

  const filteredRestaurants = restaurants.filter((r: any) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategory && activeCategory !== 'Offers') {
      // Very basic mock filtering based on name or description matching category
      const matchesCategory = r.description.toLowerCase().includes(activeCategory.toLowerCase()) || r.name.toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    }
    return matchesSearch;
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
          <Text style={styles.locationLabel}>Delivering to</Text>
          <Text style={styles.locationValue}>Home • New Delhi, India 🔽</Text>
        </View>
        <View style={styles.headerRight}>
          <Link href="/help"><Text style={styles.iconButton}>🎧</Text></Link>
          {isAuthenticated ? (
            <TouchableOpacity onPress={handleLogout}>
               <Image source={{uri: 'https://i.pravatar.cc/100?img=33'}} style={styles.avatar} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Restaurant name or dish..." 
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, paddingBottom: 15 },
  locationContainer: { flex: 1 },
  locationLabel: { fontSize: 13, color: '#fc8019', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  locationValue: { fontSize: 16, fontWeight: '700', color: '#1c1c1c', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconButton: { fontSize: 22 },
  avatar: { width: 35, height: 35, borderRadius: 17.5, borderWidth: 2, borderColor: '#eee' },
  loginBtn: { backgroundColor: '#fc8019', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  loginBtnText: { color: '#fff', fontWeight: 'bold' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f5', marginHorizontal: 15, paddingHorizontal: 15, borderRadius: 12, height: 50, marginBottom: 20 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  
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
