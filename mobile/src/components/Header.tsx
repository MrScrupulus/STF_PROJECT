import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { rootNavigationRef } from '../navigation/rootNavigationRef';
import FaIcon, { type AppIconName } from './FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showProfile?: boolean;
}

export default function Header({ title, showBack = true, showMenu = true, showProfile = false }: HeaderProps) {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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
  const menuItems: { name: string; label: string; icon: AppIconName }[] = isAuthenticated
    ? [
        { name: 'Home', label: 'Accueil', icon: 'home' },
        { name: 'Profile', label: 'Mon compte', icon: 'user' },
        { name: 'Competitions', label: 'Compétitions', icon: 'trophy' },
        { name: 'History', label: 'Historique & prises', icon: 'history' },
        { name: 'Notifications', label: 'Notifications', icon: 'bell' },
        { name: 'Invitations', label: 'Mes Invitations', icon: 'envelope' },
        { name: 'Settings', label: 'Réglages', icon: 'gear' },
        ...(isAdmin ? [{ name: 'AdminDashboard', label: 'Dashboard Admin', icon: 'key' as const }] : []),
        { name: 'LegalNotice', label: 'Mentions légales', icon: 'file' },
      ]
    : [
        { name: 'Home', label: 'Accueil', icon: 'home' },
        { name: 'Login', label: 'Connexion', icon: 'key' },
        { name: 'Register', label: 'Inscription', icon: 'register' },
        { name: 'LegalNotice', label: 'Mentions légales', icon: 'file' },
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
    const go = (name: string, params?: object) => {
      if (rootNavigationRef.isReady()) {
        // @ts-ignore
        rootNavigationRef.navigate(name, params);
        return;
      }
      // @ts-ignore
      navigation.navigate(name, params);
    };

    if (screenName === 'Home' || screenName === 'Competitions' || screenName === 'Teams') {
      go('MainTabs', { screen: screenName });
      return;
    }
    if (screenName === 'History') {
      go('History', { initialTab: 'catches' });
      return;
    }
    go(screenName);
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
    <>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        {/* Bouton retour toujours visible à gauche */}
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FaIcon name="back" size={20} color={theme.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                // @ts-ignore
                parent.navigate('MainTabs', { screen: 'Home' });
              } else if (rootNavigationRef.isReady()) {
                // @ts-ignore
                rootNavigationRef.navigate('MainTabs', { screen: 'Home' });
              } else {
                navigation.navigate('Home' as never);
              }
            }}
          >
            <View style={styles.backIconDisabled}>
              <FaIcon name="back" size={20} color={theme.accent} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoButton}
          onPress={() => {
            if (rootNavigationRef.isReady()) {
              // @ts-ignore
              rootNavigationRef.navigate('MainTabs', { screen: 'Home' });
            }
          }}
          accessibilityLabel="Accueil"
        >
          <View style={styles.logoFrame}>
            <Image
              source={require('../../assets/logo-black.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>

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
              <FaIcon name="menu" size={22} color={theme.text} />
            </TouchableOpacity>
          )}
          {showProfile ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
            >
              <FaIcon name="user" size={22} color={theme.accent} />
            </TouchableOpacity>
          ) : showMenu ? null : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
    </SafeAreaView>

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
                <FaIcon name="close" size={22} color={theme.textMuted} />
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
                <View style={styles.menuItemIcon}>
                  <FaIcon
                    name={item.icon}
                    size={20}
                    color={route.name === item.name ? theme.accent : theme.text}
                  />
                </View>
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
                <View style={styles.menuItemIcon}>
                  <FaIcon name="logout" size={20} color={theme.danger} />
                </View>
                  <Text style={[styles.menuItemText, styles.logoutText]}>
                    Déconnexion
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  safeArea: {
    backgroundColor: theme.chrome,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.chrome,
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
    color: theme.accent,
    fontWeight: '600',
  },
  backIconDisabled: {
    opacity: 0.5,
  },
  logoButton: {
    width: 42,
    height: 42,
    marginLeft: 6,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFrame: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.logoRing,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  logo: {
    width: 50,
    height: 50,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: theme.text,
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
    color: theme.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
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
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: theme.textMuted,
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
    borderBottomColor: theme.border,
  },
  menuItemActive: {
    backgroundColor: theme.accentMuted,
  },
  menuItemIcon: {
    marginRight: 16,
    width: 32,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  menuItemTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  logoutItem: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  logoutText: {
    color: theme.danger,
    fontWeight: '600',
  },
});
