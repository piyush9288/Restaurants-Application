import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Image, TextInput, SafeAreaView, Platform, Animated, Dimensions, Switch, Easing, LayoutAnimation, UIManager, Modal } from 'react-native';
import { router, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCart } from '../CartContext';
import * as Clipboard from 'expo-clipboard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const baseW = 380;
const s = (size: number) => (width / baseW) * size;
const rf = (size: number) => Math.min(Math.max(s(size), size * 0.7), size * 1.5);

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
  { id: '1', title: 'Delightful\nDeals', badge: 'GET\n70%\nOFF', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&q=80', mockItem: { id: 991, name: 'Delightful Combo', price: 199, description: 'Special deal' } },
  { id: '2', title: 'Flat ₹200 OFF\n& More', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80', mockItem: { id: 992, name: 'Mega Pizza Box', price: 399, description: 'Flat 200 off deal' } },
  { id: '3', title: 'Pick Your\nOffer!', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80', mockItem: { id: 993, name: 'Surprise Meal', price: 299, description: 'Pick your offer combo' } },
];

const FILTER_PILLS = ['Rating 4.0+', 'Fast Delivery', 'Offers', 'Veg Only', '₹300 - ₹500'];

const MART_CATEGORIES = [
  { id: '1', name: 'Vegetables', img: 'https://cdn-icons-png.flaticon.com/512/2276/2276931.png' },
  { id: '2', name: 'Fruits', img: 'https://cdn-icons-png.flaticon.com/512/3194/3194591.png' },
  { id: '3', name: 'Dairy & Milk', img: 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png' },
  { id: '4', name: 'Snacks', img: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png' },
  { id: '5', name: 'Meat', img: 'https://cdn-icons-png.flaticon.com/512/1041/1041676.png' }
];

const MART_ITEMS = [
  { id: 'm1', name: 'Amul Taaza Toned Fresh Milk', weight: '500 ml', price: 27, img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300' },
  { id: 'm2', name: 'Farm Fresh Onion', weight: '1 kg', price: 45, img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300' },
  { id: 'm3', name: 'Britannia White Bread', weight: '400 g', price: 40, img: 'https://images.unsplash.com/photo-1598142980516-10b2a7bdc327?w=300' },
  { id: 'm4', name: 'Fresh Red Tomatoes', weight: '500 g', price: 30, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300' },
  { id: 'm5', name: 'Farm Eggs (6 Pack)', weight: '6 pcs', price: 55, img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300' },
  { id: 'm6', name: 'Tata Premium Tea', weight: '250 g', price: 145, img: 'https://images.unsplash.com/photo-1576092762791-dd9e2220c476?w=300' }
];

const PremiumButton = ({ children, onPress, style, activeOpacity = 0.9 }: any) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    return (
        <TouchableOpacity activeOpacity={activeOpacity} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
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
    return <Animated.View style={[{ width, height, backgroundColor: '#1e293b', borderRadius, opacity: shimmerAnim }, style]} />;
};

// Synchronized Sequential Shimmer Text Component (Supports spanning multiple lines!)
const SequentialShimmerText = ({ text, style, sharedAnim, baseColor = '#ffffff', shineColor = '#fde047', globalIndexStart = 0, totalChars = 0 }: any) => {
    const tLen = totalChars || text.length;
    
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {text.split('').map((char: string, index: number) => {
                const globalIndex = globalIndexStart + index;
                const charPercent = globalIndex / (tLen - 1 || 1);
                
                const spread = 0.15; // Extremely smooth wide wave
                const color = sharedAnim.interpolate({
                    inputRange: [charPercent - spread, charPercent, charPercent + spread],
                    outputRange: [baseColor, shineColor, baseColor],
                    extrapolate: 'clamp'
                });
                const scale = sharedAnim.interpolate({
                    inputRange: [charPercent - spread, charPercent, charPercent + spread],
                    outputRange: [1, 1.15, 1],
                    extrapolate: 'clamp'
                });
                const textShadowRadius = sharedAnim.interpolate({
                    inputRange: [charPercent - spread, charPercent, charPercent + spread],
                    outputRange: [2, 12, 2],
                    extrapolate: 'clamp'
                });

                return (
                    <Animated.Text key={index} style={[style, { color, textShadowRadius, transform: [{scale}] }]}>
                        {char === ' ' ? '\u00A0' : char}
                    </Animated.Text>
                );
            })}
        </View>
    );
};

// Smooth Animated Diet Toggle Component
const DietToggle = ({ diet, setDiet }: { diet: string, setDiet: (d: string) => void }) => {
    const slideAnim = useRef(new Animated.Value(diet === 'VEG' ? 0 : diet === 'NON_VEG' ? 2 : 1)).current;

    useEffect(() => {
        let toValue = 1;
        if (diet === 'VEG') toValue = 0;
        else if (diet === 'NON_VEG') toValue = 2;

        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: false,
            friction: 8,
            tension: 50
        }).start();
    }, [diet]);

    const thumbLeft = slideAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['0%', '25%', '50%']
    });
    
    const thumbOpacity = slideAnim.interpolate({
        inputRange: [0, 0.5, 1, 1.5, 2],
        outputRange: [1, 0, 0, 0, 1]
    });

    const thumbBg = slideAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['rgba(34, 197, 94, 0.2)', 'rgba(255, 255, 255, 0.05)', 'rgba(239, 68, 68, 0.2)']
    });
    
    const thumbBorder = slideAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: ['rgba(34, 197, 94, 0.5)', 'rgba(255, 255, 255, 0.1)', 'rgba(239, 68, 68, 0.5)']
    });

    return (
        <View style={styles.dietToggleContainer}>
            <Animated.View style={[
                styles.dietThumb,
                {
                    left: thumbLeft,
                    backgroundColor: thumbBg,
                    borderColor: thumbBorder,
                    opacity: diet === 'ALL' ? thumbOpacity : 1
                }
            ]} />
            
            <TouchableOpacity style={styles.dietBtn} activeOpacity={0.8} onPress={() => setDiet(diet === 'VEG' ? 'ALL' : 'VEG')}>
                <View style={[styles.vegDot, diet === 'VEG' && styles.vegDotActive]} />
                <Text style={[styles.dietText, diet === 'VEG' && styles.vegTextActive]}>VEG</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dietBtn} activeOpacity={0.8} onPress={() => setDiet(diet === 'NON_VEG' ? 'ALL' : 'NON_VEG')}>
                <View style={[styles.nonVegDot, diet === 'NON_VEG' && styles.nonVegDotActive]} />
                <Text style={[styles.dietText, diet === 'NON_VEG' && styles.nonVegTextActive]}>NON</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function HomeScreen() {
  const router = useRouter();
  const { cart, addToCart, martCart, addToMartCart, removeFromMartCart, globalService, setGlobalService, userProfile } = useCart();
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [diet, setDiet] = useState('ALL');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [locationTitle, setLocationTitle] = useState('Fetching location...');
  const [locationSub, setLocationSub] = useState('Please wait...');
  
  const [activeTabState, setActiveTabState] = useState('ALL');
  const activeTab = activeTabState;
  const activeService = globalService;
  const setActiveService = setGlobalService;
  
  const serviceSlideAnim = useRef(new Animated.Value(globalService === 'FOOD' ? 0 : 1)).current;
  
  useEffect(() => {
      Animated.spring(serviceSlideAnim, {
          toValue: globalService === 'FOOD' ? 0 : 1,
          useNativeDriver: false,
          friction: 8,
          tension: 50
      }).start();
  }, [globalService]);
  
  // PNR State
  const [pnrNumber, setPnrNumber] = useState('');
  const [pnrDetails, setPnrDetails] = useState<any>(null);
  const [isPnrLoading, setIsPnrLoading] = useState(false);

  const handlePnrSearch = () => {
      if(pnrNumber.length !== 10) { 
          return; // Silent fail or proper toast instead of alert
      }
      setIsPnrLoading(true);
      setTimeout(() => {
          setIsPnrLoading(false);
          setPnrDetails({
              train: '12951 - Rajdhani Express',
              coach: 'B4',
              seat: '42, 43',
              boarding: 'New Delhi (NDLS)',
              dest: 'Mumbai Central (MMCT)',
              upcomingStations: [
                  { name: 'Kota Jn', time: '20:10', id: 'kota' },
                  { name: 'Ratlam Jn', time: '23:30', id: 'ratlam' },
                  { name: 'Vadodara Jn', time: '03:15', id: 'brc' }
              ],
              activeStation: 'kota'
          });
      }, 1500);
  };

  const handleServiceToggle = (service: string) => {
      if (service === activeService) return;
      setActiveService(service);
      setActiveTabState('ALL');
  };

  const TABS = activeService === 'FOOD' ? ['ALL', 'OFFERS', 'FOOD ON TRAIN'] : ['ALL', 'STORE', 'MART OFFERS'];

  const handleTabPress = (tab: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveTabState(tab);
  };

  // Advanced Splash & Scroll Animations
  const listFadeAnim = useRef(new Animated.Value(0)).current;
  
  // Hero Banner Floating & Shine Animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const heroShimmerAnim = useRef(new Animated.Value(-0.2)).current;

  // Typewriter effect states
  const [placeholderText, setPlaceholderText] = useState("Search for 'Biryani'");
  const placeholderIndex = useRef(0);
  const charIndex = useRef(0);

  useEffect(() => {
      // Profile and Location Setup
      const fetchProfileAndLocation = async () => {
          try {
              if (userProfile && (userProfile.pincode || userProfile.address)) {
                  setLocationTitle(userProfile.pincode ? `Home - ${userProfile.pincode}` : 'Saved Location');
                  setLocationSub(userProfile.address || 'Address configured in profile');
                  return;
              }

              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                  setLocationTitle('Select Location');
                  setLocationSub('Location permission denied');
                  return;
              }
              
              let loc = await Location.getCurrentPositionAsync({});
              let geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
              
              if (geocode.length > 0) {
                  const place = geocode[0];
                  setLocationTitle(place.name || place.city || 'Current Location');
                  let fullAddress = [place.street, place.subregion, place.city].filter(Boolean).join(', ');
                  setLocationSub(fullAddress || 'Unknown address');
              }
          } catch (e) {
              setLocationTitle('Select Location');
              setLocationSub('Tap here to set your delivery location');
          }
      };
      
      fetchProfileAndLocation();
  }, [userProfile]);
  
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
        Animated.timing(heroShimmerAnim, { 
            toValue: 1.2, 
            duration: 2000, // Faster, energetic wave across all 31 characters
            useNativeDriver: false,
            easing: Easing.linear 
        })
    ).start();
    
  }, []);

  useEffect(() => {
    // Typewriter effect depending on active service
    const terms = globalService === 'FOOD' 
        ? ['Biryani', 'Pizza', 'Sweets', 'Burger'] 
        : ['Fresh Vegetables', 'Fruits', 'Dairy & Milk', 'Snacks'];
        
    placeholderIndex.current = 0;
    charIndex.current = 0;
    setPlaceholderText(`Search for '${terms[0]}'`);
    
    let typingInterval: ReturnType<typeof setTimeout>;
    let termInterval = setInterval(() => {
        placeholderIndex.current = (placeholderIndex.current + 1) % terms.length;
        const currentTerm = terms[placeholderIndex.current];
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
  }, [globalService]);

  useEffect(() => {
    fetch(API_URL + '/api/restaurants/')
      .then(res => res.json())
      .then(data => {
        setAllRestaurants(data);
        setRestaurants(data);
      })
      .catch(() => {})
      .finally(() => {
          setTimeout(() => setLoading(false), 800);
      });
  }, []);

  // Filter Logic whenever state changes
  useEffect(() => {
      let filtered = [...allRestaurants];
      
      // Filter by FOOD vs MART service type
      if (globalService) {
          filtered = filtered.filter((r: any) => (r.type || 'FOOD') === globalService);
      }
      
      if (searchQuery) {
          filtered = filtered.filter((r: any) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      if (activeCategory) {
          filtered = filtered.filter((r: any) => r.description?.toLowerCase().includes(activeCategory.toLowerCase()));
      }
      if (diet === 'VEG') {
          filtered = filtered.filter((r: any) => r.id % 2 === 0);
      } else if (diet === 'NON_VEG') {
          filtered = filtered.filter((r: any) => r.id % 2 !== 0);
      }
      if (activeFilter === 'Rating 4.0+') {
          filtered = filtered.filter((r: any) => r.id > 0); 
      }

      setRestaurants(filtered);
      
      // Animate the list when filter changes
      listFadeAnim.setValue(0);
      Animated.timing(listFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [searchQuery, diet, activeCategory, activeFilter, activeTab, allRestaurants, globalService]);


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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]} contentContainerStyle={{ flexGrow: 1 }}>
          
          {/* TOP PREMIUM HEADER */}
          <View style={styles.premiumHeaderSection}>
              {loading ? (
                  <View style={{paddingHorizontal: 20}}>
                      <SkeletonLoader width={200} height={20} style={{marginBottom: 10}} />
                      <SkeletonLoader width={300} height={14} style={{marginBottom: 20}} />
                      <View style={{flexDirection: 'row', gap: 15, marginTop: 10}}>
                          <SkeletonLoader width={'30%'} height={110} borderRadius={24} />
                          <SkeletonLoader width={'30%'} height={110} borderRadius={24} />
                          <SkeletonLoader width={'30%'} height={110} borderRadius={24} />
                      </View>
                  </View>
              ) : (
                  <View style={{paddingHorizontal: 20}}>
                    <View style={styles.locationHeaderRow}>
                        <View style={styles.locationHeader}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={styles.locationTitle}>{locationTitle} &gt;</Text>
                            </View>
                            <Text style={styles.locationSub} numberOfLines={1}>{locationSub}</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileIconBtn}>
                            {userProfile?.photoUri ? (
                                <Image source={{uri: userProfile.photoUri}} style={styles.profileIcon} />
                            ) : (
                                <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}} style={styles.profileIcon} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* CUSTOM SEGMENTED SERVICE TOGGLE (PROFESSIONAL CONNECTED TAB) */}
                    <View style={styles.serviceToggleContainer}>
                        {/* Inactive Baseline */}
                        <View style={styles.tabBaseline} />
                        
                        {/* Connected Active Tab (Merges with page) */}
                        <Animated.View style={[
                            styles.serviceIndicatorWrapper, 
                            { 
                                left: serviceSlideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] })
                            }
                        ]} />
                        
                        <TouchableOpacity style={styles.serviceBtn} onPress={() => handleServiceToggle('FOOD')} activeOpacity={1}>
                            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'}} style={[styles.serviceIcon, activeService !== 'FOOD' && { opacity: 0.5, transform: [{scale: 0.85}] }]} />
                            <Text style={[styles.serviceTitle, activeService !== 'FOOD' && { color: '#64748b', fontWeight: '600' }]}>Food</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.serviceBtn} onPress={() => handleServiceToggle('MART')} activeOpacity={1}>
                            <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2276/2276931.png'}} style={[styles.serviceIcon, activeService !== 'MART' && { opacity: 0.5, transform: [{scale: 0.85}] }]} />
                            <Text style={[styles.serviceTitle, activeService !== 'MART' && { color: '#64748b', fontWeight: '600' }]}>Instamart</Text>
                        </TouchableOpacity>
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
                  
                  {activeService === 'FOOD' && <DietToggle diet={diet} setDiet={setDiet} />}
              </View>

              <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: s(10), paddingBottom: s(5) }}
                  contentContainerStyle={{ flexGrow: 1, minWidth: '100%', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: s(10) }}
              >
                  {TABS.map((tab, idx) => {
                      return (
                          <TouchableOpacity 
                            key={tab} 
                            style={[styles.tabBtn, { alignItems: 'center', marginHorizontal: s(2), paddingHorizontal: s(8), marginRight: 0, paddingVertical: s(10) }]} 
                            onPress={() => handleTabPress(tab)}
                          >
                              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive, { textAlign: 'center', fontSize: rf(12.5) }]}>{tab}</Text>
                              {activeTab === tab && <Animated.View style={[styles.tabActiveLine, { left: 0, right: 0, height: Math.max(3, s(4)) }]} />}
                          </TouchableOpacity>
                      );
                  })}
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
          ) : activeService === 'MART' ? (
              <View style={[styles.contentBackground, { backgroundColor: '#f8fafc' }]}>
                  {(() => {
                      const filteredMartItems = activeCategory ? MART_ITEMS.filter(item => {
                          const lowerName = item.name.toLowerCase();
                          if(activeCategory === 'Vegetables' || activeCategory === 'Fruits') return lowerName.includes('onion') || lowerName.includes('tomato') || lowerName.includes('veg');
                          if(activeCategory === 'Dairy & Milk') return lowerName.includes('milk') || lowerName.includes('egg') || lowerName.includes('bread');
                          if(activeCategory === 'Snacks') return lowerName.includes('tea') || lowerName.includes('bread');
                          if(activeCategory === 'Meat') return lowerName.includes('egg'); // Mock fallback
                          return true;
                      }) : MART_ITEMS;

                      return (
                          <>
                              {(activeTab === 'ALL' || activeTab === 'STORE') && (
                                  <>
                                      {activeTab === 'ALL' && !activeCategory && (
                                          <View style={[styles.heroBlueBanner, { backgroundColor: '#064e3b', shadowColor: '#064e3b' }]}>
                                              <Animated.Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2276/2276931.png'}} style={[styles.floatingBurger, { transform: [{ translateY: floatAnim1 }, { rotate: '-15deg' }] }]} />
                                              <Animated.Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3194/3194591.png'}} style={[styles.floatingPizza, { transform: [{ translateY: floatAnim2 }, { rotate: '15deg' }] }]} />
                                              
                                              <View style={styles.heroTextCenter}>
                                                  <SequentialShimmerText 
                                                      text="INSTAMART" 
                                                      style={[styles.heroText70, { textShadowColor: '#16a34a' }]} 
                                                      sharedAnim={heroShimmerAnim} 
                                                      baseColor="#ffffff" 
                                                      shineColor="#4ade80"
                                                      globalIndexStart={0}
                                                      totalChars={31}
                                                  />
                                                  <SequentialShimmerText 
                                                      text="10 MINUTE PREMIUM DELIVERY" 
                                                      style={[styles.heroTextUpTo, { color: '#dcfce7' }]} 
                                                      sharedAnim={heroShimmerAnim} 
                                                      baseColor="#dcfce7" 
                                                      shineColor="#ffffff"
                                                      globalIndexStart={9}
                                                      totalChars={31}
                                                  />
                                              </View>

                                              <FlatList 
                                                  data={[
                                                      { id: '1', title: 'Flat ₹100 OFF\nGroceries', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300', mockItem: { id: 'm991', name: 'Premium Basket', price: 500, weight: 'Combo' }, badge: 'MART' },
                                                      { id: '2', title: '50% OFF\nDaily Essentials', img: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300', mockItem: { id: 'm992', name: 'Daily Essentials', price: 300, weight: 'Combo' } }
                                                  ]}
                                                  horizontal
                                                  showsHorizontalScrollIndicator={false}
                                                  contentContainerStyle={{paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15}}
                                                  renderItem={({ item }) => (
                                                      <PremiumButton 
                                                        style={styles.yellowCard} 
                                                        onPress={() => {
                                                            if (item.mockItem) addToMartCart(item.mockItem);
                                                        }}
                                                      >
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
                                                          <View style={styles.yellowAddBtn}>
                                                              <Text style={styles.yellowAddText}>ADD +</Text>
                                                          </View>
                                                      </PremiumButton>
                                                  )}
                                                  keyExtractor={item => item.id}
                                              />
                                          </View>
                                      )}

                                      {(!activeCategory || activeTab === 'STORE') && (
                                          <View>
                                              <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 15, marginBottom: 10 }]}>Shop by Category</Text>
                                              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                                                  {MART_CATEGORIES.map(cat => (
                                                      <PremiumButton key={cat.id} onPress={() => setActiveCategory(activeCategory === cat.name ? '' : cat.name)}>
                                                          <View style={[styles.martCatCard, activeCategory === cat.name && {opacity: 1}]}>
                                                              <View style={[styles.martCatImgWrapper, activeCategory === cat.name && {backgroundColor: '#dcfce7', borderWidth: 2, borderColor: '#16a34a'}]}>
                                                                  <Image source={{uri: cat.img}} style={styles.martCatImg} />
                                                              </View>
                                                              <Text style={[styles.martCatName, activeCategory === cat.name && {color: '#16a34a', fontWeight: '900'}]}>{cat.name}</Text>
                                                          </View>
                                                      </PremiumButton>
                                                  ))}
                                              </ScrollView>
                                          </View>
                                      )}

                                      <View style={[styles.sectionHeaderRow, { paddingHorizontal: 20, marginTop: 10 }]}>
                                          <Text style={styles.sectionTitle}>{activeCategory ? `${activeCategory} Items` : 'Daily Bestsellers'}</Text>
                                          {activeCategory ? (
                                              <TouchableOpacity onPress={() => setActiveCategory('')}><Text style={{color: '#16a34a', fontWeight: '800'}}>Clear Filter</Text></TouchableOpacity>
                                          ) : null}
                                      </View>
                                      
                                      <View style={{ paddingHorizontal: 20, marginTop: 15, paddingBottom: 50 }}>
                                          {filteredMartItems.map((item, index) => {
                                              const quantity = martCart.find((i: any) => i.id === item.id)?.quantity || 0;
                                              return (
                                                  <Animated.View key={item.id} style={{ opacity: listFadeAnim, marginBottom: 25, transform: [{ translateY: listFadeAnim.interpolate({inputRange: [0, 1], outputRange: [20, 0]}) }] }}>
                                                      <PremiumButton style={styles.mainRestCard}>
                                                          <View style={styles.mainRestImgContainer}>
                                                              <Image source={{ uri: item.img }} style={styles.mainRestImg} />
                                                              <View style={styles.imageOverlayGradient} />
                                                              
                                                              <View style={styles.mainRestOverlay}>
                                                                  <Text style={styles.mainRestOffer}>🔥 10 MINS DELIVERY</Text>
                                                              </View>
                                                          </View>

                                                          <View style={[styles.mainRestInfo, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
                                                              <View style={{flex: 1, paddingRight: 15}}>
                                                                  <Text style={styles.mainRestName} numberOfLines={2}>{item.name}</Text>
                                                                  <Text style={styles.mainRestRating}>⭐ 4.8 (1K+) • {item.weight}</Text>
                                                                  <Text style={[styles.mainRestCuisine, {fontWeight: '900', color: '#16a34a', fontSize: 20, marginTop: 4}]}>₹{item.price}</Text>
                                                              </View>
                                                              
                                                              <View>
                                                                  {quantity > 0 ? (
                                                                      <View style={[styles.martQtyControl, {position: 'relative', bottom: 0, paddingVertical: 4}]}>
                                                                          <TouchableOpacity onPress={() => removeFromMartCart(item.id)} style={styles.martQtyBtn}><Text style={styles.martQtyText}>-</Text></TouchableOpacity>
                                                                          <Text style={styles.martQtyNum}>{quantity}</Text>
                                                                          <TouchableOpacity onPress={() => addToMartCart(item)} style={styles.martQtyBtn}><Text style={styles.martQtyText}>+</Text></TouchableOpacity>
                                                                      </View>
                                                                  ) : (
                                                                      <TouchableOpacity style={[styles.martAddBtn, {position: 'relative', bottom: 0, paddingHorizontal: 25, paddingVertical: 12}]} onPress={() => addToMartCart(item)}>
                                                                          <Text style={styles.martAddText}>ADD</Text>
                                                                      </TouchableOpacity>
                                                                  )}
                                                              </View>
                                                          </View>
                                                      </PremiumButton>
                                                  </Animated.View>
                                              );
                                          })}
                                      </View>
                                  </>
                              )}

                              {activeTab === 'MART OFFERS' && (
                                  <View style={{padding: 20}}>
                                      <Text style={styles.sectionTitle}>Instamart Offers</Text>
                                      <PremiumButton style={styles.couponCard} onPress={async () => { await Clipboard.setStringAsync('MART50'); }}>
                                           <View style={styles.couponLeft}>
                                               <Text style={styles.couponPercent}>50%</Text>
                                               <Text style={styles.couponOff}>OFF</Text>
                                           </View>
                                           <View style={styles.couponRight}>
                                               <Text style={styles.couponCode}>MART50</Text>
                                               <Text style={styles.couponDesc}>Use code to get 50% off up to ₹100 on your first grocery order.</Text>
                                               <Text style={styles.couponTap}>TAP TO COPY</Text>
                                           </View>
                                       </PremiumButton>
                                  </View>
                              )}
                          </>
                      );
                  })()}
              </View>
          ) : (
              <View style={styles.contentBackground}>
                  {activeTab === 'ALL' ? (
                      <>
                          {/* HERO BANNER SECTION */}
                          <View style={styles.heroBlueBanner}>
                              <Animated.Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'}} style={[styles.floatingBurger, { transform: [{ translateY: floatAnim1 }, { rotate: '-15deg' }] }]} />
                              <Animated.Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3595/3595458.png'}} style={[styles.floatingPizza, { transform: [{ translateY: floatAnim2 }, { rotate: '15deg' }] }]} />
                              
                              <View style={styles.heroTextCenter}>
                                  <SequentialShimmerText 
                                      text="60% OFF" 
                                      style={styles.heroText70} 
                                      sharedAnim={heroShimmerAnim} 
                                      baseColor="#ffffff" 
                                      shineColor="#fde047"
                                      globalIndexStart={0}
                                      totalChars={31}
                                  />
                                  <SequentialShimmerText 
                                      text="UP TO ₹120 ON TOP BRANDS" 
                                      style={styles.heroTextUpTo} 
                                      sharedAnim={heroShimmerAnim} 
                                      baseColor="#fcd34d" 
                                      shineColor="#ffffff"
                                      globalIndexStart={7}
                                      totalChars={31}
                                  />
                              </View>

                              <FlatList 
                                  data={YELLOW_OFFERS}
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  contentContainerStyle={{paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15}}
                                  renderItem={({ item }) => (
                                      <PremiumButton 
                                        style={styles.yellowCard} 
                                        onPress={() => {
                                            if (item.mockItem) addToCart(item.mockItem, 1);
                                        }}
                                      >
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
                                          <View style={styles.yellowAddBtn}>
                                              <Text style={styles.yellowAddText}>ADD +</Text>
                                          </View>
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
                      </>
                  ) : activeTab === 'STORE' ? (
                      <View style={[styles.sectionContainer, {marginTop: 20}]}>
                          <Text style={styles.sectionTitle}>Quick Deliveries (10 Mins)</Text>
                          <Text style={{color: '#94a3b8', marginBottom: 20}}>Fresh groceries and daily essentials</Text>
                          
                          <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
                              <PremiumButton style={styles.storeSquareCard} onPress={() => router.push('/restaurant/1?name=Fresh+Vegetables')}>
                                  <Image source={{uri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300'}} style={styles.storeSquareImg} />
                                  <View style={styles.storeSquareOverlay}>
                                      <Text style={styles.storeSquareText}>Fresh Veggies</Text>
                                  </View>
                              </PremiumButton>
                              <PremiumButton style={styles.storeSquareCard} onPress={() => router.push('/restaurant/2?name=Dairy+%26+Milk')}>
                                  <Image source={{uri: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300'}} style={styles.storeSquareImg} />
                                  <View style={styles.storeSquareOverlay}>
                                      <Text style={styles.storeSquareText}>Dairy & Milk</Text>
                                  </View>
                              </PremiumButton>
                              <PremiumButton style={styles.storeSquareCard} onPress={() => router.push('/restaurant/3?name=Meat+%26+Seafood')}>
                                  <Image source={{uri: 'https://images.unsplash.com/photo-1607623814075-e51df1bd6342?w=300'}} style={styles.storeSquareImg} />
                                  <View style={styles.storeSquareOverlay}>
                                      <Text style={styles.storeSquareText}>Meat & Seafood</Text>
                                  </View>
                              </PremiumButton>
                              <PremiumButton style={styles.storeSquareCard} onPress={() => router.push('/restaurant/4?name=Snacks+%26+Munchies')}>
                                  <Image source={{uri: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300'}} style={styles.storeSquareImg} />
                                  <View style={styles.storeSquareOverlay}>
                                      <Text style={styles.storeSquareText}>Munchies</Text>
                                  </View>
                              </PremiumButton>
                          </View>
                      </View>
                  ) : activeTab === 'OFFERS' ? (
                      <View style={[styles.sectionContainer, {marginTop: 20}]}>
                          <Text style={styles.sectionTitle}>Exclusive Coupons</Text>
                          <Text style={{color: '#94a3b8', marginBottom: 20}}>Apply these at checkout for mega savings</Text>

                          <PremiumButton style={styles.couponCard} onPress={async () => { await Clipboard.setStringAsync('WELCOME50'); }}>
                              <View style={styles.couponLeft}>
                                  <Text style={styles.couponPercent}>50%</Text>
                                  <Text style={styles.couponOff}>OFF</Text>
                              </View>
                              <View style={styles.couponRight}>
                                  <Text style={styles.couponCode}>WELCOME50</Text>
                                  <Text style={styles.couponDesc}>Use code to get 50% off up to ₹150 on your first order. Valid on all premium restaurants.</Text>
                                  <Text style={styles.couponTap}>TAP TO COPY</Text>
                              </View>
                          </PremiumButton>

                          <PremiumButton style={styles.couponCard} onPress={async () => { await Clipboard.setStringAsync('PAYTM100'); }}>
                              <View style={[styles.couponLeft, {backgroundColor: '#3b82f6'}]}>
                                  <Text style={styles.couponPercent}>FLAT</Text>
                                  <Text style={styles.couponOff}>₹100</Text>
                              </View>
                              <View style={styles.couponRight}>
                                  <Text style={styles.couponCode}>PAYTM100</Text>
                                  <Text style={styles.couponDesc}>Get flat ₹100 cashback using Paytm Wallet on minimum order of ₹399.</Text>
                                  <Text style={styles.couponTap}>TAP TO COPY</Text>
                              </View>
                          </PremiumButton>
                      </View>
                  ) : activeTab === 'FOOD ON TRAIN' ? (
                      <View style={[styles.sectionContainer, {marginTop: 20}]}>
                          <View style={styles.trainHero}>
                              <View style={styles.trainHeroTop}>
                                  <View style={{flex: 1, paddingRight: 10}}>
                                      <Text style={styles.trainTitle}>IRCTC eCatering</Text>
                                      <Text style={styles.trainSub}>Hot meals delivered right to your train seat.</Text>
                                  </View>
                                  <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2034/2034327.png'}} style={styles.trainIcon} />
                              </View>
                              
                              <View style={styles.trainDivider}>
                                  <View style={styles.trainNotchLeft} />
                                  <View style={styles.trainDashedLine} />
                                  <View style={styles.trainNotchRight} />
                              </View>

                              {isPnrLoading ? (
                                  <View style={[styles.trainHeroBottom, {alignItems: 'center', paddingVertical: 40}]}>
                                      <ActivityIndicator size="large" color="#fc8019" />
                                      <Text style={{color: '#94a3b8', marginTop: 15, fontWeight: '700'}}>Fetching journey details...</Text>
                                  </View>
                              ) : pnrDetails ? (
                                  <View style={styles.trainHeroBottom}>
                                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15}}>
                                          <View>
                                              <Text style={{color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5}}>TRAIN</Text>
                                              <Text style={{color: '#fff', fontSize: 16, fontWeight: '900'}}>{pnrDetails.train}</Text>
                                          </View>
                                          <View style={{alignItems: 'flex-end'}}>
                                              <Text style={{color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5}}>SEAT</Text>
                                              <Text style={{color: '#fff', fontSize: 16, fontWeight: '900'}}>{pnrDetails.coach}, {pnrDetails.seat}</Text>
                                          </View>
                                      </View>
                                      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
                                          <Text style={{color: '#e2e8f0', fontSize: 13, fontWeight: '700'}}>{pnrDetails.boarding}</Text>
                                          <Text style={{color: '#fc8019', fontSize: 14, marginHorizontal: 10}}>➔</Text>
                                          <Text style={{color: '#e2e8f0', fontSize: 13, fontWeight: '700'}}>{pnrDetails.dest}</Text>
                                      </View>
                                      <TouchableOpacity style={[styles.pnrSubmitBtn, {backgroundColor: '#334155', height: 45}]} onPress={() => setPnrDetails(null)}>
                                          <Text style={styles.pnrSubmitText}>CHANGE PNR</Text>
                                      </TouchableOpacity>
                                  </View>
                              ) : (
                                  <View style={styles.trainHeroBottom}>
                                      <Text style={styles.pnrLabel}>ENTER 10-DIGIT PNR NUMBER</Text>
                                      <View style={styles.pnrInputWrapper}>
                                          <Text style={styles.pnrHash}>#</Text>
                                          <TextInput 
                                              placeholder="842109..." 
                                              placeholderTextColor="#475569" 
                                              style={styles.pnrInput} 
                                              keyboardType="number-pad" 
                                              maxLength={10}
                                              value={pnrNumber}
                                              onChangeText={setPnrNumber}
                                          />
                                      </View>
                                      <TouchableOpacity style={styles.pnrSubmitBtn} onPress={handlePnrSearch}>
                                          <Text style={styles.pnrSubmitText}>SEARCH FOOD ON ROUTE</Text>
                                      </TouchableOpacity>
                                      
                                      <View style={styles.trainFeatures}>
                                          <Text style={styles.trainFeatureText}>✓ FSSAI Approved</Text>
                                          <Text style={styles.trainFeatureText}>✓ No Delivery Fee</Text>
                                          <Text style={styles.trainFeatureText}>✓ Auto Refund</Text>
                                      </View>
                                  </View>
                              )}
                          </View>

                          {pnrDetails ? (
                              <View>
                                  <Text style={styles.sectionTitle}>Upcoming Stations</Text>
                                  <Text style={{color: '#94a3b8', marginBottom: 15}}>Select a station to view delivery options</Text>
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -20, marginBottom: 20}}>
                                      <View style={{paddingHorizontal: 20, flexDirection: 'row'}}>
                                          {pnrDetails.upcomingStations.map((station: any, i: number) => (
                                              <TouchableOpacity key={i} style={[styles.stationBadge, pnrDetails.activeStation === station.id && {backgroundColor: '#0f172a', borderColor: '#0f172a'}]}>
                                                  <Text style={[styles.stationBadgeText, pnrDetails.activeStation === station.id && {color: '#fff'}]}>{station.name}</Text>
                                                  <Text style={{color: pnrDetails.activeStation === station.id ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: '700', marginTop: 2}}>Arr: {station.time}</Text>
                                              </TouchableOpacity>
                                          ))}
                                      </View>
                                  </ScrollView>
                                  
                                  <Text style={styles.sectionTitle}>Available to order</Text>
                                  <Text style={{color: '#94a3b8', marginBottom: 20}}>Delivered directly to your seat in Coach {pnrDetails.coach}</Text>
                                  {restaurants.map((item: any, index: number) => (
                                      <View key={item.id.toString()}>{renderRestaurant({item, index})}</View>
                                  ))}
                              </View>
                          ) : (
                              <View>
                                  <Text style={styles.sectionTitle}>Popular Stations</Text>
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal: -20}}>
                                      <View style={{paddingHorizontal: 20, flexDirection: 'row'}}>
                                          {['New Delhi (NDLS)', 'Mumbai Central (MMCT)', 'Howrah (HWH)', 'Bangalore (SBC)'].map((station, i) => (
                                              <View key={i} style={styles.stationBadge}>
                                                  <Text style={styles.stationBadgeText}>{station}</Text>
                                              </View>
                                          ))}
                                      </View>
                                  </ScrollView>
                              </View>
                          )}
                      </View>
                  ) : (
                      <View style={[styles.sectionContainer, {marginTop: 20}]}>
                          <Text style={styles.sectionTitle}>{activeTab}</Text>
                          <Text style={{color: '#94a3b8', marginBottom: 20}}>Curated options for you</Text>
                          {restaurants.map((item: any, index: number) => (
                              <View key={item.id.toString()}>{renderRestaurant({item, index})}</View>
                          ))}
                      </View>
                  )}
              </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' }, // Deep Midnight Blue
  contentBackground: { backgroundColor: '#f8fafc', paddingBottom: 150, minHeight: 800 }, // Offwhite for main content
  
  // SPLASH SCREEN (Ultra Premium)
  splashScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  splashContent: { alignItems: 'center' },
  splashIcon: { width: 120, height: 120, marginBottom: 25 },
  splashTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 8, marginBottom: 5 },
  splashSubtitle: { fontSize: 14, color: '#f59e0b', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  
  // HEADER
  premiumHeaderSection: { backgroundColor: '#020617', paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 25 },
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingHorizontal: 20 },
  locationHeader: { flex: 1 },
  locationTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  locationSub: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  profileIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155', overflow: 'hidden' },
  profileIcon: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  serviceToggleContainer: { flexDirection: 'row', marginTop: s(15), position: 'relative', marginHorizontal: 20 },
  tabBaseline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: '#1e293b', zIndex: 0 },
  serviceIndicatorWrapper: { position: 'absolute', top: 0, bottom: 0, width: '50%', backgroundColor: '#020617', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 0, borderColor: '#3b82f6', zIndex: 1 },
  serviceBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: s(16), paddingBottom: s(12), zIndex: 2 },
  serviceIcon: { width: s(42), height: s(42), marginBottom: s(8), resizeMode: 'contain' },
  serviceTitle: { color: '#fff', fontSize: rf(14), fontWeight: '900', letterSpacing: 0.5 },

  // STICKY SEARCH (Glassmorphic feel)
  stickySearchSection: { backgroundColor: '#020617', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 100, paddingBottom: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 28, height: 56, paddingHorizontal: 20, borderWidth: 1, borderColor: '#1e293b' },
  searchIcon: { fontSize: 20, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '600' },
  searchDivider: { width: 1, height: 24, backgroundColor: '#334155', marginHorizontal: 12 },
  micIcon: { fontSize: 20, color: '#f59e0b' },
  
  dietToggleContainer: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 30, height: 48, marginLeft: 10, padding: 4, borderWidth: 1, borderColor: '#1e293b', position: 'relative' },
  dietBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 24, zIndex: 1 },
  dietThumb: { position: 'absolute', top: 4, bottom: 4, width: '50%', borderRadius: 24, borderWidth: 1, zIndex: 0 },
  
  dietText: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  vegTextActive: { color: '#22c55e' },
  nonVegTextActive: { color: '#ef4444' },
  
  vegDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#334155', marginRight: 4 },
  vegDotActive: { backgroundColor: '#22c55e', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  
  nonVegDot: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#334155', marginRight: 4 },
  nonVegDotActive: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  
  tabsScroll: { paddingHorizontal: 20, marginTop: 10, paddingBottom: 5 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8, position: 'relative' },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  tabTextActive: { color: '#fff', fontWeight: '900' },
  tabActiveLine: { position: 'absolute', bottom: 0, left: 14, right: 14, height: 4, backgroundColor: '#f59e0b', borderRadius: 2 },

  // HERO SECTION
  heroBlueBanner: { backgroundColor: '#0f172a', paddingTop: 35, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  floatingBurger: { position: 'absolute', top: 25, left: '5%', width: 70, height: 70, opacity: 0.9, resizeMode: 'contain', zIndex: 1 },
  floatingPizza: { position: 'absolute', top: 20, right: '5%', width: 80, height: 80, opacity: 0.9, resizeMode: 'contain', zIndex: 1 },
  heroTextCenter: { alignItems: 'center', zIndex: 5, overflow: 'hidden', paddingHorizontal: '24%' },
  heroText70: { color: '#fff', fontSize: rf(32), fontWeight: '900', letterSpacing: 0, textShadowColor: '#f59e0b', textShadowOffset: {width: 1, height: 2}, textShadowRadius: 5 },
  heroTextUpTo: { color: '#fcd34d', fontSize: rf(11), fontWeight: '900', letterSpacing: 1.5, marginTop: s(3), textAlign: 'center' },
  
  yellowCard: { backgroundColor: '#ffdd00', width: 130, height: 170, borderRadius: 24, marginRight: 15, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: {width:0, height:6}, shadowOpacity:0.3, shadowRadius:10, elevation:6 },
  yellowTextContainer: { padding: 12, paddingBottom: 0, zIndex: 10 },
  yellowTitle: { fontSize: 14, fontWeight: '900', color: '#111827', textAlign: 'center', lineHeight: 18 },
  yellowBadgeWrapper: { position: 'absolute', bottom: 15, left: 10, zIndex: 15 },
  yellowBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:5 },
  yellowBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center', lineHeight: 12 },
  yellowImg: { position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 105, resizeMode: 'cover' },
  yellowAddBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.2, shadowRadius: 4, elevation:4, zIndex: 20 },
  yellowAddText: { color: '#fc8019', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  // MART UI
  martHero: { margin: 20, marginTop: 30, backgroundColor: '#4ade80', borderRadius: 24, padding: 25, flexDirection: 'row', alignItems: 'center', shadowColor: '#16a34a', shadowOffset: {width:0, height:8}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  martHeroTextContainer: { flex: 1, zIndex: 10 },
  martHeroTitle: { fontSize: 24, fontWeight: '900', color: '#064e3b', letterSpacing: -0.5 },
  martHeroSub: { fontSize: 13, color: '#065f46', fontWeight: '800', marginTop: 4 },
  martHeroImg: { width: 100, height: 100, resizeMode: 'contain', position: 'absolute', right: -10, bottom: -10, transform: [{rotate: '-15deg'}] },
  
  martCatScroll: { marginTop: 10 },
  martCatCard: { alignItems: 'center', marginRight: 20 },
  martCatImgWrapper: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset:{width:0, height:4}, shadowOpacity:0.05, shadowRadius:6, elevation:3 },
  martCatImg: { width: 40, height: 40, resizeMode: 'contain' },
  martCatName: { fontSize: 12, fontWeight: '700', color: '#334155' },
  
  martGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between', paddingBottom: 50 },
  martItemCard: { width: '47%', backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 15, shadowColor: '#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.04, shadowRadius:8, elevation: 3 },
  martItemImgContainer: { width: '100%', height: 120, backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 12, position: 'relative' },
  martItemImg: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 16 },
  martAddBtn: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, elevation:3 },
  martAddText: { color: '#16a34a', fontWeight: '900', fontSize: 12 },
  martQtyControl: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', borderRadius: 12, shadowColor: '#16a34a', shadowOffset:{width:0,height:2}, shadowOpacity:0.3, elevation:3, overflow: 'hidden' },
  martQtyBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#16a34a' },
  martQtyText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  martQtyNum: { color: '#fff', fontWeight: '800', fontSize: 13, paddingHorizontal: 4 },
  martItemName: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 4, lineHeight: 18, marginTop: 8 },
  martItemWeight: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 8 },
  martItemPrice: { fontSize: 15, fontWeight: '900', color: '#0f172a' },

  // NEW TAB SECTIONS
  storeSquareCard: { width: '48%', height: 160, borderRadius: 20, overflow: 'hidden', marginBottom: 15, backgroundColor: '#1e293b' },
  storeSquareImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  storeSquareOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 15 },
  storeSquareText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  
  couponCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 15, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#e2e8f0' },
  couponLeft: { width: 80, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', padding: 10 },
  couponPercent: { color: '#fff', fontSize: 22, fontWeight: '900' },
  couponOff: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  couponRight: { flex: 1, padding: 15 },
  couponCode: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 },
  couponDesc: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 10 },
  couponTap: { fontSize: 10, color: '#3b82f6', fontWeight: '800', letterSpacing: 0.5 },

  trainHero: { backgroundColor: '#1e293b', borderRadius: 24, marginBottom: 25, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  trainHeroTop: { padding: 25, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trainTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  trainSub: { fontSize: 13, color: '#94a3b8', fontWeight: '600', maxWidth: '85%', lineHeight: 20 },
  trainIcon: { width: 50, height: 50, opacity: 0.9 },
  
  trainDivider: { flexDirection: 'row', alignItems: 'center', height: 20 },
  trainNotchLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fcfcfc', marginLeft: -10 },
  trainNotchRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fcfcfc', marginRight: -10 },
  trainDashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed', borderRadius: 1 },
  
  trainHeroBottom: { padding: 25, paddingTop: 15 },
  pnrLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  pnrInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 20, height: 65, marginBottom: 15 },
  pnrHash: { color: '#475569', fontSize: 24, fontWeight: '900', marginRight: 10 },
  pnrInput: { flex: 1, fontSize: 24, color: '#fff', fontWeight: '900', letterSpacing: 4 },
  pnrSubmitBtn: { backgroundColor: '#fc8019', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#fc8019', shadowOffset: {width:0, height:6}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  pnrSubmitText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  
  trainFeatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  trainFeatureText: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  
  stationBadge: { backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, marginRight: 12, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  stationBadgeText: { fontSize: 14, fontWeight: '800', color: '#334155' },

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
