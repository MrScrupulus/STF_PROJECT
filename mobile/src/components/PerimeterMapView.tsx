import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';

interface Perimeter {
  id: number;
  name?: string;
  coordinates: number[][]; // [[lat, lng], [lat, lng], ...]
}

interface PerimeterMapViewProps {
  perimeters: Perimeter[];
  height?: number;
}

export default function PerimeterMapView({ perimeters }: PerimeterMapViewProps) {
  if (!perimeters || perimeters.length === 0) {
    return null;
  }

  // Calculer le centre pour créer un lien vers Google Maps
  const calculateCenter = () => {
    if (perimeters.length === 0) {
      return { lat: 50.6901, lng: 3.1664 }; // Roubaix par défaut
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    perimeters.forEach((perimeter) => {
      perimeter.coordinates.forEach((coord) => {
        const [lat, lng] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });

    return {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
    };
  };

  const center = calculateCenter();

  // Créer un lien Google Maps avec les polygones
  const openInMaps = () => {
    // Pour chaque périmètre, créer un polygone dans l'URL Google Maps
    const polygons = perimeters.map((perimeter) => {
      const coords = perimeter.coordinates
        .map((coord) => `${coord[0]},${coord[1]}`)
        .join('|');
      return coords;
    });

    // Utiliser Google Maps avec le centre et les polygones
    const url = `https://www.google.com/maps/@${center.lat},${center.lng},15z`;
    Linking.openURL(url).catch((err) => {
      console.error('Erreur lors de l\'ouverture de Google Maps:', err);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Zones autorisées</Text>
      <Text style={styles.subtitle}>
        {perimeters.length} périmètre{perimeters.length > 1 ? 's' : ''} défini{perimeters.length > 1 ? 's' : ''}
      </Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Les prises doivent être effectuées dans les périmètres définis pour cette compétition.
        </Text>
        <Text style={styles.infoText}>
          Centre approximatif: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
        </Text>
      </View>

      {perimeters.map((perimeter, index) => (
        <View key={perimeter.id || index} style={styles.perimeterInfo}>
          <View style={styles.perimeterColor} />
          <View style={styles.perimeterDetails}>
            <Text style={styles.perimeterName}>
              {perimeter.name || `Périmètre ${index + 1}`}
            </Text>
            <Text style={styles.perimeterCoords}>
              {perimeter.coordinates.length} points
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.mapButtonContainer}>
        <Text style={styles.mapButtonText} onPress={openInMaps}>
          🗺️ Ouvrir dans Google Maps
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  perimeterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  perimeterColor: {
    width: 16,
    height: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginRight: 12,
  },
  perimeterDetails: {
    flex: 1,
  },
  perimeterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  perimeterCoords: {
    fontSize: 12,
    color: '#666',
  },
  mapButtonContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
