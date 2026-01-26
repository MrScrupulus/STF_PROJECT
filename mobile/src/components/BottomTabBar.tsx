import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const nav = useNavigation();

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

  const currentRoute = state.routes[state.index];
  const currentRouteName = currentRoute?.name;

  const handleNavigation = (screenName: string) => {
    if (!isAuthenticated) {
      // Rediriger vers Login si non connecté
      nav.navigate('Login' as never);
      return;
    }
    // Navigation normale si connecté
    const route = state.routes.find((r: any) => r.name === screenName);
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(screenName as never);
    }
  };

  const handleAddCatchPress = () => {
    if (!isAuthenticated) {
      // Rediriger vers Login si non connecté
      nav.navigate('Login' as never);
      return;
    }
    // Naviguer vers AddCatch dans le Stack Navigator parent
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('AddCatch' as never);
    } else {
      navigation.navigate('AddCatch' as never);
    }
  };

  return (
    // @ts-ignore - edges is supported by react-native-safe-area-context
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Premier onglet : Compétitions */}
        {(() => {
          const competitionsRoute = state.routes.find((r: any) => r.name === 'Competitions');
          if (!competitionsRoute) return null;
          
          const isFocused = state.index === state.routes.findIndex((r: any) => r.name === 'Competitions');
          
          return (
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleNavigation('Competitions')}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>🏆</Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                Compétitions
              </Text>
            </TouchableOpacity>
          );
        })()}

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
        {(() => {
          // Si non connecté, afficher "Mon équipe" par défaut
          const tabName = isAuthenticated ? (isAdmin ? 'AdminCatchValidation' : 'Teams') : 'Teams';
          const route = state.routes.find((r: any) => r.name === tabName);
          if (!route) return null;
          
          const isFocused = state.index === state.routes.findIndex((r: any) => r.name === tabName);
          
          return (
            <TouchableOpacity
              style={styles.tab}
              onPress={() => handleNavigation(tabName)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{isAuthenticated && isAdmin ? '✓' : '👥'}</Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {isAuthenticated && isAdmin ? 'Validation' : 'Mon équipe'}
              </Text>
            </TouchableOpacity>
          );
        })()}
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
