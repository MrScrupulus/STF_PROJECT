import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';

interface HelpButtonProps {
  text: string;
  title?: string;
}

export default function HelpButton({ text, title = 'Aide' }: HelpButtonProps) {
  const onPress = () => {
    Alert.alert(title, text, [{ text: 'OK' }]);
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Afficher l'aide"
      accessibilityRole="button"
    >
      <Text style={styles.text}>?</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});
