import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        // Login Flow
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await fetch(API_URL + '/api/auth/login/access-token', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setLoading(false);

        if (response.ok) {
          if (Platform.OS === 'web') {
            localStorage.setItem('restaurant_token', data.access_token);
          }
          router.replace('/'); 
        } else {
          if (Platform.OS === 'web') alert(data.detail || "Login Failed");
          else Alert.alert("Error", data.detail || "Login Failed");
        }
      } else {
        // Register Flow
        const payload = {
            email,
            password,
            role: "RESTAURANT"
        };
        const response = await fetch(API_URL + '/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        setLoading(false);
        
        if (response.ok) {
            if (Platform.OS === 'web') {
              localStorage.setItem('restaurant_token', data.access_token);
            }
            // Go to Onboarding for new account
            router.replace('/onboarding');
        } else {
            if (Platform.OS === 'web') alert(data.detail || "Registration Failed");
            else Alert.alert("Error", data.detail || "Registration Failed");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      if (Platform.OS === 'web') alert("Network error");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
          <Text style={styles.title}>Partner Central</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Login to manage your restaurant' : 'Register your restaurant'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Please wait..." : (isLogin ? "Login" : "Create Account")}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
              <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.switchTextBold}>{isLogin ? "Register now" : "Login here"}</Text>
              </Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Premium dark
    justifyContent: 'center',
    padding: 20,
  },
  card: {
      backgroundColor: '#1e293b',
      padding: 30,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500'
  },
  input: {
    height: 55,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500'
  },
  primaryButton: {
    backgroundColor: '#3b82f6', // Professional blue
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  switchText: {
      color: '#94a3b8',
      textAlign: 'center',
      fontSize: 14
  },
  switchTextBold: {
      color: '#3b82f6',
      fontWeight: 'bold'
  }
});
