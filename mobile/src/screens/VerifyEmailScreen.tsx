import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      // Récupérer le token depuis les paramètres de route
      const token = (route.params as any)?.token;

      if (!token) {
        setStatus('error');
        setMessage('Token manquant');
        return;
      }

      try {
        console.log('Tentative de vérification avec le token:', token);
        const response = await authService.verifyEmail(token);
        console.log('Réponse de vérification:', response);
        
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
        
        // Stocker l'email pour le passer à la page de login
        if (response.email) {
          setEmail(response.email);
        }
      } catch (error: any) {
        console.error('Erreur de vérification:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          error.message || 
          'Une erreur est survenue lors de la vérification'
        );
      }
    };

    verifyEmail();
  }, [route.params]);

  const handleGoToLogin = () => {
    // Naviguer vers la page de login avec l'email pré-rempli si disponible
    if (email) {
      // @ts-ignore
      navigation.navigate('Login', { email });
    } else {
      // @ts-ignore
      navigation.navigate('Login');
    }
  };

  return (
    <>
      <Header title="Vérification d'email" showBack={false} showMenu={false} />
      <View style={styles.container}>
        {status === 'verifying' && (
          <View style={styles.content}>
            <Text style={styles.title}>Vérification en cours...</Text>
            <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
          </View>
        )}

        {status === 'success' && (
          <View style={styles.content}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>{message}</Text>
            </View>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleGoToLogin}
            >
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.content}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{message}</Text>
            </View>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleGoToLogin}
            >
              <Text style={styles.loginButtonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  spinner: {
    marginTop: 20,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  successText: {
    color: '#155724',
    fontSize: 16,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#721c24',
    fontSize: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
