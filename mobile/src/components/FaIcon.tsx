import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { appIcons, type AppIconName } from '../icons';

interface FaIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

export default function FaIcon({ name, size = 20, color = '#333' }: FaIconProps) {
  return <FontAwesomeIcon icon={appIcons[name]} size={size} color={color} />;
}

export type { AppIconName };
