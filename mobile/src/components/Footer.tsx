import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function Footer() {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const currentYear = new Date().getFullYear();

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(8, Math.round(insets.bottom * 0.45)) },
      ]}
    >
      <Text style={styles.copyright}>
        © {currentYear} MrScrupulus — Tous droits réservés.
      </Text>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    footer: {
      width: '100%',
      backgroundColor: theme.chrome,
      paddingTop: 4,
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
