"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/components/competition/CatchesMap.module.scss';

// Charger les composants Leaflet dynamiquement pour éviter les problèmes SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

// Composant pour centrer la carte (doit être dans MapContainer)
function MapCenterComponent({ center, zoom }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  const prevCenterRef = useRef(null);
  
  useEffect(() => {
    if (!center || !center[0] || !center[1]) return;
    
    // Éviter les mises à jour inutiles
    const centerKey = `${center[0]}-${center[1]}-${zoom}`;
    if (prevCenterRef.current === centerKey) return;
    prevCenterRef.current = centerKey;
    
    // Utiliser setView avec une petite transition
    map.setView(center, zoom, { animate: true, duration: 0.3 });
  }, [map, center, zoom]);
  
  return null;
}

const MapCenter = dynamic(
  () => Promise.resolve(MapCenterComponent),
  { ssr: false }
);

export default function CatchesMap({ catches, perimeters = [] }) {
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState([50.6901, 3.1664]); // Roubaix par défaut
  const [mapZoom, setMapZoom] = useState(13);
  const previousCatchesRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filtrer les prises qui ont des coordonnées GPS (mémorisé pour éviter les recalculs)
  const catchesWithLocation = useMemo(() => {
    return (catches || []).filter(
      (catchItem) => catchItem.latitude && catchItem.longitude
    );
  }, [catches]);

  // Calculer le centre de la carte basé sur les prises (seulement si les données changent)
  useEffect(() => {
    if (catchesWithLocation.length === 0) return;
    
    // Vérifier si les données ont vraiment changé
    const catchesIds = catchesWithLocation.map(c => c.id).sort().join(',');
    if (previousCatchesRef.current === catchesIds) return;
    previousCatchesRef.current = catchesIds;

    const latitudes = catchesWithLocation.map((c) => parseFloat(c.latitude));
    const longitudes = catchesWithLocation.map((c) => parseFloat(c.longitude));
    
    const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
    
    const newCenter = [avgLat, avgLng];
    
    // Ajuster le zoom selon la dispersion des points
    const latRange = Math.max(...latitudes) - Math.min(...latitudes);
    const lngRange = Math.max(...longitudes) - Math.min(...longitudes);
    const maxRange = Math.max(latRange, lngRange);
    
    let newZoom = 13;
    if (maxRange < 0.01) {
      newZoom = 15;
    } else if (maxRange < 0.05) {
      newZoom = 13;
    } else {
      newZoom = 11;
    }
    
    // Ne mettre à jour que si les valeurs ont changé
    setMapCenter((prev) => {
      if (Math.abs(prev[0] - newCenter[0]) > 0.0001 || Math.abs(prev[1] - newCenter[1]) > 0.0001) {
        return newCenter;
      }
      return prev;
    });
    
    setMapZoom((prev) => {
      if (prev !== newZoom) {
        return newZoom;
      }
      return prev;
    });
  }, [catchesWithLocation]);

  // Forcer le re-render de la carte une fois qu'elle est montée
  const [mapKey, setMapKey] = useState(0);
  useEffect(() => {
    if (isClient && catchesWithLocation.length > 0) {
      // Petit délai pour s'assurer que le conteneur est rendu
      const timer = setTimeout(() => {
        setMapKey(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isClient, catchesWithLocation.length]);

  if (!isClient) {
    return (
      <div className={styles.map_loading}>
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  if (catchesWithLocation.length === 0) {
    return (
      <div className={styles.no_catches_message}>
        <p>📍 Aucune prise avec coordonnées GPS disponible pour cette compétition</p>
      </div>
    );
  }

  return (
    <div className={styles.catches_map}>
      <h3 className={styles.map_title}>
        📍 Localisation des prises ({catchesWithLocation.length})
      </h3>
      <div className={styles.map_container}>
        <MapContainer
          key={`map-${mapKey}`}
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '600px', width: '100%', minHeight: '600px' }}
          className={styles.map}
          whenCreated={(mapInstance) => {
            // S'assurer que la carte est correctement initialisée
            setTimeout(() => {
              mapInstance.invalidateSize();
            }, 100);
          }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter center={mapCenter} zoom={mapZoom} />
          
          {/* Afficher les périmètres si disponibles */}
          {perimeters.map((perimeter) => {
            const coordinates = perimeter.coordinates.map((coord) => [coord[0], coord[1]]);
            return (
              <Polygon
                key={perimeter.id}
                positions={coordinates}
                pathOptions={{
                  color: '#3388ff',
                  fillColor: '#3388ff',
                  fillOpacity: 0.2,
                }}
              />
            );
          })}
          
          {/* Afficher les marqueurs pour chaque prise */}
          {catchesWithLocation.map((catchItem) => {
            const lat = parseFloat(catchItem.latitude);
            const lng = parseFloat(catchItem.longitude);
            
            // Valider les coordonnées
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              return null;
            }
            
            // Créer une icône personnalisée
            let icon = null;
            if (typeof window !== 'undefined') {
              const L = require('leaflet');
              icon = L.divIcon({
                html: `<div style="
                  background-color: #007AFF;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                className: 'custom-marker-icon',
              });
            }
            
            if (!icon) return null;
            
            return (
              <Marker
                key={catchItem.id}
                position={[lat, lng]}
                icon={icon}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                      {catchItem.species?.name || 'Espèce inconnue'}
                    </h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      <strong>Taille:</strong> {catchItem.size} cm
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      <strong>Équipe:</strong> {catchItem.team?.name || '-'}
                    </p>
                    {catchItem.caughtBy && (
                      <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                        <strong>Pêché par:</strong> {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
                      </p>
                    )}
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                      <strong>Points:</strong> {catchItem.points || 0}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#666' }}>
                      {new Date(catchItem.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
