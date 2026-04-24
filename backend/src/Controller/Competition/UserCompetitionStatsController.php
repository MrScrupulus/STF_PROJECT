<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\FishCatch;
use App\Entity\Competition\Team;
use App\Entity\Security\User;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\FishCatchRepository;
use App\Repository\Competition\TeamRepository;
use App\Service\CatchPhotoStorageService;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Statistiques individuelles et d'équipe (compétition), prises validées uniquement.
 */
#[Route('/api')]
class UserCompetitionStatsController extends AbstractController
{
    public function __construct(
        private readonly CatchPhotoStorageService $catchPhotoStorage,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/competitions/{id}/me/stats', name: 'api_competition_me_stats', methods: ['GET'])]
    public function getMyStats(
        int $id,
        CompetitionRepository $competitionRepository,
        FishCatchRepository $fishCatchRepository,
        TeamRepository $teamRepository,
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json([
                    'success' => false,
                    'message' => 'Authentification requise',
                ], 401);
            }

            $competition = $competitionRepository->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée',
                ], 404);
            }

            $userTeamInCompetition = $this->resolveUserTeamInCompetition($user, $id, $teamRepository);
            if (!$userTeamInCompetition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas inscrit à cette compétition',
                ], 403);
            }

            $competitionSpeciesMap = $this->buildCompetitionSpeciesMap($competition);
            $catches = $fishCatchRepository->findValidatedByCaughtByUserAndCompetition($user, $id);
            $aggregated = $this->aggregateStatsFromCatches($catches, $competitionSpeciesMap, false, false);

            return $this->json([
                'success' => true,
                'competition' => [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                ],
                'team' => [
                    'id' => $userTeamInCompetition->getId(),
                    'name' => $userTeamInCompetition->getName(),
                ],
                'stats' => array_merge($aggregated, [
                    'scope' => 'official_validated',
                    'description' => 'Prises validées dont vous êtes l\'auteur (caughtBy). Les prises sans auteur attribué ne sont pas incluses.',
                ]),
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur stats perso compétition', [
                'competitionId' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du calcul des statistiques.',
            ], 500);
        }
    }

    #[Route('/competitions/{id}/me/team/stats', name: 'api_competition_me_team_stats', methods: ['GET'])]
    public function getMyTeamStats(
        int $id,
        CompetitionRepository $competitionRepository,
        FishCatchRepository $fishCatchRepository,
        TeamRepository $teamRepository,
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return $this->json([
                    'success' => false,
                    'message' => 'Authentification requise',
                ], 401);
            }

            $competition = $competitionRepository->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée',
                ], 404);
            }

            $userTeamInCompetition = $this->resolveUserTeamInCompetition($user, $id, $teamRepository);
            if (!$userTeamInCompetition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas inscrit à cette compétition',
                ], 403);
            }

            $competitionSpeciesMap = $this->buildCompetitionSpeciesMap($competition);
            $catches = $fishCatchRepository->findValidatedByTeamAndCompetition($userTeamInCompetition, $id);
            $aggregated = $this->aggregateStatsFromCatches($catches, $competitionSpeciesMap, true, true);

            return $this->json([
                'success' => true,
                'competition' => [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                ],
                'team' => [
                    'id' => $userTeamInCompetition->getId(),
                    'name' => $userTeamInCompetition->getName(),
                ],
                'stats' => array_merge($aggregated, [
                    'scope' => 'official_validated_team',
                    'description' => 'Toutes les prises validées de votre équipe pour cette compétition. La répartition par membre utilise le champ « attrapé par » (caughtBy).',
                ]),
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Erreur stats équipe compétition', [
                'competitionId' => $id,
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
     * Aligné sur GET /competitions/{id} (isRegistered) : inclut les équipes inactives,
     * sinon les compétitions terminées avec équipe désactivée donnaient 403 alors que le détail affiche « Participé ».
     */
    private function resolveUserTeamInCompetition(User $user, int $competitionId, TeamRepository $teamRepository): ?Team
    {
        foreach ($teamRepository->findTeamsByMember($user, false) as $team) {
            if ($team->getCompetition() && $team->getCompetition()->getId() === $competitionId) {
                return $team;
            }
        }

        return null;
    }

    /**
     * @return array<int, \App\Entity\Competition\CompetitionSpecies>
     */
    private function buildCompetitionSpeciesMap(Competition $competition): array
    {
        $map = [];
        foreach ($competition->getCompetitionSpecies() as $compSpecies) {
            $speciesEntity = $compSpecies->getSpecies();
            if ($speciesEntity) {
                $map[$speciesEntity->getId()] = $compSpecies;
            }
        }

        return $map;
    }

    /**
     * @param FishCatch[] $catches
     * @param array       $competitionSpeciesMap
     *
     * @return array<string, mixed>
     */
    private function aggregateStatsFromCatches(array $catches, array $competitionSpeciesMap, bool $includeCaughtByInTimeline, bool $includeByMember): array
    {
        $speciesStats = [];
        $totalPoints = 0;
        $timeline = [];
        $catchesForMap = [];
        $cumulative = 0;
        $byMember = $includeByMember ? [] : null;

        foreach ($catches as $catch) {
            $points = $catch->calculatePoints();
            $totalPoints += $points;
            $cumulative += $points;

            $species = $catch->getSpecies();
            $speciesId = $species->getId();
            $coefficient = $species->getCoefficient();
            if (isset($competitionSpeciesMap[$speciesId])) {
                $coefficient = $competitionSpeciesMap[$speciesId]->getCoefficient();
            }

            if (!isset($speciesStats[$speciesId])) {
                $speciesStats[$speciesId] = [
                    'id' => $speciesId,
                    'name' => $species->getName(),
                    'coefficient' => $coefficient,
                    'count' => 0,
                    'points' => 0,
                ];
            }
            $speciesStats[$speciesId]['count']++;
            $speciesStats[$speciesId]['points'] += $points;

            if ($includeByMember && null !== $byMember) {
                $cb = $catch->getCaughtBy();
                $key = $cb ? (string) $cb->getId() : '_none';
                if (!isset($byMember[$key])) {
                    $byMember[$key] = [
                        'userId' => $cb ? $cb->getId() : null,
                        'firstname' => $cb ? $cb->getFirstname() : null,
                        'lastname' => $cb ? $cb->getLastname() : null,
                        'catchCount' => 0,
                        'points' => 0,
                    ];
                }
                $byMember[$key]['catchCount']++;
                $byMember[$key]['points'] += $points;
            }

            $createdAt = $catch->getCreatedAt()->format('Y-m-d H:i:s');
            $row = [
                'id' => $catch->getId(),
                'createdAt' => $createdAt,
                'points' => $points,
                'cumulativePoints' => $cumulative,
                'species' => [
                    'id' => $speciesId,
                    'name' => $species->getName(),
                ],
                'size' => $catch->getSize(),
                'latitude' => $catch->getLatitude(),
                'longitude' => $catch->getLongitude(),
                'photoUrl' => $this->catchPhotoStorage->resolvePhotoUrl($catch->getPhotoUrl()),
            ];
            if ($includeCaughtByInTimeline) {
                $cb = $catch->getCaughtBy();
                $row['caughtBy'] = $cb ? [
                    'id' => $cb->getId(),
                    'firstname' => $cb->getFirstname(),
                    'lastname' => $cb->getLastname(),
                ] : null;
            }
            $timeline[] = $row;

            if ($catch->getLatitude() && $catch->getLongitude()) {
                $mapRow = [
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
                ];
                if ($includeCaughtByInTimeline) {
                    $cb = $catch->getCaughtBy();
                    $mapRow['caughtBy'] = $cb ? [
                        'id' => $cb->getId(),
                        'firstname' => $cb->getFirstname(),
                        'lastname' => $cb->getLastname(),
                    ] : null;
                }
                $catchesForMap[] = $mapRow;
            }
        }

        $out = [
            'totalCatches' => \count($catches),
            'totalPoints' => $totalPoints,
            'speciesStats' => array_values($speciesStats),
            'timeline' => $timeline,
            'catchesForMap' => $catchesForMap,
        ];
        if ($includeByMember && null !== $byMember) {
            $out['byMember'] = array_values($byMember);
        }

        return $out;
    }
}
