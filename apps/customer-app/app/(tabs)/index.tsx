import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (typeof window !== 'undefined' && localStorage.getItem('token')) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }, [])
  );

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/restaurants/')
      .then((response) => response.json())
      .then((data) => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching restaurants: ", error);
        setLoading(false);
      });
  }, []);

  const router = useRouter();
  
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      alert("Logged out successfully");
    }
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
        <Text style={styles.title}>What would you like to eat?</Text>
        {isAuthenticated ? (
          <Text onPress={handleLogout} style={{color: '#6c757d', fontWeight: 'bold'}}>Logout</Text>
        ) : (
          <Link href="/login" style={{color: '#ff5a5f', fontWeight: 'bold'}}>Login</Link>
        )}
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#ff5a5f" />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/restaurant/${item.id}?name=${encodeURIComponent(item.name)}`)}
            >
              <View style={{height: 150, backgroundColor: '#ffe5e5', borderRadius: 8, marginBottom: 10, justifyContent: 'center', alignItems: 'center'}}>
                 <Text style={{fontSize: 40}}>🍔</Text>
              </View>
              <Text style={styles.restaurantName}>{item.name}</Text>
              <Text style={styles.cuisine}>{item.description}</Text>
              <Text style={styles.address}>📍 {item.address}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{textAlign: 'center'}}>No restaurants found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cuisine: {
    color: '#6c757d',
    marginTop: 4,
  },
  address: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#e7a700',
  }
});
