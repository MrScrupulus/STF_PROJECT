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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { authService, RegisterData } from '../services/authService';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    country: '',
    subscriber_number: '',
  });

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      // Formater la date au format YYYY-MM-DD pour l'API
      const formattedDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, birthDate: formattedDate });
    }
  };

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await authService.register(formData);
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
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response) {
        // Erreur HTTP (404, 400, 500, etc.)
        if (error.response.status === 404) {
          errorMessage = 'Le serveur n\'a pas été trouvé. Vérifiez votre connexion et que le serveur est démarré.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Données invalides. Vérifiez tous les champs.';
        } else if (error.response.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          errorMessage = error.response.data?.message || `Erreur ${error.response.status}`;
        }
      } else if (error.request) {
        // Pas de réponse du serveur
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet et que le serveur est démarré.';
      } else if (error.message) {
        // Erreur de validation côté client
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
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

          <TextInput
            style={styles.input}
            placeholder="Mot de passe *"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Téléphone (10 chiffres) (optionnel)"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, !selectedDate && styles.datePlaceholder]}>
              {selectedDate ? formatDateForDisplay(selectedDate) : 'Date de naissance (optionnel)'}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              locale="fr-FR"
            />
          )}
          
          {Platform.OS === 'ios' && showDatePicker && (
            <View style={styles.iosDatePickerActions}>
              <TouchableOpacity
                style={styles.iosDatePickerButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.iosDatePickerButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Pays (optionnel)"
            value={formData.country}
            onChangeText={(text) => setFormData({ ...formData, country: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Numéro d'adhérent (optionnel)"
            value={formData.subscriber_number}
            onChangeText={(text) => setFormData({ ...formData, subscriber_number: text })}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.linkText}>
              Déjà un compte ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  datePlaceholder: {
    color: '#999',
  },
  iosDatePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  iosDatePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iosDatePickerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
