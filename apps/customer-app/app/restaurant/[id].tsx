import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useCart } from '../CartContext';

// @ts-ignore
const API_URL = (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : null) || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : null) || 'http://127.0.0.1:8000';

export default function RestaurantMenuScreen() {
  const { id, name } = useLocalSearchParams();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { cart, addToCart } = useCart();

  useEffect(() => {
    fetch(`${API_URL}/api/restaurants/${id}/menu`)
      .then(res => res.json())
      .then(data => {
        setMenu(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddToCart = (item: any) => {
    addToCart(item, Number(id));
    alert(`${item.name} added to cart!`);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const foodImages = [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80'
    ];
    const imgUrl = foodImages[index % foodImages.length];

    return (
      <View style={styles.menuItem}>
        <View style={styles.menuInfo}>
          <Text style={styles.itemVeg}>🟢 VEG</Text>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={styles.menuImageContainer}>
          <Image source={{ uri: imgUrl }} style={styles.menuImage} />
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{fontSize: 24, fontWeight: 'bold'}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{width: 30}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 80}}>
        <View style={styles.heroContainer}>
           <Image source={{uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80'}} style={styles.heroImage} />
           <View style={styles.heroOverlay}>
             <Text style={styles.heroTitle}>{name}</Text>
             <Text style={styles.heroSub}>North Indian • Chinese • Fast Food</Text>
             <View style={styles.ratingRow}>
               <Text style={styles.ratingStar}>⭐ 4.2 (1K+ reviews)</Text>
               <Text style={styles.deliveryTime}>⏱ 30-35 min</Text>
             </View>
           </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#fc8019" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={menu}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={<Text style={styles.emptyText}>Menu is currently empty.</Text>}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating View Cart Button */}
      {cart.length > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity style={styles.floatingCartBtn} onPress={() => router.push('/cart')}>
            <View>
              <Text style={styles.floatingCartText}>{cart.length} ITEM{cart.length > 1 ? 'S' : ''}</Text>
              <Text style={styles.floatingCartSubText}>View Cart ➔</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  stickyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 25 : 0, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1c' },
  
  heroContainer: { backgroundColor: '#fff', marginBottom: 10 },
  heroImage: { width: '100%', height: 200, resizeMode: 'cover' },
  heroOverlay: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -25, shadowColor: '#000', shadowOffset: {width:0, height:-2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#1c1c1c', marginBottom: 5 },
  heroSub: { fontSize: 14, color: '#686b78', marginBottom: 15 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingStar: { fontSize: 13, fontWeight: '700', color: '#1c1c1c', marginRight: 15 },
  deliveryTime: { fontSize: 13, fontWeight: '700', color: '#1c1c1c' },

  menuSection: { backgroundColor: '#fff', padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, color: '#1c1c1c' },
  
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  menuInfo: { flex: 1, paddingRight: 15 },
  itemVeg: { fontSize: 10, marginBottom: 5 },
  itemName: { fontSize: 17, fontWeight: '700', color: '#3e4152', marginBottom: 5 },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#3e4152', marginBottom: 10 },
  itemDescription: { fontSize: 13, color: '#686b78', lineHeight: 18 },
  
  menuImageContainer: { alignItems: 'center' },
  menuImage: { width: 120, height: 120, borderRadius: 12 },
  addButton: { position: 'absolute', bottom: -15, backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 25, borderRadius: 8, borderWidth: 1, borderColor: '#d4d5d9', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  addButtonText: { color: '#60b246', fontWeight: '900', fontSize: 16 },
  
  separator: { height: 1, backgroundColor: '#e9e9eb', marginVertical: 10 },
  emptyText: { textAlign: 'center', color: '#686b78', marginTop: 20 },
  
  floatingCartContainer: { position: 'absolute', bottom: 20, left: 15, right: 15 },
  floatingCartBtn: { backgroundColor: '#60b246', borderRadius: 8, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  floatingCartText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  floatingCartSubText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
