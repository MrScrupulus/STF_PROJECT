import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { authService, RegisterData } from '../services/authService';
import FaIcon from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

const COUNTRY_CODES = ['+33', '+32', '+41', '+49', '+39', '+34', '+44', '+212', '+213', '+216', '+221'];

export default function RegisterScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+33');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    const dataToSend: RegisterData = {
      ...formData,
      username: formData.username?.trim() || undefined,
      phoneNumber: phoneNumber.trim() ? `${phoneCountryCode}${phoneNumber.replace(/\D/g, '')}` : undefined,
    };

    setLoading(true);
    try {
      await authService.register(dataToSend);
      Alert.alert(
        'Inscription réussie',
        'Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Erreur lors de l'inscription";
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <FaIcon name="back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Inscription</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Street Fishing</Text>
            <Text style={styles.subtitle}>Créer un compte</Text>

            <TextInput
              style={styles.input}
              placeholder="Pseudo (optionnel, 3-30 caractères)"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {/* <Text style={styles.optionalHint}>
              Si laissé vide : prénom + initiale du nom (ex. Marie Dupont → Marie_D).
            </Text> */}

            <TextInput
              style={styles.input}
              placeholder="Prénom *"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Nom *"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe *"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FaIcon name={showPassword ? 'eyeSlash' : 'eye'} size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmer le mot de passe *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FaIcon name={showConfirmPassword ? 'eyeSlash' : 'eye'} size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && formData.password !== confirmPassword && (
              <Text style={styles.passwordMismatch}>Les mots de passe ne correspondent pas</Text>
            )}

            <Text style={styles.optionalLabel}>Téléphone (optionnel)</Text>
            <View style={styles.phoneRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.countryCodesScroll}
              >
                {COUNTRY_CODES.map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.countryCodeChip,
                      phoneCountryCode === code && styles.countryCodeChipActive,
                    ]}
                    onPress={() => setPhoneCountryCode(code)}
                  >
                    <Text
                      style={[
                        styles.countryCodeText,
                        phoneCountryCode === code && styles.countryCodeTextActive,
                      ]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="6 12 34 56 78"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <Text style={styles.buttonText}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  headerSafeArea: {
    backgroundColor: theme.chrome,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.chrome,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: theme.accent,
    fontWeight: '600',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.text,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: theme.textMuted,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionalLabel: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 8,
  },
  optionalHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 18,
  },
  phoneRow: {
    marginBottom: 16,
  },
  countryCodesScroll: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  countryCodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceRaised,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  countryCodeChipActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  countryCodeText: {
    fontSize: 14,
    color: theme.text,
  },
  countryCodeTextActive: {
    color: theme.onAccent,
  },
  phoneInput: {
    marginBottom: 0,
  },
  button: {
    backgroundColor: theme.accent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.onAccent,
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: theme.accent,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 8,
  },
  passwordMismatch: {
    color: theme.danger,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    paddingLeft: 4,
  },
});
