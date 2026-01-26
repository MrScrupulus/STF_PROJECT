import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import Header from '../components/Header';

export default function HomeScreen() {
  return (
    <>
      <Header title="Street Fishing" showBack={false} showMenu={true} showProfile={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Street Fishing</Text>
            <Text style={styles.subtitle}>L'application de compétition de pêche urbaine</Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>À propos de l'application</Text>
            <Text style={styles.description}>
              Street Fishing est une application dédiée aux compétitions de pêche urbaine. 
              Participez à des compétitions, enregistrez vos prises, formez des équipes et 
              suivez vos statistiques en temps réel.
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Fonctionnalités principales</Text>
            
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🏆</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Compétitions</Text>
                <Text style={styles.featureDescription}>
                  Consultez les compétitions en cours, à venir ou terminées. 
                  Inscrivez-vous avec votre équipe et suivez le classement en direct.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📷</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Enregistrement de prises</Text>
                <Text style={styles.featureDescription}>
                  Photographiez et enregistrez vos prises directement depuis l'application. 
                  Géolocalisation automatique et validation par les administrateurs.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>👥</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Gestion d'équipe</Text>
                <Text style={styles.featureDescription}>
                  Créez ou rejoignez une équipe, invitez vos amis et participez ensemble 
                  aux compétitions. Suivez les performances de votre équipe.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Statistiques</Text>
                <Text style={styles.featureDescription}>
                  Consultez votre historique de prises, le nombre de compétitions auxquelles 
                  vous avez participé et vos statistiques par espèce de poisson.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Utilisez la barre de navigation en bas pour accéder rapidement aux compétitions 
              et à votre équipe. Le bouton central permet d'ajouter une prise rapidement.
            </Text>
          </View>
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
  headerSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footerSection: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
