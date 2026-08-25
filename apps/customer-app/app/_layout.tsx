import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Text } from 'react-native';
import 'react-native-reanimated';
import { CartProvider } from './CartContext';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const splashLogoRotate = useRef(new Animated.Value(0)).current;

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      Animated.loop(
          Animated.timing(splashLogoRotate, { toValue: 1, duration: 8000, useNativeDriver: true, easing: Easing.linear })
      ).start();

      setTimeout(() => {
          Animated.parallel([
              Animated.timing(splashOpacity, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
              Animated.timing(splashScale, { toValue: 1.2, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) })
          ]).start(() => setShowCustomSplash(false));
      }, 2000);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const splashRotation = splashLogoRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
        <RootLayoutNav />
        {showCustomSplash && (
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', zIndex: 99999, opacity: splashOpacity, transform: [{ scale: splashScale }] }]}>
                <View style={{ alignItems: 'center' }}>
                    <Animated.Image 
                        source={{uri: 'https://cdn-icons-png.flaticon.com/512/2819/2819194.png'}} 
                        style={{ width: 120, height: 120, marginBottom: 25, transform: [{ rotate: splashRotation }] }} 
                    />
                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 8, marginBottom: 5 }}>GOURMET</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Premium Food Delivery</Text>
                </View>
            </Animated.View>
        )}
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <CartProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="cart" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="register" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ presentation: 'modal', title: 'Help & Support' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </CartProvider>
  );
}
