import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (isLogin: boolean) => {
    setLoading(true);
    try {
      let response;
      if (isLogin) {
        // Login uses OAuth2 Form Data
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        response = await fetch('http://127.0.0.1:8000/api/auth/login/access-token', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Register uses JSON
        response = await fetch('http://127.0.0.1:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: 'CUSTOMER' }),
        });
      }

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (Platform.OS === 'web') {
          localStorage.setItem('token', data.access_token);
        }
        if (Platform.OS === 'web') {
            alert(isLogin ? "Login Successful!" : "Registration Successful!");
        } else {
            Alert.alert("Success", isLogin ? "Logged in successfully!" : "Registered successfully!");
        }
        router.replace('/'); // Go back to Home
      } else {
        if (Platform.OS === 'web') {
            alert(data.detail || "Authentication Failed");
        } else {
            Alert.alert("Error", data.detail || "Authentication Failed");
        }
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      if (Platform.OS === 'web') {
          alert("Network error, please check backend.");
      } else {
          Alert.alert("Error", "Network error, please check backend.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Foodie</Text>
      <Text style={styles.subtitle}>Login or Register to order your favorite meals</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={() => handleAuth(true)}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Please wait..." : "Login"}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => handleAuth(false)}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff5a5f',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#ff5a5f',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5a5f',
  },
  secondaryButtonText: {
    color: '#ff5a5f',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
