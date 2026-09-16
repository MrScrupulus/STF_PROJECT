import React, { useLayoutEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

/** Ancien écran « Mes prises » : redirige vers l’historique unifié (onglet prises). */
export default function CatchesScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    // @ts-ignore — params de route History
    navigation.replace('History', { initialTab: 'catches' });
  }, [navigation]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.bg,
  },
});
