<?php

namespace App\Controller;

use App\Entity\Competition\FishCatch;
use App\Entity\Security\User;
use App\Repository\Competition\FishCatchRepository;
use App\Service\CatchPhotoStorageService;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Statistiques globales de l'utilisateur connecté (toutes compétitions), prises validées / caughtBy.
 */
#[Route('/api/me')]
class MeStatsController extends AbstractController
{
    public function __construct(
        private readonly CatchPhotoStorageService $catchPhotoStorage,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/stats', name: 'api_me_stats', methods: ['GET'])]
    public function getGlobalStats(FishCatchRepository $fishCatchRepository): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json([
                    'success' => false,
                    'message' => 'Authentification requise',
                ], 401);
            }

            $catches = $fishCatchRepository->findValidatedByCaughtByUserGlobally($user);

            $speciesStats = [];
            $totalPoints = 0;
            $timeline = [];
            $catchesForMap = [];
            $cumulative = 0;

            foreach ($catches as $catch) {
                $competition = $catch->getCompetition();
                if (!$competition) {
                    continue;
                }

                $points = $catch->calculatePoints();
                $totalPoints += $points;
                $cumulative += $points;

                $species = $catch->getSpecies();
                $speciesId = $species->getId();

                if (!isset($speciesStats[$speciesId])) {
                    $speciesStats[$speciesId] = [
                        'id' => $speciesId,
                        'name' => $species->getName(),
                        'count' => 0,
                        'points' => 0,
                    ];
                }
                $speciesStats[$speciesId]['count']++;
                $speciesStats[$speciesId]['points'] += $points;

                $createdAt = $catch->getCreatedAt()->format('Y-m-d H:i:s');
                $timeline[] = [
                    'id' => $catch->getId(),
                    'createdAt' => $createdAt,
                    'points' => $points,
                    'cumulativePoints' => $cumulative,
                    'competition' => [
                        'id' => $competition->getId(),
                        'name' => $competition->getName(),
                    ],
                    'species' => [
                        'id' => $speciesId,
                        'name' => $species->getName(),
                    ],
                    'size' => $catch->getSize(),
                    'latitude' => $catch->getLatitude(),
                    'longitude' => $catch->getLongitude(),
                    'photoUrl' => $this->catchPhotoStorage->resolvePhotoUrl($catch->getPhotoUrl()),
                ];

                if ($catch->getLatitude() && $catch->getLongitude()) {
                    $catchesForMap[] = [
                        'id' => $catch->getId(),
                        'size' => $catch->getSize(),
                        'species' => [
                            'id' => $speciesId,
                            'name' => $species->getName(),
                        ],
                        'points' => $points,
                        'createdAt' => $createdAt,
                        'latitude' => $catch->getLatitude(),
                        'longitude' => $catch->getLongitude(),
                        'competition' => [
                            'id' => $competition->getId(),
                            'name' => $competition->getName(),
                        ],
                    ];
                }
            }

            return $this->json([
                'success' => true,
                'stats' => [
                    'scope' => 'official_validated_global',
                    'description' => 'Toutes vos prises validées (caughtBy), toutes compétitions. Coefficients selon chaque compétition.',
                    'totalCatches' => \count($catches),
                    'totalPoints' => $totalPoints,
                    'speciesStats' => array_values($speciesStats),
                    'byCompetition' => $this->buildByCompetitionSummary($catches),
                    'timeline' => $timeline,
                    'catchesForMap' => $catchesForMap,
                ],
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur stats globales utilisateur', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du calcul des statistiques.',
            ], 500);
        }
    }

    /**
     * @param FishCatch[] $catches
     *
     * @return list<array{competition: array{id: int, name: string}, totalCatches: int, totalPoints: int}>
     */
    private function buildByCompetitionSummary(array $catches): array
    {
        $groups = [];
        foreach ($catches as $catch) {
            $competition = $catch->getCompetition();
            if (!$competition) {
                continue;
            }
            $cid = $competition->getId();
            if (!isset($groups[$cid])) {
                $groups[$cid] = [
                    'competition' => [
                        'id' => $competition->getId(),
                        'name' => $competition->getName(),
                    ],
                    'totalCatches' => 0,
                    'totalPoints' => 0,
                ];
            }
            $groups[$cid]['totalCatches']++;
            $groups[$cid]['totalPoints'] += $catch->calculatePoints();
        }

        return array_values($groups);
    }
}
