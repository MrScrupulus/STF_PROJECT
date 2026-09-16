import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function Footer() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  safe: {
    width: '100%',
    backgroundColor: theme.chrome,
  },
  footer: {
    width: '100%',
    backgroundColor: theme.chrome,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    color: theme.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
