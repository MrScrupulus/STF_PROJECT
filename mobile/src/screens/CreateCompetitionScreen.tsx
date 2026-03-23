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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminService } from '../services/adminService';
import { speciesService } from '../services/speciesService';
import Header from '../components/Header';

interface CompetitionSpecies {
  speciesId: number;
  coefficient: string | number;
  basePoints?: number | null;
}

export default function CreateCompetitionScreen() {
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
  const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number | null>(null);

  const { data: availableSpecies, isLoading: loadingSpecies } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createCompetition(data),
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
        basePoints: formData.isBonusEnabled ? 50 : null,
      },
    ]);
  };

  const handleRemoveSpecies = (index: number) => {
    setCompetitionSpecies(competitionSpecies.filter((_, i) => i !== index));
  };

  const handleSpeciesChange = (index: number, field: string, value: any) => {
    const updated = [...competitionSpecies];
    updated[index] = { ...updated[index], [field]: value };
    
    // Si on change l'espèce et que le bonus est activé, mettre à jour basePoints si nécessaire
    if (field === 'speciesId' && formData.isBonusEnabled && !updated[index].basePoints) {
      updated[index].basePoints = 50;
    }
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
      isBonusEnabled: formData.isBonusEnabled,
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

      if (formData.isBonusEnabled && cs.basePoints) {
        speciesData.basePoints = cs.basePoints;
      }

      return speciesData;
    });

    competitionData.species = speciesConfig;

    createMutation.mutate(competitionData);
  };

  return (
    <>
      <Header title="Créer une compétition" showBack={true} showMenu={false} />
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
            <Text style={styles.label}>Poissons comptabilisés pour le score</Text>
            <Text style={styles.hint}>Nombre des meilleures prises (par points) comptabilisées. Laisser vide ou 0 = toutes les prises.</Text>
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
            <Text style={styles.label}>Type</Text>
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
              <Text style={styles.label}>Pas de limite de participants</Text>
              <Switch
                value={formData.hasNoLimit}
                onValueChange={(value) => setFormData({ ...formData, hasNoLimit: value })}
              />
            </View>
          </View>

          {/* Max participants */}
          {!formData.hasNoLimit && (
            <View style={styles.section}>
              <Text style={styles.label}>Nombre maximum de participants *</Text>
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
            <Text style={styles.label}>Règlement</Text>
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
              <Text style={styles.label}>Rendre le classement public</Text>
              <Switch
                value={formData.isRankingPublic}
                onValueChange={(value) => setFormData({ ...formData, isRankingPublic: value })}
              />
            </View>
            <Text style={styles.helpText}>
              Si activé, le classement sera visible par tous les utilisateurs une fois la compétition terminée.
            </Text>
          </View>

          {/* Bonus activé */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Activer la règle du bonus</Text>
              <Switch
                value={formData.isBonusEnabled}
                onValueChange={(value) => {
                  setFormData({ ...formData, isBonusEnabled: value });
                  // Mettre à jour basePoints des espèces
                  if (value) {
                    setCompetitionSpecies(
                      competitionSpecies.map((cs) => ({
                        ...cs,
                        basePoints: cs.basePoints || 50,
                      }))
                    );
                  } else {
                    setCompetitionSpecies(
                      competitionSpecies.map((cs) => ({
                        ...cs,
                        basePoints: null,
                      }))
                    );
                  }
                }}
              />
            </View>
            <Text style={styles.helpText}>
              Si activé, les équipes gagneront des points bonus selon le nombre d'espèces différentes pêchées.
            </Text>
          </View>

          {/* Espèces */}
          <View style={styles.section}>
            <View style={styles.speciesHeader}>
              <Text style={styles.label}>Espèces de la compétition *</Text>
              <TouchableOpacity
                style={styles.addSpeciesButton}
                onPress={handleAddSpecies}
                disabled={loadingSpecies || !availableSpecies || availableSpecies.length === 0}
              >
                <Text style={styles.addSpeciesButtonText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              Définissez les espèces disponibles avec leurs coefficients.
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
                      <Text style={styles.speciesLabel}>Coefficient</Text>
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

                    {formData.isBonusEnabled && (
                      <View style={styles.speciesBonus}>
                        <Text style={styles.speciesLabel}>Points bonus</Text>
                        <TextInput
                          style={styles.speciesInput}
                          value={compSpecies.basePoints ? String(compSpecies.basePoints) : ''}
                          onChangeText={(text) => {
                            const value = parseInt(text);
                            handleSpeciesChange(index, 'basePoints', isNaN(value) ? null : value);
                          }}
                          keyboardType="number-pad"
                          placeholder="50"
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.removeSpeciesButton}
                      onPress={() => handleRemoveSpecies(index)}
                    >
                      <Text style={styles.removeSpeciesButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bouton submit */}
          <TouchableOpacity
            style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Créer la compétition</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de sélection d'espèce */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
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
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  iosDatePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  iosDatePickerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  iosDatePickerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
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
  addSpeciesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addSpeciesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  speciesItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  speciesSelectButtonText: {
    fontSize: 14,
    color: '#333',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 400,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionActive: {
    backgroundColor: '#f0f8ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextActive: {
    color: '#007AFF',
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
    color: '#666',
    marginBottom: 4,
  },
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
  removeSpeciesButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
