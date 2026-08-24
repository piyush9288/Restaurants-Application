import { SymbolView } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Active Deliveries',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'bicycle', android: 'pedal_bike', web: 'motorcycle' }} tintColor={color} size={28} />
          ),
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'dollarsign.circle', android: 'attach_money', web: 'monetization_on' }} tintColor={color} size={28} />
          ),
          headerShown: false
        }}
      />
    </Tabs>
  );
}
