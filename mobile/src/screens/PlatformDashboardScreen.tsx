import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { adminService } from '../services/adminService';
import Header from '../components/Header';
import FaIcon from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { isPlatformAdmin } from '../utils/roles';
import { type ThemeColors } from '../theme';

type AdminUser = {
  id: number;
  email?: string;
  username?: string;
  firstname?: string;
  lastname?: string;
  roles?: string[];
  creationRights?: {
    canCreate?: boolean;
    unusedCount?: number;
    nextExpiresAt?: string | null;
    isAdmin?: boolean;
    credits?: { id: number; expiresAt?: string | null }[];
  };
};

export default function PlatformDashboardScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const displayName = user
    ? [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || user.username || user.email
    : '';
  const unused = user?.creationRights?.credits ?? [];
  const targetIsAdmin = isPlatformAdmin(user?.roles) || !!user?.creationRights?.isAdmin;

  const search = async () => {
    const query = email.trim();
    if (!query) {
      Alert.alert('Adresse e-mail', 'Saisissez l’adresse du compte à trouver.');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const users = await adminService.getUsers(query);
      setUser(users[0] ?? null);
    } catch (error: any) {
      setUser(null);
      Alert.alert(
        'Recherche impossible',
        error.response?.data?.message || 'Vérifiez votre connexion, puis réessayez.'
      );
    } finally {
      setLoading(false);
    }
  };

  const grant = () => {
    if (!user) {
      return;
    }
    Alert.alert(
      'Attribuer un crédit',
      `1 crédit de 90 jours sera envoyé à ${user.email}. Le compte pourra créer une compétition.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Attribuer',
          onPress: async () => {
            setBusy(true);
            try {
              await adminService.grantCreationCredit(user.id, { days: 90 });
              const users = await adminService.getUsers(user.email || email);
              setUser(users[0] ?? user);
              Alert.alert('Crédit attribué', 'Un e-mail a été envoyé au créateur.');
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible d’attribuer le crédit.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const cancelCredit = (creditId: number) => {
    if (!user) {
      return;
    }
    Alert.alert('Annuler ce crédit', 'Le crédit non utilisé sera retiré.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Annuler le crédit',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await adminService.cancelCreationCredit(creditId);
            const users = await adminService.getUsers(user.email || email);
            setUser(users[0] ?? null);
          } catch (error: any) {
            Alert.alert(
              'Erreur',
              error.response?.data?.message || 'Impossible d’annuler le crédit.'
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Header title="Dashboard" showBack={true} showMenu={true} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <FaIcon name="key" size={22} color={theme.onAccent} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.displayName}>Dashboard</Text>
              <Text style={styles.identityHint}>
                Attribuer un crédit de création à un compte existant, via son e-mail.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="prenom@exemple.fr"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="search"
            onSubmitEditing={search}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={search} disabled={loading || busy}>
            {loading ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <Text style={styles.primaryBtnText}>Rechercher</Text>
            )}
          </TouchableOpacity>

          {searched && !loading && !user ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun compte pour cet e-mail</Text>
              <Text style={styles.emptySubtext}>
                Le crédit va sur un compte Street Fishing déjà créé. La personne doit d’abord s’inscrire.
              </Text>
            </View>
          ) : null}

          {user ? (
            <View style={styles.userCard}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userMeta}>
                {targetIsAdmin
                  ? 'Administrateur — création sans crédit'
                  : `${user.creationRights?.unusedCount ?? 0} crédit(s) disponible(s)`}
                {user.creationRights?.nextExpiresAt
                  ? ` · expire ${user.creationRights.nextExpiresAt}`
                  : ''}
              </Text>

              {!targetIsAdmin ? (
                <TouchableOpacity style={styles.primaryBtn} onPress={grant} disabled={busy}>
                  <Text style={styles.primaryBtnText}>Attribuer 1 crédit (90 jours)</Text>
                </TouchableOpacity>
              ) : null}

              {unused.length > 0 ? (
                <View style={styles.creditsBlock}>
                  <Text style={styles.creditsTitle}>Crédits non utilisés</Text>
                  {unused.map((credit) => (
                    <View key={credit.id} style={styles.creditRow}>
                      <Text style={styles.creditLabel}>
                        Jusqu’au {credit.expiresAt || '—'}
                      </Text>
                      <TouchableOpacity onPress={() => cancelCredit(credit.id)} disabled={busy}>
                        <Text style={styles.cancelLink}>Retirer</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: theme.bg },
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 16, paddingBottom: 40 },
    identityCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    identityText: { flex: 1 },
    displayName: { fontSize: 20, fontWeight: '700', color: theme.text },
    identityHint: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginLeft: 4,
    },
    input: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 16,
    },
    primaryBtnText: { color: theme.onAccent, fontWeight: '700', fontSize: 15 },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
    },
    emptyText: { fontSize: 16, fontWeight: '600', color: theme.text },
    emptySubtext: { fontSize: 14, color: theme.textMuted, marginTop: 6, lineHeight: 20 },
    userCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
    },
    userName: { fontSize: 18, fontWeight: '700', color: theme.text },
    userEmail: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
    userMeta: { fontSize: 14, color: theme.text, marginTop: 10, marginBottom: 14 },
    creditsBlock: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
    creditsTitle: { fontSize: 13, fontWeight: '700', color: theme.textMuted, marginBottom: 8 },
    creditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    creditLabel: { fontSize: 14, color: theme.text, flex: 1, marginRight: 12 },
    cancelLink: { fontSize: 14, fontWeight: '700', color: theme.danger },
  });
