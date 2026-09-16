import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_THEME_NAME,
  THEME_STORAGE_KEY,
  palettes,
  type ThemeColors,
  type ThemeName,
} from '../theme';

type ThemeContextValue = {
  name: ThemeName;
  colors: ThemeColors;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeName(value: string | null): value is ThemeName {
  return value === 'anthracite' || value === 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>(DEFAULT_THEME_NAME);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (!cancelled && isThemeName(stored)) {
          setName(stored);
        }
      } catch {
        // Conserver le thème par défaut
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeName = useCallback((next: ThemeName) => {
    setName(next);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      name,
      colors: palettes[name],
      setThemeName,
    }),
    [name, setThemeName]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
