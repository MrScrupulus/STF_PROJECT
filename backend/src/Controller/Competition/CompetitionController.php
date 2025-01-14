<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Repository\Competition\CompetitionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class CompetitionController extends AbstractController
{
    #[Route('/admin/competitions', name: 'app_admin_competitions_list', methods: ['GET'])]
    public function adminList(CompetitionRepository $repository): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competitions = $repository->findAll();

            // Transformer les données pour éviter les références circulaires
            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'maxParticipants' => $competition->getMaxParticipants(),
                ];
            }, $competitions);

            return $this->json([
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/competitions', name: 'app_competitions_list', methods: ['GET'])]
    public function list(CompetitionRepository $repository): JsonResponse
    {
        try {
            $competitions = $repository->findAll();

            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                ];
            }, $competitions);

            return $this->json([
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'get_competition', methods: ['GET'])]
    public function getCompetition(Competition $competition): JsonResponse
    {
        return $this->json([
            'id' => $competition->getId(),
            'name' => $competition->getName(),
            'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
            'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
            'teams' => array_map(function ($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'totalScore' => $team->getTotalScore(),
                ];
            }, $competition->getTeams()->toArray()),
        ]);
    }
}
