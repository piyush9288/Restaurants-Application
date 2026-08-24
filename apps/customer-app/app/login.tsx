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
  },
  secondaryButtonText: {
    color: '#ff5a5f',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
