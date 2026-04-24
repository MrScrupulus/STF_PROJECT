import React, { useState, useEffect, useMemo } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import MapView, { Polygon, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminService } from '../services/adminService';
import { competitionsService } from '../services/competitionsService';
import { perimeterService } from '../services/perimeterService';
import { speciesService } from '../services/speciesService';
import Header from '../components/Header';
import PerimeterMapView from '../components/PerimeterMapView';
import HelpButton from '../components/HelpButton';
import CreateSpeciesModal from '../components/CreateSpeciesModal';
import { COMPETITION_HELP } from '../constants/competitionHelpTexts';

type PerimeterNameEditorProps = {
  competitionId: number;
  perimeterId: number;
  initialName: string | null | undefined;
  onSaved: () => void;
};

function PerimeterNameEditor({ competitionId, perimeterId, initialName, onSaved }: PerimeterNameEditorProps) {
  const [value, setValue] = useState(() => (initialName ?? '').trim());
  useEffect(() => {
    setValue((initialName ?? '').trim());
  }, [perimeterId, initialName]);

  const persist = async () => {
    const trimmed = value.trim();
    const next = trimmed.length > 0 ? trimmed : '';
    const prev = (initialName ?? '').trim();
    if (next === prev) return;
    try {
      await perimeterService.update(competitionId, perimeterId, { name: next || undefined });
      onSaved();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'enregistrer le nom.');
    }
  };

  return (
    <TextInput
      style={styles.perimeterNameInput}
      value={value}
      onChangeText={setValue}
      onEndEditing={persist}
      onSubmitEditing={persist}
      placeholder="Nom de la zone (optionnel)"
      placeholderTextColor="#999"
      returnKeyType="done"
    />
  );
}

interface CompetitionSpeciesRow {
  speciesId: number;
  coefficient: string | number;
  basePoints?: number | null;
  quota?: string | number | null;
}

const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseApiDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
};

export default function EditCompetitionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { id } = (route.params as any) || {};
  const competitionId = typeof id === 'string' ? parseInt(id, 10) : id;

  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    teamSize: '2',
    description: '',
    reglement: '',
    hasNoLimit: false,
    maxParticipants: '',
    isRankingPublic: false,
    newSpeciesBonusEnabled: false,
    newSpeciesBonusPoints: '',
    quotaBonusEnabled: false,
    quotaBonusPoints: '',
    maxFishCounted: '', // vide = tous, sinon nombre saisi
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartDateOnly, setShowStartDateOnly] = useState(false);
  const [showStartTimeOnly, setShowStartTimeOnly] = useState(false);
  const [showEndDateOnly, setShowEndDateOnly] = useState(false);
  const [showEndTimeOnly, setShowEndTimeOnly] = useState(false);
  const [error, setError] = useState('');
  const [reglementImageUrls, setReglementImageUrls] = useState<string[]>([]);
  const [reglementImageUploading, setReglementImageUploading] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zonePoints, setZonePoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [competitionSpecies, setCompetitionSpecies] = useState<CompetitionSpeciesRow[]>([]);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showCreateSpeciesModal, setShowCreateSpeciesModal] = useState(false);
  const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 50.6927,
    longitude: 3.1742,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const { data: competitionData, isLoading } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => competitionsService.getOne(competitionId),
    enabled: !!competitionId,
  });

  const { data: perimetersData, refetch: refetchPerimeters } = useQuery({
    queryKey: ['perimeters', competitionId],
    queryFn: () => perimeterService.getAll(competitionId),
    enabled: !!competitionId,
  });

  const { data: availableSpecies, isLoading: loadingSpecies } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
  });

  /** Référence stable tant que competitionData ne change pas (évite boucle useEffect → setState). */
  const competition = useMemo(() => {
    if (competitionData == null) return null;
    const d = competitionData as any;
    if (d.success !== undefined) {
      return d.success ? { ...d, success: undefined } : null;
    }
    return d;
  }, [competitionData]);

  const perimeters = perimetersData?.perimeters || competition?.perimeters || [];

  useEffect(() => {
    if (competition) {
      setFormData({
        name: competition.name || '',
        startDate: parseApiDate(competition.startDate) || new Date(),
        endDate: parseApiDate(competition.endDate) || new Date(),
        teamSize: String(competition.teamSize ?? 2),
        description: competition.description || '',
        reglement: (competition as any).reglement || '',
        hasNoLimit: (competition as any).hasNoLimit ?? false,
        maxParticipants: (competition as any).hasNoLimit ? '' : String(competition.maxParticipants ?? ''),
        isRankingPublic: (competition as any).isRankingPublic ?? false,
        newSpeciesBonusEnabled: (competition as any).newSpeciesBonusEnabled ?? false,
        newSpeciesBonusPoints: (competition as any).hasOwnProperty('newSpeciesBonusPoints') && (competition as any).newSpeciesBonusPoints != null
          ? String((competition as any).newSpeciesBonusPoints)
          : '',
        quotaBonusEnabled: (competition as any).quotaBonusEnabled ?? false,
        quotaBonusPoints: (competition as any).hasOwnProperty('quotaBonusPoints') && (competition as any).quotaBonusPoints != null
          ? String((competition as any).quotaBonusPoints)
          : '',
        maxFishCounted: (competition as any).hasOwnProperty('maxFishCounted') && (competition as any).maxFishCounted != null
          ? String((competition as any).maxFishCounted)
          : '',
      });
      const urls = (competition as any).reglementImageUrls;
      setReglementImageUrls(Array.isArray(urls) ? urls : ((competition as any).reglementImageUrl ? [(competition as any).reglementImageUrl] : []));
    }
  }, [competition]);

  useEffect(() => {
    if (!competition) return;
    const raw = (competition as any).species;
    if (!Array.isArray(raw) || raw.length === 0) {
      setCompetitionSpecies([]);
      return;
    }
    setCompetitionSpecies(
      raw.map((s: any) => ({
        speciesId: s.id,
        coefficient: String(s.coefficient ?? 1),
        basePoints: s.basePoints ?? null,
        quota: s.quota != null && s.quota !== '' ? String(s.quota) : '',
      }))
    );
  }, [competition]);

  const normalizeNumber = (value: string) => value.replace(',', '.');
  const parseNumber = (value: string): number | null => {
    if (!value || value === '') return null;
    const parsed = parseFloat(normalizeNumber(value));
    return isNaN(parsed) ? null : parsed;
  };

  const handleAddSpecies = () => {
    if (!availableSpecies || availableSpecies.length === 0) return;
    const first = availableSpecies[0];
    setCompetitionSpecies((prev) => [
      ...prev,
      { speciesId: first.id, coefficient: first.coefficient || 1.0, basePoints: null, quota: '' },
    ]);
  };

  const handleRemoveSpecies = (index: number) => {
    setCompetitionSpecies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpeciesChange = (index: number, field: string, value: any) => {
    setCompetitionSpecies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateCompetition(competitionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['admin-competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      Alert.alert('Succès', 'Compétition mise à jour avec succès.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erreur lors de la mise à jour.';
      Alert.alert('Erreur', msg);
    },
  });

  const createPerimeterMutation = useMutation({
    mutationFn: (payload: { coordinates: number[][]; name?: string }) =>
      perimeterService.create(competitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perimeters', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      refetchPerimeters();
      setShowZoneModal(false);
      setZonePoints([]);
      setNewZoneName('');
      Alert.alert('Succès', 'Zone ajoutée.');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'ajouter la zone.');
    },
  });

  const deletePerimeterMutation = useMutation({
    mutationFn: (perimeterId: number) => perimeterService.delete(competitionId, perimeterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perimeters', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      refetchPerimeters();
    },
  });

  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (showStartDateOnly) {
        setShowStartDateOnly(false);
        if (date && event?.type !== 'dismissed') {
          const newDate = new Date(date);
          newDate.setHours(formData.startDate.getHours(), formData.startDate.getMinutes());
          setFormData({ ...formData, startDate: newDate });
          setShowStartTimeOnly(true);
        }
        return;
      }
      if (showStartTimeOnly) {
        setShowStartTimeOnly(false);
        if (date && event?.type !== 'dismissed') {
          const newDate = new Date(formData.startDate);
          newDate.setHours(date.getHours(), date.getMinutes());
          setFormData({ ...formData, startDate: newDate });
        }
        return;
      }
      setShowStartDatePicker(false);
    }
    if (date && event?.type !== 'dismissed') {
      setFormData({ ...formData, startDate: date });
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (showEndDateOnly) {
        setShowEndDateOnly(false);
        if (date && event?.type !== 'dismissed') {
          const newDate = new Date(date);
          newDate.setHours(formData.endDate.getHours(), formData.endDate.getMinutes());
          setFormData({ ...formData, endDate: newDate });
          setShowEndTimeOnly(true);
        }
        return;
      }
      if (showEndTimeOnly) {
        setShowEndTimeOnly(false);
        if (date && event?.type !== 'dismissed') {
          const newDate = new Date(formData.endDate);
          newDate.setHours(date.getHours(), date.getMinutes());
          setFormData({ ...formData, endDate: newDate });
        }
        return;
      }
      setShowEndDatePicker(false);
    }
    if (date && event?.type !== 'dismissed') {
      setFormData({ ...formData, endDate: date });
    }
  };

  const handleSubmit = () => {
    setError('');
    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (formData.startDate >= formData.endDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }
    if (!formData.hasNoLimit && (!formData.maxParticipants || parseInt(formData.maxParticipants) < 1)) {
      setError('Nombre max de participants requis');
      return;
    }

    if (competitionSpecies.length === 0) {
      setError('Au moins une espèce doit être configurée');
      return;
    }

    const newSpeciesBonusPointsVal = formData.newSpeciesBonusEnabled && formData.newSpeciesBonusPoints
      ? parseInt(String(formData.newSpeciesBonusPoints).trim(), 10) : null;
    const quotaBonusPointsVal = formData.quotaBonusEnabled && formData.quotaBonusPoints
      ? parseInt(String(formData.quotaBonusPoints).trim(), 10) : null;

    const speciesPayload: any[] = [];
    for (const cs of competitionSpecies) {
      const coefficient = parseNumber(String(cs.coefficient));
      if (coefficient === null || coefficient < 0) {
        setError('Coefficient invalide pour une espèce');
        return;
      }
      const row: any = { speciesId: cs.speciesId, coefficient };
      const quotaVal = cs.quota != null && String(cs.quota).trim() !== '';
      if (quotaVal) {
        const q = parseInt(String(cs.quota).trim(), 10);
        row.quota = !isNaN(q) && q >= 1 ? q : null;
      } else {
        row.quota = null;
      }
      speciesPayload.push(row);
    }

    const data: any = {
      name: formData.name.trim(),
      startDate: formatDateTime(formData.startDate),
      endDate: formatDateTime(formData.endDate),
      teamSize: parseInt(formData.teamSize),
      description: formData.description.trim() || null,
      reglement: formData.reglement.trim() || null,
      hasNoLimit: formData.hasNoLimit,
      isRankingPublic: formData.isRankingPublic,
      isBonusEnabled: formData.newSpeciesBonusEnabled,
      newSpeciesBonusEnabled: formData.newSpeciesBonusEnabled,
      newSpeciesBonusPoints: newSpeciesBonusPointsVal,
      quotaBonusEnabled: formData.quotaBonusEnabled,
      quotaBonusPoints: quotaBonusPointsVal,
      maxFishCounted: (() => {
        const v = formData.maxFishCounted.trim();
        if (!v || v === '0') return null;
        const n = parseInt(v, 10);
        return isNaN(n) || n < 1 ? null : n;
      })(),
      species: speciesPayload,
    };
    if (!formData.hasNoLimit) {
      data.maxParticipants = parseInt(formData.maxParticipants);
    }
    updateMutation.mutate(data);
  };

  const openZoneModal = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès à la position pour définir une zone.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setMapRegion({
        ...mapRegion,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (_) {}
    setZonePoints([]);
    setNewZoneName('');
    setShowZoneModal(true);
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setZonePoints((prev) => [...prev, { latitude, longitude }]);
  };

  const undoLastVertex = () => {
    setZonePoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  };

  const saveZone = () => {
    if (zonePoints.length < 3) {
      Alert.alert('Erreur', 'Une zone doit avoir au moins 3 points. Appuyez sur la carte pour ajouter des points.');
      return;
    }
    const coordinates = zonePoints.map((p) => [p.latitude, p.longitude]);
    const trimmed = newZoneName.trim();
    createPerimeterMutation.mutate({
      coordinates,
      ...(trimmed ? { name: trimmed } : {}),
    });
  };

  const handleDeletePerimeter = (perimeterId: number) => {
    Alert.alert('Supprimer', 'Supprimer cette zone ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deletePerimeterMutation.mutate(perimeterId) },
    ]);
  };

  if (isLoading || !competition) {
    return (
      <View style={styles.center}>
        <Header title="Modifier" showBack={true} showMenu={false} />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <Header title="Modifier la compétition" showBack={true} showMenu={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="Nom de la compétition"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date de début *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => (Platform.OS === 'android' ? setShowStartDateOnly(true) : setShowStartDatePicker(true))}
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
            {Platform.OS === 'android' && showStartDateOnly && (
              <DateTimePicker value={formData.startDate} mode="date" display="default" onChange={handleStartDateChange} />
            )}
            {Platform.OS === 'android' && showStartTimeOnly && (
              <DateTimePicker value={formData.startDate} mode="time" display="default" onChange={handleStartDateChange} />
            )}
            {Platform.OS === 'ios' && showStartDatePicker && (
              <DateTimePicker
                value={formData.startDate}
                mode="datetime"
                display="spinner"
                onChange={handleStartDateChange}
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Date de fin *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => (Platform.OS === 'android' ? setShowEndDateOnly(true) : setShowEndDatePicker(true))}
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
            {Platform.OS === 'android' && showEndDateOnly && (
              <DateTimePicker value={formData.endDate} mode="date" display="default" onChange={handleEndDateChange} minimumDate={formData.startDate} />
            )}
            {Platform.OS === 'android' && showEndTimeOnly && (
              <DateTimePicker value={formData.endDate} mode="time" display="default" onChange={handleEndDateChange} />
            )}
            {Platform.OS === 'ios' && showEndDatePicker && (
              <DateTimePicker value={formData.endDate} mode="datetime" display="spinner" onChange={handleEndDateChange} minimumDate={formData.startDate} />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Taille des équipes *</Text>
            <TextInput
              style={styles.input}
              value={formData.teamSize}
              onChangeText={(t) => setFormData({ ...formData, teamSize: t })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={[styles.labelRow, styles.labelRowInSwitch]}>
                <Text style={styles.label}>Pas de limite de participants</Text>
                <HelpButton text={COMPETITION_HELP.hasNoLimit} />
              </View>
              <Switch value={formData.hasNoLimit} onValueChange={(v) => setFormData({ ...formData, hasNoLimit: v })} />
            </View>
          </View>

          {!formData.hasNoLimit && (
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nombre max de participants *</Text>
                <HelpButton text={COMPETITION_HELP.maxParticipants} />
              </View>
              <TextInput
                style={styles.input}
                value={formData.maxParticipants}
                onChangeText={(t) => setFormData({ ...formData, maxParticipants: t })}
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* Poissons comptabilisés */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Poissons comptabilisés pour le score</Text>
              <HelpButton text={COMPETITION_HELP.maxFishCounted} />
            </View>
            <Text style={styles.helpText}>Nombre des meilleures prises (par points) comptabilisées. Laisser vide ou 0 = toutes les prises.</Text>
            <TextInput
              style={styles.input}
              value={formData.maxFishCounted}
              onChangeText={(t) => setFormData({ ...formData, maxFishCounted: t.replace(/[^0-9]/g, '') })}
              placeholder="Ex: 5, 10, 20 (vide = toutes)"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Description..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Règlement</Text>
              <HelpButton text={COMPETITION_HELP.reglement} />
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.reglement}
              onChangeText={(t) => setFormData({ ...formData, reglement: t })}
              placeholder="Règlement de la compétition (règles, modalités...)..."
              multiline
              numberOfLines={5}
            />
            <Text style={styles.helpText}>Images du règlement (optionnel) :</Text>
            {reglementImageUrls.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
                {reglementImageUrls.map((url, idx) => (
                  <View key={idx} style={{ width: '47%' }}>
                    <Image source={{ uri: url }} style={{ width: '100%', height: 150, resizeMode: 'contain', borderWidth: 1, borderColor: '#ccc', borderRadius: 4 }} />
                    <TouchableOpacity
                      style={[styles.deleteButton, { marginTop: 4 }]}
                      onPress={async () => {
                        try {
                          const res = await adminService.deleteReglementImage(competitionId, idx);
                          setReglementImageUrls(res.reglementImageUrls || []);
                          queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
                        } catch (err: any) {
                          Alert.alert('Erreur', err.response?.data?.message || 'Erreur suppression image');
                        }
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.addZoneButton}
              onPress={async () => {
                try {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour importer une image.');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    quality: 0.9,
                  });
                  if (!result.canceled && result.assets[0]) {
                    setReglementImageUploading(true);
                    const res = await adminService.uploadReglementImage(
                      competitionId,
                      result.assets[0].uri,
                      result.assets[0].mimeType || 'image/jpeg'
                    );
                    setReglementImageUrls(res.reglementImageUrls || []);
                    queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
                  }
                } catch (err: any) {
                  Alert.alert('Erreur', err.response?.data?.message || 'Erreur lors de l\'upload');
                } finally {
                  setReglementImageUploading(false);
                }
              }}
              disabled={reglementImageUploading}
            >
              <Text style={styles.addZoneButtonText}>
                {reglementImageUploading ? 'Upload en cours...' : '+ Ajouter une image (jpg, png)'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={[styles.labelRow, styles.labelRowInSwitch]}>
                <Text style={styles.label}>Classement public</Text>
                <HelpButton text={COMPETITION_HELP.isRankingPublic} />
              </View>
              <Switch value={formData.isRankingPublic} onValueChange={(v) => setFormData({ ...formData, isRankingPublic: v })} />
            </View>
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
                onValueChange={(v) => setFormData({ ...formData, newSpeciesBonusEnabled: v })}
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
                  onChangeText={(t) => setFormData({ ...formData, newSpeciesBonusPoints: t.replace(/[^0-9]/g, '') })}
                  placeholder="Ex: 50"
                  keyboardType="number-pad"
                />
              </View>
            )}
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
                onValueChange={(v) => setFormData({ ...formData, quotaBonusEnabled: v })}
              />
            </View>
            {formData.quotaBonusEnabled && (
              <View style={[styles.section, { marginTop: 8 }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Valeur du bonus (pts)</Text>
                  <HelpButton text={COMPETITION_HELP.quotaBonusPoints} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.quotaBonusPoints}
                  onChangeText={(t) => setFormData({ ...formData, quotaBonusPoints: t.replace(/[^0-9]/g, '') })}
                  placeholder="Ex: 500"
                  keyboardType="number-pad"
                />
              </View>
            )}
          </View>

          {/* Espèces */}
          <View style={styles.section}>
            <View style={styles.speciesHeader}>
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
            </View>
            <Text style={styles.helpText}>Coefficients et quotas par espèce (identique à la création).</Text>
            {competitionSpecies.map((compSpecies, index) => {
              const species = availableSpecies?.find((s) => s.id === compSpecies.speciesId);
              return (
                <View key={`${compSpecies.speciesId}-${index}`} style={styles.speciesItem}>
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
                          const value = parseNumber(String(compSpecies.coefficient));
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
                        onChangeText={(text) => handleSpeciesChange(index, 'quota', text.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="Illimité"
                      />
                    </View>
                    <TouchableOpacity style={styles.removeSpeciesButton} onPress={() => handleRemoveSpecies(index)}>
                      <Text style={styles.removeSpeciesButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Zones autorisées */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zones autorisées</Text>
            <Text style={styles.helpText}>
              Les prises doivent être effectuées dans ces zones. Sans zone définie, toutes les positions sont autorisées.
            </Text>
            {perimeters.length > 0 && (
              <View style={styles.perimeterList}>
                <PerimeterMapView perimeters={perimeters} height={200} />
                {perimeters.map((p: any) => (
                  <View key={p.id} style={styles.perimeterRow}>
                    <View style={styles.perimeterRowMain}>
                      <PerimeterNameEditor
                        competitionId={competitionId}
                        perimeterId={p.id}
                        initialName={p.name}
                        onSaved={() => {
                          refetchPerimeters();
                          queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePerimeter(p.id)}
                      disabled={deletePerimeterMutation.isPending}
                    >
                      <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.addZoneButton} onPress={openZoneModal}>
              <Text style={styles.addZoneButtonText}>+ Ajouter une zone</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, updateMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Enregistrer</Text>}
          </TouchableOpacity>
        </ScrollView>

        <CreateSpeciesModal
          visible={showCreateSpeciesModal}
          onClose={() => setShowCreateSpeciesModal(false)}
          onSpeciesReady={(payload) => {
            setCompetitionSpecies((prev) => [
              ...prev,
              {
                speciesId: payload.speciesId,
                coefficient: payload.competitionCoefficient,
                basePoints: null,
                quota: '',
              },
            ]);
          }}
        />

        <Modal
          visible={showSpeciesModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSpeciesModal(false)}
        >
          <View style={styles.speciesModalOverlay}>
            <View style={styles.speciesModalContent}>
              <View style={styles.speciesModalHeader}>
                <Text style={styles.speciesModalTitle}>Sélectionner une espèce</Text>
                <TouchableOpacity
                  onPress={() => setShowSpeciesModal(false)}
                  style={styles.speciesModalCloseButton}
                >
                  <Text style={styles.speciesModalCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.speciesModalList}>
                {availableSpecies?.map((s) => {
                  const current =
                    selectedSpeciesIndex !== null ? competitionSpecies[selectedSpeciesIndex] : null;
                  const isSelected = current?.speciesId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.speciesModalOption, isSelected && styles.speciesModalOptionActive]}
                      onPress={() => {
                        if (selectedSpeciesIndex !== null) {
                          handleSpeciesChange(selectedSpeciesIndex, 'speciesId', s.id);
                        }
                        setShowSpeciesModal(false);
                        setSelectedSpeciesIndex(null);
                      }}
                    >
                      <Text
                        style={[styles.speciesModalOptionText, isSelected && styles.speciesModalOptionTextActive]}
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

        {/* Modal dessin zone */}
        <Modal visible={showZoneModal} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dessiner une zone</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowZoneModal(false);
                  setZonePoints([]);
                  setNewZoneName('');
                }}
              >
                <Text style={styles.modalCloseText}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHelp}>
              Les zones déjà enregistrées sont en bleu (bien visibles). La zone en cours se superpose en bleu plus clair,
              avec les pastilles numérotées. Appuyez sur la carte pour placer les sommets (au moins 3 points).
            </Text>
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Nom de la zone (optionnel)</Text>
              <TextInput
                style={styles.modalNameInput}
                value={newZoneName}
                onChangeText={setNewZoneName}
                placeholder="Ex. : Quai nord, Zone A…"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={mapRegion}
                onPress={handleMapPress}
              >
                {perimeters
                  .filter((p: any) => Array.isArray(p.coordinates) && p.coordinates.length >= 3)
                  .map((p: any) => (
                    <Polygon
                      key={`existing-zone-${p.id}`}
                      coordinates={p.coordinates.map((c: number[]) => ({
                        latitude: c[0],
                        longitude: c[1],
                      }))}
                      fillColor="rgba(0, 86, 214, 0.42)"
                      strokeColor="#004AAD"
                      strokeWidth={3}
                    />
                  ))}
                {zonePoints.map((p, index) => (
                  <Marker
                    key={`zone-pt-${index}-${p.latitude.toFixed(6)}-${p.longitude.toFixed(6)}`}
                    coordinate={p}
                    anchor={{ x: 0.5, y: 0.5 }}
                    tracksViewChanges={zonePoints.length <= 20}
                  >
                    <View style={styles.zoneVertexMarker} pointerEvents="none">
                      <Text style={styles.zoneVertexMarkerText}>{index + 1}</Text>
                    </View>
                  </Marker>
                ))}
                {zonePoints.length === 2 && (
                  <Polyline
                    coordinates={zonePoints}
                    strokeColor="#00B4FF"
                    strokeWidth={3}
                  />
                )}
                {zonePoints.length >= 3 && (
                  <Polygon
                    coordinates={[...zonePoints, zonePoints[0]]}
                    fillColor="rgba(0, 180, 255, 0.35)"
                    strokeColor="#007AFF"
                    strokeWidth={2}
                  />
                )}
              </MapView>
            </View>
            <Text style={styles.pointsCount}>{zonePoints.length} point(s) — minimum 3</Text>
            <TouchableOpacity
              style={[styles.undoVertexButton, zonePoints.length === 0 && styles.undoVertexButtonDisabled]}
              onPress={undoLastVertex}
              disabled={zonePoints.length === 0}
            >
              <Text style={styles.undoVertexButtonText}>↩ Annuler le dernier point</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelZoneButton}
                onPress={() => {
                  setShowZoneModal(false);
                  setZonePoints([]);
                  setNewZoneName('');
                }}
              >
                <Text style={styles.cancelZoneButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveZoneButton, zonePoints.length < 3 && styles.saveZoneButtonDisabled]}
                onPress={saveZone}
                disabled={zonePoints.length < 3 || createPerimeterMutation.isPending}
              >
                {createPerimeterMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveZoneButtonText}>Enregistrer la zone</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorBox: { backgroundColor: '#fee', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#c00', fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
  labelRowInSwitch: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  dateText: { fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helpText: { fontSize: 12, color: '#666', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  perimeterList: { marginBottom: 12 },
  perimeterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  perimeterRowMain: { flex: 1, minWidth: 0 },
  perimeterNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  deleteButton: { padding: 8 },
  deleteButtonText: { color: '#c00', fontSize: 14 },
  addZoneButton: { borderWidth: 2, borderColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center' },
  addZoneButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  submitButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, padding: 16, paddingTop: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalCloseText: { color: '#007AFF', fontSize: 16 },
  modalHelp: { fontSize: 14, color: '#666', marginBottom: 12 },
  modalField: { marginBottom: 12 },
  modalFieldLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  modalNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  mapContainer: { height: 400, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  map: { flex: 1, width: '100%', height: '100%' },
  zoneVertexMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  zoneVertexMarkerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  pointsCount: { fontSize: 14, color: '#666', marginBottom: 8 },
  undoVertexButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f0f7ff',
  },
  undoVertexButtonDisabled: { opacity: 0.45, borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  undoVertexButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelZoneButton: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#eee', borderRadius: 8 },
  cancelZoneButtonText: { fontSize: 16 },
  saveZoneButton: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#007AFF', borderRadius: 8 },
  saveZoneButtonDisabled: { opacity: 0.5 },
  saveZoneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesHeaderButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newSpeciesButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newSpeciesButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  addSpeciesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addSpeciesButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  speciesItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  speciesRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  speciesSelect: { flex: 2 },
  speciesSelectButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  speciesSelectButtonText: { fontSize: 14, color: '#333' },
  speciesCoefficient: { flex: 1 },
  speciesLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  speciesInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#333',
  },
  removeSpeciesButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSpeciesButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  speciesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  speciesModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  speciesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  speciesModalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  speciesModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speciesModalCloseButtonText: { fontSize: 18, color: '#666', fontWeight: 'bold' },
  speciesModalList: { maxHeight: 400 },
  speciesModalOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  speciesModalOptionActive: { backgroundColor: '#f0f8ff' },
  speciesModalOptionText: { fontSize: 16, color: '#333' },
  speciesModalOptionTextActive: { color: '#007AFF', fontWeight: '600' },
});
