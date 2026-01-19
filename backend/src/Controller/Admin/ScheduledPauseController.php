<?php

namespace App\Controller\Admin;

use App\Entity\Competition\ScheduledPause;
use App\Repository\Competition\ScheduledPauseRepository;
use App\Repository\Competition\CompetitionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/competitions/{competitionId}/scheduled-pauses')]
class ScheduledPauseController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private ScheduledPauseRepository $scheduledPauseRepository,
        private CompetitionRepository $competitionRepository
    ) {
    }

    /**
     * Convertit une date UTC en Europe/Paris pour l'affichage
     */
    private function formatDateForDisplay(\DateTimeInterface $date): string
    {
        $timezone = new \DateTimeZone('Europe/Paris');
        $dateCopy = clone $date;
        if ($dateCopy instanceof \DateTime) {
            $dateCopy->setTimezone($timezone);
        }
        return $dateCopy->format('Y-m-d H:i:s');
    }

    /**
     * Liste toutes les pauses programmées d'une compétition
     */
    #[Route('', name: 'admin_scheduled_pauses_list', methods: ['GET'])]
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

        $pauses = $this->scheduledPauseRepository->findActiveByCompetition($competitionId);

        $pausesData = array_map(function ($pause) {
            return [
                'id' => $pause->getId(),
                'startDate' => $this->formatDateForDisplay($pause->getStartDate()),
                'endDate' => $this->formatDateForDisplay($pause->getEndDate()),
                'reason' => $pause->getReason(),
                'isActive' => $pause->isActive(),
                'createdAt' => $this->formatDateForDisplay($pause->getCreatedAt()),
            ];
        }, $pauses);

        return $this->json([
            'success' => true,
            'pauses' => $pausesData,
        ]);
    }

    /**
     * Crée une nouvelle pause programmée
     */
    #[Route('', name: 'admin_scheduled_pause_create', methods: ['POST'])]
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

        if (!isset($data['startDate']) || !isset($data['endDate'])) {
            return $this->json([
                'success' => false,
                'message' => 'Les dates de début et de fin sont requises'
            ], 400);
        }

        try {
            // Les dates viennent du frontend en format local (Europe/Paris)
            // On doit les interpréter comme étant en Europe/Paris
            $timezone = new \DateTimeZone('Europe/Paris');
            $startDate = new \DateTime($data['startDate'], $timezone);
            $endDate = new \DateTime($data['endDate'], $timezone);
            // Convertir en UTC pour le stockage en base
            $startDate->setTimezone(new \DateTimeZone('UTC'));
            $endDate->setTimezone(new \DateTimeZone('UTC'));
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Format de date invalide: ' . $e->getMessage()
            ], 400);
        }

        if ($endDate <= $startDate) {
            return $this->json([
                'success' => false,
                'message' => 'La date de fin doit être postérieure à la date de début'
            ], 400);
        }

        // Vérifier que la pause est dans les dates de la compétition
        if ($startDate < $competition->getStartDate() || $endDate > $competition->getEndDate()) {
            return $this->json([
                'success' => false,
                'message' => 'La pause doit être dans les dates de la compétition'
            ], 400);
        }

        $pause = new ScheduledPause();
        $pause->setCompetition($competition);
        $pause->setStartDate($startDate);
        $pause->setEndDate($endDate);
        $pause->setReason($data['reason'] ?? null);
        $pause->setIsActive(true);

        $this->entityManager->persist($pause);
        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Pause programmée créée avec succès',
            'pause' => [
                'id' => $pause->getId(),
                'startDate' => $this->formatDateForDisplay($pause->getStartDate()),
                'endDate' => $this->formatDateForDisplay($pause->getEndDate()),
                'reason' => $pause->getReason(),
                'isActive' => $pause->isActive(),
            ]
        ], 201);
    }

    /**
     * Met à jour une pause programmée
     */
    #[Route('/{id}', name: 'admin_scheduled_pause_update', methods: ['PUT'])]
    public function update(int $competitionId, int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $pause = $this->scheduledPauseRepository->find($id);
        if (!$pause || $pause->getCompetition()->getId() !== $competitionId) {
            return $this->json([
                'success' => false,
                'message' => 'Pause programmée non trouvée'
            ], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['startDate'])) {
            try {
                // Les dates viennent du frontend en format local (Europe/Paris)
                $timezone = new \DateTimeZone('Europe/Paris');
                $startDate = new \DateTime($data['startDate'], $timezone);
                // Convertir en UTC pour le stockage en base
                $startDate->setTimezone(new \DateTimeZone('UTC'));
                $pause->setStartDate($startDate);
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'message' => 'Format de date de début invalide: ' . $e->getMessage()
                ], 400);
            }
        }

        if (isset($data['endDate'])) {
            try {
                // Les dates viennent du frontend en format local (Europe/Paris)
                $timezone = new \DateTimeZone('Europe/Paris');
                $endDate = new \DateTime($data['endDate'], $timezone);
                // Convertir en UTC pour le stockage en base
                $endDate->setTimezone(new \DateTimeZone('UTC'));
                $pause->setEndDate($endDate);
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'message' => 'Format de date de fin invalide: ' . $e->getMessage()
                ], 400);
            }
        }

        if (isset($data['reason'])) {
            $pause->setReason($data['reason']);
        }

        if (isset($data['isActive'])) {
            $pause->setIsActive((bool) $data['isActive']);
        }

        // Vérifier la cohérence des dates
        if ($pause->getEndDate() <= $pause->getStartDate()) {
            return $this->json([
                'success' => false,
                'message' => 'La date de fin doit être postérieure à la date de début'
            ], 400);
        }

        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Pause programmée mise à jour avec succès',
            'pause' => [
                'id' => $pause->getId(),
                'startDate' => $this->formatDateForDisplay($pause->getStartDate()),
                'endDate' => $this->formatDateForDisplay($pause->getEndDate()),
                'reason' => $pause->getReason(),
                'isActive' => $pause->isActive(),
            ]
        ]);
    }

    /**
     * Supprime une pause programmée
     */
    #[Route('/{id}', name: 'admin_scheduled_pause_delete', methods: ['DELETE'])]
    public function delete(int $competitionId, int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $pause = $this->scheduledPauseRepository->find($id);
        if (!$pause || $pause->getCompetition()->getId() !== $competitionId) {
            return $this->json([
                'success' => false,
                'message' => 'Pause programmée non trouvée'
            ], 404);
        }

        $this->entityManager->remove($pause);
        $this->entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Pause programmée supprimée avec succès'
        ]);
    }
}
