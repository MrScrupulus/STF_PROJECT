import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.footer}>
      <Text style={styles.copyright}>
        © {currentYear} MrScrupulus - Tous droits réservés.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  copyright: {
    color: '#a3a3a3',
    fontSize: 12,
    textAlign: 'center',
  },
});
