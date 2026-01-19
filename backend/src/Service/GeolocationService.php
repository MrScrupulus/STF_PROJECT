<?php

namespace App\Service;

use App\Entity\Competition\CompetitionPerimeter;
use App\Repository\Competition\CompetitionPerimeterRepository;

class GeolocationService
{
    public function __construct(
        private readonly CompetitionPerimeterRepository $perimeterRepository
    ) {
    }

    /**
     * Vérifie si une position GPS (latitude, longitude) est dans un périmètre
     * Utilise l'algorithme "ray casting" pour déterminer si un point est dans un polygone
     * 
     * @param float $latitude Latitude du point à vérifier
     * @param float $longitude Longitude du point à vérifier
     * @param array $polygon Coordonnées du polygone [[lat, lng], [lat, lng], ...]
     * @return bool True si le point est dans le polygone, false sinon
     */
    public function isPointInPolygon(float $latitude, float $longitude, array $polygon): bool
    {
        // Un polygone doit avoir au moins 3 points
        if (count($polygon) < 3) {
            return false;
        }

        $inside = false;
        $j = count($polygon) - 1;

        for ($i = 0; $i < count($polygon); $i++) {
            // Normaliser le format des coordonnées
            $pointI = $polygon[$i];
            $pointJ = $polygon[$j];
            
            $xi = is_array($pointI) ? ($pointI[0] ?? $pointI['lat'] ?? null) : null;
            $yi = is_array($pointI) ? ($pointI[1] ?? $pointI['lng'] ?? null) : null;
            $xj = is_array($pointJ) ? ($pointJ[0] ?? $pointJ['lat'] ?? null) : null;
            $yj = is_array($pointJ) ? ($pointJ[1] ?? $pointJ['lng'] ?? null) : null;

            if ($xi === null || $yi === null || $xj === null || $yj === null) {
                $j = $i;
                continue;
            }

            // Algorithme ray casting (point-in-polygon)
            // On trace un rayon horizontal depuis le point vers la droite
            // On compte le nombre d'intersections avec les arêtes du polygone
            if ((($yi > $longitude) !== ($yj > $longitude)) && 
                ($latitude < ($xj - $xi) * ($longitude - $yi) / ($yj - $yi) + $xi)) {
                $inside = !$inside;
            }

            $j = $i;
        }

        return $inside;
    }

    /**
     * Vérifie si une position GPS est dans au moins un des périmètres actifs d'une compétition
     * 
     * @param float $latitude Latitude du point à vérifier
     * @param float $longitude Longitude du point à vérifier
     * @param int $competitionId ID de la compétition
     * @return bool True si le point est dans au moins un périmètre, false sinon
     */
    public function isPointInCompetitionPerimeter(float $latitude, float $longitude, int $competitionId): bool
    {
        $perimeters = $this->perimeterRepository->findActiveByCompetition($competitionId);

        // Si aucun périmètre n'est défini, on autorise toutes les positions
        if (empty($perimeters)) {
            return true;
        }

        // Vérifier si le point est dans au moins un périmètre
        foreach ($perimeters as $perimeter) {
            if ($this->isPointInPolygon($latitude, $longitude, $perimeter->getCoordinates())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Valide une position GPS pour une compétition
     * Retourne un message d'erreur si la validation échoue, null si elle réussit
     * 
     * @param float|null $latitude Latitude du point à vérifier
     * @param float|null $longitude Longitude du point à vérifier
     * @param int $competitionId ID de la compétition
     * @return string|null Message d'erreur ou null si valide
     */
    public function validateLocation(?float $latitude, ?float $longitude, int $competitionId): ?string
    {
        // Si aucun périmètre n'est défini, on accepte toutes les positions
        $perimeters = $this->perimeterRepository->findActiveByCompetition($competitionId);
        if (empty($perimeters)) {
            return null;
        }

        // Si un périmètre est défini, la position GPS est obligatoire
        if ($latitude === null || $longitude === null) {
            return 'La position GPS est requise pour cette compétition.';
        }

        // Vérifier que la position est valide (latitude entre -90 et 90, longitude entre -180 et 180)
        if ($latitude < -90 || $latitude > 90) {
            return 'La latitude doit être comprise entre -90 et 90.';
        }

        if ($longitude < -180 || $longitude > 180) {
            return 'La longitude doit être comprise entre -180 et 180.';
        }

        // Vérifier si le point est dans le périmètre
        if (!$this->isPointInCompetitionPerimeter($latitude, $longitude, $competitionId)) {
            return 'La prise doit être effectuée dans la zone autorisée de la compétition.';
        }

        return null;
    }
}
