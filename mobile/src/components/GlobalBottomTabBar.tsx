import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

// Routes où la barre de navigation ne doit pas être affichée
const HIDDEN_ROUTES = ['Login', 'Register'];

interface GlobalBottomTabBarProps {
  navigationRef: React.RefObject<any>;
  currentRoute: string | null;
}

export default function GlobalBottomTabBar({ navigationRef, currentRoute }: GlobalBottomTabBarProps) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { isAuthenticated } = useAuth();

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

  // Ne pas afficher la barre sur Login et Register uniquement
  // Si currentRoute est null, afficher quand même la barre (cas du démarrage sur Home)
  if (currentRoute && HIDDEN_ROUTES.includes(currentRoute)) {
    return null;
  }

  const handleNavigation = (screenName: string) => {
    const nav = navigationRef.current;
    if (!nav) return;

    if (!isAuthenticated) {
      nav.navigate('Login');
      return;
    }
    
    if (screenName === 'Competitions' || screenName === 'Teams' || screenName === 'AdminCatchValidation') {
      nav.navigate('MainTabs', { screen: screenName });
    } else {
      nav.navigate('MainTabs');
    }
  };

  const handleAddCatchPress = () => {
    const nav = navigationRef.current;
    if (!nav) return;

    if (!isAuthenticated) {
      nav.navigate('Login');
      return;
    }
    nav.navigate('AddCatch');
  };

  // Déterminer quel onglet est actif
  const isCompetitionsActive = currentRoute === 'Competitions' || currentRoute === 'CompetitionDetail';
  const isTeamsActive = currentRoute === 'Teams' || currentRoute === 'TeamDetail' || currentRoute === 'CreateTeam' || currentRoute === 'EditTeam' || currentRoute === 'Invitations';
  const isAdminValidationActive = currentRoute === 'AdminCatchValidation' || currentRoute === 'AdminDashboard';
  const isHomeActive = currentRoute === 'Home' || currentRoute === 'MainTabs';

  // Déterminer quel onglet afficher (Teams ou AdminCatchValidation)
  const teamsTabName = isAuthenticated && isAdmin ? 'AdminCatchValidation' : 'Teams';
  const teamsTabLabel = isAuthenticated && isAdmin ? 'Validation' : 'Mon équipe';
  const teamsTabIcon = isAuthenticated && isAdmin ? '✓' : '👥';
  const teamsTabActive = isAuthenticated && isAdmin ? isAdminValidationActive : isTeamsActive;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Premier onglet : Compétitions */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleNavigation('Competitions')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🏆</Text>
          <Text style={[styles.tabLabel, isCompetitionsActive && styles.tabLabelActive]}>
            Compétitions
          </Text>
        </TouchableOpacity>

        {/* Bouton central pour ajouter une prise */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCatchPress}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonInner}>
            <Text style={styles.addButtonIcon}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* Deuxième onglet : Mon équipe ou Validation */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleNavigation(teamsTabName)}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>{teamsTabIcon}</Text>
          <Text style={[styles.tabLabel, teamsTabActive && styles.tabLabelActive]}>
            {teamsTabLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    fontSize: 28,
  },
});
