<?php

namespace App\Controller\Competition;

use App\Entity\Competition\FishCatch;
use App\Repository\Competition\FishCatchRepository;
use App\Repository\Competition\TeamRepository;
use App\Repository\Security\UserRepository;
use App\Service\NotificationService;
use App\Service\GeolocationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class FishCatchController extends AbstractController
{
    /**
     * Récupère toutes les prises de l'utilisateur connecté
     */
    #[Route('/catches', name: 'user_catches_list', methods: ['GET'])]
    public function getUserCatches(FishCatchRepository $repository, TeamRepository $teamRepository): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Récupérer toutes les équipes de l'utilisateur
            $allTeams = $teamRepository->findUserHistory($user);
            $teamIds = array_map(function($team) {
                return $team->getId();
            }, $allTeams);

            // Récupérer toutes les prises de l'utilisateur
            $qb = $repository->createQueryBuilder('c')
                ->join('c.team', 't')
                ->leftJoin('c.species', 's')
                ->leftJoin('c.caughtBy', 'u')
                ->leftJoin('c.competition', 'comp');

            // Construire la condition : caughtBy = user OU team IN (teams de l'utilisateur)
            $conditions = ['c.caughtBy = :user'];
            $parameters = ['user' => $user];

            if (!empty($teamIds)) {
                $conditions[] = 't.id IN (:teamIds)';
                $parameters['teamIds'] = $teamIds;
            }

            $qb->where(implode(' OR ', $conditions));
            foreach ($parameters as $key => $value) {
                $qb->setParameter($key, $value);
            }

            $allCatches = $qb->orderBy('c.createdAt', 'DESC')
                ->getQuery()
                ->getResult();

            // Transformer les prises
            $catchesData = array_map(function ($catch) {
                return [
                    'id' => $catch->getId(),
                    'species' => [
                        'id' => $catch->getSpecies()->getId(),
                        'name' => $catch->getSpecies()->getName(),
                        'coefficient' => $catch->getSpecies()->getCoefficient(),
                    ],
                    'size' => $catch->getSize(),
                    'length' => $catch->getSize(), // Alias pour compatibilité
                    'points' => $catch->calculatePoints(),
                    'photoUrl' => $catch->getPhotoUrl(),
                    'comment' => $catch->getComment(),
                    'isValidated' => $catch->isValidated(),
                    'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                    'team' => [
                        'id' => $catch->getTeam()->getId(),
                        'name' => $catch->getTeam()->getName(),
                    ],
                    'competition' => $catch->getCompetition() ? [
                        'id' => $catch->getCompetition()->getId(),
                        'name' => $catch->getCompetition()->getName(),
                    ] : null,
                ];
            }, $allCatches);

            return $this->json($catchesData);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des prises', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des prises. Veuillez réessayer plus tard.'
            ], 500);
        }
    }
}
