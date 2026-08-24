import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image, TextInput, SafeAreaView, Platform, Animated, Dimensions, Switch } from 'react-native';
import { useRouter, useFocusEffect } from 'react-native';
// Note: router is imported from expo-router, using require/import based on framework
import { router } from 'expo-router';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

const CATEGORIES = [
  { id: '1', name: 'Specials', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&q=80' },
  { id: '2', name: 'Pizzas', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80' },
  { id: '3', name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80' },
  { id: '4', name: 'Biryani', img: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=200&q=80' },
  { id: '5', name: 'Cakes', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80' },
];

const YELLOW_OFFERS = [
  { id: '1', title: 'Delightful\nDeals', badge: 'GET\n70%\nOFF', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
  { id: '2', title: 'Flat ₹200 OFF\n& More', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
  { id: '3', title: 'Pick Your\nOffer!', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80' },
];

const TOP_RATED = [
  { id: '1', name: 'Biryani Mahal', rating: '4.3', time: '40-45 mins', offer: '₹50 OFF', img: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&q=80' },
  { id: '2', name: 'Bikkgane Biryani', rating: '4.3', time: '30-35 mins', offer: '50% OFF', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
  { id: '3', name: 'Baskin Robbins', rating: '4.5', time: '25-30 mins', offer: 'BUY 1 GET 1', img: 'https://images.unsplash.com/photo-1558500588-44fbfa716eb7?w=400&q=80' },
];

const FILTER_PILLS = ['Filter', 'Sort by v', 'Extra off', '99 Store', 'Fast Delivery'];

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState('ALL');
  const TABS = ['ALL', 'STORE', 'OFFERS', 'FOOD ON TRAIN', 'EATRIGHT'];

  useEffect(() => {
    // Fetch user profile logic
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetch(API_URL + '/api/users/me/profile', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
            if (data && data.pincode) setUserProfile(data);
        }).catch(e => {});
    }

    // Fetch restaurants
    fetch(API_URL + '/api/restaurants/')
      .then((res) => res.json())
      .then((data) => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const renderTopRated = ({ item }: { item: any }) => (
      <TouchableOpacity style={styles.topRatedCard} activeOpacity={0.9} onPress={() => router.push(`/restaurant/1?name=${encodeURIComponent(item.name)}`)}>
          <View style={styles.topRatedImgContainer}>
              <Image source={{ uri: item.img }} style={styles.topRatedImg} />
              <TouchableOpacity style={styles.heartIcon}><Text style={{color: '#fff', fontSize: 18}}>🤍</Text></TouchableOpacity>
              <View style={styles.topRatedOverlay}>
                  <Text style={styles.topRatedOffer}>{item.offer}</Text>
                  {item.offer.includes('ABOVE') && <Text style={styles.topRatedSubOffer}>ABOVE ₹449</Text>}
              </View>
          </View>
          <Text style={styles.topRatedName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.topRatedMeta}>⭐ {item.rating} • {item.time}</Text>
          <Text style={styles.topRatedDesc}>Biryani</Text>
      </TouchableOpacity>
  );

  const renderYellowOffer = ({ item }: { item: any }) => (
      <TouchableOpacity style={styles.yellowCard} activeOpacity={0.9}>
          <Text style={styles.yellowTitle}>{item.title}</Text>
          {item.badge && (
             <View style={styles.yellowBadgeWrapper}>
                 <View style={styles.yellowBadge}>
                    <Text style={styles.yellowBadgeText}>{item.badge}</Text>
                 </View>
             </View>
          )}
          <Image source={{ uri: item.img }} style={styles.yellowImg} />
      </TouchableOpacity>
  );

  const renderRestaurant = ({ item, index }: { item: any, index: number }) => {
    const images = [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80'
    ];
    const imgUrl = images[index % images.length];
    
    return (
      <TouchableOpacity 
        style={styles.mainRestCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/restaurant/${item.id}?name=${encodeURIComponent(item.name)}`)}
      >
        <View style={styles.mainRestImgContainer}>
            <Image source={{ uri: imgUrl }} style={styles.mainRestImg} />
            <TouchableOpacity style={styles.mainHeartIcon}><Text style={{color: '#fff', fontSize: 22}}>🤍</Text></TouchableOpacity>
            
            {/* Dots */}
            <View style={styles.imageDots}>
                <View style={[styles.imgDot, {backgroundColor: '#fff', width: 8}]} />
                <View style={styles.imgDot} /><View style={styles.imgDot} /><View style={styles.imgDot} />
            </View>

            <View style={styles.mainRestOverlay}>
                <Text style={styles.mainRestOffer}>🔥 Buy 1 get 1</Text>
            </View>
            <View style={styles.mainRestTimeBadge}>
                <Text style={styles.mainRestTimeText}>35-40 MINS</Text>
            </View>
        </View>

        <View style={styles.mainRestInfo}>
            <Text style={styles.mainRestName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.mainRestRating}>⭐ 4.2 (1.1K+) • {item.address}</Text>
            <Text style={styles.mainRestCuisine}>{item.description} • ₹300 for two</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]} contentContainerStyle={{paddingBottom: 100}}>
        
        {/* TOP BLUE SECTION */}
        <View style={styles.blueHeaderSection}>
            {/* Location */}
            <View style={styles.locationHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.locationTitle}>Near maa ambey utsav hall &gt;</Text>
                </View>
                <Text style={styles.locationSub} numberOfLines={1}>Amrendra Kumar, Pragati Nagar, Sipara, Patna, Bihar...</Text>
            </View>

            {/* Service Toggles */}
            <View style={styles.serviceToggles}>
                <TouchableOpacity style={[styles.serviceBtn, styles.serviceBtnActive]}>
                    <Text style={{fontSize: 24, marginBottom: 4}}>🍔</Text>
                    <Text style={styles.serviceTextActive}>Food</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceBtn}>
                    <View style={styles.timeBadge}><Text style={styles.timeBadgeText}>22 mins</Text></View>
                    <Text style={{fontSize: 24, marginBottom: 4}}>🛒</Text>
                    <Text style={styles.serviceText}>Instamart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.serviceBtn}>
                    <Text style={{fontSize: 24, marginBottom: 4}}>🍽️</Text>
                    <Text style={styles.serviceText}>Dineout</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* SEARCH & FILTERS (Sticky) */}
        <View style={styles.stickySearchSection}>
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search for 'Biryani'"
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <View style={styles.searchDivider} />
                    <Text style={styles.micIcon}>🎤</Text>
                </View>
                
                <View style={styles.vegToggleBox}>
                    <Text style={styles.vegText}>VEG</Text>
                    <Switch value={isVeg} onValueChange={setIsVeg} trackColor={{false: '#ccc', true: '#22c55e'}} thumbColor="#fff" />
                </View>
            </View>

            {/* TABS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                {TABS.map((tab) => (
                    <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        {activeTab === tab && <View style={styles.tabActiveLine} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* 70% OFF BLUE HERO BANNER */}
        <View style={styles.heroBlueBanner}>
            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'}} style={styles.floatingBurger} />
            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3595/3595458.png'}} style={styles.floatingPizza} />
            <View style={styles.heroTextCenter}>
                <Text style={styles.heroText70}>70% OFF</Text>
                <Text style={styles.heroTextUpTo}>UP TO ₹140</Text>
            </View>

            {/* Yellow Offers Horizontal List */}
            <FlatList 
                data={YELLOW_OFFERS}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{paddingHorizontal: 15, paddingTop: 20}}
                renderItem={renderYellowOffer}
                keyExtractor={item => item.id}
            />
        </View>

        {/* TOP RATED NEAR YOU */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top rated near you</Text>
            <FlatList 
                data={TOP_RATED}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{paddingRight: 15}}
                renderItem={renderTopRated}
                keyExtractor={item => item.id}
            />
        </View>

        {/* WHAT'S ON YOUR MIND? */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>What's on your mind?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mindScroll}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.id} style={styles.mindItem}>
                        <Image source={{uri: cat.img}} style={styles.mindImg} />
                        <Text style={styles.mindText}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* 99 STORE PROMO & FILTER PILLS */}
        <View style={styles.filterPillsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FILTER_PILLS.map((pill, idx) => (
                    <TouchableOpacity key={idx} style={styles.pillBtn}>
                        <Text style={styles.pillText}>{pill}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* ALL RESTAURANTS */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top {restaurants.length} restaurants to explore</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#fc8019" style={{marginTop: 40}} />
            ) : (
                <FlatList 
                    data={restaurants}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={renderRestaurant}
                    scrollEnabled={false}
                />
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  blueHeaderSection: { backgroundColor: '#0a1024', paddingTop: Platform.OS === 'android' ? 40 : 20, paddingHorizontal: 15, paddingBottom: 15 },
  locationHeader: { marginBottom: 20 },
  locationTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  locationSub: { color: '#9ca3af', fontSize: 13 },
  
  serviceToggles: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 20, padding: 5 },
  serviceBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, position: 'relative' },
  serviceBtnActive: { backgroundColor: '#1d2745' },
  serviceText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  serviceTextActive: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  timeBadge: { position: 'absolute', top: -5, backgroundColor: '#2563eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  timeBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  stickySearchSection: { backgroundColor: '#0a1024', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, zIndex: 100, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, elevation: 4 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, height: 48, paddingHorizontal: 12 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  searchDivider: { width: 1, height: 20, backgroundColor: '#e5e7eb', marginHorizontal: 10 },
  micIcon: { fontSize: 18, color: '#fc8019' },
  vegToggleBox: { backgroundColor: '#fff', borderRadius: 12, height: 48, marginLeft: 10, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  vegText: { fontSize: 11, fontWeight: 'bold', color: '#22c55e', marginRight: 2 },
  
  tabsScroll: { paddingHorizontal: 15, marginTop: 5 },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 12, marginRight: 5, position: 'relative' },
  tabBtnActive: {},
  tabText: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  tabTextActive: { color: '#fff' },
  tabActiveLine: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 3, backgroundColor: '#fff', borderTopLeftRadius: 3, borderTopRightRadius: 3 },

  heroBlueBanner: { backgroundColor: '#111e4f', paddingTop: 25, paddingBottom: 20, overflow: 'hidden' },
  floatingBurger: { position: 'absolute', top: 20, left: -10, width: 80, height: 80, transform: [{rotate: '-15deg'}] },
  floatingPizza: { position: 'absolute', top: 15, right: -10, width: 80, height: 80, transform: [{rotate: '15deg'}] },
  heroTextCenter: { alignItems: 'center' },
  heroText70: { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: -1, textShadowColor: '#fc8019', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  heroTextUpTo: { color: '#fbbf24', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  
  yellowCard: { backgroundColor: '#ffdd00', width: 130, height: 170, borderRadius: 16, marginRight: 15, padding: 12, overflow: 'hidden', position: 'relative' },
  yellowTitle: { fontSize: 15, fontWeight: '900', color: '#1c1c1c', textAlign: 'center', lineHeight: 20 },
  yellowBadgeWrapper: { position: 'absolute', bottom: 20, left: 15, zIndex: 10 },
  yellowBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1c248b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  yellowBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  yellowImg: { position: 'absolute', bottom: -10, right: -10, width: 90, height: 90, resizeMode: 'cover' },

  sectionContainer: { paddingHorizontal: 15, marginTop: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1c1c1c', marginBottom: 15 },
  
  topRatedCard: { width: 140, marginRight: 15 },
  topRatedImgContainer: { width: '100%', height: 140, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 8 },
  topRatedImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  topRatedOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.6)' },
  topRatedOffer: { color: '#fff', fontSize: 14, fontWeight: '900' },
  topRatedSubOffer: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold' },
  heartIcon: { position: 'absolute', top: 8, right: 8 },
  topRatedName: { fontSize: 15, fontWeight: '800', color: '#1c1c1c', marginBottom: 2 },
  topRatedMeta: { fontSize: 12, color: '#24963f', fontWeight: '700', marginBottom: 2 },
  topRatedDesc: { fontSize: 12, color: '#686b78' },
  
  mindScroll: { paddingBottom: 10 },
  mindItem: { width: 80, alignItems: 'center', marginRight: 15 },
  mindImg: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
  mindText: { fontSize: 13, fontWeight: '700', color: '#4b5563', textAlign: 'center' },

  filterPillsSection: { paddingHorizontal: 15, marginTop: 15, marginBottom: 10 },
  pillBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 10, backgroundColor: '#fff' },
  pillText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },

  mainRestCard: { marginBottom: 30 },
  mainRestImgContainer: { width: '100%', height: 220, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: 12 },
  mainRestImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  mainHeartIcon: { position: 'absolute', top: 15, right: 15 },
  imageDots: { position: 'absolute', top: 15, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  imgDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 2 },
  mainRestOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, paddingTop: 40, backgroundColor: 'rgba(0,0,0,0.7)' },
  mainRestOffer: { color: '#fff', fontSize: 20, fontWeight: '900' },
  mainRestTimeBadge: { position: 'absolute', bottom: 15, right: 15, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  mainRestTimeText: { color: '#1c1c1c', fontSize: 12, fontWeight: '900' },
  mainRestInfo: { paddingHorizontal: 5 },
  mainRestName: { fontSize: 20, fontWeight: '900', color: '#1c1c1c', marginBottom: 4 },
  mainRestRating: { fontSize: 14, color: '#4b5563', fontWeight: '600', marginBottom: 4 },
  mainRestCuisine: { fontSize: 14, color: '#686b78' }
});
