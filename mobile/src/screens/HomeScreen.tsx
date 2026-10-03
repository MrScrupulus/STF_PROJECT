import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import Header from '../components/Header';
import { homeActions, homeContent } from '../constants/homeContent';
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function HomeScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [openGuide, setOpenGuide] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    authService
      .getCurrentUser()
      .then((response) => {
        const user = response.user || response;
        if (!cancelled) {
          setIsAdmin(Boolean(user.roles?.includes('ROLE_ADMIN')));
        }
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const go = (screen: string) => {
    (navigation as any).navigate(screen);
  };

  const toggleGuide = (id: string) => {
    setOpenGuide((current) => (current === id ? null : id));
  };

  return (
    <>
      <Header title="Street Fishing" showBack={false} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{homeContent.title}</Text>
        <Text style={styles.subtitle}>{homeContent.subtitle}</Text>
        <Text style={styles.intro}>{homeContent.intro}</Text>

        {homeActions.map((action) => (
          <TouchableOpacity
            key={action.screen}
            style={styles.actionCard}
            onPress={() => go(action.screen)}
            activeOpacity={0.75}
          >
            <View style={styles.actionIcon}>
              <FaIcon name={action.icon} size={22} color={theme.accent} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionHint}>{action.hint}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {isAdmin ? (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => go('AdminDashboard')}
            activeOpacity={0.75}
          >
            <View style={styles.actionIcon}>
              <FaIcon name="flag" size={22} color={theme.accent} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Dashboard admin</Text>
              <Text style={styles.actionHint}>Compétitions, validations, pénalités</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.replayCard}
          onPress={() => (navigation as any).navigate('Onboarding', { replay: true })}
          activeOpacity={0.75}
        >
          <FaIcon name="help" size={20} color={theme.accent} />
          <Text style={styles.replayText}>Revoir l’intro</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Aide rapide</Text>

        <GuideBlock
          styles={styles}
          theme={theme}
          id="catch"
          open={openGuide === 'catch'}
          onToggle={() => toggleGuide('catch')}
          icon="camera"
          title={homeContent.catchTutorialTitle}
          steps={homeContent.catchTutorialSteps}
        />
        <GuideBlock
          styles={styles}
          theme={theme}
          id="comp"
          open={openGuide === 'comp'}
          onToggle={() => toggleGuide('comp')}
          icon="trophy"
          title={homeContent.competitionTutorialTitle}
          steps={homeContent.competitionTutorialSteps}
        />
        {isAdmin ? (
          <GuideBlock
            styles={styles}
            theme={theme}
            id="admin"
            open={openGuide === 'admin'}
            onToggle={() => toggleGuide('admin')}
            icon="flag"
            title={homeContent.adminTutorialTitle}
            badge={homeContent.adminBadge}
            steps={homeContent.competitionAdminSteps}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

function GuideBlock({
  styles,
  theme,
  id,
  open,
  onToggle,
  icon,
  title,
  steps,
  badge,
}: {
  styles: ReturnType<typeof createStyles>;
  theme: ThemeColors;
  id: string;
  open: boolean;
  onToggle: () => void;
  icon: AppIconName;
  title: string;
  steps: string[];
  badge?: string;
}) {
  return (
    <View style={styles.guideCard}>
      <TouchableOpacity style={styles.guideHeader} onPress={onToggle} activeOpacity={0.7}>
        <FaIcon name={icon} size={18} color={theme.accent} />
        <Text style={styles.guideTitle}>{title}</Text>
        {badge ? <Text style={styles.adminBadge}>{badge}</Text> : null}
        <Text style={styles.guideChevron}>{open ? '–' : '+'}</Text>
      </TouchableOpacity>
      {open
        ? steps.map((text, index) => (
            <View key={`${id}-${text}`} style={styles.step}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))
        : null}
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textMuted,
      marginBottom: 8,
    },
    intro: {
      fontSize: 15,
      color: theme.textMuted,
      lineHeight: 22,
      marginBottom: 20,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionText: {
      flex: 1,
      marginHorizontal: 12,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    actionHint: {
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 18,
    },
    chevron: {
      fontSize: 22,
      color: theme.textMuted,
      fontWeight: '300',
    },
    replayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      marginTop: 4,
      marginBottom: 24,
    },
    replayText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.accent,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    guideCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    guideHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    guideTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    guideChevron: {
      fontSize: 20,
      color: theme.textMuted,
      fontWeight: '600',
      width: 20,
      textAlign: 'center',
    },
    adminBadge: {
      backgroundColor: theme.danger,
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      overflow: 'hidden',
      color: theme.onAccent,
    },
    step: {
      flexDirection: 'row',
      marginTop: 12,
      alignItems: 'flex-start',
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.accent,
      color: theme.onAccent,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 24,
      marginRight: 10,
      overflow: 'hidden',
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      color: theme.textMuted,
      lineHeight: 20,
      paddingTop: 2,
    },
  });
