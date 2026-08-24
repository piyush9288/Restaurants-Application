import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform, SafeAreaView, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

// @ts-ignore
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const router = useRouter();

  // Animation states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const fetchProfile = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/users/me/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setPincode(data.pincode || '');
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true })
        ]).start();
      }
    };
    fetchProfile();
  }, []);

  const handleFetchLocation = async () => {
    if (Platform.OS === 'web') {
      alert("Auto-fetch location is better supported on mobile devices. Please enter manually.");
      return;
    }
    
    setFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to use auto-fetch.');
        setFetchingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const loc = reverseGeocode[0];
        const fullAddress = `${loc.name ? loc.name + ', ' : ''}${loc.street ? loc.street + ', ' : ''}${loc.city ? loc.city + ', ' : ''}${loc.region ? loc.region : ''}`;
        setAddress(fullAddress);
        if (loc.postalCode) setPincode(loc.postalCode);
      } else {
        Alert.alert("Error", "Could not fetch address details");
      }
    } catch (err) {
      Alert.alert("Error", "Could not fetch location");
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name || !phone || !address || !pincode) {
       if (Platform.OS === 'web') alert("Please fill all details completely!");
       else Alert.alert("Incomplete", "Please fill all details completely!");
       return;
    }
    
    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${API_URL}/api/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, address, pincode })
      });
      if (res.ok) {
        if (Platform.OS === 'web') alert("Profile updated successfully!");
        else Alert.alert("Success", "Profile updated successfully!");
        router.back();
      } else {
        if (Platform.OS === 'web') alert("Failed to update profile.");
        else Alert.alert("Error", "Failed to update profile.");
      }
    } catch (err) {
      if (Platform.OS === 'web') alert("Network error.");
      else Alert.alert("Error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: '#f9fafb'}}><ActivityIndicator size="large" color="#fc8019" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Account</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            
            <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>👤</Text>
                </View>
                <Text style={styles.avatarEmail}>{email}</Text>
                <Text style={styles.avatarSubText}>Manage your details</Text>
            </View>

            <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput 
                        style={styles.input} 
                        value={name} 
                        onChangeText={setName} 
                        placeholder="e.g. John Doe" 
                        placeholderTextColor="#a1a1aa"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput 
                        style={styles.input} 
                        value={phone} 
                        onChangeText={setPhone} 
                        placeholder="e.g. +91 98765 43210" 
                        keyboardType="phone-pad"
                        placeholderTextColor="#a1a1aa" 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.locationHeaderRow}>
                        <Text style={styles.label}>Delivery Address</Text>
                        <TouchableOpacity onPress={handleFetchLocation} style={styles.gpsBtn}>
                            <Text style={styles.gpsBtnText}>{fetchingLocation ? "Fetching..." : "📍 Auto-fetch"}</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        value={address} 
                        onChangeText={setAddress} 
                        placeholder="House No, Building, Street, Area" 
                        multiline 
                        numberOfLines={3} 
                        placeholderTextColor="#a1a1aa"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Pincode / Zip</Text>
                    <TextInput 
                        style={styles.input} 
                        value={pincode} 
                        onChangeText={setPincode} 
                        placeholder="e.g. 110001" 
                        keyboardType="numeric" 
                        placeholderTextColor="#a1a1aa"
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? "Updating Profile..." : "Save Details"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                if (typeof window !== 'undefined') localStorage.removeItem('token');
                router.replace('/');
                if (Platform.OS === 'web') alert("Logged out");
            }}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>App Version 1.0.0 (Premium)</Text>
            <View style={{height: 40}} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 70, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 25 : 0, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, elevation: 2, zIndex: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  backButtonText: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  title: { fontSize: 18, fontWeight: '900', color: '#111827', letterSpacing: 0.5 },
  
  content: { padding: 20 },
  
  avatarSection: { alignItems: 'center', marginBottom: 25 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff3ed', justifyContent: 'center', alignItems: 'center', shadowColor: '#fc8019', shadowOffset: {width:0, height:8}, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8, marginBottom: 15 },
  avatarEmoji: { fontSize: 50 },
  avatarEmail: { fontSize: 18, fontWeight: '800', color: '#111827' },
  avatarSubText: { fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  
  formCard: { backgroundColor: '#fff', padding: 25, borderRadius: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.04, shadowRadius: 20, elevation: 5, marginBottom: 25 },
  
  inputGroup: { marginBottom: 20 },
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '800', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 15, height: 55, fontSize: 16, color: '#111827', fontWeight: '500' },
  textArea: { height: 90, paddingTop: 15, textAlignVertical: 'top' },
  
  gpsBtn: { backgroundColor: '#fc8019', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#fc8019', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  gpsBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  
  saveBtn: { backgroundColor: '#fc8019', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#fc8019', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  
  logoutBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#fee2e2', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 15 },
  logoutBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 16 },
  
  versionText: { textAlign: 'center', color: '#a1a1aa', fontSize: 12, marginTop: 25, fontWeight: '600' }
});
