import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { router } from 'expo-router';

export default function DineScreen() {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();
    }, []);

    const topRestaurants = [
        { name: 'The Taj Palace', rating: '4.9', discount: 'Flat 50% OFF on Bill', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80', distance: '1.2 km' },
        { name: 'Olive Bar & Kitchen', rating: '4.7', discount: '1+1 on Buffet', img: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=500&q=80', distance: '3.5 km' }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back to Home</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dineout</Text>
                <View style={styles.cartIcon}><Text style={{fontSize: 20}}>🍷</Text></View>
            </View>
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.heroBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/2819/2819194.png'}} style={styles.heroImg} />
                    <View style={styles.heroOverlay}>
                        <Text style={styles.heroBadge}>PREMIUM DINING</Text>
                        <Text style={styles.heroText}>Save up to 50% every time you eat out</Text>
                        <TouchableOpacity style={styles.bookBtn}>
                            <Text style={styles.bookBtnText}>Explore Near You</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={styles.sectionTitle}>Curated Collections</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionScroll}>
                        {['Romantic', 'Rooftop', 'Buffet', 'Luxury'].map((cat, i) => (
                            <TouchableOpacity key={i} style={styles.collectionCard}>
                                <Text style={styles.collectionText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.sectionTitle}>Top Trending Restaurants</Text>
                    {topRestaurants.map((rest, i) => (
                        <TouchableOpacity key={i} style={styles.restCard}>
                            <Image source={{uri: rest.img}} style={styles.restImg} />
                            <View style={styles.restOverlay}>
                                <Text style={styles.restDiscount}>{rest.discount}</Text>
                            </View>
                            <View style={styles.restInfo}>
                                <View>
                                    <Text style={styles.restName}>{rest.name}</Text>
                                    <Text style={styles.restMeta}>{rest.distance} • Fine Dining</Text>
                                </View>
                                <View style={styles.ratingBadge}>
                                    <Text style={styles.ratingText}>⭐ {rest.rating}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
                <View style={{height: 50}} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#020617', zIndex: 10 },
    backBtn: { padding: 10, backgroundColor: '#1e293b', borderRadius: 12 },
    backText: { color: '#ec4899', fontSize: 14, fontWeight: 'bold' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    cartIcon: { width: 44, height: 44, backgroundColor: '#1e293b', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    
    content: { flex: 1, padding: 20 },
    heroBanner: { height: 220, backgroundColor: '#ec4899', borderRadius: 30, marginBottom: 35, position: 'relative', overflow: 'hidden', shadowColor: '#ec4899', shadowOffset: {width:0, height:10}, shadowOpacity: 0.3, shadowRadius: 20 },
    heroImg: { position: 'absolute', top: -30, right: -40, width: 200, height: 200, opacity: 0.3, transform: [{rotate: '15deg'}] },
    heroOverlay: { padding: 25, flex: 1, justifyContent: 'center' },
    heroBadge: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15 },
    heroText: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 20, width: '90%', lineHeight: 32 },
    bookBtn: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'flex-start' },
    bookBtnText: { color: '#ec4899', fontWeight: '900', fontSize: 14 },
    
    sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 20 },
    
    collectionScroll: { marginBottom: 30, overflow: 'visible' },
    collectionCard: { backgroundColor: '#1e293b', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#334155' },
    collectionText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    
    restCard: { backgroundColor: '#0f172a', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
    restImg: { width: '100%', height: 180, resizeMode: 'cover' },
    restOverlay: { position: 'absolute', top: 15, left: 15, backgroundColor: '#ec4899', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    restDiscount: { color: '#fff', fontWeight: '900', fontSize: 13 },
    restInfo: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    restName: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4 },
    restMeta: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
    ratingBadge: { backgroundColor: '#14532d', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    ratingText: { color: '#4ade80', fontWeight: '900', fontSize: 13 }
});
