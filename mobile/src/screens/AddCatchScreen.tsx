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
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catchesService, CreateCatchData } from '../services/catchesService';
import { speciesService } from '../services/speciesService';
import { teamService } from '../services/teamService';
import { competitionsService } from '../services/competitionsService';
import { authService } from '../services/authService';
import { isDatePast } from '../utils/dateUtils';
import Header from '../components/Header';

export default function AddCatchScreen({ navigation, route }: any) {
  const queryClient = useQueryClient();
  const [selectedSpecies, setSelectedSpecies] = useState<number | null>(null);
  const [size, setSize] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Charger l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.user) {
          const user = response.user;
          setCurrentUser(user);
          setIsAdmin(user.roles?.includes('ROLE_ADMIN') || false);
        }
      } catch (error: any) {
        console.error('Erreur chargement utilisateur:', error);
        // Si erreur 401, l'utilisateur n'est plus authentifié
        // La navigation sera gérée automatiquement par App.tsx
        if (error.response?.status === 401) {
          // Ne rien faire, App.tsx gérera la redirection
        }
      }
    };
    loadUser();
  }, []);

  // Charger les équipes de l'utilisateur
  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams(),
  });

  // Charger les compétitions en cours
  const { data: competitions, isLoading: loadingCompetitions } = useQuery({
    queryKey: ['competitions-ongoing'],
    queryFn: async () => {
      const allCompetitions = await competitionsService.getAll();
      const now = new Date();
      return allCompetitions.filter((comp: any) => {
        const start = new Date(comp.startDate);
        const end = new Date(comp.endDate);
        return now >= start && now <= end;
      });
    },
  });

  // Charger les espèces
  const { data: species, isLoading: loadingSpecies } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
    enabled: true, // S'assurer que la requête est activée
  });

  // Trouver l'équipe inscrite à une compétition en cours et charger les détails complets
  useEffect(() => {
    if (teamsData?.teams && competitions) {
      const registeredTeam = teamsData.teams.find(
        (team: any) =>
          team.competition &&
          competitions.some((comp: any) => comp.id === team.competition.id)
      );

      if (registeredTeam && registeredTeam.competition) {
        setSelectedTeam(registeredTeam);
        const competition = competitions.find(
          (c: any) => c.id === registeredTeam.competition?.id
        );
        if (competition) {
          // Charger les détails complets de la compétition pour avoir les périmètres
          competitionsService.getOne(competition.id).then((fullCompetition: any) => {
            setSelectedCompetition(fullCompetition);
          }).catch(() => {
            // En cas d'erreur, utiliser la compétition de base
            setSelectedCompetition(competition);
          });
          
          // Sélectionner automatiquement le membre connecté par défaut
          if (currentUser && registeredTeam.members) {
            const defaultMember = registeredTeam.members.find(
              (m: any) => m.id === currentUser.id
            );
            if (defaultMember) {
              setSelectedMember(defaultMember.id);
            }
          }
        }
      }
    }
  }, [teamsData, competitions, currentUser]);

  // Demander les permissions pour la caméra et la localisation
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        // Permission caméra
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          Alert.alert(
            'Permission requise',
            'Nous avons besoin de la permission pour utiliser la caméra.'
          );
        }

        // Permission localisation
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        if (locationStatus.status !== 'granted') {
          Alert.alert(
            'Permission de localisation requise',
            'Nous avons besoin de votre position GPS pour valider que la prise est effectuée dans la zone autorisée de la compétition.'
          );
        }
      }
    })();
  }, []);

  // Capturer la position GPS
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);

      // Demander la permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setIsGettingLocation(false);
        setLocationError('Permission de localisation refusée');
        
        // Vérifier si la permission a été refusée définitivement
        if (canAskAgain === false) {
          // Permission refusée définitivement, proposer d'ouvrir les paramètres
          Alert.alert(
            'Permission de localisation requise',
            'La permission de localisation a été refusée. Veuillez l\'activer dans les paramètres de votre téléphone pour pouvoir ajouter des prises.',
            [
              {
                text: 'Annuler',
                style: 'cancel',
              },
              {
                text: 'Ouvrir les paramètres',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ]
          );
        } else {
          // Permission peut encore être demandée
          Alert.alert(
            'Permission requise',
            'Nous avons besoin de votre position GPS pour valider que la prise est effectuée dans la zone autorisée. Veuillez autoriser l\'accès à votre localisation.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Réessayer après un court délai
                  setTimeout(() => {
                    getCurrentLocation();
                  }, 500);
                },
              },
            ]
          );
        }
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLocationError(null);
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la position:', error);
      setLocationError('Impossible de récupérer votre position');
      Alert.alert(
        'Erreur de localisation',
        'Impossible de récupérer votre position GPS. Veuillez réessayer.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Mutation pour créer une prise
  const createCatchMutation = useMutation({
    mutationFn: (data: CreateCatchData) =>
      catchesService.create(selectedCompetition.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catches'] });
      Alert.alert('Succès', 'Prise enregistrée avec succès !', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Erreur lors de l\'enregistrement de la prise'
      );
    },
  });

  // Prendre une photo et capturer la position GPS
  const takePhoto = async () => {
    try {
      // Capturer la position GPS avant de prendre la photo
      await getCurrentLocation();

      const result = await ImagePicker.launchCameraAsync({
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
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Soumettre le formulaire
  const handleSubmit = () => {
    if (!selectedSpecies) {
      Alert.alert('Erreur', 'Veuillez sélectionner une espèce');
      return;
    }

    if (!size || parseFloat(size) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une taille valide');
      return;
    }

    if (!photo) {
      Alert.alert('Erreur', 'Veuillez prendre une photo de la prise');
      return;
    }

    if (!selectedCompetition) {
      Alert.alert('Erreur', 'Vous n\'êtes inscrit à aucune compétition en cours');
      return;
    }

    // Vérifier si la compétition est terminée (sauf pour les admins)
    if (!isAdmin && selectedCompetition.endDate && isDatePast(selectedCompetition.endDate)) {
      Alert.alert(
        'Compétition terminée',
        'La compétition est terminée. Il n\'est plus possible d\'ajouter des prises.\n\nSeuls les administrateurs peuvent ajouter des prises après la fin de la compétition.'
      );
      return;
    }

    // Vérifier si la compétition est en pause (même pour les admins)
    if (selectedCompetition.isPaused) {
      Alert.alert(
        'Compétition en pause',
        'La compétition est actuellement en pause. Il est impossible d\'ajouter des prises pendant la pause.'
      );
      return;
    }

    // Vérifier si la compétition a des périmètres définis
    // Si oui, la position GPS est obligatoire
    const hasPerimeters = selectedCompetition.perimeters && selectedCompetition.perimeters.length > 0;
    
    if (hasPerimeters && !location) {
      Alert.alert(
        'Position GPS requise',
        'Cette compétition nécessite une position GPS pour valider que la prise est effectuée dans la zone autorisée. Veuillez capturer votre position.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Capturer la position',
            onPress: async () => {
              await getCurrentLocation();
              // Après avoir capturé la position, on pourra réessayer
            },
          },
        ]
      );
      return;
    }

    const catchData: CreateCatchData = {
      speciesId: selectedSpecies,
      size: parseFloat(size),
      photoUrl: photo,
      comment: comment || undefined,
      caughtById: selectedMember || undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
    };

    createCatchMutation.mutate(catchData);
  };

  if (loadingTeams || loadingCompetitions || loadingSpecies) {
    return (
      <>
        <Header title="Ajouter une prise" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  if (!selectedCompetition) {
    return (
      <>
        <Header title="Ajouter une prise" showBack={true} showMenu={true} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.errorText}>
            Vous n'êtes inscrit à aucune compétition en cours.
          </Text>
          <Text style={styles.errorSubtext}>
            Veuillez vous inscrire à une compétition avant d'ajouter une prise.
          </Text>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Header title="Ajouter une prise" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Compétition: {selectedCompetition.name}</Text>

      {/* Sélection de l'espèce */}
      <View style={styles.section}>
        <Text style={styles.label}>Espèce *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(Array.isArray(species) ? species : []).map((spec: any) => (
            <TouchableOpacity
              key={spec.id}
              style={[
                styles.speciesButton,
                selectedSpecies === spec.id && styles.speciesButtonSelected,
              ]}
              onPress={() => setSelectedSpecies(spec.id)}
            >
              <Text
                style={[
                  styles.speciesButtonText,
                  selectedSpecies === spec.id && styles.speciesButtonTextSelected,
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

      {/* Sélection du membre (si équipe avec plusieurs membres) */}
      {selectedTeam?.members && selectedTeam.members.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.label}>Membre qui a fait la prise</Text>
          {selectedTeam.members.map((member: any) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberButton,
                selectedMember === member.id && styles.memberButtonSelected,
              ]}
              onPress={() => setSelectedMember(member.id)}
            >
              <Text
                style={[
                  styles.memberButtonText,
                  selectedMember === member.id && styles.memberButtonTextSelected,
                ]}
              >
                {member.firstname} {member.lastname}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Photo */}
      <View style={styles.section}>
        <Text style={styles.label}>Photo *</Text>
        {photo ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={takePhoto}
            >
              <Text style={styles.retakeButtonText}>Reprendre la photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>📷 Prendre une photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Position GPS */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Position GPS
          {selectedCompetition.perimeters && selectedCompetition.perimeters.length > 0 && (
            <Text style={styles.required}> *</Text>
          )}
        </Text>
        {location ? (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              📍 Latitude: {location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              📍 Longitude: {location.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity
              style={styles.updateLocationButton}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Text style={styles.updateLocationButtonText}>
                  🔄 Mettre à jour la position
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {locationError && (
              <Text style={styles.errorText}>{locationError}</Text>
            )}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.locationButtonText}>
                  📍 Capturer la position GPS
                </Text>
              )}
            </TouchableOpacity>
            {selectedCompetition.perimeters && selectedCompetition.perimeters.length > 0 && (
              <Text style={styles.locationHint}>
                ⚠️ La position GPS est requise pour cette compétition afin de valider que la prise est effectuée dans la zone autorisée.
              </Text>
            )}
          </View>
        )}
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
        />
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
          <Text style={styles.submitButtonText}>Enregistrer la prise</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  speciesButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  speciesButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  speciesButtonText: {
    fontSize: 14,
    color: '#333',
  },
  speciesButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  memberButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  memberButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  memberButtonText: {
    fontSize: 16,
    color: '#333',
  },
  memberButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 40,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  required: {
    color: '#ff3b30',
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  updateLocationButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  updateLocationButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationHint: {
    fontSize: 12,
    color: '#ff9500',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
