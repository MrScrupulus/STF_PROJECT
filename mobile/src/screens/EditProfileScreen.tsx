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
import DateTimePicker from '@react-native-community/datetimepicker';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    birthdate: '',
    country: '',
    subscriber_number: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        phone_number: user.phone_number || '',
        birthdate: user.birth_date || '',
        country: user.country || '',
        subscriber_number: user.subscriber_number || '',
      });

      if (user.birth_date) {
        setSelectedDate(new Date(user.birth_date));
      }
    }
  }, [user]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, birthdate: formattedDate });
    }
  };

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

      // Ajouter les champs optionnels seulement s'ils sont remplis
      if (formData.phone_number && formData.phone_number.trim() !== '') {
        profileData.phone_number = formData.phone_number.replace(/\D/g, '');
      } else {
        profileData.phone_number = null;
      }

      if (formData.birthdate && formData.birthdate.trim() !== '') {
        profileData.birthdate = formData.birthdate;
      } else {
        profileData.birthdate = null;
      }

      if (formData.country && formData.country.trim() !== '') {
        profileData.country = formData.country;
      } else {
        profileData.country = null;
      }

      if (formData.subscriber_number && formData.subscriber_number.trim() !== '') {
        profileData.subscriber_number = formData.subscriber_number;
      } else {
        profileData.subscriber_number = null;
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date de naissance</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Text style={[styles.dateText, !formData.birthdate && styles.datePlaceholder]}>
                  {formData.birthdate
                    ? new Date(formData.birthdate).toLocaleDateString('fr-FR')
                    : 'Sélectionner une date (optionnel)'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <>
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <View style={styles.iosDatePickerActions}>
                      <TouchableOpacity
                        style={styles.iosDatePickerButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.iosDatePickerButtonText}>Valider</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pays</Text>
              <TextInput
                style={styles.input}
                placeholder="Pays (optionnel)"
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de licence</Text>
              <TextInput
                style={styles.input}
                placeholder="Numéro de licence (optionnel)"
                value={formData.subscriber_number}
                onChangeText={(text) => setFormData({ ...formData, subscriber_number: text })}
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
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    color: '#999',
  },
  iosDatePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  iosDatePickerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  iosDatePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
