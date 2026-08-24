// @ts-nocheck
import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useCart } from '../CartContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { cart } = useCart();
  
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fc8019',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.05,
            shadowRadius: 15,
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
            position: 'absolute',
        },
        tabBarLabelStyle: {
            fontWeight: '700',
            fontSize: 11,
            marginTop: 4
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
             <SymbolView name={{ ios: 'house', android: 'house', web: 'house' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => (
             <SymbolView name={{ ios: 'list.bullet', android: 'list', web: 'list' }} tintColor={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View>
                <SymbolView name={{ ios: 'cart', android: 'shopping-cart', web: 'shopping-cart' }} tintColor={color} size={28} />
                {cartItemCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cartItemCount}</Text>
                    </View>
                )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          tabBarIcon: ({ color }) => (
             <SymbolView name={{ ios: 'headphones', android: 'headset', web: 'headset' }} tintColor={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        right: -8,
        top: -6,
        backgroundColor: '#fc8019',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900'
    }
});
