import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export const Button = ({ title, onPress }: { title: string, onPress: () => void }) => {
  return (
    <View style={styles.button}>
      <Text style={styles.text} onPress={onPress}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff5a5f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
