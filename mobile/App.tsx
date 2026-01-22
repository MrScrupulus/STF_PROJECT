import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import HomeScreen from './src/screens/HomeScreen';
import CompetitionsScreen from './src/screens/CompetitionsScreen';
import CompetitionDetailScreen from './src/screens/CompetitionDetailScreen';
import CatchesScreen from './src/screens/CatchesScreen';
import AddCatchScreen from './src/screens/AddCatchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TeamsScreen from './src/screens/TeamsScreen';
import TeamDetailScreen from './src/screens/TeamDetailScreen';
import CreateTeamScreen from './src/screens/CreateTeamScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SpeciesScreen from './src/screens/SpeciesScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminCatchValidationScreen from './src/screens/AdminCatchValidationScreen';
import AdminAddCatchScreen from './src/screens/AdminAddCatchScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import InvitationsScreen from './src/screens/InvitationsScreen';
import EditTeamScreen from './src/screens/EditTeamScreen';
import CreateCompetitionScreen from './src/screens/CreateCompetitionScreen';
import NotificationPreferencesScreen from './src/screens/NotificationPreferencesScreen';
import NotificationInitializer from './src/components/NotificationInitializer';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const Stack = createNativeStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppNavigator() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const navigationRef = useRef<any>(null);
  const linkingRef = useRef<any>(null);

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
      if (navigationRef.current) {
        // @ts-ignore
        navigationRef.current.navigate('VerifyEmail', { token });
      }
    }
    
    // Parser l'URL manuellement pour stf://reset-password/{token}
    if (url.startsWith('stf://reset-password/')) {
      const token = url.replace('stf://reset-password/', '');
      console.log('Token extrait (reset-password):', token);
      
      // Naviguer vers l'écran de réinitialisation avec le token
      if (navigationRef.current) {
        // @ts-ignore
        navigationRef.current.navigate('ResetPassword', { token });
      }
    }
  };

  if (isAuthenticated === null) {
    return null; // Splash screen is showing
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        linkingRef.current = navigationRef.current;
      }}
    >
      <NotificationInitializer />
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Competitions" component={CompetitionsScreen} />
            <Stack.Screen name="CompetitionDetail" component={CompetitionDetailScreen} />
            <Stack.Screen name="Catches" component={CatchesScreen} />
            <Stack.Screen name="AddCatch" component={AddCatchScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Teams" component={TeamsScreen} />
            <Stack.Screen name="TeamDetail" component={TeamDetailScreen} />
            <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Species" component={SpeciesScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminCatchValidation" component={AdminCatchValidationScreen} />
            <Stack.Screen name="AdminAddCatch" component={AdminAddCatchScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Invitations" component={InvitationsScreen} />
            <Stack.Screen name="EditTeam" component={EditTeamScreen} />
            <Stack.Screen name="CreateCompetition" component={CreateCompetitionScreen} />
            <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

