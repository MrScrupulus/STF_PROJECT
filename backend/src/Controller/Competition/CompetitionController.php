<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Repository\Competition\CompetitionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

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

    #[Route('/competitions', name: 'competition_list', methods: ['GET'])]
    public function list(CompetitionRepository $repository): JsonResponse
    {
        try {
            $competitions = $repository->findAll();

            // Transformer les données comme dans la route admin
            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'maxParticipants' => $competition->getMaxParticipants(),
                    'teamSize' => $competition->getTeamSize(),
                    'hasNoLimit' => $competition->getHasNoLimit(),
                ];
            }, $competitions);

            return $this->json([
                'success' => true,
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des compétitions: ' . $e->getMessage()
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

    #[Route('/admin/competitions/{id}', name: 'app_admin_competition_delete', methods: ['DELETE'])]
    public function delete(Competition $competition, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            // Vérifier s'il y a des équipes liées
            if (!$competition->getTeams()->isEmpty()) {
                return $this->json([
                    'error' => 'Impossible de supprimer cette compétition car elle contient des équipes'
                ], 400);
            }

            $entityManager->remove($competition);
            $entityManager->flush();

            return $this->json([
                'message' => 'Compétition supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue lors de la suppression',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/competitions', name: 'app_admin_competition_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $data = json_decode($request->getContent(), true);

            $competition = new Competition();
            $competition->setName($data['name']);
            $competition->setType($data['type']);
            $competition->setStartDate(new \DateTime($data['startDate']));
            $competition->setEndDate(new \DateTime($data['endDate']));
            $competition->setDescription($data['description'] ?? null);
            $competition->setTeamSize((int) $data['teamSize']);
            $competition->setHasNoLimit($data['hasNoLimit'] ?? false);

            if (!$data['hasNoLimit'] && isset($data['maxParticipants'])) {
                $competition->setMaxParticipants((int) $data['maxParticipants']);
            }

            $entityManager->persist($competition);
            $entityManager->flush();

            return $this->json([
                'message' => 'Compétition créée avec succès',
                'competition' => [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'teamSize' => $competition->getTeamSize(),
                    'hasNoLimit' => $competition->getHasNoLimit(),
                    'maxParticipants' => $competition->getMaxParticipants(),
                ]
            ], 201);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue lors de la création',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
