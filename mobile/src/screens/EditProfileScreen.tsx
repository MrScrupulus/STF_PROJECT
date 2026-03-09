import React, { useState, useEffect } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: userResponse, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response;
    },
  });

  const user = userResponse?.user;

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.firstname || !formData.lastname) {
      Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const profileData: any = {
        firstname: formData.firstname,
        lastname: formData.lastname,
      };

      if (formData.phone_number && formData.phone_number.trim() !== '') {
        profileData.phone_number = formData.phone_number.replace(/\D/g, '');
      } else {
        profileData.phone_number = null;
      }

      await authService.updateProfile(profileData);
      
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      Alert.alert('Succès', 'Profil mis à jour avec succès.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      // Prioriser le message du backend, sinon message générique
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du profil. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <Header title="Modifier mon profil" showBack={true} showMenu={false} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                value={formData.firstname}
                onChangeText={(text) => setFormData({ ...formData, firstname: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={formData.lastname}
                onChangeText={(text) => setFormData({ ...formData, lastname: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="Téléphone (optionnel)"
                value={formData.phone_number}
                onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
