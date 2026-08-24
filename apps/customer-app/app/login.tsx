import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform, Animated, Easing } from 'react-native';
import { useRouter, Link } from 'expo-router';

// @ts-ignore
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.exp), useNativeDriver: true })
    ]).start();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch(`${API_URL}/api/auth/login/access-token`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (Platform.OS === 'web') {
          localStorage.setItem('token', data.access_token);
        }
        router.replace('/'); 
      } else {
        if (Platform.OS === 'web') alert(data.detail || "Login Failed");
        else Alert.alert("Error", data.detail || "Login Failed");
      }
    } catch (error) {
      setLoading(false);
      if (Platform.OS === 'web') alert("Network error");
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.logo}>🍔 Foodie</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to order your favorite premium meals</Text>

        <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#aaa" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#aaa" />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/register" style={styles.link}>Create one</Link>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 30, textAlign: 'center' },
  input: { height: 55, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 12, paddingHorizontal: 15, marginBottom: 16, fontSize: 16, color: '#333' },
  primaryButton: { backgroundColor: '#ff4b4b', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#ff4b4b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666', fontSize: 15 },
  link: { color: '#ff4b4b', fontSize: 15, fontWeight: 'bold' }
});
