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

  // Charger les compétitions
  const { data: competitions, isLoading: loadingCompetitions } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: () => adminService.getCompetitions(),
  });

  // Charger les équipes de la compétition sélectionnée
  const { data: competitionData, isLoading: loadingCompetition } = useQuery({
    queryKey: ['competition', selectedCompetition],
    queryFn: () => competitionsService.getOne(selectedCompetition!),
    enabled: !!selectedCompetition,
  });

  // Charger les espèces
  const { data: species, isLoading: loadingSpecies } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
  });

  // Charger les détails de l'équipe sélectionnée
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', selectedTeam],
    queryFn: () => teamService.getOne(selectedTeam!),
    enabled: !!selectedTeam,
  });

  // Réinitialiser les sélections quand la compétition change
  useEffect(() => {
    if (selectedCompetition) {
      setSelectedTeam(null);
      setSelectedMember(null);
    }
  }, [selectedCompetition]);

  // Réinitialiser le membre quand l'équipe change
  useEffect(() => {
    if (selectedTeam) {
      setSelectedMember(null);
    }
  }, [selectedTeam]);

  // Sélectionner une photo depuis la galerie
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
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
      Alert.alert('Succès', 'Prise créée et validée avec succès !', [
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

  if (loadingCompetitions || loadingSpecies) {
    return (
      <>
        <Header title="Ajouter une prise (Admin)" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  const teams = competitionData?.teams || [];
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
        <View style={styles.section}>
          <Text style={styles.label}>Espèce *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(species || []).map((spec: any) => (
              <TouchableOpacity
                key={spec.id}
                style={[
                  styles.optionButton,
                  selectedSpecies === spec.id && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedSpecies(spec.id)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    selectedSpecies === spec.id && styles.optionButtonTextSelected,
                  ]}
                >
                  {spec.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={styles.photoButtonText}>
              {photo ? '📷 Photo sélectionnée' : '📷 Sélectionner une photo'}
            </Text>
          </TouchableOpacity>
          {photo && (
            <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" />
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
  photoButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
