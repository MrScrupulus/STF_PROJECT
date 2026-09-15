import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.footer}>
        <Text style={styles.copyright}>
          © {currentYear} MrScrupulus — Tous droits réservés.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    width: '100%',
    backgroundColor: '#1a1a1a',
  },
  footer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    color: '#a3a3a3',
    fontSize: 11,
    textAlign: 'center',
  },
});
