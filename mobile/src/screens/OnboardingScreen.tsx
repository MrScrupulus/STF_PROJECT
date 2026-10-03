import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { markOnboardingComplete } from '../utils/onboardingStorage';
import { registerPushToken, requestNotificationPermissions } from '../utils/notifications';

type PermStatus = 'idle' | 'granted' | 'denied';

const STEPS = [
  {
    icon: 'camera' as AppIconName,
    title: 'Carnet de prises',
    text: 'Le bouton bleu au centre photographie une prise pour votre journal personnel.',
  },
  {
    icon: 'users' as AppIconName,
    title: 'Équipe',
    text: 'Créez une équipe ou rejoignez-en une avant de vous inscrire à une manche.',
  },
  {
    icon: 'trophy' as AppIconName,
    title: 'Compétition',
    text: 'Inscrivez votre équipe, puis enregistrez vos prises pendant la manche.',
  },
  {
    icon: 'gear' as AppIconName,
    title: 'Réglages',
    text: 'Thème, notifications et compte : menu burger → Réglages.',
  },
];

export default function OnboardingScreen({ navigation, route, onFinished }: any) {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const replay = Boolean(route?.params?.replay);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState<PermStatus>('idle');
  const [location, setLocation] = useState<PermStatus>('idle');
  const [notifs, setNotifs] = useState<PermStatus>('idle');

  const finish = useCallback(async () => {
    await markOnboardingComplete();
    onFinished?.();
    if (replay) {
      navigation.goBack();
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [navigation, replay, onFinished]);

  const askCamera = async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    setCamera(result.status === 'granted' ? 'granted' : 'denied');
  };

  const askLocation = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    setLocation(result.status === 'granted' ? 'granted' : 'denied');
  };

  const askNotifs = async () => {
    const ok = await requestNotificationPermissions();
    setNotifs(ok ? 'granted' : 'denied');
    if (ok) {
      void registerPushToken();
    }
  };

  const askAll = async () => {
    setBusy(true);
    try {
      await askCamera();
      await askLocation();
      await askNotifs();
    } finally {
      setBusy(false);
    }
  };

  const onPrimary = async () => {
    if (page === 2) {
      await askAll();
      setPage(3);
      return;
    }
    if (page === 3) {
      await finish();
      return;
    }
    setPage((p) => p + 1);
  };

  const primaryLabel =
    page === 2 ? 'Autoriser les accès' : page === 3 ? 'C’est parti' : 'Continuer';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={finish} hitSlop={12}>
          <Text style={styles.skip}>{replay ? 'Fermer' : 'Passer'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {page === 0 ? (
          <>
            <View style={styles.heroIcon}>
              <FaIcon name="trophy" size={36} color={theme.accent} />
            </View>
            <Text style={styles.title}>Bienvenue sur Street Fishing</Text>
            <Text style={styles.lead}>
              Deux usages, un même bouton photo : votre carnet personnel, et les
              manches de compétition avec votre équipe.
            </Text>
          </>
        ) : null}

        {page === 1 ? (
          <>
            <Text style={styles.title}>Comment ça marche</Text>
            <Text style={styles.lead}>
              Retenez l’essentiel. Vous pourrez revoir ce guide depuis l’accueil.
            </Text>
            {STEPS.map((step) => (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <FaIcon name={step.icon} size={18} color={theme.accent} />
                </View>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {page === 2 ? (
          <>
            <Text style={styles.title}>Trois accès indispensables</Text>
            <Text style={styles.lead}>
              Sans eux, une prise en compétition ne peut pas être validée
              correctement. Vous pouvez tout autoriser d’un coup, ou plus tard
              dans les réglages du téléphone.
            </Text>
            <PermRow
              styles={styles}
              theme={theme}
              icon="camera"
              title="Appareil photo"
              hint="Photographier la prise"
              status={camera}
            />
            <PermRow
              styles={styles}
              theme={theme}
              icon="map"
              title="Position"
              hint="Géolocaliser la prise sur le parcours"
              status={location}
            />
            <PermRow
              styles={styles}
              theme={theme}
              icon="bell"
              title="Notifications"
              hint="Validation, résultats et invitations"
              status={notifs}
            />
          </>
        ) : null}

        {page === 3 ? (
          <>
            <View style={styles.heroIcon}>
              <FaIcon name="check" size={36} color={theme.success} />
            </View>
            <Text style={styles.title}>Vous pouvez y aller</Text>
            <Text style={styles.lead}>
              Accueil pour les raccourcis, barre du bas pour les compétitions et
              l’équipe, bouton bleu pour une prise. Le guide reste disponible
              si besoin.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primary}
          onPress={() => void onPrimary()}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color={theme.onAccent} />
          ) : (
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          )}
        </TouchableOpacity>
        {page === 2 ? (
          <TouchableOpacity onPress={() => setPage(3)} style={styles.secondary}>
            <Text style={styles.secondaryText}>Plus tard</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function PermRow({
  styles,
  theme,
  icon,
  title,
  hint,
  status,
}: {
  styles: ReturnType<typeof createStyles>;
  theme: ThemeColors;
  icon: AppIconName;
  title: string;
  hint: string;
  status: PermStatus;
}) {
  const label = status === 'granted' ? 'OK' : status === 'denied' ? 'Refusé' : 'Requis';
  const color =
    status === 'granted' ? theme.success : status === 'denied' ? theme.danger : theme.textMuted;
  return (
    <View style={styles.permRow}>
      <View style={styles.stepIcon}>
        <FaIcon name={icon} size={18} color={theme.accent} />
      </View>
      <View style={styles.stepTextWrap}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{hint}</Text>
      </View>
      <Text style={[styles.permStatus, { color }]}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.border,
    },
    dotActive: {
      backgroundColor: theme.accent,
      width: 18,
    },
    skip: {
      color: theme.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
    body: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 24,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      alignSelf: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    lead: {
      fontSize: 16,
      color: theme.textMuted,
      lineHeight: 24,
      marginBottom: 20,
    },
    stepRow: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    permRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 10,
    },
    stepIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    stepTextWrap: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    stepText: {
      fontSize: 14,
      color: theme.textMuted,
      lineHeight: 20,
    },
    permStatus: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 8,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 8,
      paddingTop: 8,
    },
    primary: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryText: {
      color: theme.onAccent,
      fontSize: 17,
      fontWeight: '700',
    },
    secondary: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    secondaryText: {
      color: theme.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
  });
