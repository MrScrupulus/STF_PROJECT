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
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function HomeScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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
              <FaIcon name={feature.icon} size={28} color={theme.accent} />
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
                <FaIcon name="camera" size={24} color={theme.accent} />
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
                  <FaIcon name="trophy" size={24} color={theme.accent} />
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

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: theme.textMuted,
    textAlign: 'center',
  },
  tutorialSection: {
    marginBottom: 32,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  tutorialCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
    flex: 1,
  },
  adminBadge: {
    backgroundColor: theme.danger,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    overflow: 'hidden',
    color: theme.onAccent,
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
    backgroundColor: theme.accent,
    color: theme.onAccent,
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
    color: theme.textMuted,
    lineHeight: 22,
    paddingTop: 2,
  },
  actionButton: {
    backgroundColor: theme.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionSection: {
    marginBottom: 32,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: theme.textMuted,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
  },
  footerSection: {
    backgroundColor: theme.accentMuted,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.accent,
    textAlign: 'center',
    lineHeight: 20,
  },
});
