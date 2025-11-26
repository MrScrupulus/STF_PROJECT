import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CompetitionsScreen from './src/screens/CompetitionsScreen';
import CompetitionDetailScreen from './src/screens/CompetitionDetailScreen';
import CatchesScreen from './src/screens/CatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { authService } from './src/services/authService';

const Stack = createNativeStackNavigator();

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      await SplashScreen.hideAsync();
    }
  };

  if (isAuthenticated === null) {
    return null; // Splash screen is showing
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Competitions" component={CompetitionsScreen} />
                <Stack.Screen name="CompetitionDetail" component={CompetitionDetailScreen} />
                <Stack.Screen name="Catches" component={CatchesScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

