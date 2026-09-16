export type ThemeName = 'anthracite' | 'light';

export type ThemeColors = {
  name: ThemeName;
  bg: string;
  chrome: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  success: string;
  successDim: string;
  danger: string;
  onAccent: string;
  logoRing: string;
  statusBar: 'light' | 'dark';
};

export const palettes: Record<ThemeName, ThemeColors> = {
  anthracite: {
    name: 'anthracite',
    bg: '#141414',
    chrome: '#1C1C1C',
    surface: '#1E1E1E',
    surfaceRaised: '#2A2A2A',
    border: '#3A3A3A',
    text: '#F5F5F5',
    textMuted: '#A8A8A8',
    accent: '#5B9FFF',
    accentMuted: '#1A3358',
    success: '#34C759',
    successDim: '#248A3D',
    danger: '#FF453A',
    onAccent: '#FFFFFF',
    logoRing: '#F5F5F5',
    statusBar: 'light',
  },
  light: {
    name: 'light',
    bg: '#F5F5F5',
    chrome: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceRaised: '#F0F0F0',
    border: '#E0E0E0',
    text: '#333333',
    textMuted: '#666666',
    accent: '#007AFF',
    accentMuted: '#E8F1FF',
    success: '#34C759',
    successDim: '#248A3D',
    danger: '#DC3545',
    onAccent: '#FFFFFF',
    logoRing: '#1C1C1C',
    statusBar: 'dark',
  },
};

export const DEFAULT_THEME_NAME: ThemeName = 'anthracite';
export const THEME_STORAGE_KEY = 'stf_theme_name';

/** @deprecated Utiliser useThemeColors() — conservé comme fallback anthracite au chargement module. */
export const theme = palettes.anthracite;
