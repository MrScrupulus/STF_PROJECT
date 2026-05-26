import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthSessionExpiredHandler } from './src/utils/authSessionEvents';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import CompetitionDetailScreen from './src/screens/CompetitionDetailScreen';
import CatchesScreen from './src/screens/CatchesScreen';
import AddCatchScreen from './src/screens/AddCatchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TeamDetailScreen from './src/screens/TeamDetailScreen';
import CreateTeamScreen from './src/screens/CreateTeamScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminAddCatchScreen from './src/screens/AdminAddCatchScreen';
import AdminPenaltyScreen from './src/screens/AdminPenaltyScreen';
import AdminCatchValidationScreen from './src/screens/AdminCatchValidationScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import InvitationsScreen from './src/screens/InvitationsScreen';
import EditTeamScreen from './src/screens/EditTeamScreen';
import CreateCompetitionScreen from './src/screens/CreateCompetitionScreen';
import EditCompetitionScreen from './src/screens/EditCompetitionScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import LegalNoticeScreen from './src/screens/LegalNoticeScreen';
import NotificationInitializer from './src/components/NotificationInitializer';
import GlobalBottomTabBar from './src/components/GlobalBottomTabBar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import MainTabs from './src/navigation/MainTabs';
import { rootNavigationRef } from './src/navigation/rootNavigationRef';

const Stack = createNativeStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function getActiveRouteName(state: any): string | null {
  if (!state || !state.routes) return null;
  const route = state.routes[state.index];
  if (!route) return null;
  if (route.state) {
    const nested = getActiveRouteName(route.state);
    if (nested) return nested;
    if (route.name === 'MainTabs' && route.state?.routes?.length) {
      const tabRoute = route.state.routes[route.state.index ?? 0];
      return tabRoute?.name ?? 'Home';
    }
  }
  return route.name;
}

function SessionExpiredBridge() {
  const { setIsAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    setAuthSessionExpiredHandler(() => {
      queryClient.clear();
      setIsAuthenticated(false);
    });
    return () => setAuthSessionExpiredHandler(null);
  }, [queryClient, setIsAuthenticated]);

  return null;
}

function AppNavigator() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const linkingRef = useRef<any>(null);
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);

  // Configuration des deep links
  const linking = {
    prefixes: ['stf://'],
    config: {
      screens: {
        VerifyEmail: 'verify-email/:token',
        ResetPassword: 'reset-password/:token',
        Login: 'login',
      },
    },
  };

  // Gérer les deep links au démarrage de l'app
  useEffect(() => {
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    handleInitialURL();

    // Écouter les deep links pendant l'exécution de l'app
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log('Deep link reçu:', url);
    
    // Parser l'URL manuellement pour stf://verify-email/{token}
    if (url.startsWith('stf://verify-email/')) {
      const token = url.replace('stf://verify-email/', '');
      console.log('Token extrait (verify-email):', token);
      
      // Naviguer vers l'écran de vérification avec le token
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.navigate('VerifyEmail' as never, { token } as never);
      }
    }
    
    // Parser l'URL manuellement pour stf://reset-password/{token}
    if (url.startsWith('stf://reset-password/')) {
      const token = url.replace('stf://reset-password/', '');
      console.log('Token extrait (reset-password):', token);
      
      // Naviguer vers l'écran de réinitialisation avec le token
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.navigate('ResetPassword' as never, { token } as never);
      }
    }
  };

  if (isAuthenticated === null) {
    return null; // Splash screen is showing
  }

  return (
    <NavigationContainer 
      ref={rootNavigationRef}
      linking={linking}
      onReady={() => {
        linkingRef.current = rootNavigationRef;
        const state = rootNavigationRef.getRootState?.();
        if (state) setCurrentRoute(getActiveRouteName(state));
      }}
      onStateChange={() => {
        const state = rootNavigationRef.getRootState?.();
        if (state) setCurrentRoute(getActiveRouteName(state));
      }}
    >
      <NotificationInitializer />
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            {/* Connexion obligatoire : Login en premier, pas d'accès au contenu */}
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="LegalNotice" component={LegalNoticeScreen} />
          </>
        ) : (
          <>
            {/* Tab Navigator pour les écrans principaux (inclut Home mais caché dans la barre) - DOIT ÊTRE EN PREMIER */}
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            
            {/* Écrans secondaires accessibles depuis les tabs ou le menu */}
            <Stack.Screen name="CompetitionDetail" component={CompetitionDetailScreen} />
            <Stack.Screen name="Catches" component={CatchesScreen} />
            <Stack.Screen name="AddCatch" component={AddCatchScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
            <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminAddCatch" component={AdminAddCatchScreen} />
            <Stack.Screen name="AdminPenalty" component={AdminPenaltyScreen} />
            <Stack.Screen name="AdminCatchValidation" component={AdminCatchValidationScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Invitations" component={InvitationsScreen} />
            <Stack.Screen name="EditTeam" component={EditTeamScreen} />
            <Stack.Screen name="CreateCompetition" component={CreateCompetitionScreen} />
            <Stack.Screen name="EditCompetition" component={EditCompetitionScreen} />
            <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
            <Stack.Screen name="LegalNotice" component={LegalNoticeScreen} />
          </>
        )}
      </Stack.Navigator>
      {/* Barre de navigation globale visible sur toutes les pages sauf Login et Register */}
      <GlobalBottomTabBar navigationRef={rootNavigationRef} currentRoute={currentRoute} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <SessionExpiredBridge />
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

