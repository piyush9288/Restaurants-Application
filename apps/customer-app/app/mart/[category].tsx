import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function MartCategoryScreen() {
    const { category } = useLocalSearchParams();
    const catName = category ? category.toString() : 'Category';

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Mock products for the category
    const products = [
        { id: '1', name: 'Premium ' + catName, price: '₹149', weight: '500g', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' },
        { id: '2', name: 'Fresh Organic ' + catName, price: '₹299', weight: '1kg', img: 'https://images.unsplash.com/photo-1596422846543-74c6fc1e430a?w=200&q=80' },
        { id: '3', name: 'Farm Picked ' + catName, price: '₹99', weight: '250g', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80' },
        { id: '4', name: 'Imported ' + catName, price: '₹450', weight: '500g', img: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=200&q=80' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{catName}</Text>
                <View style={styles.cartIcon}><Text style={{fontSize: 20}}>🛒</Text></View>
            </View>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.sectionTitle}>Showing all in {catName}</Text>
                    
                    <View style={styles.productGrid}>
                        {products.map(item => (
                            <View key={item.id} style={styles.productCard}>
                                <Image source={{uri: item.img}} style={styles.productImg} />
                                <View style={styles.addBtn}>
                                    <Text style={styles.addText}>ADD</Text>
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productTime}>⏱️ 10 MINS</Text>
                                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                                    <Text style={styles.productWeight}>{item.weight}</Text>
                                    <Text style={styles.productPrice}>{item.price}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>
                <View style={{height: 100}} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#020617' },
    backBtn: { padding: 10, backgroundColor: '#1e293b', borderRadius: 12 },
    backText: { color: '#8b5cf6', fontSize: 14, fontWeight: 'bold' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    cartIcon: { width: 44, height: 44, backgroundColor: '#1e293b', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    
    content: { flex: 1, padding: 20 },
    sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 25 },
    
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    productCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 20, marginBottom: 20, overflow: 'hidden', paddingBottom: 15, position: 'relative' },
    productImg: { width: '100%', height: 130, backgroundColor: '#cbd5e1' },
    addBtn: { position: 'absolute', top: 115, right: 10, backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 10, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3, zIndex: 10 },
    addText: { color: '#8b5cf6', fontWeight: '900', fontSize: 13 },
    
    productInfo: { padding: 15, paddingTop: 20 },
    productTime: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginBottom: 4 },
    productName: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 5 },
    productWeight: { color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 10 },
    productPrice: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
