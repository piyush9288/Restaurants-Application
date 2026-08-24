import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const faqs = [
    { q: "How do I place an order?", a: "Browse restaurants from the home screen, tap items to add them to your cart, and click checkout." },
    { q: "Where is my food?", a: "Check the 'Orders' tab to see the real-time status of your delivery." },
    { q: "Can I cancel my order?", a: "You can cancel your order within 2 minutes of placing it by contacting support." },
    { q: "How do I contact the rider?", a: "Once your order is marked 'OUT_FOR_DELIVERY', rider details will appear in your order history." }
  ];

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, padding: 20 }}>
        <Text style={styles.header}>Help & Support</Text>
        <Text style={styles.sub}>How can we help you today?</Text>

        <View style={styles.contactCard}>
          <Text style={{fontSize: 24, marginBottom: 10}}>🎧</Text>
          <Text style={styles.contactTitle}>Live Chat Support</Text>
          <Text style={{color: '#666', textAlign: 'center', marginBottom: 15}}>Our agents are available 24/7</Text>
          <TouchableOpacity style={styles.btn} onPress={() => alert("Connecting to agent...")}>
            <Text style={{color: '#fff', fontWeight: 'bold'}}>Start Chat</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.faqHeader}>Frequently Asked Questions</Text>
        
        {faqs.map((faq, idx) => (
          <View key={idx} style={styles.faqItem}>
            <Text style={styles.question}>Q: {faq.q}</Text>
            <Text style={styles.answer}>A: {faq.a}</Text>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { fontSize: 32, fontWeight: 'bold', color: '#1a1a1a', marginTop: 20 },
  sub: { fontSize: 16, color: '#666', marginBottom: 30 },
  contactCard: { backgroundColor: '#fff', padding: 25, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 30 },
  contactTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  btn: { backgroundColor: '#1a1a1a', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  faqHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  faqItem: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  question: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#ff4b4b' },
  answer: { color: '#444', lineHeight: 22 }
});
