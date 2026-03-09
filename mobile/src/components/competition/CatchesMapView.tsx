import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getSpeciesColor, getPinColorForAndroid } from '../../utils/speciesColors';

const PIN_SIZE = 14;

interface CatchItem {
  id?: number;
  latitude?: number;
  longitude?: number;
  size?: number;
  species?: { id: number; name: string };
  team?: { name: string };
  caughtBy?: { firstname: string; lastname: string };
}

interface CatchesMapViewProps {
  catches: CatchItem[];
  speciesStats?: Array<{ id: number }>;
  height?: number;
}

export default function CatchesMapView({
  catches = [],
  speciesStats = [],
  height = 300,
}: CatchesMapViewProps) {
  const withCoords = useMemo(
    () => catches.filter((c) => c.latitude != null && c.longitude != null),
    [catches]
  );

  const region = useMemo(() => {
    if (withCoords.length === 0) {
      return { latitude: 50.6901, longitude: 3.1664, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    const toNum = (v: string | number | undefined): number =>
      typeof v === 'string' ? parseFloat(v) : Number(v ?? 0);
    const lats = withCoords.map((c) => toNum(c.latitude)).filter((n) => !isNaN(n));
    const lngs = withCoords.map((c) => toNum(c.longitude)).filter((n) => !isNaN(n));
    if (lats.length === 0 || lngs.length === 0) {
      return { latitude: 50.6901, longitude: 3.1664, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padding = 0.002;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.01, maxLat - minLat + padding),
      longitudeDelta: Math.max(0.01, maxLng - minLng + padding),
    };
  }, [withCoords]);

  if (withCoords.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>Aucune prise avec localisation</Text>
      </View>
    );
  }

  const mapHeight = height - 40;

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>
        🗺️ Carte des prises ({withCoords.length} localisation{withCoords.length > 1 ? 's' : ''})
      </Text>
      <MapView
        style={[styles.map, { height: mapHeight }]}
        initialRegion={region}
        mapType="standard"
      >
        {withCoords.map((c, idx) => {
          const color = getSpeciesColor(c.species?.id, speciesStats);
          const pinColor = getPinColorForAndroid(c.species?.id, speciesStats);
          const lat = typeof c.latitude === 'string' ? parseFloat(c.latitude) : Number(c.latitude);
          const lng = typeof c.longitude === 'string' ? parseFloat(c.longitude) : Number(c.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <Marker
              key={Platform.OS === 'android' ? `${c.id ?? idx}-${pinColor}` : c.id ?? idx}
              coordinate={{ latitude: lat, longitude: lng }}
              {...(Platform.OS === 'ios'
                ? {
                    anchor: { x: 0.5, y: 0.5 },
                    tracksViewChanges: false,
                  }
                : { pinColor })}
              title={`${c.species?.name ?? 'Prise'} - ${c.size ?? '?'} cm`}
              description={
                c.team?.name
                  ? `${c.team.name}${c.caughtBy ? ` (${c.caughtBy.firstname} ${c.caughtBy.lastname})` : ''}`
                  : undefined
              }
            >
              {Platform.OS === 'ios' ? (
                <View
                  collapsable={false}
                  style={[
                    styles.pin,
                    {
                      width: PIN_SIZE,
                      height: PIN_SIZE,
                      borderRadius: PIN_SIZE / 2,
                      backgroundColor: color,
                    },
                  ]}
                />
              ) : null}
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    borderRadius: 8,
  },
  pin: {
    borderWidth: 1.5,
    borderColor: 'white',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
