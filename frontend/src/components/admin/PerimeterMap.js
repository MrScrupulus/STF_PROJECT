"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMap } from "react-leaflet";
import styles from "../../styles/components/admin/PerimeterMap.module.scss";

// Charger les composants Leaflet dynamiquement pour éviter les problèmes SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

/**
 * Composant interne pour gérer le dessin de polygone
 */
function DrawControl({ onPolygonComplete, existingPolygons = [] }) {
  const map = useMap();
  const drawControlRef = useRef(null);
  const drawnLayersRef = useRef(null);
  const handlersRef = useRef({});
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (!map || typeof window === "undefined") return;

    const setupDrawControl = async () => {
      const L = (await import("leaflet")).default;
      
      // Fix pour les icônes Leaflet avec Next.js
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      await import("leaflet-draw");
      setLeafletLoaded(true);
      
      drawnLayersRef.current = new L.FeatureGroup();
      map.addLayer(drawnLayersRef.current);

      // Créer le contrôle de dessin
      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnLayersRef.current,
          remove: true,
        },
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Dessiner les polygones existants
      existingPolygons.forEach((polygon) => {
        if (polygon.coordinates && polygon.coordinates.length > 0) {
          const latlngs = polygon.coordinates.map((coord) => [coord[0], coord[1]]);
          const poly = L.polygon(latlngs, {
            color: "#3388ff",
            fillColor: "#3388ff",
            fillOpacity: 0.2,
          });
          poly.perimeterId = polygon.id;
          drawnLayersRef.current.addLayer(poly);
        }
      });

      // Écouter les événements de dessin
      const handleDrawCreated = (e) => {
        const layer = e.layer;
        drawnLayersRef.current.addLayer(layer);

        // Extraire les coordonnées du polygone
        const latlngs = layer.getLatLngs()[0];
        const coordinates = latlngs.map((latlng) => [latlng.lat, latlng.lng]);

        // Fermer le polygone si nécessaire (premier point = dernier point)
        if (coordinates.length > 0) {
          const first = coordinates[0];
          const last = coordinates[coordinates.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            coordinates.push([first[0], first[1]]);
          }
        }

        onPolygonComplete(coordinates);
      };

      const handleDrawEdited = (e) => {
        const layers = e.layers;
        layers.eachLayer((layer) => {
          if (layer instanceof L.Polygon) {
            const latlngs = layer.getLatLngs()[0];
            const coordinates = latlngs.map((latlng) => [latlng.lat, latlng.lng]);
            
            // Fermer le polygone si nécessaire
            if (coordinates.length > 0) {
              const first = coordinates[0];
              const last = coordinates[coordinates.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                coordinates.push([first[0], first[1]]);
              }
            }

            onPolygonComplete(coordinates, layer.perimeterId);
          }
        });
      };

      const handleDrawDeleted = (e) => {
        const layers = e.layers;
        layers.eachLayer((layer) => {
          if (layer.perimeterId) {
            // Notifier la suppression
            onPolygonComplete(null, layer.perimeterId);
          }
        });
      };

      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      map.on(L.Draw.Event.EDITED, handleDrawEdited);
      map.on(L.Draw.Event.DELETED, handleDrawDeleted);

      handlersRef.current = {
        created: handleDrawCreated,
        edited: handleDrawEdited,
        deleted: handleDrawDeleted,
        L: L,
      };
    };

    setupDrawControl();

    return () => {
      if (map && leafletLoaded && handlersRef.current.L) {
        const L = handlersRef.current.L;
        const handlers = handlersRef.current;
        if (handlers.created) {
          map.off(L.Draw.Event.CREATED, handlers.created);
        }
        if (handlers.edited) {
          map.off(L.Draw.Event.EDITED, handlers.edited);
        }
        if (handlers.deleted) {
          map.off(L.Draw.Event.DELETED, handlers.deleted);
        }
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
        }
        if (drawnLayersRef.current) {
          map.removeLayer(drawnLayersRef.current);
        }
      }
    };
  }, [map, onPolygonComplete, existingPolygons, leafletLoaded]);

  return null;
}

/**
 * Composant principal de la carte avec dessin de périmètre
 */
export default function PerimeterMap({ 
  onPolygonComplete, 
  existingPerimeters = [],
  center = [50.6901, 3.1664], // Roubaix par défaut
  zoom = 13 
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Charger les styles CSS de Leaflet
    if (typeof window !== "undefined") {
      import("leaflet/dist/leaflet.css");
      import("leaflet-draw/dist/leaflet.draw.css");
      // Importer les styles personnalisés pour Leaflet Draw
      import("../../styles/global/leaflet-draw.css");
    }
  }, []);

  if (!isClient) {
    return (
      <div className={styles.map_loading}>
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className={styles.perimeter_map}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "500px", width: "100%" }}
        className={styles.map_container}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawControl 
          onPolygonComplete={onPolygonComplete}
          existingPolygons={existingPerimeters}
        />
      </MapContainer>
      <div className={styles.map_instructions}>
        <p>📌 Utilisez l'outil de dessin pour créer un périmètre autour de la zone autorisée</p>
        <p>✏️ Cliquez sur le polygone pour le modifier</p>
        <p>🗑️ Utilisez l'outil de suppression pour supprimer un périmètre</p>
      </div>
    </div>
  );
}
