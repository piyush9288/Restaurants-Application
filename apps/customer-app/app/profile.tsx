import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// @ts-ignore
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${API_URL}/api/users/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, address })
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
    return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#fc8019" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{padding: 5}}>
          <Text style={{fontSize: 24, fontWeight: 'bold'}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{width: 30}} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <Text style={{fontSize: 60}}>👤</Text>
          <Text style={{marginTop: 10, fontSize: 16, color: '#666'}}>{email}</Text>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />

        <Text style={styles.label}>Delivery Address</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter your full address" multiline numberOfLines={3} style={[styles.input, {height: 80}]} />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Details"}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {
            if (typeof window !== 'undefined') localStorage.removeItem('token');
            router.replace('/');
            if (Platform.OS === 'web') alert("Logged out");
        }}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 25 : 0, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 3 },
  title: { fontSize: 18, fontWeight: '800', color: '#1c1c1c' },
  content: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '700', color: '#3e4152', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9e9eb', borderRadius: 8, paddingHorizontal: 15, height: 50, marginBottom: 20, fontSize: 16, color: '#1c1c1c' },
  saveBtn: { backgroundColor: '#fc8019', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ff4b4b', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  logoutBtnText: { color: '#ff4b4b', fontWeight: '800', fontSize: 16 }
});
