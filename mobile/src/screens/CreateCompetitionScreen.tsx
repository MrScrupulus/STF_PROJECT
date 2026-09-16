import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { adminService } from '../services/adminService';
import { speciesService } from '../services/speciesService';
import Header from '../components/Header';
import FaIcon from '../components/FaIcon';
import HelpButton from '../components/HelpButton';
import CreateSpeciesModal from '../components/CreateSpeciesModal';
import ScheduledPauseFormModal, { ScheduledPauseFormValues } from '../components/ScheduledPauseFormModal';
import { COMPETITION_HELP } from '../constants/competitionHelpTexts';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

type PauseDraft = { key: string } & ScheduledPauseFormValues;

interface CompetitionSpecies {
  speciesId: number;
  coefficient: string | number;
  basePoints?: number | null;
  quota?: string | number | null;
  quotaBonusPoints?: string | number | null;
}

export default function CreateCompetitionScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    teamSize: '2',
    type: 'street',
    maxParticipants: '',
    hasNoLimit: false,
    description: '',
    reglement: '',
    isRankingPublic: false,
    isBonusEnabled: false,
    newSpeciesBonusEnabled: false,
    newSpeciesBonusPoints: '',
    quotaBonusEnabled: false,
    maxFishCounted: '', // vide = tous, sinon nombre saisi
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // États pour gérer séparément date et heure sur Android
  const [showStartDateOnly, setShowStartDateOnly] = useState(false);
  const [showStartTimeOnly, setShowStartTimeOnly] = useState(false);
  const [showEndDateOnly, setShowEndDateOnly] = useState(false);
  const [showEndTimeOnly, setShowEndTimeOnly] = useState(false);
  const [competitionSpecies, setCompetitionSpecies] = useState<CompetitionSpecies[]>([]);
  const [error, setError] = useState('');
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showCreateSpeciesModal, setShowCreateSpeciesModal] = useState(false);
  const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number | null>(null);
  const [scheduledPausesDraft, setScheduledPausesDraft] = useState<PauseDraft[]>([]);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [pauseModalInitial, setPauseModalInitial] = useState<ScheduledPauseFormValues | null>(null);
  const [pauseEditingKey, setPauseEditingKey] = useState<string | null>(null);
  const [coverAsset, setCoverAsset] = useState<{ uri: string; mimeType?: string } | null>(null);

  const { data: availableSpecies, isLoading: loadingSpecies } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await adminService.createCompetition(data);
      const id = res.competition?.id;
      if (id && coverAsset) {
        await adminService.uploadCoverImage(id, coverAsset.uri, coverAsset.mimeType || 'image/jpeg');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      Alert.alert('Succès', 'Compétition créée avec succès.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la création. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleAddSpecies = () => {
    if (!availableSpecies || availableSpecies.length === 0) return;
    const firstSpecies = availableSpecies[0];
    setCompetitionSpecies([
      ...competitionSpecies,
      {
        speciesId: firstSpecies.id,
        coefficient: firstSpecies.coefficient || 1.0,
        basePoints: null,
        quota: '',
        quotaBonusPoints: '',
      },
    ]);
  };

  const handleRemoveSpecies = (index: number) => {
    setCompetitionSpecies(competitionSpecies.filter((_, i) => i !== index));
  };

  const handleSpeciesChange = (index: number, field: string, value: any) => {
    const updated = [...competitionSpecies];
    updated[index] = { ...updated[index], [field]: value };
    setCompetitionSpecies(updated);
  };

  // Fonction pour normaliser les nombres (accepter "," et ".")
  const normalizeNumber = (value: string): string => {
    return value.replace(',', '.');
  };

  // Fonction pour parser les nombres avec virgule ou point
  const parseNumber = (value: string): number | null => {
    if (!value || value === '') return null;
    const normalized = normalizeNumber(value);
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // Sur Android, on gère séparément date et heure
      if (showStartDateOnly) {
        setShowStartDateOnly(false);
        if (!date || (event && event.type === 'dismissed')) {
          return;
        }
        // Mettre à jour la date, garder l'heure actuelle
        const newDate = new Date(date);
        newDate.setHours(formData.startDate.getHours());
        newDate.setMinutes(formData.startDate.getMinutes());
        setFormData({ ...formData, startDate: newDate });
        // Ouvrir le sélecteur d'heure
        setShowStartTimeOnly(true);
        return;
      }
      if (showStartTimeOnly) {
        setShowStartTimeOnly(false);
        if (!date || (event && event.type === 'dismissed')) {
          return;
        }
        // Mettre à jour l'heure, garder la date actuelle
        const newDate = new Date(formData.startDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setFormData({ ...formData, startDate: newDate });
        // Si la date de fin est avant la date de début, mettre à jour
        if (newDate > formData.endDate) {
          const newEndDate = new Date(newDate);
          newEndDate.setHours(newDate.getHours() + 1);
          setFormData({ ...formData, startDate: newDate, endDate: newEndDate });
        }
        return;
      }
      setShowStartDatePicker(false);
      // Sur Android, si l'utilisateur annule, event peut être undefined, null, ou event.type === 'dismissed'
      // Vérifier d'abord si date existe, puis vérifier event si nécessaire
      if (!date) {
        return;
      }
      // Si event existe et est de type 'dismissed', ne pas mettre à jour
      if (event && event.type === 'dismissed') {
        return;
      }
    }
    // Vérifier que date existe avant de continuer
    if (!date) {
      return;
    }
    setFormData({ ...formData, startDate: date });
    // Si la date de fin est avant la date de début, mettre à jour
    if (date > formData.endDate) {
      const newEndDate = new Date(date);
      newEndDate.setHours(date.getHours() + 1);
      setFormData({ ...formData, startDate: date, endDate: newEndDate });
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // Sur Android, on gère séparément date et heure
      if (showEndDateOnly) {
        setShowEndDateOnly(false);
        if (!date || (event && event.type === 'dismissed')) {
          return;
        }
        // Mettre à jour la date, garder l'heure actuelle
        const newDate = new Date(date);
        newDate.setHours(formData.endDate.getHours());
        newDate.setMinutes(formData.endDate.getMinutes());
        setFormData({ ...formData, endDate: newDate });
        // Ouvrir le sélecteur d'heure
        setShowEndTimeOnly(true);
        return;
      }
      if (showEndTimeOnly) {
        setShowEndTimeOnly(false);
        if (!date || (event && event.type === 'dismissed')) {
          return;
        }
        // Mettre à jour l'heure, garder la date actuelle
        const newDate = new Date(formData.endDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setFormData({ ...formData, endDate: newDate });
        return;
      }
      setShowEndDatePicker(false);
      // Sur Android, si l'utilisateur annule, event peut être undefined, null, ou event.type === 'dismissed'
      // Vérifier d'abord si date existe, puis vérifier event si nécessaire
      if (!date) {
        return;
      }
      // Si event existe et est de type 'dismissed', ne pas mettre à jour
      if (event && event.type === 'dismissed') {
        return;
      }
    }
    // Vérifier que date existe avant de continuer
    if (!date) {
      return;
    }
    setFormData({ ...formData, endDate: date });
  };

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = () => {
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom de la compétition est requis');
      return;
    }

    if (formData.startDate >= formData.endDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    if (!formData.teamSize || parseInt(formData.teamSize) < 1) {
      setError('La taille des équipes doit être au moins 1');
      return;
    }

    if (!formData.hasNoLimit && (!formData.maxParticipants || parseInt(formData.maxParticipants) < 1)) {
      setError('Le nombre maximum de participants est requis');
      return;
    }

    if (competitionSpecies.length === 0) {
      setError('Au moins une espèce doit être configurée');
      return;
    }

    for (const p of scheduledPausesDraft) {
      if (p.endDate <= p.startDate) {
        setError('Chaque pause programmée doit se terminer après son début.');
        return;
      }
      if (p.startDate < formData.startDate || p.endDate > formData.endDate) {
        setError('Les pauses programmées doivent être entièrement comprises entre le début et la fin de la compétition.');
        return;
      }
    }

    if (formData.quotaBonusEnabled) {
      for (const cs of competitionSpecies) {
        const quotaVal = cs.quota != null && String(cs.quota).trim() !== '';
        if (!quotaVal) continue;
        const qbpStr = cs.quotaBonusPoints != null ? String(cs.quotaBonusPoints).trim() : '';
        const qb = parseInt(qbpStr, 10);
        if (!qbpStr || isNaN(qb) || qb < 1) {
          setError('Avec le bonus quota activé, chaque espèce avec un quota doit avoir un bonus (points) d’au moins 1.');
          return;
        }
      }
    }

    const newSpeciesBonusPointsVal = formData.newSpeciesBonusEnabled && formData.newSpeciesBonusPoints
      ? parseInt(String(formData.newSpeciesBonusPoints).trim(), 10) : null;

    // Préparer les données
    const competitionData: any = {
      name: formData.name.trim(),
      startDate: formatDateTime(formData.startDate),
      endDate: formatDateTime(formData.endDate),
      teamSize: parseInt(formData.teamSize),
      type: formData.type,
      hasNoLimit: formData.hasNoLimit,
      description: formData.description.trim() || null,
      reglement: formData.reglement.trim() || null,
      isRankingPublic: formData.isRankingPublic,
      isBonusEnabled: formData.newSpeciesBonusEnabled,
      newSpeciesBonusEnabled: formData.newSpeciesBonusEnabled,
      newSpeciesBonusPoints: newSpeciesBonusPointsVal,
      quotaBonusEnabled: formData.quotaBonusEnabled,
      maxFishCounted: (() => {
        const v = formData.maxFishCounted.trim();
        if (!v || v === '0') return null;
        const n = parseInt(v, 10);
        return isNaN(n) || n < 1 ? 5 : n;
      })(),
    };

    if (!formData.hasNoLimit) {
      competitionData.maxParticipants = parseInt(formData.maxParticipants);
    }

    // Préparer les espèces
    const speciesConfig = competitionSpecies.map((cs) => {
      const coefficient = parseNumber(String(cs.coefficient));
      if (coefficient === null || coefficient < 0) {
        throw new Error(`Coefficient invalide pour l'espèce`);
      }

      const speciesData: any = {
        speciesId: cs.speciesId,
        coefficient: coefficient,
      };

      const quotaVal = cs.quota != null && String(cs.quota).trim() !== '';
      if (quotaVal) {
        const q = parseInt(String(cs.quota).trim(), 10);
        speciesData.quota = !isNaN(q) && q >= 1 ? q : null;
      } else {
        speciesData.quota = null;
      }
      if (formData.quotaBonusEnabled && quotaVal) {
        const qb = parseInt(String(cs.quotaBonusPoints ?? '').trim(), 10);
        speciesData.quotaBonusPoints = !isNaN(qb) && qb >= 1 ? qb : 1;
      }

      if (
        formData.newSpeciesBonusEnabled &&
        cs.basePoints != null &&
        String(cs.basePoints).trim() !== ''
      ) {
        const bp = parseInt(String(cs.basePoints).trim(), 10);
        if (!isNaN(bp) && bp >= 1) {
          speciesData.basePoints = bp;
        }
      }

      return speciesData;
    });

    competitionData.species = speciesConfig;

    if (scheduledPausesDraft.length > 0) {
      competitionData.scheduledPauses = scheduledPausesDraft.map((p) => ({
        startDate: formatDateTime(p.startDate),
        endDate: formatDateTime(p.endDate),
        ...(p.reason.trim() ? { reason: p.reason.trim() } : {}),
      }));
    }

    createMutation.mutate(competitionData);
  };

  const openAddPauseModal = () => {
    setPauseEditingKey(null);
    setPauseModalInitial(null);
    setPauseModalVisible(true);
  };

  const openEditPauseModal = (draft: PauseDraft) => {
    setPauseEditingKey(draft.key);
    setPauseModalInitial({
      startDate: draft.startDate,
      endDate: draft.endDate,
      reason: draft.reason,
    });
    setPauseModalVisible(true);
  };

  const handlePauseFormSave = (v: ScheduledPauseFormValues) => {
    if (pauseEditingKey) {
      setScheduledPausesDraft((prev) =>
        prev.map((p) => (p.key === pauseEditingKey ? { ...p, ...v } : p))
      );
    } else {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setScheduledPausesDraft((prev) => [...prev, { key, ...v }]);
    }
    setPauseModalVisible(false);
  };

  const removePauseDraft = (key: string) => {
    setScheduledPausesDraft((prev) => prev.filter((p) => p.key !== key));
  };

  return (
    <>
      <Header title="Créer une compétition" showBack={true} showMenu={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <FaIcon name="trophy" size={22} color={theme.onAccent} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.displayName}>Nouvelle manche</Text>
              <Text style={styles.identityHint}>Dates, espèces, règlement et jaquette</Text>
            </View>
          </View>

          {/* Nom */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom de la compétition *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nom de la compétition"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Jaquette (optionnel)</Text>
            <Text style={styles.helpText}>Image jpg, png ou webp à côté du titre dans la liste. Pas de PDF.</Text>
            {coverAsset && (
              <Image source={{ uri: coverAsset.uri }} style={styles.coverPreview} />
            )}
            <TouchableOpacity
              style={styles.addZoneButton}
              onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour importer une image.');
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.9,
                });
                if (!result.canceled && result.assets[0]) {
                  setCoverAsset({
                    uri: result.assets[0].uri,
                    mimeType: result.assets[0].mimeType || 'image/jpeg',
                  });
                }
              }}
            >
              <Text style={styles.addZoneButtonText}>
                {coverAsset ? 'Changer la jaquette' : 'Choisir une jaquette'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.label}>Date de début *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                if (Platform.OS === 'android') {
                  // Sur Android, ouvrir d'abord le sélecteur de date
                  setShowStartDateOnly(true);
                } else {
                  // Sur iOS, ouvrir le sélecteur datetime
                  setShowStartDatePicker(true);
                }
              }}
            >
              <Text style={styles.dateText}>
                {formData.startDate.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            {/* Sur Android, utiliser deux sélecteurs séparés */}
            {Platform.OS === 'android' && showStartDateOnly && (
              <DateTimePicker
                value={formData.startDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
            {Platform.OS === 'android' && showStartTimeOnly && (
              <DateTimePicker
                value={formData.startDate}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleStartDateChange}
              />
            )}
            {/* Sur iOS, utiliser le sélecteur datetime */}
            {Platform.OS === 'ios' && showStartDatePicker && (
              <DateTimePicker
                value={formData.startDate}
                mode="datetime"
                is24Hour={true}
                display="spinner"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
            {Platform.OS === 'ios' && showStartDatePicker && (
              <View style={styles.iosDatePickerActions}>
                <TouchableOpacity
                  style={styles.iosDatePickerButton}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <Text style={styles.iosDatePickerButtonText}>Valider</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date de fin *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                if (Platform.OS === 'android') {
                  // Sur Android, ouvrir d'abord le sélecteur de date
                  setShowEndDateOnly(true);
                } else {
                  // Sur iOS, ouvrir le sélecteur datetime
                  setShowEndDatePicker(true);
                }
              }}
            >
              <Text style={styles.dateText}>
                {formData.endDate.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            {/* Sur Android, utiliser deux sélecteurs séparés */}
            {Platform.OS === 'android' && showEndDateOnly && (
              <DateTimePicker
                value={formData.endDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={handleEndDateChange}
                minimumDate={formData.startDate}
              />
            )}
            {Platform.OS === 'android' && showEndTimeOnly && (
              <DateTimePicker
                value={formData.endDate}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleEndDateChange}
              />
            )}
            {/* Sur iOS, utiliser le sélecteur datetime */}
            {Platform.OS === 'ios' && showEndDatePicker && (
              <DateTimePicker
                value={formData.endDate}
                mode="datetime"
                is24Hour={true}
                display="spinner"
                onChange={handleEndDateChange}
                minimumDate={formData.startDate}
              />
            )}
            {Platform.OS === 'ios' && showEndDatePicker && (
              <View style={styles.iosDatePickerActions}>
                <TouchableOpacity
                  style={styles.iosDatePickerButton}
                  onPress={() => setShowEndDatePicker(false)}
                >
                  <Text style={styles.iosDatePickerButtonText}>Valider</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Taille équipe */}
          <View style={styles.section}>
            <Text style={styles.label}>Taille des équipes *</Text>
            <TextInput
              style={styles.input}
              value={formData.teamSize}
              onChangeText={(text) => setFormData({ ...formData, teamSize: text })}
              placeholder="2"
              keyboardType="number-pad"
            />
          </View>

          {/* Nombre de poissons comptabilisés */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Poissons comptabilisés pour le score</Text>
              <HelpButton text={COMPETITION_HELP.maxFishCounted} />
            </View>
            <Text style={styles.helpText}>Nombre des meilleures prises (par points) comptabilisées. Laisser vide ou 0 = toutes les prises.</Text>
            <TextInput
              style={styles.input}
              value={formData.maxFishCounted}
              onChangeText={(text) => setFormData({ ...formData, maxFishCounted: text.replace(/[^0-9]/g, '') })}
              placeholder="Ex: 5, 10, 20 (vide = toutes)"
              keyboardType="number-pad"
            />
          </View>

          {/* Type */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Type</Text>
              <HelpButton text={COMPETITION_HELP.type} />
            </View>
            <View style={styles.typeButtons}>
              {['street', 'boat', 'float'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type === 'street' ? 'Street' : type === 'boat' ? 'Boat' : 'Float'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pas de limite */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={[styles.labelRow, styles.labelRowInSwitch]}>
                <Text style={styles.label}>Pas de limite de participants</Text>
                <HelpButton text={COMPETITION_HELP.hasNoLimit} />
              </View>
              <Switch
                value={formData.hasNoLimit}
                onValueChange={(value) => setFormData({ ...formData, hasNoLimit: value })}
              />
            </View>
          </View>

          {/* Max participants */}
          {!formData.hasNoLimit && (
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nombre maximum de participants *</Text>
                <HelpButton text={COMPETITION_HELP.maxParticipants} />
              </View>
              <TextInput
                style={styles.input}
                value={formData.maxParticipants}
                onChangeText={(text) => setFormData({ ...formData, maxParticipants: text })}
                placeholder="100"
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description de la compétition..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Règlement */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Règlement</Text>
              <HelpButton text={COMPETITION_HELP.reglement} />
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.reglement}
              onChangeText={(text) => setFormData({ ...formData, reglement: text })}
              placeholder="Règlement de la compétition (visible dans l'onglet Règlement)..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Classement public */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={[styles.labelRow, styles.labelRowInSwitch]}>
                <Text style={styles.label}>Rendre le classement public</Text>
                <HelpButton text={COMPETITION_HELP.isRankingPublic} />
              </View>
              <Switch
                value={formData.isRankingPublic}
                onValueChange={(value) => setFormData({ ...formData, isRankingPublic: value })}
              />
            </View>
            <Text style={styles.helpText}>
              Si activé, le classement sera visible par tous les utilisateurs une fois la compétition terminée.
            </Text>
          </View>

          {/* Bonus nouvelle espèce */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={[styles.labelRow, styles.labelRowInSwitch]}>
                <Text style={styles.label}>Bonus par nouvelle espèce</Text>
                <HelpButton text={COMPETITION_HELP.newSpeciesBonus} />
              </View>
              <Switch
                value={formData.newSpeciesBonusEnabled}
                onValueChange={(value) =>
                  setFormData({ ...formData, newSpeciesBonusEnabled: value })
                }
              />
            </View>
            {formData.newSpeciesBonusEnabled && (
              <View style={[styles.section, { marginTop: 8 }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Valeur du bonus (pts)</Text>
                  <HelpButton text={COMPETITION_HELP.newSpeciesBonusPoints} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.newSpeciesBonusPoints}
                  onChangeText={(text) =>
                    setFormData({ ...formData, newSpeciesBonusPoints: text.replace(/[^0-9]/g, '') })
                  }
                  placeholder="Ex: 50"
                  keyboardType="number-pad"
                />
              </View>
            )}
            <Text style={styles.helpText}>
              Points bonus pour chaque espèce différente pêchée (au-delà de la première).
            </Text>
          </View>

          {/* Bonus quota */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={[styles.labelRow, styles.labelRowInSwitch]}>
                <Text style={styles.label}>Bonus quota atteint</Text>
                <HelpButton text={COMPETITION_HELP.quotaBonus} />
              </View>
              <Switch
                value={formData.quotaBonusEnabled}
                onValueChange={(value) =>
                  setFormData({ ...formData, quotaBonusEnabled: value })
                }
              />
            </View>
            {formData.quotaBonusEnabled && (
              <Text style={[styles.helpText, { marginTop: 8 }]}>
                Pour chaque espèce à laquelle vous donnez un quota, renseignez aussi le montant du bonus lorsque ce quota est atteint (ex. 500 pts).
              </Text>
            )}
          </View>

          {/* Espèces */}
          <View style={styles.section}>
            <Text style={styles.label}>Espèces de la compétition *</Text>
            <View style={styles.speciesHeaderButtons}>
                <TouchableOpacity
                  style={styles.newSpeciesButton}
                  onPress={() => setShowCreateSpeciesModal(true)}
                >
                  <Text style={styles.newSpeciesButtonText}>+ Nouvelle espèce</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addSpeciesButton}
                  onPress={handleAddSpecies}
                  disabled={loadingSpecies || !availableSpecies || availableSpecies.length === 0}
                >
                  <Text style={styles.addSpeciesButtonText}>+ Ligne</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Définissez les espèces avec leurs coefficients et quotas. Si le bonus quota est activé, indiquez aussi le bonus sur chaque ligne qui a un quota.
            </Text>

            {competitionSpecies.map((compSpecies, index) => {
              const species = availableSpecies?.find((s) => s.id === compSpecies.speciesId);
              return (
                <View key={index} style={styles.speciesItem}>
                  <View style={styles.speciesRow}>
                    <View style={styles.speciesSelect}>
                      <Text style={styles.speciesLabel}>Espèce</Text>
                      <TouchableOpacity
                        style={styles.speciesSelectButton}
                        onPress={() => {
                          setSelectedSpeciesIndex(index);
                          setShowSpeciesModal(true);
                        }}
                      >
                        <Text style={styles.speciesSelectButtonText}>
                          {species?.name || 'Sélectionner une espèce'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.speciesCoefficient}>
                      <View style={[styles.labelRow, { marginBottom: 4 }]}>
                        <Text style={styles.speciesLabel}>Coefficient</Text>
                        <HelpButton text={COMPETITION_HELP.speciesCoefficient} />
                      </View>
                      <TextInput
                        style={styles.speciesInput}
                        value={String(compSpecies.coefficient)}
                        onChangeText={(text) => {
                          const normalized = normalizeNumber(text);
                          const decimalPattern = /^-?\d*\.?\d*$/;
                          if (text === '' || text === '.' || text === ',') {
                            handleSpeciesChange(index, 'coefficient', text);
                          } else if (decimalPattern.test(normalized)) {
                            handleSpeciesChange(index, 'coefficient', text);
                          }
                        }}
                        onBlur={() => {
                          const currentValue = String(compSpecies.coefficient);
                          const value = parseNumber(currentValue);
                          if (value === null || value < 0) {
                            handleSpeciesChange(index, 'coefficient', 1.0);
                          } else {
                            handleSpeciesChange(index, 'coefficient', value);
                          }
                        }}
                        keyboardType="decimal-pad"
                        placeholder="1.0"
                      />
                    </View>

                    <View style={styles.speciesCoefficient}>
                      <View style={[styles.labelRow, { marginBottom: 4 }]}>
                        <Text style={styles.speciesLabel}>Quota (opt.)</Text>
                        <HelpButton text={COMPETITION_HELP.speciesQuota} />
                      </View>
                      <TextInput
                        style={styles.speciesInput}
                        value={compSpecies.quota != null ? String(compSpecies.quota) : ''}
                        onChangeText={(text) =>
                          handleSpeciesChange(index, 'quota', text.replace(/[^0-9]/g, ''))
                        }
                        keyboardType="number-pad"
                        placeholder="Illimité"
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.removeSpeciesButton}
                      onPress={() => handleRemoveSpecies(index)}
                    >
                      <Text style={styles.removeSpeciesButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {formData.quotaBonusEnabled ? (
                    <View style={{ marginTop: 10 }}>
                      <View style={[styles.labelRow, { marginBottom: 4 }]}>
                        <Text style={styles.speciesLabel}>Bonus si quota atteint (pts)</Text>
                        <HelpButton text={COMPETITION_HELP.speciesQuotaBonusPoints} />
                      </View>
                      <TextInput
                        style={styles.speciesInputWide}
                        value={compSpecies.quotaBonusPoints != null ? String(compSpecies.quotaBonusPoints) : ''}
                        onChangeText={(text) =>
                          handleSpeciesChange(index, 'quotaBonusPoints', text.replace(/[^0-9]/g, ''))
                        }
                        keyboardType="number-pad"
                        editable={Boolean(compSpecies.quota != null && String(compSpecies.quota).trim() !== '')}
                        placeholder={
                          compSpecies.quota != null && String(compSpecies.quota).trim() !== ''
                            ? 'Ex: 500'
                            : 'Renseignez d’abord un quota'
                        }
                        placeholderTextColor={theme.textMuted}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Pauses programmées (optionnel) */}
          <View style={styles.section}>
            <Text style={styles.label}>Pauses programmées</Text>
            <TouchableOpacity style={[styles.addSpeciesButton, styles.pauseAddButton]} onPress={openAddPauseModal}>
              <Text style={styles.addSpeciesButtonText}>+ Pause</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Périodes pendant lesquelles la compétition sera en pause automatique (ex. relâché). Optionnel.
            </Text>
            {scheduledPausesDraft.map((p) => (
              <View key={p.key} style={styles.pauseDraftRow}>
                <TouchableOpacity
                  style={styles.pauseDraftMain}
                  onPress={() => openEditPauseModal(p)}
                >
                  <Text style={styles.pauseDraftDates}>
                    {p.startDate.toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    →{' '}
                    {p.endDate.toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {p.reason.trim() ? (
                    <Text style={styles.pauseDraftReason} numberOfLines={2}>
                      {p.reason.trim()}
                    </Text>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeSpeciesButton} onPress={() => removePauseDraft(p.key)}>
                  <Text style={styles.removeSpeciesButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Bouton submit */}
          <TouchableOpacity
            style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <>
                <FaIcon name="plus" size={16} color={theme.onAccent} />
                <Text style={styles.submitButtonText}>Créer la compétition</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        <ScheduledPauseFormModal
          visible={pauseModalVisible}
          competitionStart={formData.startDate}
          competitionEnd={formData.endDate}
          initial={pauseModalInitial}
          title={pauseEditingKey ? 'Modifier la pause' : 'Nouvelle pause'}
          onClose={() => setPauseModalVisible(false)}
          onSave={handlePauseFormSave}
        />

        {/* Modal de sélection d'espèce */}
        <CreateSpeciesModal
          visible={showCreateSpeciesModal}
          onClose={() => setShowCreateSpeciesModal(false)}
          onSpeciesReady={(payload) => {
            setCompetitionSpecies((prev) => [
              ...prev,
              {
                speciesId: payload.speciesId,
                coefficient: payload.competitionCoefficient,
                basePoints:
                  payload.catalogBasePoints != null && payload.catalogBasePoints > 0
                    ? payload.catalogBasePoints
                    : null,
                quota: '',
                quotaBonusPoints: '',
              },
            ]);
          }}
        />

        <Modal
          visible={showSpeciesModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSpeciesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner une espèce</Text>
                <TouchableOpacity
                  onPress={() => setShowSpeciesModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {availableSpecies?.map((s) => {
                  const currentSpecies = selectedSpeciesIndex !== null
                    ? competitionSpecies[selectedSpeciesIndex]
                    : null;
                  const isSelected = currentSpecies?.speciesId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.modalOption,
                        isSelected && styles.modalOptionActive,
                      ]}
                      onPress={() => {
                        if (selectedSpeciesIndex !== null) {
                          handleSpeciesChange(selectedSpeciesIndex, 'speciesId', s.id);
                        }
                        setShowSpeciesModal(false);
                        setSelectedSpeciesIndex(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  identityCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  identityText: { flex: 1 },
  displayName: { fontSize: 20, fontWeight: '700', color: theme.text },
  identityHint: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  section: {
    marginBottom: 12,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  labelRowInSwitch: { flex: 1 },
  helpText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  coverPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#111',
  },
  addZoneButton: {
    borderWidth: 2,
    borderColor: theme.accent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addZoneButtonText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: theme.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: theme.text,
  },
  iosDatePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  iosDatePickerButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  iosDatePickerButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  typeButtonText: {
    fontSize: 16,
    color: theme.textMuted,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: theme.onAccent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesHeaderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  newSpeciesButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  newSpeciesButtonText: { color: theme.onAccent, fontSize: 13, fontWeight: '600' },
  addSpeciesButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addSpeciesButtonText: {
    color: theme.onAccent,
    fontSize: 13,
    fontWeight: '600',
  },
  pauseAddButton: {
    marginTop: 4,
    marginBottom: 8,
  },
  speciesItem: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  speciesSelect: {
    flex: 2,
  },
  speciesSelectButton: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  speciesSelectButtonText: {
    fontSize: 14,
    color: theme.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: theme.textMuted,
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalOptionActive: {
    backgroundColor: '#f0f8ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.text,
  },
  modalOptionTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  speciesCoefficient: {
    flex: 1,
  },
  speciesBonus: {
    flex: 1,
  },
  speciesLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
  },
  speciesInput: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: theme.text,
  },
  speciesInputWide: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: theme.text,
    width: '100%',
  },
  removeSpeciesButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSpeciesButtonText: {
    color: theme.onAccent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  pauseDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  pauseDraftMain: {
    flex: 1,
  },
  pauseDraftDates: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
  },
  pauseDraftReason: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
});
