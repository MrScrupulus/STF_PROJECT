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
  Switch,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { speciesService } from '../services/speciesService';

export type SpeciesReadyPayload = {
  speciesId: number;
  name: string;
  /** Coefficient à utiliser sur la ligne « compétition » (saisie utilisateur ou 1 pour une espèce bonus). */
  competitionCoefficient: number;
  /** Points catalogue (bonus espèce) : à reporter sur la ligne compétition si l’organisateur utilise les bonus espèce. */
  catalogBasePoints: number | null;
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
  const [isBonus, setIsBonus] = useState(false);
  const [basePoints, setBasePoints] = useState('50');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setCoefficient('1');
    setIsBonus(false);
    setBasePoints('50');
  }, [visible]);

  const JOURNAL_DEFAULT_COEFFICIENT = 1;

  const submit = async () => {
    const n = name.trim();
    if (!n) {
      Alert.alert('Erreur', 'Le nom est requis.');
      return;
    }
    let coefParsed = JOURNAL_DEFAULT_COEFFICIENT;
    let basePointsParsed = 50;

    if (variant !== 'journal') {
      if (isBonus) {
        const rawBp = parseInt(String(basePoints).trim().replace(/[^0-9]/g, ''), 10);
        basePointsParsed = Number.isFinite(rawBp) && rawBp >= 1 ? rawBp : 50;
        coefParsed = 1;
      } else {
        coefParsed = parseFloat(coefficient.replace(',', '.'));
        if (Number.isNaN(coefParsed) || coefParsed <= 0) {
          Alert.alert('Erreur', 'Indiquez un coefficient strictement positif.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const res =
        variant === 'journal'
          ? await speciesService.create({ name: n, coefficient: coefParsed })
          : isBonus
            ? await adminService.createSpecies({ name: n, isBonus: true, basePoints: basePointsParsed })
            : await adminService.createSpecies({ name: n, isBonus: false, coefficient: coefParsed });
      const sp = res.species;
      if (!sp?.id) {
        throw new Error('Réponse serveur invalide');
      }
      await queryClient.invalidateQueries({ queryKey: ['species'] });
      const rowCoef =
        variant === 'journal'
          ? JOURNAL_DEFAULT_COEFFICIENT
          : typeof sp.coefficient === 'number'
            ? sp.coefficient
            : coefParsed;
      const bpFromCatalog =
        sp.basePoints != null && Number(sp.basePoints) > 0 ? Number(sp.basePoints) : null;
      const catalogBasePoints = variant === 'journal' ? null : bpFromCatalog;

      onSpeciesReady({
        speciesId: sp.id,
        name: sp.name,
        competitionCoefficient: rowCoef,
        catalogBasePoints,
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
              <View style={styles.switchRow}>
                <Text style={styles.label}>Espèce bonus</Text>
                <Switch value={isBonus} onValueChange={setIsBonus} />
              </View>
              <Text style={[styles.helpCoef, { marginTop: 0, marginBottom: 12 }]}>
                Comme sur le tableau de bord web : espèce bonus = points fixes par prise ; sinon coefficient × taille
                (cm).
              </Text>
              {!isBonus ? (
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
                    Référentiel et valeur par défaut sur la ligne compétition (modifiable après ajout).
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Points bonus *</Text>
                  <TextInput
                    style={styles.input}
                    value={basePoints}
                    onChangeText={(t) => setBasePoints(t.replace(/[^0-9]/g, ''))}
                    placeholder="50"
                    keyboardType="number-pad"
                  />
                  <Text style={styles.helpCoef}>
                    Points attribués par prise pour cette espèce bonus (équivalent web « Points bonus »).
                  </Text>
                </>
              )}
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
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
