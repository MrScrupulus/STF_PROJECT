import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await authService.getCurrentUser();
        const user = response.user || response;
        setIsAdmin(user.roles?.includes('ROLE_ADMIN') || false);
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  return (
    <>
      <Header title="Street Fishing" showBack={false} showMenu={true} />
      <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Street Fishing</Text>
        <Text style={styles.subtitle}>Bienvenue !</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Competitions' as never)}
        >
          <Text style={styles.cardTitle}>Compétitions</Text>
          <Text style={styles.cardDescription}>
            Voir et gérer les compétitions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.primaryCard]}
          onPress={() => navigation.navigate('AddCatch' as never)}
        >
          <Text style={[styles.cardTitle, styles.primaryCardTitle]}>📷 Ajouter une prise</Text>
          <Text style={[styles.cardDescription, styles.primaryCardDescription]}>
            Prendre une photo et enregistrer votre prise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Catches' as never)}
        >
          <Text style={styles.cardTitle}>Mes Prises</Text>
          <Text style={styles.cardDescription}>
            Voir toutes vos prises enregistrées
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Teams' as never)}
        >
          <Text style={styles.cardTitle}>Mes Équipes</Text>
          <Text style={styles.cardDescription}>
            Voir et gérer vos équipes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Species' as never)}
        >
          <Text style={styles.cardTitle}>Espèces</Text>
          <Text style={styles.cardDescription}>
            Voir toutes les espèces disponibles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.cardTitle}>Profil</Text>
          <Text style={styles.cardDescription}>
            Gérer votre profil
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.card, styles.adminCard]}
            onPress={() => navigation.navigate('AdminDashboard' as never)}
          >
            <Text style={[styles.cardTitle, styles.adminCardTitle]}>⚙️ Dashboard Admin</Text>
            <Text style={[styles.cardDescription, styles.adminCardDescription]}>
              Gérer les utilisateurs, compétitions et valider les prises
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  primaryCardTitle: {
    color: '#fff',
  },
  primaryCardDescription: {
    color: '#fff',
    opacity: 0.9,
  },
  adminCard: {
    backgroundColor: '#FF9500',
  },
  adminCardTitle: {
    color: '#fff',
  },
  adminCardDescription: {
    color: '#fff',
    opacity: 0.9,
  },
});

