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
import { homeContent } from '../constants/homeContent';
import FaIcon from '../components/FaIcon';

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
      <Header title="Street Fishing" showBack={false} showMenu={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>{homeContent.title}</Text>
            <Text style={styles.subtitle}>{homeContent.subtitle}</Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>{homeContent.aboutTitle}</Text>
            <Text style={styles.description}>{homeContent.about}</Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>{homeContent.featuresTitle}</Text>
            {homeContent.features.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <FaIcon name={feature.icon} size={28} color="#007AFF" />
            </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
            ))}
          </View>

          <View style={styles.tutorialSection}>
            <Text style={styles.tutorialTitle}>{homeContent.tutorialTitle}</Text>
            <View style={styles.tutorialCard}>
              <View style={styles.tutorialHeader}>
                <FaIcon name="camera" size={24} color="#007AFF" />
                <Text style={styles.tutorialCardTitle}>{homeContent.catchTutorialTitle}</Text>
              </View>
              <View style={styles.tutorialSteps}>
                {homeContent.catchTutorialSteps.map((text, index) => (
                <View key={text} style={styles.step}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepText}>{text}</Text>
                </View>
                ))}
              </View>
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => (navigation as any).navigate('AddCatch')}
                >
                  <Text style={styles.actionButtonText}>{homeContent.catchTutorialButton}</Text>
                </TouchableOpacity>
              )}
            </View>

            {isAuthenticated && isAdmin && (
              <View style={styles.tutorialCard}>
                <View style={styles.tutorialHeader}>
                  <FaIcon name="trophy" size={24} color="#007AFF" />
                  <Text style={styles.tutorialCardTitle}>{homeContent.competitionTutorialTitle}</Text>
                  <Text style={styles.adminBadge}>{homeContent.adminBadge}</Text>
                </View>
                <View style={styles.tutorialSteps}>
                  {homeContent.competitionTutorialSteps.map((text, index) => (
                  <View key={text} style={styles.step}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                    <Text style={styles.stepText}>{text}</Text>
                  </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>{homeContent.footer}</Text>
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
    gap: 8,
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
    width: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
