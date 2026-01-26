import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

// Routes où la barre de navigation ne doit pas être affichée
const HIDDEN_ROUTES = ['Login', 'Register'];

// Fonction récursive pour trouver la route active dans l'état de navigation
const getActiveRouteName = (state: any): string | null => {
  if (!state || !state.routes) {
    return null;
  }
  
  const route = state.routes[state.index];
  if (!route) {
    return null;
  }
  
  // Si la route a un état imbriqué (comme dans un Tab Navigator), continuer la récursion
  if (route.state) {
    const nestedRoute = getActiveRouteName(route.state);
    // Si on trouve une route imbriquée, la retourner
    if (nestedRoute) {
      return nestedRoute;
    }
    // Si on est dans MainTabs, essayer de trouver la route active dans les tabs
    if (route.name === 'MainTabs' && route.state?.routes) {
      const tabIndex = route.state.index !== undefined ? route.state.index : 0;
      const tabRoute = route.state.routes[tabIndex];
      if (tabRoute && tabRoute.name) {
        return tabRoute.name;
      }
      // Si aucune route n'est trouvée mais qu'on a des routes, prendre la première (Home par défaut)
      if (route.state.routes.length > 0) {
        const firstRoute = route.state.routes[0];
        if (firstRoute && firstRoute.name) {
          return firstRoute.name;
        }
      }
      // Par défaut, si on est dans MainTabs sans route détectée, c'est Home
      return 'Home';
    }
  }
  
  return route.name;
};

export default function GlobalBottomTabBar() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const [currentRoute, setCurrentRoute] = React.useState<string | null>(null);
  
  // Obtenir la route actuelle depuis le Stack Navigator
  const navigationState = useNavigationState((state) => state);
  
  // Initialiser la route au montage et écouter les changements
  React.useEffect(() => {
    const updateRoute = () => {
      try {
        const state = (navigation as any).getState();
        if (state) {
          const routeName = getActiveRouteName(state);
          if (routeName) {
            setCurrentRoute(routeName);
          } else {
            // Si aucune route n'est détectée mais qu'on a un état, 
            // on est probablement sur MainTabs/Home
            const mainRoute = state.routes?.[state.index];
            if (mainRoute?.name === 'MainTabs') {
              setCurrentRoute('Home');
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    };

    // Mettre à jour immédiatement
    updateRoute();

    // Écouter les changements de navigation
    const unsubscribe = navigation.addListener('state', () => {
      updateRoute();
    });

    return unsubscribe;
  }, [navigation]);

  // Aussi mettre à jour quand navigationState change
  React.useEffect(() => {
    if (navigationState) {
      const routeName = getActiveRouteName(navigationState);
      if (routeName) {
        setCurrentRoute(routeName);
      }
    }
  }, [navigationState]);

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
    if (!isAuthenticated) {
      // Rediriger vers Login si non connecté
      (navigation as any).navigate('Login');
      return;
    }
    
    // Navigation vers les écrans du Tab Navigator
    if (screenName === 'Competitions' || screenName === 'Teams' || screenName === 'AdminCatchValidation') {
      // Si on est déjà dans MainTabs, naviguer directement vers l'écran dans le Tab Navigator
      // Sinon, naviguer vers MainTabs puis vers l'écran spécifique
      const navState = (navigation as any).getState();
      const isInMainTabs = navState?.routes[navState.index]?.name === 'MainTabs';
      
      if (isInMainTabs) {
        // Naviguer dans le Tab Navigator
        (navigation as any).navigate('MainTabs', { screen: screenName });
      } else {
        // Naviguer vers MainTabs puis vers l'écran spécifique
        (navigation as any).navigate('MainTabs', { screen: screenName });
      }
    } else {
      // Pour Home, naviguer vers MainTabs
      (navigation as any).navigate('MainTabs');
    }
  };

  const handleAddCatchPress = () => {
    if (!isAuthenticated) {
      // Rediriger vers Login si non connecté
      (navigation as any).navigate('Login');
      return;
    }
    // Naviguer vers AddCatch
    (navigation as any).navigate('AddCatch');
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
