import React, { useState, useEffect, useRef } from 'react';
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
import { savePhotoToGallery } from '../utils/savePhotoToGallery';
import Header from '../components/Header';
import CreateSpeciesModal from '../components/CreateSpeciesModal';

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
  const [locationStatus, setLocationStatus] = useState<'updated' | 'in-zone' | 'out-of-zone' | null>(null);
  /** Heure de capture de la photo (fait foi pour la date officielle de la prise) */
  const [photoCapturedAt, setPhotoCapturedAt] = useState<Date | null>(null);
  const cameraOpenAttempted = useRef(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [showCreateSpeciesModal, setShowCreateSpeciesModal] = useState(false);

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
        console.error('Détail réponse:', error.response?.data);
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

  const journalMode = bootstrapDone && !selectedCompetition;

  const { data: allSpeciesCatalog = [], isLoading: loadingAllSpecies } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
    enabled: journalMode,
  });

  const species =
    selectedCompetition?.species && Array.isArray(selectedCompetition.species) && selectedCompetition.species.length > 0
      ? selectedCompetition.species
      : allSpeciesCatalog;
  const loadingSpecies = journalMode && loadingAllSpecies;

  // Équipe inscrite à une compétition en cours → contexte compétition ; sinon journal personnel (hors compétition)
  useEffect(() => {
    if (!teamsData?.teams || competitions === undefined) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const registeredTeam = teamsData.teams.find(
        (team: any) =>
          team.competition &&
          competitions.some((comp: any) => comp.id === team.competition.id)
      );

      if (registeredTeam && registeredTeam.competition) {
        const competition = competitions.find((c: any) => c.id === registeredTeam.competition?.id);
        if (competition) {
          setSelectedTeam(registeredTeam);
          try {
            const fullCompetition: any = await competitionsService.getOne(competition.id);
            if (cancelled) {
              return;
            }
            if (fullCompetition && fullCompetition.success !== false) {
              const competitionData =
                fullCompetition.success === true ? { ...fullCompetition, success: undefined } : fullCompetition;
              setSelectedCompetition(competitionData);
            } else {
              setSelectedCompetition(competition);
            }
            if (currentUser && registeredTeam.members) {
              const defaultMember = registeredTeam.members.find((m: any) => m.id === currentUser.id);
              if (defaultMember) {
                setSelectedMember(defaultMember.id);
              }
            }
          } catch (error) {
            console.error('Erreur lors du chargement des détails de la compétition:', error);
            if (!cancelled) {
              setSelectedCompetition(competition);
            }
          }
        } else {
          if (!cancelled) {
            setSelectedCompetition(null);
            setSelectedTeam(null);
          }
        }
      } else {
        if (!cancelled) {
          setSelectedCompetition(null);
          setSelectedTeam(null);
        }
      }

      if (!cancelled) {
        setBootstrapDone(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [teamsData, competitions, currentUser]);

  // Vérifier la zone quand la compétition ou la localisation change
  useEffect(() => {
    if (location && selectedCompetition) {
      // Vérifier si la position est dans la zone autorisée
      if (!selectedCompetition.perimeters || selectedCompetition.perimeters.length === 0) {
        setLocationStatus('updated');
      } else {
        const isInZone = selectedCompetition.perimeters.some((perimeter: any) => {
          return isPointInPolygon(location.latitude, location.longitude, perimeter.coordinates);
        });
        setLocationStatus(isInZone ? 'in-zone' : 'out-of-zone');
      }
    } else {
      setLocationStatus(null);
    }
  }, [selectedCompetition, location]);

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

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(newLocation);
      setLocationError(null);
      
      // Vérifier si la position est dans la zone autorisée
      checkLocationInZone(newLocation);
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

  // Algorithme ray casting pour vérifier si un point est dans un polygone
  const isPointInPolygon = (lat: number, lng: number, polygon: any[]): boolean => {
    if (!polygon || polygon.length < 3) {
      return false;
    }

    let inside = false;
    let j = polygon.length - 1;

    for (let i = 0; i < polygon.length; i++) {
      const pointI = polygon[i];
      const pointJ = polygon[j];

      // Normaliser le format des coordonnées
      const xi = Array.isArray(pointI) ? pointI[0] : pointI?.lat ?? pointI?.[0];
      const yi = Array.isArray(pointI) ? pointI[1] : pointI?.lng ?? pointI?.[1];
      const xj = Array.isArray(pointJ) ? pointJ[0] : pointJ?.lat ?? pointJ?.[0];
      const yj = Array.isArray(pointJ) ? pointJ[1] : pointJ?.lng ?? pointJ?.[1];

      if (xi === null || yi === null || xj === null || yj === null) {
        j = i;
        continue;
      }

      // Algorithme ray casting
      if (((yi > lng) !== (yj > lng)) && (lat < ((xj - xi) * (lng - yi) / (yj - yi) + xi))) {
        inside = !inside;
      }

      j = i;
    }

    return inside;
  };

  // Vérifier si la position est dans la zone autorisée
  const checkLocationInZone = (loc: { latitude: number; longitude: number }) => {
    if (!selectedCompetition || !selectedCompetition.perimeters || selectedCompetition.perimeters.length === 0) {
      // Pas de périmètre défini, on accepte toutes les positions
      setLocationStatus('updated');
      return;
    }

    // Vérifier si le point est dans au moins un périmètre
    const isInZone = selectedCompetition.perimeters.some((perimeter: any) => {
      return isPointInPolygon(loc.latitude, loc.longitude, perimeter.coordinates);
    });

    setLocationStatus(isInZone ? 'in-zone' : 'out-of-zone');
  };

  const reportCatchError = (error: any) => {
    console.error('Erreur lors de la création de la prise:', error);
    let errorMessage = 'Erreur lors de l\'enregistrement de la prise.';
    if (error.response) {
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      if (error.response.status) {
        errorMessage += ` (Code: ${error.response.status})`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    Alert.alert('Erreur', errorMessage);
  };

  const createCatchMutation = useMutation({
    mutationFn: (data: CreateCatchData) => catchesService.create(selectedCompetition.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catches'] });
      queryClient.invalidateQueries({ queryKey: ['competition', selectedCompetition.id] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['competition'] });
      queryClient.invalidateQueries({ queryKey: ['my-history-base'] });
      queryClient.invalidateQueries({ queryKey: ['my-history-catches'] });
      Alert.alert('Succès', 'Prise enregistrée avec succès.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: reportCatchError,
  });

  const createJournalMutation = useMutation({
    mutationFn: (data: CreateCatchData) => catchesService.createJournal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catches'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['my-history-base'] });
      queryClient.invalidateQueries({ queryKey: ['my-history-catches'] });
      queryClient.invalidateQueries({ queryKey: ['me-global-stats'] });
      Alert.alert(
        'Succès',
        'Prise enregistrée dans votre journal (hors compétition). Aucune validation organisateur n’est nécessaire.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: reportCatchError,
  });

  // Prendre une photo et capturer la position GPS (flux caméra d'abord)
  const takePhoto = async () => {
    try {
      // Capturer la position GPS avant de prendre la photo
      await getCurrentLocation();

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
        // Heure de la photo = fait foi pour la date officielle de la prise (pas le clic sur "Enregistrer")
        setPhotoCapturedAt(new Date());

        await savePhotoToGallery(asset.uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Ouvrir la caméra immédiatement à l'arrivée sur l'écran (flux caméra d'abord)
  useEffect(() => {
    const ready = bootstrapDone && (selectedCompetition || journalMode);
    if (ready && !photo && !cameraOpenAttempted.current && !loadingTeams && !loadingCompetitions) {
      cameraOpenAttempted.current = true;
      const timer = setTimeout(() => takePhoto(), 50);
      return () => clearTimeout(timer);
    }
  }, [bootstrapDone, journalMode, selectedCompetition?.id, photo, loadingTeams, loadingCompetitions]);

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

    if (journalMode) {
      const catchData: CreateCatchData = {
        speciesId: selectedSpecies,
        size: parseFloat(size),
        photoUrl: photo,
        comment: comment && comment.trim() ? comment.trim() : undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        caughtAt: photoCapturedAt?.toISOString(),
      };
      createJournalMutation.mutate(catchData);
      return;
    }

    if (!selectedCompetition) {
      Alert.alert('Erreur', 'Contexte compétition indisponible');
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
    // Si oui, la position GPS est obligatoire et doit être dans la zone
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

    if (hasPerimeters && location && locationStatus === 'out-of-zone') {
      Alert.alert(
        'Hors zone autorisée',
        'Votre position actuelle n\'est pas dans une zone autorisée pour cette compétition. Les prises doivent être effectuées dans les périmètres définis. Déplacez-vous dans la zone ou capturez à nouveau votre position.'
      );
      return;
    }

    // Vérifier que l'espèce sélectionnée existe dans les espèces de la compétition
    const selectedSpeciesObj = species.find((spec: any) => spec.id === selectedSpecies);
    if (!selectedSpeciesObj) {
      Alert.alert('Erreur', 'L\'espèce sélectionnée n\'est pas valide pour cette compétition');
      return;
    }

    const catchData: CreateCatchData = {
      speciesId: selectedSpecies,
      size: parseFloat(size),
      photoUrl: photo,
      comment: comment && comment.trim() ? comment.trim() : undefined,
      caughtById: selectedMember || undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      caughtAt: photoCapturedAt?.toISOString(),
    };

    createCatchMutation.mutate(catchData);
  };

  if (!bootstrapDone || loadingTeams || loadingCompetitions || (journalMode && loadingAllSpecies)) {
    return (
      <>
        <Header title="Ajouter une prise" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  if (bootstrapDone && (selectedCompetition || journalMode) && !photo) {
    return (
      <>
        <Header title="Ajouter une prise" showBack={true} showMenu={true} />
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, styles.cameraStepContent]}>
          <Text style={styles.subtitle}>
            {journalMode
              ? 'Journal personnel (hors compétition)'
              : `Compétition : ${selectedCompetition.name}`}
          </Text>
          <Text style={styles.cameraStepHint}>
            {journalMode
              ? 'Prenez la photo de la prise. Elle est enregistrée tout de suite dans votre historique, sans validation organisateur.'
              : "Prenez d'abord la photo de la prise. L'heure de la photo fera foi pour la date officielle."}
          </Text>
          <TouchableOpacity style={styles.cameraStepButton} onPress={takePhoto}>
            <Text style={styles.cameraStepButtonIcon}>📷</Text>
            <Text style={styles.cameraStepButtonText}>Prendre la photo</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Header title="Ajouter une prise" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        {journalMode
          ? 'Journal personnel — prise hors compétition'
          : `Compétition : ${selectedCompetition?.name ?? ''}`}
      </Text>

      {/* Sélection de l'espèce */}
      <View style={styles.section}>
        <Text style={styles.label}>Espèce *</Text>
        {loadingSpecies ? (
          <ActivityIndicator color="#007AFF" />
        ) : species && species.length > 0 ? (
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
        ) : (
          <Text style={styles.errorText}>
            {journalMode ? 'Aucune espèce dans le référentiel — créez-en une ci-dessous.' : 'Aucune espèce configurée pour cette compétition'}
          </Text>
        )}
        {journalMode && (
          <TouchableOpacity style={styles.createSpeciesLink} onPress={() => setShowCreateSpeciesModal(true)}>
            <Text style={styles.createSpeciesLinkText}>+ Créer / retrouver une espèce</Text>
          </TouchableOpacity>
        )}
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
      {!journalMode && selectedTeam?.members && selectedTeam.members.length > 1 && (
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
          {!journalMode && selectedCompetition?.perimeters && selectedCompetition.perimeters.length > 0 && (
            <Text style={styles.required}> *</Text>
          )}
          {journalMode && <Text style={styles.optionalHint}> (optionnel)</Text>}
        </Text>
        {location ? (
          <View style={styles.locationContainer}>
            {/* Message de statut de la géolocalisation */}
            {locationStatus === 'updated' && (
              <View style={styles.locationStatusContainer}>
                <Text style={styles.locationStatusText}>
                  ✓ Géolocalisation actualisée
                </Text>
              </View>
            )}
            {locationStatus === 'in-zone' && (
              <View style={[styles.locationStatusContainer, styles.locationStatusInZone]}>
                <Text style={styles.locationStatusTextInZone}>
                  ✓ Vous êtes dans la zone autorisée
                </Text>
              </View>
            )}
            {locationStatus === 'out-of-zone' && (
              <View style={[styles.locationStatusContainer, styles.locationStatusOutZone]}>
                <Text style={styles.locationStatusTextOutZone}>
                  ✗ Vous êtes en dehors de la zone autorisée
                </Text>
              </View>
            )}
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
            {!journalMode && selectedCompetition?.perimeters && selectedCompetition.perimeters.length > 0 && (
              <Text style={styles.locationHint}>
                ⚠️ La position GPS est requise pour cette compétition afin de valider que la prise est effectuée dans la zone autorisée.
              </Text>
            )}
            {journalMode && (
              <Text style={styles.locationHint}>Utile pour votre carte personnelle dans l’historique.</Text>
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
          (createCatchMutation.isPending || createJournalMutation.isPending) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={createCatchMutation.isPending || createJournalMutation.isPending}
      >
        {createCatchMutation.isPending || createJournalMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enregistrer la prise</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
      <CreateSpeciesModal
        visible={showCreateSpeciesModal}
        onClose={() => setShowCreateSpeciesModal(false)}
        variant="journal"
        onSpeciesReady={(payload) => {
          setSelectedSpecies(payload.speciesId);
          queryClient.invalidateQueries({ queryKey: ['species'] });
        }}
      />
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
  cameraStepContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  cameraStepHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  cameraStepButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  cameraStepButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  cameraStepButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
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
  createSpeciesLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  createSpeciesLinkText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  optionalHint: {
    fontSize: 14,
    color: '#888',
    fontWeight: '400',
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
  locationStatusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
  },
  locationStatusInZone: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  locationStatusOutZone: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  locationStatusText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  locationStatusTextInZone: {
    fontSize: 14,
    color: '#065f46',
    textAlign: 'center',
    fontWeight: '600',
  },
  locationStatusTextOutZone: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
    fontWeight: '600',
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
