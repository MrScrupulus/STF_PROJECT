import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../services/adminService';
import { competitionsService } from '../services/competitionsService';
import { speciesService } from '../services/speciesService';
import { teamService } from '../services/teamService';
import { savePhotoToGallery } from '../utils/savePhotoToGallery';
import Header from '../components/Header';

export default function AdminAddCatchScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<number | null>(null);
  const [size, setSize] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Charger les compétitions (en cours + terminées, pour permettre l'ajout de prise en correction)
  const { data: competitions, isLoading: loadingCompetitions } = useQuery({
    queryKey: ['admin-competitions-all'],
    queryFn: async () => {
      const allCompetitions = await adminService.getCompetitions();
      const now = new Date();
      return allCompetitions
        .map((comp: any) => ({
          ...comp,
          isEnded: new Date(comp.endDate) < now,
        }))
        .sort((a: any, b: any) => {
          // En cours d'abord, puis terminées
          if (a.isEnded !== b.isEnded) return a.isEnded ? 1 : -1;
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        });
    },
  });

  // Charger les détails de la compétition sélectionnée (avec équipes et espèces)
  const { data: competitionData, isLoading: loadingCompetition } = useQuery({
    queryKey: ['competition', selectedCompetition],
    queryFn: () => competitionsService.getOne(selectedCompetition!),
    enabled: !!selectedCompetition,
  });

  // Utiliser les espèces de la compétition si disponibles
  const competitionDataAny: any = competitionData;
  const competition: any = competitionDataAny?.success !== undefined
    ? (competitionDataAny.success ? { ...competitionDataAny, success: undefined } : null)
    : competitionDataAny;
  const species = competition?.species && Array.isArray(competition.species) && competition.species.length > 0
    ? competition.species
    : [];

  // Charger les détails de l'équipe sélectionnée
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', selectedTeam],
    queryFn: () => teamService.getOne(selectedTeam!),
    enabled: !!selectedTeam,
  });

  // Demander les permissions pour la caméra
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          console.log('Permission caméra refusée');
        }
      }
    })();
  }, []);

  // Réinitialiser les sélections quand la compétition change
  useEffect(() => {
    if (selectedCompetition) {
      setSelectedTeam(null);
      setSelectedMember(null);
      setSelectedSpecies(null);
    }
  }, [selectedCompetition]);

  // Réinitialiser le membre quand l'équipe change
  useEffect(() => {
    if (selectedTeam) {
      setSelectedMember(null);
    }
  }, [selectedTeam]);

  // Prendre une photo avec la caméra
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        setPhoto(base64Image);
        await savePhotoToGallery(asset.uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Sélectionner une photo depuis la galerie
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhoto(base64Image);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  };

  // Mutation pour créer une prise
  const createCatchMutation = useMutation({
    mutationFn: (data: {
      competitionId: number;
      teamId: number;
      speciesId: number;
      size: number;
      photoUrl?: string;
      comment?: string;
      caughtById?: number;
    }) => adminService.createCatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-catches'] });
      queryClient.invalidateQueries({ queryKey: ['competition', selectedCompetition] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      // Invalider toutes les requêtes liées aux compétitions pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['competition'] });
      Alert.alert('Succès', 'Prise créée et validée avec succès.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Erreur lors de la création de la prise'
      );
    },
  });

  // Soumettre le formulaire
  const handleSubmit = () => {
    if (!selectedCompetition) {
      Alert.alert('Erreur', 'Veuillez sélectionner une compétition');
      return;
    }

    if (!selectedTeam) {
      Alert.alert('Erreur', 'Veuillez sélectionner une équipe');
      return;
    }

    if (!selectedSpecies) {
      Alert.alert('Erreur', 'Veuillez sélectionner une espèce');
      return;
    }

    // Vérifier que l'espèce sélectionnée existe dans les espèces de la compétition
    const selectedSpeciesObj = species.find((spec: any) => {
      const specId = spec.id || spec.speciesId || spec.species?.id;
      return specId === selectedSpecies;
    });
    if (!selectedSpeciesObj) {
      Alert.alert('Erreur', 'L\'espèce sélectionnée n\'est pas valide pour cette compétition');
      return;
    }

    if (!size || parseFloat(size) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une taille valide');
      return;
    }

    if (!photo) {
      Alert.alert('Erreur', 'Veuillez sélectionner une photo');
      return;
    }

    const catchData = {
      competitionId: selectedCompetition,
      teamId: selectedTeam,
      speciesId: selectedSpecies,
      size: parseFloat(size),
      photoUrl: photo,
      comment: comment || undefined,
      caughtById: selectedMember || undefined,
    };

    createCatchMutation.mutate(catchData);
  };

  if (loadingCompetitions) {
    return (
      <>
        <Header title="Ajouter une prise (Admin)" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  const teams = competition?.teams || [];
  const members = teamData?.team?.members || [];

  return (
    <>
      <Header title="Ajouter une prise (Admin)" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Sélection de la compétition */}
        <View style={styles.section}>
          <Text style={styles.label}>Compétition *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(competitions || []).map((comp: any) => (
              <TouchableOpacity
                key={comp.id}
                style={[
                  styles.optionButton,
                  selectedCompetition === comp.id && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedCompetition(comp.id)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    selectedCompetition === comp.id && styles.optionButtonTextSelected,
                  ]}
                >
                  {comp.name}
                  {comp.isEnded ? ' (terminée)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sélection de l'équipe */}
        {selectedCompetition && (
          <View style={styles.section}>
            <Text style={styles.label}>Équipe *</Text>
            {loadingCompetition ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : teams.length === 0 ? (
              <Text style={styles.errorText}>Aucune équipe inscrite à cette compétition</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {teams.map((team: any) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.optionButton,
                      selectedTeam === team.id && styles.optionButtonSelected,
                    ]}
                    onPress={() => setSelectedTeam(team.id)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        selectedTeam === team.id && styles.optionButtonTextSelected,
                      ]}
                    >
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Sélection du membre */}
        {selectedTeam && (
          <View style={styles.section}>
            <Text style={styles.label}>Membre (optionnel)</Text>
            {loadingTeam ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : members.length === 0 ? (
              <Text style={styles.errorText}>Aucun membre dans cette équipe</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedMember === null && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedMember(null)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedMember === null && styles.optionButtonTextSelected,
                    ]}
                  >
                    Non spécifié
                  </Text>
                </TouchableOpacity>
                {members.map((member: any) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.optionButton,
                      selectedMember === member.id && styles.optionButtonSelected,
                    ]}
                    onPress={() => setSelectedMember(member.id)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        selectedMember === member.id && styles.optionButtonTextSelected,
                      ]}
                    >
                      {member.firstname} {member.lastname}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Sélection de l'espèce */}
        {selectedCompetition && (
          <View style={styles.section}>
            <Text style={styles.label}>Espèce *</Text>
            {loadingCompetition ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : species.length === 0 ? (
              <Text style={styles.errorText}>
                Aucune espèce configurée pour cette compétition
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {species.map((spec: any) => {
                  // Gérer différentes structures : CompetitionSpecies ou Species direct
                  const specId = spec.id || spec.speciesId || spec.species?.id;
                  const specName = spec.name || spec.species?.name;
                  return (
                    <TouchableOpacity
                      key={specId}
                      style={[
                        styles.optionButton,
                        selectedSpecies === specId && styles.optionButtonSelected,
                      ]}
                      onPress={() => setSelectedSpecies(specId)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          selectedSpecies === specId && styles.optionButtonTextSelected,
                        ]}
                      >
                        {specName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Taille */}
        <View style={styles.section}>
          <Text style={styles.label}>Taille (cm) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 25.5"
            value={size}
            onChangeText={setSize}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Commentaire */}
        <View style={styles.section}>
          <Text style={styles.label}>Commentaire (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ajouter un commentaire..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo *</Text>
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity style={[styles.photoButton, styles.photoButtonCamera]} onPress={takePhoto}>
              <Text style={styles.photoButtonText}>📷 Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoButton, styles.photoButtonGallery]} onPress={pickImage}>
              <Text style={styles.photoButtonText}>🖼️ Importer depuis la galerie</Text>
            </TouchableOpacity>
          </View>
          {photo && (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhoto(null)}
              >
                <Text style={styles.removePhotoButtonText}>✕ Supprimer la photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            createCatchMutation.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={createCatchMutation.isPending}
        >
          {createCatchMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Créer la prise</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonCamera: {
    backgroundColor: '#007AFF',
  },
  photoButtonGallery: {
    backgroundColor: '#34C759',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoContainer: {
    marginTop: 12,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removePhotoButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
  },
});
