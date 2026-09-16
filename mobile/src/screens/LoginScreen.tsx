import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService, LoginCredentials } from '../services/authService';
import FaIcon from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function LoginScreen({ navigation, onLogin, route }: any) {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  // Pré-remplir l'email depuis les paramètres de route (après vérification d'email)
  const initialEmail = route?.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginCredentials = { email, password };
      await authService.login(credentials);
      // Mettre à jour l'état d'authentification dans App.tsx
      if (onLogin) {
        onLogin();
      }
    } catch (error: any) {
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      // Extraire le message d'erreur du backend
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Titre personnalisé selon le type d'erreur
      let errorTitle = 'Erreur de connexion';
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (error.response?.data?.requiresVerification || errorMessage.includes('vérifié') || errorMessage.includes('activé')) {
          errorTitle = 'Compte non activé';
        } else {
          errorTitle = 'Identifiants incorrects';
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Connexion</Text>
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
          <Text style={styles.subtitle}>Connectez-vous</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
          >
            <Text style={styles.forgotPasswordText}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register' as never)}
          >
            <Text style={styles.linkText}>
              Pas encore de compte ? S'inscrire
            </Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
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
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: theme.surfaceRaised,
    color: theme.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: theme.surfaceRaised,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: theme.text,
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 8,
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
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: theme.accent,
    fontSize: 14,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: theme.accent,
    fontSize: 16,
  },
});

