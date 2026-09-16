import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { useTheme, useThemeColors } from '../contexts/ThemeContext';
import { palettes, type ThemeColors, type ThemeName } from '../theme';

type SettingRow = {
  label: string;
  hint: string;
  icon: AppIconName;
  screen: string;
};

const ROWS: SettingRow[] = [
  {
    label: 'Notifications et e-mails',
    hint: 'Push, alertes et notifications par mail',
    icon: 'bell',
    screen: 'NotificationPreferences',
  },
  {
    label: 'Mon compte',
    hint: 'Profil, mot de passe et données personnelles',
    icon: 'user',
    screen: 'Profile',
  },
  {
    label: 'Mentions légales',
    hint: 'Confidentialité et conditions d’utilisation',
    icon: 'file',
    screen: 'LegalNotice',
  },
];

const THEME_OPTIONS: { id: ThemeName; label: string; hint: string }[] = [
  { id: 'anthracite', label: 'Anthracite', hint: 'Thème actuel, fond sombre' },
  { id: 'light', label: 'Clair', hint: 'Ancien thème, fond blanc' },
];

export default function SettingsScreen() {
  const theme = useThemeColors();
  const { name, setThemeName } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();

  return (
    <>
      <Header title="Réglages" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Gérez l’apparence, vos notifications et vos préférences. Le profil reste
          aussi accessible depuis « Mon compte ».
        </Text>

        <Text style={styles.sectionTitle}>Apparence</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const selected = name === opt.id;
            const preview = palettes[opt.id];
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.themeCard, selected && styles.themeCardSelected]}
                onPress={() => setThemeName(opt.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <View style={[styles.themeSwatch, { backgroundColor: preview.chrome }]}>
                  <View style={[styles.themeSwatchBar, { backgroundColor: preview.accent }]} />
                  <View style={[styles.themeSwatchPage, { backgroundColor: preview.bg }]} />
                </View>
                <Text style={styles.themeLabel}>{opt.label}</Text>
                <Text style={styles.themeHint}>{opt.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {ROWS.map((row) => (
          <TouchableOpacity
            key={row.screen}
            style={styles.row}
            onPress={() => navigation.navigate(row.screen as never)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <FaIcon name={row.icon} size={20} color={theme.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowHint}>{row.hint}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  themeCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: theme.border,
  },
  themeCardSelected: {
    borderColor: theme.accent,
  },
  themeSwatch: {
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  themeSwatchBar: {
    height: 8,
  },
  themeSwatchPage: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  themeHint: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  rowHint: {
    fontSize: 13,
    color: theme.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: theme.textMuted,
    fontWeight: '300',
  },
});
