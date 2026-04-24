import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
}

export default function Header({ title, showBack = true, showMenu = true, showProfile = false }: HeaderProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { setIsAuthenticated, isAuthenticated } = useAuth();

  const canGoBack = navigation.canGoBack();

  useEffect(() => {
    // Vérifier si admin seulement si connecté
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

  // Menu items selon l'état d'authentification (Profil en premier pour ergonomie)
  const menuItems = isAuthenticated
    ? [
        { name: 'Profile', label: 'Mon compte', icon: '👤' },
        { name: 'Home', label: 'Accueil', icon: '🏠' },
        { name: 'History', label: 'Historique & prises', icon: '📜' },
        { name: 'Notifications', label: 'Notifications', icon: '🔔' },
        { name: 'Invitations', label: 'Mes Invitations', icon: '✉️' },
        ...(isAdmin ? [{ name: 'AdminDashboard', label: 'Dashboard Admin', icon: '⚙️' }] : []),
        { name: 'LegalNotice', label: 'Mentions légales', icon: '📄' },
      ]
    : [
        { name: 'Home', label: 'Accueil', icon: '🏠' },
        { name: 'Login', label: 'Connexion', icon: '🔐' },
        { name: 'Register', label: 'Inscription', icon: '📝' },
        { name: 'LegalNotice', label: 'Mentions légales', icon: '📄' },
      ];

  const handleProfilePress = () => {
    if (isAuthenticated) {
      navigation.navigate('Profile' as never);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  const handleMenuPress = (screenName: string) => {
    setMenuVisible(false);
    if (route.name !== screenName) {
      // Si on navigue vers Home, Competitions ou Teams, naviguer dans le Tab Navigator
      if (screenName === 'Profile' || screenName === 'Home' || screenName === 'Competitions' || screenName === 'Teams') {
        // Obtenir le navigateur parent (Stack) et naviguer vers MainTabs avec l'écran spécifique
        const parent = navigation.getParent();
        if (parent && screenName !== 'Profile') {
          // Naviguer vers MainTabs, puis vers l'écran spécifique dans les tabs
          // @ts-ignore - nested navigation typing
          parent.navigate('MainTabs', {
            screen: screenName,
          });
        } else {
          // Profile et autres écrans : navigation normale
          navigation.navigate(screenName as never);
        }
      } else {
        if (screenName === 'History') {
          // @ts-ignore
          navigation.navigate('History', { initialTab: 'catches' });
        } else {
          navigation.navigate(screenName as never);
        }
      }
    }
  };

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    setMenuVisible(false);
    try {
      await authService.logout();
      // Invalider tous les caches React Query pour éviter d'afficher les données de l'ancien utilisateur
      queryClient.clear();
      // Mettre à jour l'état d'authentification pour que App.tsx change le stack
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Bouton retour toujours visible à gauche */}
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Si on ne peut pas revenir, naviguer vers Home
              const parent = navigation.getParent();
              if (parent) {
                // @ts-ignore - nested navigation typing
                parent.navigate('MainTabs', { screen: 'Home' });
              } else {
                navigation.navigate('Home' as never);
              }
            }}
          >
            <Text style={[styles.backIcon, styles.backIconDisabled]}>←</Text>
          </TouchableOpacity>
        )}

        {/* Titre au centre */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Street Fishing'}
          </Text>
        </View>

        {/* Menu burger à droite (ancienne position du profil) */}
        <View style={styles.rightButtons}>
          {showMenu && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(true)}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          )}
          {showProfile ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          ) : showMenu ? null : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>

      {/* Menu Burger Modal */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Menu</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setMenuVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.menuItem,
                    route.name === item.name && styles.menuItemActive,
                  ]}
                  onPress={() => handleMenuPress(item.name)}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuItemText,
                      route.name === item.name && styles.menuItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Afficher le bouton de déconnexion seulement si connecté */}
              {isAuthenticated && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.logoutItem]}
                  onPress={handleLogout}
                >
                  <Text style={styles.menuItemIcon}>🚪</Text>
                  <Text style={[styles.menuItemText, styles.logoutText]}>
                    Déconnexion
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 56,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  backIconDisabled: {
    opacity: 0.5,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    paddingRight: 16,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  profileIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  menuList: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemActive: {
    backgroundColor: '#f0f7ff',
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  menuItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  logoutItem: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutText: {
    color: '#dc3545',
    fontWeight: '600',
  },
});
