import React, { useLayoutEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/** Ancien écran « Mes prises » : redirige vers l’historique unifié (onglet prises). */
export default function CatchesScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    // @ts-ignore — params de route History
    navigation.replace('History', { initialTab: 'catches' });
  }, [navigation]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
