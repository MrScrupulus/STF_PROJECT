import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CompetitionsScreen from '../screens/CompetitionsScreen';
import TeamsScreen from '../screens/TeamsScreen';
import AdminCatchValidationListScreen from '../screens/AdminCatchValidationListScreen';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { isAuthenticated } = useAuth();

  return (
    <Tab.Navigator
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          tabBarButton: () => null, // Cacher Home de la barre de navigation
        }}
      />
      {/* Toujours inclure les écrans pour que la barre de navigation fonctionne */}
      <Tab.Screen 
        name="Competitions" 
        component={CompetitionsScreen}
        options={{ tabBarLabel: 'Compétitions' }}
      />
      <Tab.Screen 
        name="Teams" 
        component={TeamsScreen}
        options={{ tabBarLabel: 'Mon équipe' }}
      />
      <Tab.Screen 
        name="AdminCatchValidation" 
        component={AdminCatchValidationListScreen}
        options={{ tabBarLabel: 'Validation' }}
      />
    </Tab.Navigator>
  );
}
