import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { speciesService } from '../services/speciesService';

export type SpeciesReadyPayload = {
  speciesId: number;
  name: string;
  /** Coefficient à utiliser sur la ligne « compétition » (saisie utilisateur). */
  competitionCoefficient: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Appelé après succès API (création ou réutilisation d’une espèce existante). */
  onSpeciesReady: (payload: SpeciesReadyPayload) => void;
  /** journal = POST /api/species (utilisateur) ; admin = route admin (organisateur). */
  variant?: 'admin' | 'journal';
};

export default function CreateSpeciesModal({
  visible,
  onClose,
  onSpeciesReady,
  variant = 'admin',
}: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [coefficient, setCoefficient] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setCoefficient('1');
  }, [visible]);

  const JOURNAL_DEFAULT_COEFFICIENT = 1;

  const submit = async () => {
    const n = name.trim();
    if (!n) {
      Alert.alert('Erreur', 'Le nom est requis.');
      return;
    }
    const coefParsed =
      variant === 'journal'
        ? JOURNAL_DEFAULT_COEFFICIENT
        : parseFloat(coefficient.replace(',', '.'));
    if (variant !== 'journal' && (Number.isNaN(coefParsed) || coefParsed <= 0)) {
      Alert.alert('Erreur', 'Indiquez un coefficient strictement positif.');
      return;
    }

    setLoading(true);
    try {
      const res =
        variant === 'journal'
          ? await speciesService.create({ name: n, coefficient: coefParsed })
          : await adminService.createSpecies({ name: n, coefficient: coefParsed });
      const sp = res.species;
      if (!sp?.id) {
        throw new Error('Réponse serveur invalide');
      }
      await queryClient.invalidateQueries({ queryKey: ['species'] });
      onSpeciesReady({
        speciesId: sp.id,
        name: sp.name,
        competitionCoefficient: coefParsed,
      });
      onClose();
      if (res.reused) {
        setTimeout(() => {
          Alert.alert(
            'Déjà dans le référentiel',
            variant === 'journal'
              ? `« ${sp.name} » existait déjà (même nom, casse ou espaces différents). C’est celle-ci qui est utilisée.`
              : `« ${sp.name} » existait déjà (même nom, casse ou espaces différents). Elle est ajoutée à la compétition avec le coefficient saisi.`
          );
        }, 250);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d’enregistrer l’espèce.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Nouvelle espèce</Text>
          <Text style={styles.hint}>
            {variant === 'journal'
              ? 'Ajout au référentiel global. Si le nom existe déjà (casse / espaces), l’exemplaire existant est utilisé.'
              : 'Si le nom correspond déjà à une espèce (ex. « brochet » → « Brochet »), aucun doublon n’est créé.'}
          </Text>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex. : Brochet, Sandre…"
            autoCapitalize="sentences"
          />
          {variant !== 'journal' && (
            <>
              <Text style={styles.label}>Coefficient catalogue *</Text>
              <TextInput
                style={styles.input}
                value={coefficient}
                onChangeText={(t) => setCoefficient(t.replace(/[^0-9.,]/g, ''))}
                placeholder="1.0"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helpCoef}>
                Utilisé dans le référentiel si l’espèce est vraiment nouvelle ; pour la compétition, la ligne ajoutée
                reprend ce coefficient (modifiable ensuite).
              </Text>
            </>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={loading}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOk} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnOkText}>Ajouter</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    zIndex: 1,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
  hint: { fontSize: 13, color: '#666', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  helpCoef: { fontSize: 12, color: '#888', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  btnCancelText: { color: '#666', fontSize: 16 },
  btnOk: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  btnOkText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
