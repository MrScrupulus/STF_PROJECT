<?php

namespace App\Controller\Admin;

use App\Entity\Competition\CompetitionPerimeter;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\CompetitionPerimeterRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/competitions/{competitionId}/perimeters')]
class CompetitionPerimeterController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CompetitionPerimeterRepository $perimeterRepository,
        private readonly CompetitionRepository $competitionRepository
    ) {
    }

    /**
     * Liste tous les périmètres d'une compétition
     */
    #[Route('', name: 'admin_perimeters_list', methods: ['GET'])]
    public function list(int $competitionId): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $competition = $this->competitionRepository->find($competitionId);
        if (!$competition) {
            return $this->json([
                'success' => false,
                'message' => 'Compétition non trouvée'
            ], 404);
        }

        $perimeters = $this->perimeterRepository->findBy(
            ['competition' => $competition],
            ['id' => 'ASC']
        );

        $perimetersData = array_map(function ($perimeter) {
            return [
                'id' => $perimeter->getId(),
                'name' => $perimeter->getName(),
                'coordinates' => $perimeter->getCoordinates(),
                'isActive' => $perimeter->isActive(),
            ];
        }, $perimeters);

        return $this->json([
            'success' => true,
            'perimeters' => $perimetersData,
        ]);
    }

    /**
     * Crée un nouveau périmètre
     */
    #[Route('', name: 'admin_perimeters_create', methods: ['POST'])]
    public function create(int $competitionId, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $competition = $this->competitionRepository->find($competitionId);
        if (!$competition) {
            return $this->json([
                'success' => false,
                'message' => 'Compétition non trouvée'
            ], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['coordinates']) || !is_array($data['coordinates'])) {
            return $this->json([
                'success' => false,
                'message' => 'Les coordonnées du périmètre sont requises'
            ], 400);
        }

        // Valider que les coordonnées forment un polygone valide (au moins 3 points)
        if (count($data['coordinates']) < 3) {
            return $this->json([
                'success' => false,
                'message' => 'Un périmètre doit avoir au moins 3 points'
            ], 400);
        }

        // Valider le format des coordonnées
        foreach ($data['coordinates'] as $point) {
            if (!is_array($point) || count($point) < 2) {
                return $this->json([
                    'success' => false,
                    'message' => 'Format de coordonnées invalide. Chaque point doit être [latitude, longitude]'
                ], 400);
            }
            
            $lat = $point[0] ?? $point['lat'] ?? null;
            $lng = $point[1] ?? $point['lng'] ?? null;
            
            if ($lat === null || $lng === null) {
                return $this->json([
                    'success' => false,
                    'message' => 'Format de coordonnées invalide'
                ], 400);
            }

            // Normaliser le format en [lat, lng]
            if (isset($point['lat']) || isset($point['lng'])) {
                $point = [$lat, $lng];
            }
        }

        $perimeter = new CompetitionPerimeter();
        $perimeter->setCompetition($competition);
        $perimeter->setCoordinates($data['coordinates']);
        $perimeter->setName($data['name'] ?? null);
        $perimeter->setIsActive($data['isActive'] ?? true);

        $this->entityManager->persist($perimeter);
        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Périmètre créé avec succès',
            'perimeter' => [
                'id' => $perimeter->getId(),
                'name' => $perimeter->getName(),
                'coordinates' => $perimeter->getCoordinates(),
                'isActive' => $perimeter->isActive(),
            ]
        ], 201);
    }

    /**
     * Met à jour un périmètre
     */
    #[Route('/{id}', name: 'admin_perimeters_update', methods: ['PUT'])]
    public function update(int $competitionId, int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $perimeter = $this->perimeterRepository->find($id);
        if (!$perimeter || $perimeter->getCompetition()->getId() !== $competitionId) {
            return $this->json([
                'success' => false,
                'message' => 'Périmètre non trouvé'
            ], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['coordinates'])) {
            if (!is_array($data['coordinates']) || count($data['coordinates']) < 3) {
                return $this->json([
                    'success' => false,
                    'message' => 'Un périmètre doit avoir au moins 3 points'
                ], 400);
            }
            $perimeter->setCoordinates($data['coordinates']);
        }

        if (isset($data['name'])) {
            $perimeter->setName($data['name']);
        }

        if (isset($data['isActive'])) {
            $perimeter->setIsActive((bool) $data['isActive']);
        }

        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Périmètre mis à jour avec succès',
            'perimeter' => [
                'id' => $perimeter->getId(),
                'name' => $perimeter->getName(),
                'coordinates' => $perimeter->getCoordinates(),
                'isActive' => $perimeter->isActive(),
            ]
        ]);
    }

    /**
     * Supprime un périmètre
     */
    #[Route('/{id}', name: 'admin_perimeters_delete', methods: ['DELETE'])]
    public function delete(int $competitionId, int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $perimeter = $this->perimeterRepository->find($id);
        if (!$perimeter || $perimeter->getCompetition()->getId() !== $competitionId) {
            return $this->json([
                'success' => false,
                'message' => 'Périmètre non trouvé'
            ], 404);
        }

        $this->entityManager->remove($perimeter);
        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Périmètre supprimé avec succès'
        ]);
    }
}
