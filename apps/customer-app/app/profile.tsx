import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform, SafeAreaView, ScrollView, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useCart } from './CartContext';

export default function ProfileScreen() {
  const { userProfile, setUserProfile } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (userProfile) {
        setName(userProfile.name || '');
        setPhone(userProfile.phone || '');
        setAddress(userProfile.address || '');
        setPincode(userProfile.pincode || '');
        setPhotoUri(userProfile.photoUri || '');
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  }, [userProfile]);

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
      }
    } catch (err) {
      Alert.alert("Error", "Could not fetch location");
    } finally {
      setFetchingLocation(false);
    }
  };

  const handlePhotoUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await setUserProfile({
        ...userProfile,
        name,
        phone,
        address,
        pincode,
        photoUri
    });
    setSaving(false);
    if (Platform.OS !== 'web') {
        Alert.alert("Saved", "Profile & Location Updated Successfully!", [{text: "OK"}]);
    } else {
        alert("Profile & Location Updated Successfully!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <View style={styles.avatarSection}>
                <TouchableOpacity activeOpacity={0.8} onPress={handlePhotoUpload}>
                    <View style={styles.avatarCircle}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={{width: 116, height: 116, borderRadius: 58}} />
                        ) : (
                            <Text style={styles.avatarEmoji}>👤</Text>
                        )}
                        <View style={styles.editBadge}>
                            <Text style={styles.editBadgeText}>📷</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarSubText}>Tap to add/change photo (Optional)</Text>
                <Text style={styles.avatarEmail}>{userProfile?.email || 'user@example.com'}</Text>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.sectionHeader}>PERSONAL DETAILS</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. John Doe" placeholderTextColor="#94a3b8" />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.phoneRow}>
                        <View style={styles.countryCodeBox}>
                            <Text style={styles.countryCodeEmoji}>🇮🇳</Text>
                            <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <TextInput style={[styles.input, {flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0}]} value={phone} onChangeText={setPhone} placeholder="98765 43210" keyboardType="phone-pad" maxLength={10} placeholderTextColor="#94a3b8" />
                    </View>
                </View>
                <Text style={[styles.sectionHeader, {marginTop: 15}]}>DELIVERY LOCATION</Text>
                <TouchableOpacity onPress={handleFetchLocation} style={styles.gpsFullBtn}>
                    <Text style={styles.gpsFullBtnIcon}>📍</Text>
                    <Text style={styles.gpsFullBtnText}>{fetchingLocation ? "Fetching..." : "Auto-Fetch Current Location"}</Text>
                </TouchableOpacity>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Complete Address</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={address} onChangeText={setAddress} placeholder="House/Flat No, Building, Street, Area" multiline numberOfLines={3} placeholderTextColor="#94a3b8" />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Pincode / Zip</Text>
                    <TextInput style={styles.input} value={pincode} onChangeText={setPincode} placeholder="e.g. 110001" keyboardType="numeric" placeholderTextColor="#94a3b8" />
                </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Details"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 70, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? 25 : 0, zIndex: 10, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.03, elevation: 2 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  title: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 35, marginTop: 10 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#111827', position: 'relative', shadowColor: '#111827', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 },
  avatarEmoji: { fontSize: 45 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#ffffff' },
  editBadgeText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  avatarSubText: { fontSize: 12, color: '#64748b', marginTop: 12, fontWeight: '600' },
  avatarEmail: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginTop: 6 },
  formSection: { backgroundColor: '#ffffff', padding: 25, borderRadius: 28, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 25, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.04, shadowRadius: 20, elevation: 4 },
  sectionHeader: { fontSize: 12, fontWeight: '900', color: '#111827', letterSpacing: 1.5, marginBottom: 20 },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 18, height: 58, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  countryCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', height: 58, paddingHorizontal: 15, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  countryCodeEmoji: { fontSize: 18, marginRight: 6 },
  countryCodeText: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  gpsFullBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.05)', borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.1)', height: 55, borderRadius: 16, marginBottom: 20 },
  gpsFullBtnIcon: { fontSize: 18, marginRight: 8 },
  gpsFullBtnText: { color: '#111827', fontSize: 15, fontWeight: '800' },
  textArea: { height: 100, paddingTop: 18, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#111827', paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: '#111827', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  saveBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  logoutBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fee2e2', paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 16 },
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 30, fontWeight: '700', letterSpacing: 1 }
});
