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
} from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminService } from '../services/adminService';
import { competitionsService } from '../services/competitionsService';
import { perimeterService } from '../services/perimeterService';
import Header from '../components/Header';
import PerimeterMapView from '../components/PerimeterMapView';

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
    maxFishCounted: '', // vide = tous, sinon nombre saisi
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartDateOnly, setShowStartDateOnly] = useState(false);
  const [showStartTimeOnly, setShowStartTimeOnly] = useState(false);
  const [showEndDateOnly, setShowEndDateOnly] = useState(false);
  const [showEndTimeOnly, setShowEndTimeOnly] = useState(false);
  const [error, setError] = useState('');
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zonePoints, setZonePoints] = useState<{ latitude: number; longitude: number }[]>([]);
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

  const competition = (competitionData as any)?.success !== undefined
    ? ((competitionData as any).success ? { ...(competitionData as any), success: undefined } : null)
    : competitionData;

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
        maxFishCounted: (competition as any).hasOwnProperty('maxFishCounted') && (competition as any).maxFishCounted != null
          ? String((competition as any).maxFishCounted)
          : '',
      });
    }
  }, [competition]);

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
    mutationFn: (coordinates: number[][]) => perimeterService.create(competitionId, { coordinates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perimeters', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      refetchPerimeters();
      setShowZoneModal(false);
      setZonePoints([]);
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

    const data: any = {
      name: formData.name.trim(),
      startDate: formatDateTime(formData.startDate),
      endDate: formatDateTime(formData.endDate),
      teamSize: parseInt(formData.teamSize),
      description: formData.description.trim() || null,
      reglement: formData.reglement.trim() || null,
      hasNoLimit: formData.hasNoLimit,
      isRankingPublic: formData.isRankingPublic,
      maxFishCounted: (() => {
        const v = formData.maxFishCounted.trim();
        if (!v || v === '0') return null;
        const n = parseInt(v, 10);
        return isNaN(n) || n < 1 ? null : n;
      })(),
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
    setShowZoneModal(true);
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setZonePoints([...zonePoints, { latitude, longitude }]);
  };

  const saveZone = () => {
    if (zonePoints.length < 3) {
      Alert.alert('Erreur', 'Une zone doit avoir au moins 3 points. Appuyez sur la carte pour ajouter des points.');
      return;
    }
    const coordinates = zonePoints.map((p) => [p.latitude, p.longitude]);
    createPerimeterMutation.mutate(coordinates);
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
              <Text style={styles.label}>Pas de limite de participants</Text>
              <Switch value={formData.hasNoLimit} onValueChange={(v) => setFormData({ ...formData, hasNoLimit: v })} />
            </View>
          </View>

          {!formData.hasNoLimit && (
            <View style={styles.section}>
              <Text style={styles.label}>Nombre max de participants *</Text>
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
            <Text style={styles.label}>Poissons comptabilisés pour le score</Text>
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
            <Text style={styles.label}>Règlement</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.reglement}
              onChangeText={(t) => setFormData({ ...formData, reglement: t })}
              placeholder="Règlement de la compétition (règles, modalités...)..."
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Classement public</Text>
              <Switch value={formData.isRankingPublic} onValueChange={(v) => setFormData({ ...formData, isRankingPublic: v })} />
            </View>
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
                    <Text style={styles.perimeterName}>Zone {p.id}</Text>
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

        {/* Modal dessin zone */}
        <Modal visible={showZoneModal} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dessiner une zone</Text>
              <TouchableOpacity onPress={() => { setShowZoneModal(false); setZonePoints([]); }}>
                <Text style={styles.modalCloseText}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHelp}>Appuyez sur la carte pour ajouter les sommets du polygone (au moins 3 points).</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={handleMapPress}
              >
                {zonePoints.length >= 3 && (
                  <Polygon
                    coordinates={[...zonePoints, zonePoints[0]]}
                    fillColor="rgba(0, 122, 255, 0.3)"
                    strokeColor="#007AFF"
                    strokeWidth={2}
                  />
                )}
              </MapView>
            </View>
            <Text style={styles.pointsCount}>{zonePoints.length} point(s) — minimum 3</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelZoneButton} onPress={() => { setShowZoneModal(false); setZonePoints([]); }}>
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
  perimeterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  perimeterName: { fontSize: 14 },
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
  mapContainer: { height: 400, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  map: { flex: 1, width: '100%', height: '100%' },
  pointsCount: { fontSize: 14, color: '#666', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelZoneButton: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#eee', borderRadius: 8 },
  cancelZoneButtonText: { fontSize: 16 },
  saveZoneButton: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#007AFF', borderRadius: 8 },
  saveZoneButtonDisabled: { opacity: 0.5 },
  saveZoneButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
