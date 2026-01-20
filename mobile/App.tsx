import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
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

  if (isAuthenticated === null) {
    return null; // Splash screen is showing
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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

