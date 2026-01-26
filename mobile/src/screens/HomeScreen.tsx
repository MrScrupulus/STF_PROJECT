import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
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
    } else {
      setIsAdmin(false);
    }
  }, [isAuthenticated]);

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

          {/* Section Tutoriel */}
          <View style={styles.tutorialSection}>
            <Text style={styles.tutorialTitle}>📚 Guide rapide</Text>
            
            {/* Tutoriel : Saisie de prise */}
            <View style={styles.tutorialCard}>
              <View style={styles.tutorialHeader}>
                <Text style={styles.tutorialIcon}>📷</Text>
                <Text style={styles.tutorialCardTitle}>Comment enregistrer une prise ?</Text>
              </View>
              <View style={styles.tutorialSteps}>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Cliquez sur le bouton central bleu (📷) en bas de l'écran</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>Prenez une photo de votre prise ou sélectionnez une photo existante</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>Sélectionnez l'espèce de poisson capturé</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.stepText}>Indiquez la taille (en cm) et ajoutez un commentaire si vous le souhaitez</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>5</Text>
                  <Text style={styles.stepText}>Si vous participez à une compétition, sélectionnez-la ainsi que votre équipe</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>6</Text>
                  <Text style={styles.stepText}>Autorisez la géolocalisation pour valider votre position</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>7</Text>
                  <Text style={styles.stepText}>Validez ! Votre prise sera soumise à validation par un administrateur</Text>
                </View>
              </View>
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => (navigation as any).navigate('AddCatch')}
                >
                  <Text style={styles.actionButtonText}>Ajouter une prise maintenant</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tutoriel : Création de compétition (admin seulement) */}
            {isAuthenticated && isAdmin && (
              <View style={styles.tutorialCard}>
                <View style={styles.tutorialHeader}>
                  <Text style={styles.tutorialIcon}>🏆</Text>
                  <Text style={styles.tutorialCardTitle}>Comment créer une compétition ?</Text>
                  <Text style={styles.adminBadge}>Admin uniquement</Text>
                </View>
                <View style={styles.tutorialSteps}>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>1</Text>
                    <Text style={styles.stepText}>Accédez au Dashboard Admin depuis le menu burger (☰)</Text>
                  </View>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>2</Text>
                    <Text style={styles.stepText}>Cliquez sur "Créer une compétition"</Text>
                  </View>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>3</Text>
                    <Text style={styles.stepText}>Remplissez les informations : nom, dates de début et fin, taille d'équipe</Text>
                  </View>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>4</Text>
                    <Text style={styles.stepText}>Ajoutez les espèces autorisées avec leurs coefficients de points</Text>
                  </View>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>5</Text>
                    <Text style={styles.stepText}>Configurez les options : nombre max de participants, classement public, bonus</Text>
                  </View>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>6</Text>
                    <Text style={styles.stepText}>Ajoutez une description pour expliquer les règles de la compétition</Text>
                  </View>
                  <View style={styles.step}>
                    <Text style={styles.stepNumber}>7</Text>
                    <Text style={styles.stepText}>Validez la création. La compétition apparaîtra dans la liste des compétitions</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Utilisez la barre de navigation en bas pour accéder rapidement aux compétitions 
              et à votre équipe. Le bouton central permet d'ajouter une prise rapidement.
            </Text>
          </View>
        </View>
        <Footer />
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
  tutorialSection: {
    marginBottom: 32,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tutorialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tutorialIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tutorialCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: '#ff6b6b',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    overflow: 'hidden',
    color: '#fff',
  },
  tutorialSteps: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    paddingTop: 2,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
