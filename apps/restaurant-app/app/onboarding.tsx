import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function OnboardingScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    
    // Form State
    const [type, setType] = useState('FOOD');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.5,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name || !phone || !address || !pincode) {
            Alert.alert('Missing Fields', 'Please fill out all required details.');
            return;
        }

        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('restaurant_token') : null;
            
            const payload = {
                name,
                description,
                address,
                pincode,
                phone,
                type,
                photo_url: photoUri
            };

            const response = await fetch(`${API_URL}/api/restaurants/me`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            setLoading(false);
            if (response.ok) {
                if (Platform.OS === 'web') alert('Profile setup complete!');
                else Alert.alert('Success', 'Welcome to Partner Central!');
                router.replace('/');
            } else {
                const data = await response.json();
                Alert.alert('Error', data.detail || 'Failed to setup profile');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Network Error', 'Could not connect to server');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Partner Onboarding</Text>
                <Text style={styles.headerSub}>Step {step} of 2</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {step === 1 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Business Type</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity 
                                style={[styles.typeBtn, type === 'FOOD' && styles.typeBtnActive]} 
                                onPress={() => setType('FOOD')}
                            >
                                <Text style={{fontSize: 30, marginBottom: 10}}>🍽️</Text>
                                <Text style={[styles.typeText, type === 'FOOD' && styles.typeTextActive]}>Food Delivery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.typeBtn, type === 'MART' && styles.typeBtnActive]} 
                                onPress={() => setType('MART')}
                            >
                                <Text style={{fontSize: 30, marginBottom: 10}}>🛒</Text>
                                <Text style={[styles.typeText, type === 'MART' && styles.typeTextActive]}>Instamart</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>Basic Details</Text>
                        <TextInput style={styles.input} placeholder="Business Name *" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
                        <TextInput style={styles.input} placeholder="Short Description" placeholderTextColor="#94a3b8" value={description} onChangeText={setDescription} />
                        <TextInput style={styles.input} placeholder="Phone Number *" placeholderTextColor="#94a3b8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                        
                        <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
                            <Text style={styles.nextBtnText}>Next Step ➔</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 2 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Cover Photo</Text>
                        <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.coverImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Text style={{fontSize: 40}}>📸</Text>
                                    <Text style={styles.uploadText}>Upload Cover Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.sectionTitle}>Location Details</Text>
                        <TextInput style={styles.input} placeholder="Full Address *" placeholderTextColor="#94a3b8" value={address} onChangeText={setAddress} multiline />
                        <TextInput style={styles.input} placeholder="Pincode *" placeholderTextColor="#94a3b8" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
                        
                        <View style={{flexDirection: 'row', marginTop: 10}}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                <Text style={styles.backBtnText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
                                <Text style={styles.submitBtnText}>{loading ? 'Saving...' : 'Complete Setup'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { padding: 30, paddingTop: 60, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
    headerSub: { fontSize: 14, color: '#94a3b8', fontWeight: 'bold', marginTop: 5 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    card: { backgroundColor: '#1e293b', padding: 25, borderRadius: 24, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15, marginTop: 10 },
    
    typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    typeBtn: { flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 16, alignItems: 'center', marginHorizontal: 5, borderWidth: 2, borderColor: 'transparent' },
    typeBtnActive: { borderColor: '#3b82f6', backgroundColor: '#172554' },
    typeText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 15 },
    typeTextActive: { color: '#60a5fa' },

    input: { height: 55, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 15, marginBottom: 16, fontSize: 15, color: '#fff' },
    
    photoUpload: { height: 150, backgroundColor: '#0f172a', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' },
    coverImage: { width: '100%', height: '100%' },

    nextBtn: { backgroundColor: '#3b82f6', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    
    backBtn: { flex: 1, backgroundColor: '#334155', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    submitBtn: { flex: 2, backgroundColor: '#10b981', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
