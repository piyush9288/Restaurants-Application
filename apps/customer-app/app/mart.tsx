import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { router } from 'expo-router';

export default function MartScreen() {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();
    }, []);

    const categories = [
        { name: 'Fresh Fruits', img: 'https://cdn-icons-png.flaticon.com/512/3194/3194591.png' },
        { name: 'Vegetables', img: 'https://cdn-icons-png.flaticon.com/512/2153/2153788.png' },
        { name: 'Dairy & Milk', img: 'https://cdn-icons-png.flaticon.com/512/3014/3014527.png' },
        { name: 'Munchies', img: 'https://cdn-icons-png.flaticon.com/512/2515/2515183.png' },
        { name: 'Cold Drinks', img: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' },
        { name: 'Meat', img: 'https://cdn-icons-png.flaticon.com/512/3143/3143645.png' }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back to Home</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Instamart</Text>
                <View style={styles.cartIcon}><Text style={{fontSize: 20}}>🛒</Text></View>
            </View>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View style={[styles.heroBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.heroBadge}>10 MINS DELIVERY</Text>
                    <Text style={styles.heroText}>Groceries delivered superfast</Text>
                    <Image source={{uri: 'https://cdn-icons-png.flaticon.com/512/3753/3753696.png'}} style={styles.heroImg} />
                </Animated.View>
                
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={styles.sectionTitle}>Explore Categories</Text>
                    <View style={styles.grid}>
                        {categories.map((cat, i) => (
                            <TouchableOpacity key={i} style={styles.gridItem} onPress={() => router.push(`/mart/${encodeURIComponent(cat.name)}`)}>
                                <View style={styles.catPlaceholder}>
                                    <Image source={{uri: cat.img}} style={styles.catImg} />
                                </View>
                                <Text style={styles.catText}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#020617' },
    backBtn: { padding: 10, backgroundColor: '#1e293b', borderRadius: 12 },
    backText: { color: '#8b5cf6', fontSize: 14, fontWeight: 'bold' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    cartIcon: { width: 44, height: 44, backgroundColor: '#1e293b', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    
    content: { flex: 1, padding: 20 },
    heroBanner: { backgroundColor: '#8b5cf6', padding: 30, borderRadius: 30, marginBottom: 35, position: 'relative', overflow: 'hidden', shadowColor: '#8b5cf6', shadowOffset: {width:0, height:10}, shadowOpacity: 0.3, shadowRadius: 20 },
    heroBadge: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15 },
    heroText: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 5, width: '70%', lineHeight: 38 },
    heroImg: { position: 'absolute', bottom: -20, right: -20, width: 150, height: 150, opacity: 0.9, transform: [{rotate: '-15deg'}] },
    
    sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '30%', alignItems: 'center', marginBottom: 25 },
    catPlaceholder: { width: 90, height: 90, backgroundColor: '#1e293b', borderRadius: 24, marginBottom: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity:0.3, shadowRadius:5 },
    catImg: { width: 50, height: 50 },
    catText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', textAlign: 'center' }
});
