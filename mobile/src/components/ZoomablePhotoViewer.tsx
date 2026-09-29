import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FaIcon from './FaIcon';
import { API_BASE_URL } from '../config/api';
import { savePhotoToGallery } from '../utils/savePhotoToGallery';
import { getSecureItem } from '../utils/secureStore';

type Props = {
  uri: string | null | undefined;
  visible: boolean;
  onClose: () => void;
};

async function materializeLocalFile(uri: string): Promise<string> {
  const dest = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}stf-gallery-${Date.now()}.jpg`;

  if (uri.startsWith('data:')) {
    const comma = uri.indexOf(',');
    const base64 = comma >= 0 ? uri.slice(comma + 1) : uri;
    await FileSystem.writeAsStringAsync(dest, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return dest.startsWith('file:') ? dest : `file://${dest}`;
  }

  if (uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph:')) {
    return uri;
  }

  const token = await getSecureItem('jwtToken');
  const headers: Record<string, string> = { Accept: 'image/*' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = '1';
  }

  const result = await FileSystem.downloadAsync(uri, dest, { headers });
  if (result.status && result.status >= 400) {
    throw new Error(`download ${result.status}`);
  }
  const local = result.uri || dest;
  return local.startsWith('file:') || local.startsWith('content:') ? local : `file://${local}`;
}

function pinchDistance(touches: readonly { pageX: number; pageY: number }[]) {
  if (touches.length < 2) return 0;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.hypot(dx, dy);
}

export default function ZoomablePhotoViewer({ uri, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [saving, setSaving] = useState(false);
  const [turns, setTurns] = useState(0);
  const scale = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(1);
  const pinchStart = useRef(1);
  const pinchStartDist = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!visible) {
      setTurns(0);
      scale.setValue(1);
      scaleValue.current = 1;
    }
  }, [visible, scale]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (e) => (e.nativeEvent.touches?.length ?? 0) >= 2,
      onMoveShouldSetPanResponder: (e) => (e.nativeEvent.touches?.length ?? 0) >= 2,
      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches ?? [];
        if (touches.length >= 2) {
          pinchStartDist.current = pinchDistance(touches);
          pinchStart.current = scaleValue.current;
        }
      },
      onPanResponderMove: (e) => {
        const touches = e.nativeEvent.touches ?? [];
        if (touches.length < 2 || pinchStartDist.current < 8) return;
        const ratio = pinchDistance(touches) / pinchStartDist.current;
        const next = Math.min(4, Math.max(1, pinchStart.current * ratio));
        scaleValue.current = next;
        scale.setValue(next);
      },
      onPanResponderRelease: () => {
        pinchStartDist.current = 0;
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      const next = scaleValue.current > 1.2 ? 1 : 2.4;
      scaleValue.current = next;
      Animated.spring(scale, { toValue: next, useNativeDriver: true, bounciness: 0 }).start();
    }
    lastTap.current = now;
  };

  const handleRotate = () => {
    setTurns((n) => (n + 1) % 4);
    scale.setValue(1);
    scaleValue.current = 1;
  };

  const handleSave = async () => {
    if (!uri || saving) return;
    setSaving(true);
    try {
      const local = await materializeLocalFile(uri);
      const ok = await savePhotoToGallery(local);
      Alert.alert(
        ok ? 'Enregistré' : 'Erreur',
        ok
          ? 'La photo a été ajoutée à votre galerie.'
          : 'Impossible d’enregistrer la photo. Vérifiez l’autorisation d’accès à la galerie.'
      );
    } catch (error) {
      console.warn('Enregistrement galerie:', error);
      Alert.alert(
        'Erreur',
        'Impossible d’enregistrer la photo. Vérifiez la connexion et l’autorisation galerie.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!uri) {
    return null;
  }

  const rotateDeg = turns * 90;
  const swapped = turns % 2 === 1;
  const imgW = swapped ? winH : winW;
  const imgH = swapped ? winW : winH;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait']}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.toolbar,
            { paddingTop: Math.max(insets.top, 12), paddingHorizontal: 12 + insets.left },
          ]}
        >
          <TouchableOpacity style={styles.toolBtn} onPress={onClose} accessibilityLabel="Fermer">
            <FaIcon name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.toolbarRight}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={handleRotate}
              accessibilityLabel="Pivoter de 90 degrés"
            >
              <FaIcon name="rotate" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={handleSave}
              disabled={saving}
              accessibilityLabel="Enregistrer dans la galerie"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <FaIcon name="download" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stage} {...pan.panHandlers}>
          <Animated.View
            style={{
              width: imgW,
              height: imgH,
              transform: [{ rotate: `${rotateDeg}deg` }, { scale }],
            }}
          >
            <Pressable onPress={handleDoubleTap}>
              <Image source={{ uri }} style={{ width: imgW, height: imgH }} resizeMode="contain" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  toolbar: {
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
