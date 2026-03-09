import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';

interface Perimeter {
  id: number;
  name?: string;
  coordinates: number[][]; // [[lat, lng], [lat, lng], ...]
}

interface PerimeterMapViewProps {
  perimeters: Perimeter[];
  height?: number;
}

export default function PerimeterMapView({ perimeters, height = 250 }: PerimeterMapViewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!perimeters || perimeters.length === 0) {
    return null;
  }

  const region = useMemo(() => {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    perimeters.forEach((perimeter) => {
      perimeter.coordinates.forEach((coord) => {
        const lat = coord[0];
        const lng = coord[1];
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });

    const padding = 0.002;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, maxLat - minLat + padding),
      longitudeDelta: Math.max(0.01, maxLng - minLng + padding),
    };
  }, [perimeters]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleButtonText}>
          {expanded ? 'Masquer les zones autorisées' : 'Afficher les zones autorisées'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.mapWrapper, { height }]}>
          <MapView style={styles.map} initialRegion={region} mapType="standard">
            {perimeters.map((perimeter, index) => {
              const coords = perimeter.coordinates.map((c) => ({
                latitude: c[0],
                longitude: c[1],
              }));
              if (coords.length < 3) return null;
              return (
                <Polygon
                  key={perimeter.id ?? index}
                  coordinates={coords}
                  fillColor="rgba(0, 122, 255, 0.2)"
                  strokeColor="#007AFF"
                  strokeWidth={2}
                />
              );
            })}
          </MapView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  toggleButton: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  mapWrapper: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  map: {
    flex: 1,
    width: '100%',
  },
});
