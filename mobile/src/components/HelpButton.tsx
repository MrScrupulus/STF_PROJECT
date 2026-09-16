import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import FaIcon from './FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

interface HelpButtonProps {
  text: string;
  title?: string;
}

export default function HelpButton({ text, title = 'Aide' }: HelpButtonProps) {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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
      <FaIcon name="help" size={14} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  button: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
  },
});
