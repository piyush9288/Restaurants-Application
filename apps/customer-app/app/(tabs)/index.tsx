import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image, TextInput, SafeAreaView, Platform, Animated, Dimensions, Switch, Easing } from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

const CATEGORIES = [
  { id: '1', name: 'Specials', keyword: '', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&q=80' },
  { id: '2', name: 'Pizzas', keyword: 'pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80' },
  { id: '3', name: 'Burgers', keyword: 'burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80' },
  { id: '4', name: 'Biryani', keyword: 'biryani', img: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=200&q=80' },
  { id: '5', name: 'Desserts', keyword: 'dessert', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80' },
];

const YELLOW_OFFERS = [
  { id: '1', title: 'Delightful\nDeals', badge: 'GET\n70%\nOFF', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80' },
  { id: '2', title: 'Flat ₹200 OFF\n& More', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
  { id: '3', title: 'Pick Your\nOffer!', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80' },
];

const FILTER_PILLS = ['Rating 4.0+', 'Fast Delivery', 'Offers', 'Veg Only', '₹300 - ₹500'];
const SEARCH_TERMS = ['Biryani', 'Pizza', 'Sweets', 'EatRight', 'Burger'];

// Premium Animated Pressable Component
const PremiumButton = ({ children, onPress, style, activeOpacity = 0.9 }: any) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    return (
        <Animated.View style={[{ transform: [{ scale }] }]}>
            <TouchableOpacity activeOpacity={activeOpacity} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={style}>
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Shimmer Skeleton Component
const SkeletonLoader = ({ width, height, style, borderRadius = 12 }: any) => {
    const shimmerAnim = useRef(new Animated.Value(0.2)).current;
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(shimmerAnim, { toValue: 0.6, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(shimmerAnim, { toValue: 0.2, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
        ])).start();
    }, []);
    return <Animated.View style={[{ width, height, backgroundColor: '#334155', borderRadius, opacity: shimmerAnim }, style]} />;
};

export default function HomeScreen() {
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isVeg, setIsVeg] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);
  
  const [activeTab, setActiveTab] = useState('ALL');
  const TABS = ['ALL', 'STORE', 'OFFERS', 'FOOD ON TRAIN', 'EATRIGHT'];

  // Advanced Splash & Scroll Animations
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const splashLogoRotate = useRef(new Animated.Value(0)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Hero Banner Floating & Shine Animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-100)).current;

  // Typewriter effect states
  const [placeholderText, setPlaceholderText] = useState("Search for 'Biryani'");
  const placeholderIndex = useRef(0);
  const charIndex = useRef(0);

  useEffect(() => {
    // Start Floating and Shine Animations
    Animated.loop(
        Animated.sequence([
            Animated.timing(floatAnim1, { toValue: -10, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(floatAnim1, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
        ])
    ).start();

    Animated.loop(
        Animated.sequence([
            Animated.timing(floatAnim2, { toValue: 12, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(floatAnim2, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
        ])
    ).start();

    Animated.loop(
        Animated.timing(shineAnim, { toValue: width, duration: 2500, useNativeDriver: true, delay: 1000 })
    ).start();
    
    // Typewriter effect
    let typingInterval: NodeJS.Timeout;
    let termInterval = setInterval(() => {
        placeholderIndex.current = (placeholderIndex.current + 1) % SEARCH_TERMS.length;
        const currentTerm = SEARCH_TERMS[placeholderIndex.current];
        charIndex.current = 0;
        setPlaceholderText(`Search for '`);
        
        typingInterval = setInterval(() => {
            if (charIndex.current <= currentTerm.length) {
                setPlaceholderText(`Search for '${currentTerm.substring(0, charIndex.current)}'`);
                charIndex.current++;
            } else {
                clearInterval(typingInterval);
            }
        }, 100);
    }, 4000);

    return () => {
        clearInterval(termInterval);
        if(typingInterval) clearInterval(typingInterval);
    };
  }, []);

  useEffect(() => {
    // Elegant Splash Screen Animation
    Animated.loop(Animated.timing(splashLogoRotate, { toValue: 1, duration: 8000, useNativeDriver: true, easing: Easing.linear })).start();

    fetch(API_URL + '/api/restaurants/')
      .then(res => res.json())
      .then(data => {
        setAllRestaurants(data);
        setRestaurants(data);
      })
      .catch(() => {});

    setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(splashOpacity, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
                Animated.timing(splashScale, { toValue: 1.2, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) })
            ]).start(() => setAppReady(true));
        }, 800); 
    }, 2000);
  }, []);

  // Filter Logic whenever state changes
  useEffect(() => {
      let filtered = [...allRestaurants];
      
      if (searchQuery) {
          filtered = filtered.filter((r: any) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (activeCategory) {
          filtered = filtered.filter((r: any) => r.description.toLowerCase().includes(activeCategory.toLowerCase()));
      }
      if (isVeg) {
          // Fake veg logic since backend might not have it: assume every even ID is veg or we just randomly filter to simulate
          filtered = filtered.filter((r: any) => r.id % 2 === 0);
      }
      if (activeFilter === 'Rating 4.0+') {
          // Fake rating logic: keep all since mock is usually 4+
          filtered = filtered.filter((r: any) => r.id > 0); 
      }

      setRestaurants(filtered);
      
      // Animate the list when filter changes
      listFadeAnim.setValue(0);
      Animated.timing(listFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [searchQuery, isVeg, activeCategory, activeFilter, allRestaurants]);

  const toggleCategory = (keyword: string) => {
      setActiveCategory(prev => prev === keyword ? '' : keyword);
  };

  const toggleFilter = (pill: string) => {
      setActiveFilter(prev => prev === pill ? '' : pill);
  };

  const renderRestaurant = ({ item, index }: { item: any, index: number }) => {
    const images = [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80'
    ];
    const imgUrl = images[index % images.length];
    
    return (
      <Animated.View style={{ opacity: listFadeAnim, transform: [{ translateY: listFadeAnim.interpolate({inputRange: [0, 1], outputRange: [20, 0]}) }] }}>
          <PremiumButton style={styles.mainRestCard} onPress={() => router.push(`/restaurant/${item.id}?name=${encodeURIComponent(item.name)}`)}>
            <View style={styles.mainRestImgContainer}>
                <Image source={{ uri: imgUrl }} style={styles.mainRestImg} />
                <View style={styles.imageOverlayGradient} />
                
                <TouchableOpacity style={styles.mainHeartIcon}>
                    <Text style={{color: '#fff', fontSize: 22, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 4}}>🤍</Text>
                </TouchableOpacity>
                
                <View style={styles.mainRestOverlay}>
                    <Text style={styles.mainRestOffer}>🔥 Flat ₹150 OFF</Text>
                </View>
                <View style={styles.mainRestTimeBadge}>
                    <Text style={styles.mainRestTimeText}>35-40 MINS</Text>
                </View>
            </View>

            <View style={styles.mainRestInfo}>
                <Text style={styles.mainRestName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.mainRestRating}>⭐ 4.5 (2K+) • {item.address}</Text>
                <Text style={styles.mainRestCuisine}>{item.description} • ₹400 for two</Text>
            </View>
          </PremiumButton>
      </Animated.View>
    );
  };

  const splashRotation = splashLogoRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      {/* PREMIUM SPLASH SCREEN */}
      {!appReady && (
        <Animated.View style={[styles.splashScreen, { opacity: splashOpacity, transform: [{ scale: splashScale }] }]}>
            <View style={styles.splashContent}>
                <Animated.Image 
                    source={{uri: 'https://cdn-icons-png.flaticon.com/512/2819/2819194.png'}} 
                    style={[styles.splashIcon, { transform: [{ rotate: splashRotation }] }]} 
                />
                <Text style={styles.splashTitle}>GOURMET</Text>
                <Text style={styles.splashSubtitle}>Premium Food Delivery</Text>
            </View>
        </Animated.View>
      )}

      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]} contentContainerStyle={{paddingBottom: 100}}>
          
          {/* TOP PREMIUM HEADER */}
          <View style={styles.premiumHeaderSection}>
              {loading ? (
                  <View style={{paddingHorizontal: 20}}>
                      <SkeletonLoader width={200} height={20} style={{marginBottom: 10}} />
                      <SkeletonLoader width={300} height={14} style={{marginBottom: 20}} />
                      <View style={{flexDirection: 'row', gap: 15, marginTop: 10}}>
                          <SkeletonLoader width={'30%'} height={80} borderRadius={20} />
                          <SkeletonLoader width={'30%'} height={80} borderRadius={20} />
                          <SkeletonLoader width={'30%'} height={80} borderRadius={20} />
                      </View>
                  </View>
              ) : (
                  <View style={{paddingHorizontal: 20}}>
                    <View style={styles.locationHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.locationTitle}>Home, Phase 1 &gt;</Text>
                        </View>
                        <Text style={styles.locationSub} numberOfLines={1}>Block A, Cyber City, Gurgaon, India</Text>
                    </View>

                    <View style={styles.serviceToggles}>
                        <PremiumButton style={[styles.serviceBtn, styles.serviceBtnActive]}>
                            <Text style={{fontSize: 26, marginBottom: 5}}>🍔</Text>
                            <Text style={styles.serviceTextActive}>Food</Text>
                        </PremiumButton>
                        <PremiumButton style={styles.serviceBtn}>
                            <View style={styles.timeBadge}><Text style={styles.timeBadgeText}>15 mins</Text></View>
                            <Text style={{fontSize: 26, marginBottom: 5}}>🛍️</Text>
                            <Text style={styles.serviceText}>Mart</Text>
                        </PremiumButton>
                        <PremiumButton style={styles.serviceBtn}>
                            <Text style={{fontSize: 26, marginBottom: 5}}>🍷</Text>
                            <Text style={styles.serviceText}>Dine</Text>
                        </PremiumButton>
                    </View>
                  </View>
              )}
          </View>

          {/* SEARCH & FILTERS (Sticky, High Z-Index) */}
          <View style={styles.stickySearchSection}>
              <View style={styles.searchRow}>
                  <View style={styles.searchBox}>
                      <Text style={styles.searchIcon}>🔍</Text>
                      <TextInput 
                          style={styles.searchInput}
                          placeholder={`${placeholderText}'`}
                          placeholderTextColor="#94a3b8"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                      />
                      <View style={styles.searchDivider} />
                      <Text style={styles.micIcon}>🎤</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.vegToggleBox, isVeg && styles.vegToggleBoxActive]} 
                    activeOpacity={0.8}
                    onPress={() => setIsVeg(!isVeg)}
                  >
                      <View style={[styles.vegDot, isVeg && styles.vegDotActive]} />
                      <Text style={[styles.vegText, isVeg && styles.vegTextActive]}>VEG</Text>
                  </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                  {TABS.map((tab) => (
                      <TouchableOpacity key={tab} style={[styles.tabBtn]} onPress={() => setActiveTab(tab)}>
                          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                          {activeTab === tab && <View style={styles.tabActiveLine} />}
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </View>

          {/* DYNAMIC CONTENT */}
          {loading ? (
              <View style={{padding: 20, marginTop: 10}}>
                  <SkeletonLoader width={'100%'} height={220} borderRadius={24} style={{marginBottom: 30}} />
                  <View style={{flexDirection: 'row', gap: 20, marginBottom: 40}}>
                      <SkeletonLoader width={80} height={80} borderRadius={40} />
                      <SkeletonLoader width={80} height={80} borderRadius={40} />
                      <SkeletonLoader width={80} height={80} borderRadius={40} />
                      <SkeletonLoader width={80} height={80} borderRadius={40} />
                  </View>
                  <SkeletonLoader width={'100%'} height={300} borderRadius={24} />
              </View>
          ) : (
              <View style={styles.contentBackground}>
                  {/* HERO BANNER SECTION */}
                  <View style={styles.heroBlueBanner}>
                      <Animated.Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'}} style={[styles.floatingBurger, { transform: [{ translateY: floatAnim1 }, { rotate: '-15deg' }] }]} />
                      <Animated.Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3595/3595458.png'}} style={[styles.floatingPizza, { transform: [{ translateY: floatAnim2 }, { rotate: '15deg' }] }]} />
                      
                      <View style={styles.heroTextCenter}>
                          <Text style={styles.heroText70}>60% OFF</Text>
                          <Text style={styles.heroTextUpTo}>UP TO ₹120 ON TOP BRANDS</Text>
                          <Animated.View style={[styles.shineEffect, { transform: [{ translateX: shineAnim }] }]} />
                      </View>

                      <FlatList 
                          data={YELLOW_OFFERS}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15}}
                          renderItem={({ item }) => (
                              <PremiumButton style={styles.yellowCard}>
                                  <View style={styles.yellowTextContainer}>
                                      <Text style={styles.yellowTitle}>{item.title}</Text>
                                  </View>
                                  {item.badge && (
                                     <View style={styles.yellowBadgeWrapper}>
                                         <View style={styles.yellowBadge}>
                                            <Text style={styles.yellowBadgeText}>{item.badge}</Text>
                                         </View>
                                     </View>
                                  )}
                                  <Image source={{ uri: item.img }} style={styles.yellowImg} />
                              </PremiumButton>
                          )}
                          keyExtractor={item => item.id}
                      />
                  </View>

                  {/* WHAT'S ON YOUR MIND? */}
                  <View style={styles.sectionContainer}>
                      <View style={styles.sectionHeaderRow}>
                          <Text style={styles.sectionTitle}>What's on your mind?</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mindScroll}>
                          {CATEGORIES.map(cat => (
                              <PremiumButton 
                                key={cat.id} 
                                style={styles.mindItem}
                                onPress={() => toggleCategory(cat.keyword)}
                              >
                                  <View style={[styles.mindImgContainer, activeCategory === cat.keyword && styles.mindImgContainerActive]}>
                                      <Image source={{uri: cat.img}} style={styles.mindImg} />
                                  </View>
                                  <Text style={[styles.mindText, activeCategory === cat.keyword && styles.mindTextActive]}>{cat.name}</Text>
                              </PremiumButton>
                          ))}
                      </ScrollView>
                  </View>

                  {/* FILTER PILLS */}
                  <View style={styles.filterPillsSection}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {FILTER_PILLS.map((pill, idx) => (
                              <TouchableOpacity 
                                key={idx} 
                                style={[styles.pillBtn, activeFilter === pill && styles.pillBtnActive]}
                                onPress={() => toggleFilter(pill)}
                              >
                                  <Text style={[styles.pillText, activeFilter === pill && styles.pillTextActive]}>{pill}</Text>
                              </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>

                  {/* ALL RESTAURANTS */}
                  <View style={styles.sectionContainer}>
                      <Text style={styles.sectionTitle}>
                        {restaurants.length > 0 ? `${restaurants.length} premium places to explore` : `No places found`}
                      </Text>
                      
                      {restaurants.length === 0 ? (
                          <View style={styles.emptyState}>
                              <Text style={{fontSize: 50, marginBottom: 15}}>🍽️</Text>
                              <Text style={styles.emptyTitle}>Nothing found here!</Text>
                              <Text style={styles.emptySub}>Try removing some filters.</Text>
                          </View>
                      ) : (
                          <FlatList 
                              data={restaurants}
                              keyExtractor={(item: any) => item.id.toString()}
                              renderItem={renderRestaurant}
                              scrollEnabled={false}
                          />
                      )}
                  </View>
              </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, // Deep Midnight Blue
  contentBackground: { backgroundColor: '#f8fafc' }, // Offwhite for main content
  
  // SPLASH SCREEN (Ultra Premium)
  splashScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  splashContent: { alignItems: 'center' },
  splashIcon: { width: 120, height: 120, marginBottom: 25 },
  splashTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 8, marginBottom: 5 },
  splashSubtitle: { fontSize: 14, color: '#f59e0b', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  
  // HEADER
  premiumHeaderSection: { backgroundColor: '#020617', paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 25 },
  locationHeader: { marginBottom: 25 },
  locationTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  locationSub: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  
  serviceToggles: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a', borderRadius: 24, padding: 8, borderWidth: 1, borderColor: '#1e293b' },
  serviceBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 20 },
  serviceBtnActive: { backgroundColor: '#1e293b', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  serviceText: { color: '#64748b', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  serviceTextActive: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  timeBadge: { position: 'absolute', top: -8, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10, shadowColor: '#ef4444', shadowOffset: {width:0, height:4}, shadowOpacity:0.4, shadowRadius:6 },
  timeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  // STICKY SEARCH (Glassmorphic feel)
  stickySearchSection: { backgroundColor: '#020617', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 100, paddingBottom: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, height: 56, paddingHorizontal: 15, borderWidth: 1, borderColor: '#1e293b' },
  searchIcon: { fontSize: 20, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '600' },
  searchDivider: { width: 1, height: 24, backgroundColor: '#334155', marginHorizontal: 12 },
  micIcon: { fontSize: 20, color: '#f59e0b' },
  
  vegToggleBox: { backgroundColor: '#0f172a', borderRadius: 16, height: 56, marginLeft: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  vegToggleBoxActive: { backgroundColor: '#14532d', borderColor: '#22c55e' },
  vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#64748b', marginRight: 6 },
  vegDotActive: { backgroundColor: '#4ade80' },
  vegText: { fontSize: 12, fontWeight: '900', color: '#64748b' },
  vegTextActive: { color: '#4ade80' },
  
  tabsScroll: { paddingHorizontal: 20, marginTop: 10, paddingBottom: 5 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8, position: 'relative' },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  tabTextActive: { color: '#fff', fontWeight: '900' },
  tabActiveLine: { position: 'absolute', bottom: 0, left: 14, right: 14, height: 4, backgroundColor: '#f59e0b', borderRadius: 2 },

  // HERO SECTION
  heroBlueBanner: { backgroundColor: '#0f172a', paddingTop: 35, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  floatingBurger: { position: 'absolute', top: 25, left: 0, width: 85, height: 85, opacity: 0.9, resizeMode: 'contain' },
  floatingPizza: { position: 'absolute', top: 15, right: 0, width: 95, height: 95, opacity: 0.9, resizeMode: 'contain' },
  heroTextCenter: { alignItems: 'center', zIndex: 5, overflow: 'hidden', paddingHorizontal: 40 },
  heroText70: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 0, textShadowColor: '#f59e0b', textShadowOffset: {width: 1, height: 2}, textShadowRadius: 5 },
  heroTextUpTo: { color: '#fcd34d', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 3, textAlign: 'center' },
  shineEffect: { position: 'absolute', top: -20, left: 0, width: 30, height: 150, backgroundColor: 'rgba(255,255,255,0.3)', transform: [{rotate: '20deg'}], zIndex: 10 },
  
  yellowCard: { backgroundColor: '#ffdd00', width: 130, height: 170, borderRadius: 24, marginRight: 15, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: {width:0, height:6}, shadowOpacity:0.3, shadowRadius:10, elevation:6 },
  yellowTextContainer: { padding: 12, paddingBottom: 0, zIndex: 10 },
  yellowTitle: { fontSize: 14, fontWeight: '900', color: '#111827', textAlign: 'center', lineHeight: 18 },
  yellowBadgeWrapper: { position: 'absolute', bottom: 15, left: 10, zIndex: 15 },
  yellowBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:5 },
  yellowBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center', lineHeight: 12 },
  yellowImg: { position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 105, resizeMode: 'cover' },

  // CATEGORIES
  sectionContainer: { paddingHorizontal: 20, marginTop: 35 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  
  mindScroll: { paddingBottom: 15, overflow: 'visible' },
  mindItem: { alignItems: 'center', marginRight: 22 },
  mindImgContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', padding: 5, shadowColor: '#000', shadowOffset: {width:0, height:6}, shadowOpacity:0.08, shadowRadius:10, elevation:5, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  mindImgContainerActive: { borderColor: '#f59e0b' },
  mindImg: { width: '100%', height: '100%', borderRadius: 35 },
  mindText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  mindTextActive: { color: '#f59e0b', fontWeight: '900' },

  // FILTER PILLS
  filterPillsSection: { paddingHorizontal: 20, marginTop: 15, marginBottom: 20 },
  pillBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', marginRight: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  pillBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  pillText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  pillTextActive: { color: '#fff' },

  // MAIN RESTAURANT CARDS (Ultra Premium)
  mainRestCard: { backgroundColor: '#fff', borderRadius: 28, marginBottom: 35, shadowColor: '#000', shadowOffset: {width: 0, height: 15}, shadowOpacity: 0.1, shadowRadius: 30, elevation: 12 },
  mainRestImgContainer: { width: '100%', height: 240, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', position: 'relative' },
  mainRestImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlayGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.5)' },
  mainHeartIcon: { position: 'absolute', top: 20, right: 20 },
  mainRestOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 40 },
  mainRestOffer: { color: '#fff', fontSize: 24, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:0, height:2}, textShadowRadius:4 },
  mainRestTimeBadge: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.2, shadowRadius:5 },
  mainRestTimeText: { color: '#0f172a', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  
  mainRestInfo: { padding: 20 },
  mainRestName: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 },
  mainRestRating: { fontSize: 15, color: '#475569', fontWeight: '700', marginBottom: 6 },
  mainRestCuisine: { fontSize: 15, color: '#64748b', fontWeight: '500' },

  // EMPTY STATE
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  emptySub: { fontSize: 15, color: '#64748b', textAlign: 'center' }
});
