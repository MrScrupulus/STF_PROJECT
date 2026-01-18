#!/bin/bash
# Créer des images de base avec ImageMagick si disponible
if command -v convert &> /dev/null; then
  # Icon 1024x1024
  convert -size 1024x1024 xc:#007AFF -gravity center -pointsize 200 -fill white -annotate +0+0 "STF" icon.png
  
  # Splash 1242x2436 (iPhone)
  convert -size 1242x2436 xc:#ffffff -gravity center -pointsize 100 -fill #007AFF -annotate +0+0 "Street Fishing" splash.png
  
  # Adaptive icon 1024x1024
  convert -size 1024x1024 xc:#007AFF -gravity center -pointsize 200 -fill white -annotate +0+0 "STF" adaptive-icon.png
  
  echo "Assets créés avec succès"
else
  echo "ImageMagick non disponible, création d'images minimales..."
  # Créer des fichiers PNG minimales (1x1 pixel transparent)
  # Note: Ces images ne fonctionneront pas vraiment mais permettront à Expo de démarrer
  echo "PNG minimales à créer manuellement"
fi
