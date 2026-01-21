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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    if (!/[@$!%*#?&]/.test(password)) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*#?&)' };
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      Alert.alert('Erreur', passwordValidation.message);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(formData.currentPassword, formData.newPassword);
      
      Alert.alert('Succès', 'Mot de passe modifié avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      // Prioriser le message du backend, sinon message générique
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la modification du mot de passe. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = formData.newPassword ? validatePassword(formData.newPassword) : null;
  const passwordsMatch = formData.newPassword && formData.confirmPassword
    ? formData.newPassword === formData.confirmPassword
    : null;

  return (
    <>
      <Header title="Modifier le mot de passe" showBack={true} showMenu={false} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mot de passe actuel *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mot de passe actuel"
                  value={formData.currentPassword}
                  onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
                  secureTextEntry={!showCurrentPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <FontAwesome
                    name={showCurrentPassword ? 'eye' : 'eye-slash'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nouveau mot de passe *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nouveau mot de passe"
                  value={formData.newPassword}
                  onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                  secureTextEntry={!showNewPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <FontAwesome
                    name={showNewPassword ? 'eye' : 'eye-slash'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {passwordValidation && (
                <Text
                  style={[
                    styles.validationText,
                    passwordValidation.valid ? styles.validationSuccess : styles.validationError,
                  ]}
                >
                  {passwordValidation.message || '✓ Mot de passe valide'}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirmer le nouveau mot de passe *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirmer le nouveau mot de passe"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesome
                    name={showConfirmPassword ? 'eye' : 'eye-slash'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {passwordsMatch !== null && (
                <Text
                  style={[
                    styles.validationText,
                    passwordsMatch ? styles.validationSuccess : styles.validationError,
                  ]}
                >
                  {passwordsMatch ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Modifier le mot de passe</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
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
  validationText: {
    fontSize: 12,
    marginTop: 4,
  },
  validationSuccess: {
    color: '#10b981',
  },
  validationError: {
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
