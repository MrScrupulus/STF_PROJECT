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

export default function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <>
      <Header title="Réglages" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Gérez vos notifications, e-mails et préférences. Le profil reste aussi
          accessible depuis « Mon compte ».
        </Text>
        {ROWS.map((row) => (
          <TouchableOpacity
            key={row.screen}
            style={styles.row}
            onPress={() => navigation.navigate(row.screen as never)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <FaIcon name={row.icon} size={20} color="#007AFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 2,
  },
  rowHint: {
    fontSize: 13,
    color: '#888',
  },
  chevron: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: '300',
  },
});
