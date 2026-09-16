import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { appIcons, type AppIconName } from '../icons';
import { useThemeColors } from '../contexts/ThemeContext';

interface FaIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

export default function FaIcon({ name, size = 20, color }: FaIconProps) {
  const theme = useThemeColors();
  return <FontAwesomeIcon icon={appIcons[name]} size={size} color={color ?? theme.text} />;
}

export type { AppIconName };
