<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\Team;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\TeamRepository;
use App\Repository\Competition\FishCatchRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Service\EmailService;
use App\Service\CompetitionSnapshotService;
use App\Service\NotificationService;
use App\Repository\Competition\ScheduledPauseRepository;
use App\Entity\Competition\ScheduledPause;
use App\Repository\Competition\CompetitionPerimeterRepository;
use App\Repository\Species\SpeciesRepository;
use App\Entity\Competition\CompetitionSpecies;
use App\Repository\Competition\CompetitionSpeciesRepository;
use Psr\Log\LoggerInterface;

#[Route('/api')]
class CompetitionController extends AbstractController
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {
    }
    #[Route('/admin/competitions', name: 'app_admin_competitions_list', methods: ['GET'])]
    public function adminList(CompetitionRepository $repository): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competitions = $repository->createQueryBuilder('c')
                ->select('c')
                ->getQuery()
                ->getResult();

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
                    'isRankingPublic' => $competition->getIsRankingPublic(),
                    'isPaused' => $competition->getIsPaused(),
                ];
            }, $competitions);

            return $this->json([
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des compétitions (admin)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'error' => 'Une erreur est survenue',
                'message' => 'Une erreur est survenue lors de la récupération des compétitions. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/competitions', name: 'competition_list', methods: ['GET'])]
    public function list(CompetitionRepository $repository, TeamRepository $teamRepository, FishCatchRepository $catchRepository, Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            
            // Pagination
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = min(50, max(1, (int) $request->query->get('limit', 10))); // Par défaut 10, max 50

            // Récupérer les équipes de l'utilisateur pour déterminer s'il est inscrit ou a participé
            $userTeamIds = [];
            $userParticipatedCompetitionIds = [];
            if ($user) {
                // Récupérer toutes les équipes (actives et inactives) pour vérifier la participation historique
                $allUserTeams = $teamRepository->findUserHistory($user);
                $teamIds = array_map(function($team) {
                    return $team->getId();
                }, $allUserTeams);
                
                foreach ($allUserTeams as $team) {
                    if ($team->getCompetition()) {
                        $userTeamIds[] = $team->getCompetition()->getId();
                    }
                }
                
                // Vérifier aussi via les prises pour les compétitions terminées
                if (!empty($teamIds)) {
                    $now = new \DateTime();
                    $userCatches = $catchRepository->createQueryBuilder('c')
                        ->join('c.team', 't')
                        ->leftJoin('c.competition', 'comp')
                        ->where('c.caughtBy = :user OR t.id IN (:teamIds)')
                        ->andWhere('c.competition IS NOT NULL')
                        ->setParameter('user', $user)
                        ->setParameter('teamIds', $teamIds)
                        ->getQuery()
                        ->getResult();
                    
                    foreach ($userCatches as $catch) {
                        if ($catch->getCompetition()) {
                            $competitionId = $catch->getCompetition()->getId();
                            $competition = $catch->getCompetition();
                            // Vérifier si la compétition est terminée
                            if ($competition->getEndDate() < $now && !in_array($competitionId, $userParticipatedCompetitionIds)) {
                                $userParticipatedCompetitionIds[] = $competitionId;
                            }
                        }
                    }
                }
            }

            // Compter le total
            $qbCount = $repository->createQueryBuilder('c')
                ->select('COUNT(c.id)');
            $total = (int) $qbCount->getQuery()->getSingleScalarResult();
            $pages = (int) ceil($total / $limit);

            // Récupérer les compétitions paginées
            $qb = $repository->createQueryBuilder('c')
                ->orderBy('c.startDate', 'DESC');
            
            $competitions = $qb
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            // Transformer les données comme dans la route admin
            $data = array_map(function ($competition) use ($userTeamIds, $userParticipatedCompetitionIds) {
                $now = new \DateTime();
                $isEnded = $competition->getEndDate() < $now;
                // Vérifier si l'utilisateur est inscrit (équipe active) ou a participé (équipe inactive ou prises)
                $isRegistered = in_array($competition->getId(), $userTeamIds) || 
                                ($isEnded && in_array($competition->getId(), $userParticipatedCompetitionIds));
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
                    'isRankingPublic' => $competition->getIsRankingPublic(),
                    'isRegistered' => $isRegistered,
                ];
            }, $competitions);

            return $this->json([
                'success' => true,
                'competitions' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => $pages,
                    'count' => count($data),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des compétitions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des compétitions. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/competitions/ongoing', name: 'competition_ongoing', methods: ['GET'])]
    public function getOngoingCompetitions(CompetitionRepository $repository): JsonResponse
    {
        try {
            $now = new \DateTime();
            
            $competitions = $repository->createQueryBuilder('c')
                ->where('c.startDate <= :now')
                ->andWhere('c.endDate >= :now')
                ->setParameter('now', $now)
                ->getQuery()
                ->getResult();

            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'teamSize' => $competition->getTeamSize(),
                    'isPaused' => $competition->getIsPaused(),
                ];
            }, $competitions);

            return $this->json([
                'success' => true,
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des compétitions en cours', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des compétitions en cours. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/competitions/{id}', name: 'get_competition', methods: ['GET'])]
    public function getCompetition(int $id, CompetitionRepository $repository, TeamRepository $teamRepository, FishCatchRepository $catchRepository, CompetitionSnapshotService $snapshotService, ScheduledPauseRepository $scheduledPauseRepository, CompetitionPerimeterRepository $perimeterRepository): JsonResponse
    {
        // Charger la compétition avec les équipes et leurs membres pour éviter les requêtes N+1
        $competition = $repository->createQueryBuilder('c')
            ->select('c', 't', 'm')
            ->leftJoin('c.teams', 't')
            ->leftJoin('t.members', 'm')
            ->where('c.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();

        if (!$competition) {
            return $this->json([
                'success' => false,
                'message' => 'Compétition non trouvée'
            ], 404);
        }
        
        $user = $this->getUser();
        $isAdmin = $user && in_array('ROLE_ADMIN', $user->getRoles());
        
        // Si la compétition n'est pas publiée et que l'utilisateur n'est pas connecté/admin, refuser l'accès
        if (!$competition->getIsRankingPublic() && !$user) {
            return $this->json([
                'success' => false,
                'message' => 'Les détails de cette compétition ne sont pas encore publics'
            ], 403);
        }
        
        $now = new \DateTime();
        $isEnded = $competition->getEndDate() < $now;
        
        // Déterminer quelles équipes retourner selon les règles de sécurité
        $teamsToReturn = [];
        $useSnapshots = false;

        // La visibilité du classement dépend de isRankingPublic
        // Si l'admin publie le classement (isRankingPublic = true), tout le monde peut voir, même si la compétition n'est pas terminée
        // Sinon, seuls les admins peuvent voir le classement complet
        $rankingVisible = $competition->getIsRankingPublic() || $isAdmin;
        
        if ($rankingVisible) {
            // Pour les compétitions terminées, utiliser les snapshots (état figé)
            if ($isEnded) {
                // Créer les snapshots s'ils n'existent pas encore
                if (!$snapshotService->hasSnapshots($competition)) {
                    $snapshotService->createSnapshotsForCompetition($competition);
                } else {
                    // Vérifier si les snapshots existants ont des membres vides
                    // Si oui, recréer les snapshots pour récupérer les membres depuis les prises
                    $snapshots = $snapshotService->getSnapshotsForCompetition($competition);
                    $needsRecreation = false;
                    foreach ($snapshots as $snapshot) {
                        if (empty($snapshot->getMembers())) {
                            $needsRecreation = true;
                            break;
                        }
                    }
                    if ($needsRecreation) {
                        $snapshotService->createSnapshotsForCompetition($competition, true);
                    }
                }
                
                // Utiliser les snapshots pour le classement
                $snapshots = $snapshotService->getSnapshotsForCompetition($competition);
                $useSnapshots = true;
                $teamsToReturn = $snapshots;
            } else {
                // Pour les compétitions en cours, utiliser les équipes actuelles (actives seulement)
                $allTeams = $competition->getTeams()->filter(function($team) {
                    return $team->getIsActive();
                })->toArray();
                
                // Trier par score décroissant en utilisant le score filtré par compétition
                usort($allTeams, function($a, $b) use ($competition) {
                    $scoreA = $a->getScoreForCompetition($competition);
                    $scoreB = $b->getScoreForCompetition($competition);
                    return $scoreB - $scoreA;
                });
                $teamsToReturn = $allTeams;
            }
        } else {
            // Classement non visible : utilisateur normal voit uniquement son équipe
            if ($user) {
                $userTeams = $teamRepository->findTeamsByMember($user);
                foreach ($userTeams as $team) {
                    if ($team->getCompetition() && $team->getCompetition()->getId() === $competition->getId()) {
                        $teamsToReturn[] = $team;
                        break; // Un utilisateur ne peut avoir qu'une équipe par compétition
                    }
                }
            }
        }
        
        // Récupérer les pauses programmées (visibles pour tous)
        $scheduledPauses = $scheduledPauseRepository->findActiveByCompetition($competition->getId());
        $scheduledPausesData = array_map(function ($pause) {
            // Convertir les dates UTC en Europe/Paris pour l'affichage
            $timezone = new \DateTimeZone('Europe/Paris');
            $startDate = clone $pause->getStartDate();
            $startDate->setTimezone($timezone);
            $endDate = clone $pause->getEndDate();
            $endDate->setTimezone($timezone);
            
            return [
                'id' => $pause->getId(),
                'startDate' => $startDate->format('Y-m-d H:i:s'),
                'endDate' => $endDate->format('Y-m-d H:i:s'),
                'reason' => $pause->getReason(),
            ];
        }, $scheduledPauses);

        // Récupérer les périmètres (visibles pour tous)
        $perimeters = $perimeterRepository->findActiveByCompetition($competition->getId());
        $perimetersData = array_map(function ($perimeter) {
            return [
                'id' => $perimeter->getId(),
                'name' => $perimeter->getName(),
                'coordinates' => $perimeter->getCoordinates(),
            ];
        }, $perimeters);

        // Récupérer les espèces de la compétition
        $competitionSpecies = $competition->getCompetitionSpecies();
        $speciesData = array_map(function ($compSpecies) {
            $species = $compSpecies->getSpecies();
            return [
                'id' => $species->getId(),
                'name' => $species->getName(),
                'coefficient' => $compSpecies->getCoefficient(),
                'isBonusEnabled' => $compSpecies->isBonusEnabled(),
                'basePoints' => $compSpecies->getBasePoints(),
            ];
        }, $competitionSpecies->toArray());
        
        // Déterminer si l'utilisateur est inscrit à cette compétition ou y a participé
        $isRegistered = false;
        if ($user) {
            // Vérifier via les équipes actives
            $userTeams = $teamRepository->findTeamsByMember($user);
            foreach ($userTeams as $team) {
                if ($team->getCompetition() && $team->getCompetition()->getId() === $competition->getId()) {
                    $isRegistered = true;
                    break;
                }
            }
            
            // Si la compétition est terminée et que l'utilisateur n'est pas inscrit via une équipe active,
            // vérifier via les équipes historiques et les prises
            if (!$isRegistered && $isEnded) {
                $allUserTeams = $teamRepository->findUserHistory($user);
                $teamIds = array_map(function($team) {
                    return $team->getId();
                }, $allUserTeams);
                
                // Vérifier si l'utilisateur a des prises pour cette compétition
                if (!empty($teamIds)) {
                    $userCatches = $catchRepository->createQueryBuilder('c')
                        ->join('c.team', 't')
                        ->where('(c.caughtBy = :user OR t.id IN (:teamIds))')
                        ->andWhere('c.competition = :competitionId')
                        ->setParameter('user', $user)
                        ->setParameter('teamIds', $teamIds)
                        ->setParameter('competitionId', $competition->getId())
                        ->setMaxResults(1)
                        ->getQuery()
                        ->getResult();
                    
                    if (!empty($userCatches)) {
                        $isRegistered = true;
                    }
                }
            }
        }
        
        return $this->json([
            'success' => true,
            'id' => $competition->getId(),
            'name' => $competition->getName(),
            'type' => $competition->getType(),
            'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
            'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
            'description' => $competition->getDescription(),
            'teamSize' => $competition->getTeamSize(),
            'maxParticipants' => $competition->getMaxParticipants(),
            'hasNoLimit' => $competition->getHasNoLimit(),
            'isEnded' => $isEnded,
            'isRankingPublic' => $competition->getIsRankingPublic(),
            'isPaused' => $competition->getIsPaused(),
            'isBonusEnabled' => $competition->getIsBonusEnabled(),
            'isRegistered' => $isRegistered,
            'scheduledPauses' => $scheduledPausesData,
            'perimeters' => $perimetersData,
            'species' => $speciesData,
            'teams' => array_map(function ($teamOrSnapshot) use ($rankingVisible, $isAdmin, $user, $teamRepository, $useSnapshots, $competition) {
                // Pour les utilisateurs normaux si le classement n'est pas public, ne pas retourner le score
                if ($useSnapshots) {
                    // Utiliser les données du snapshot (état figé)
                    $showScore = $rankingVisible;
                    return [
                        'id' => $teamOrSnapshot->getTeam()->getId(),
                        'name' => $teamOrSnapshot->getTeamName(),
                        'totalScore' => $showScore ? $teamOrSnapshot->getTotalScore() : null,
                        'registrationNumber' => $teamOrSnapshot->getRegistrationNumber(),
                        'members' => $teamOrSnapshot->getMembers(), // Déjà au format JSON
                    ];
                } else {
                    // Utiliser les données de l'équipe actuelle
                    $showScore = $rankingVisible || ($user && $teamOrSnapshot->getMembers()->contains($user));
                    // Utiliser le score filtré par compétition pour éviter d'inclure les prises d'autres compétitions
                    $teamScore = $showScore ? $teamOrSnapshot->getScoreForCompetition($competition) : null;
                    return [
                        'id' => $teamOrSnapshot->getId(),
                        'name' => $teamOrSnapshot->getName(),
                        'totalScore' => $teamScore,
                        'registrationNumber' => $teamOrSnapshot->getRegistrationNumber(),
                        'isActive' => $teamOrSnapshot->getIsActive(),
                        'members' => array_map(function ($member) {
                return [
                                'id' => $member->getId(),
                                'firstname' => $member->getFirstname(),
                                'lastname' => $member->getLastname(),
                            ];
                        }, $teamOrSnapshot->getMembers()->toArray()),
                    ];
                }
            }, $teamsToReturn),
        ]);
    }

    #[Route('/competitions/{id}', name: 'app_competition_update', methods: ['PUT'])]
    public function update(int $id, Request $request, CompetitionRepository $repository, EntityManagerInterface $entityManager, CompetitionSnapshotService $snapshotService): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competition = $repository->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (isset($data['name'])) {
                $competition->setName($data['name']);
            }
            if (isset($data['type'])) {
                $competition->setType($data['type']);
            }
            if (isset($data['startDate'])) {
                $competition->setStartDate(new \DateTime($data['startDate']));
            }
            if (isset($data['endDate'])) {
                $competition->setEndDate(new \DateTime($data['endDate']));
            }
            if (isset($data['description'])) {
                $competition->setDescription($data['description']);
            }
            if (isset($data['teamSize'])) {
                $competition->setTeamSize((int) $data['teamSize']);
            }
            if (isset($data['hasNoLimit'])) {
                $competition->setHasNoLimit($data['hasNoLimit']);
            }
            if (isset($data['maxParticipants']) && !($data['hasNoLimit'] ?? false)) {
                $competition->setMaxParticipants((int) $data['maxParticipants']);
            }
            if (isset($data['isRankingPublic'])) {
                $competition->setIsRankingPublic((bool) $data['isRankingPublic']);
                
                // Si on publie le classement d'une compétition terminée, créer les snapshots
                $now = new \DateTime();
                $isEnded = $competition->getEndDate() < $now;
                if ($data['isRankingPublic'] && $isEnded) {
                    $snapshotService->createSnapshotsForCompetition($competition);
                }
            }
            if (isset($data['isPaused'])) {
                $competition->setIsPaused((bool) $data['isPaused']);
            }

            $entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Compétition mise à jour avec succès',
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
                    'isRankingPublic' => $competition->getIsRankingPublic(),
                    'isPaused' => $competition->getIsPaused(),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la mise à jour de la compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la mise à jour',
                'message' => 'Une erreur est survenue lors de la mise à jour de la compétition. Veuillez réessayer plus tard.'
            ], 500);
        }
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
            $this->logger->error('Erreur lors de la suppression de la compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'error' => 'Une erreur est survenue lors de la suppression',
                'message' => 'Une erreur est survenue lors de la suppression de la compétition. Veuillez réessayer plus tard.'
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
            $competition->setIsRankingPublic($data['isRankingPublic'] ?? false);
            $competition->setIsBonusEnabled($data['isBonusEnabled'] ?? false);

            if (!$data['hasNoLimit'] && isset($data['maxParticipants'])) {
                $competition->setMaxParticipants((int) $data['maxParticipants']);
            }

            $entityManager->persist($competition);
            $entityManager->flush();

            // Créer les espèces associées à la compétition si elles sont fournies
            if (isset($data['species']) && is_array($data['species'])) {
                $speciesRepository = $entityManager->getRepository(\App\Entity\Species\Species::class);
                foreach ($data['species'] as $speciesData) {
                    if (!isset($speciesData['speciesId']) || !isset($speciesData['coefficient'])) {
                        continue; // Ignorer les espèces incomplètes
                    }

                    try {
                        $species = $speciesRepository->find($speciesData['speciesId']);
                        if (!$species) {
                            continue; // Ignorer si l'espèce n'existe pas
                        }

                        $competitionSpecies = new CompetitionSpecies();
                        $competitionSpecies->setCompetition($competition);
                        $competitionSpecies->setSpecies($species);
                        $competitionSpecies->setCoefficient((float) $speciesData['coefficient']);
                        // basePoints seulement si le bonus est activé pour la compétition
                        if ($competition->getIsBonusEnabled() && isset($speciesData['basePoints'])) {
                            $competitionSpecies->setBasePoints((int) $speciesData['basePoints']);
                        } else {
                            $competitionSpecies->setBasePoints(null);
                        }

                        $entityManager->persist($competitionSpecies);
                    } catch (\Exception $e) {
                        // Log l'erreur mais continue la création
                        error_log('Erreur lors de la création d\'une espèce de compétition: ' . $e->getMessage());
                    }
                }
                $entityManager->flush();
            }

            // Créer les pauses programmées si elles sont fournies
            if (isset($data['scheduledPauses']) && is_array($data['scheduledPauses'])) {
                $timezoneParis = new \DateTimeZone('Europe/Paris');
                foreach ($data['scheduledPauses'] as $pauseData) {
                    if (!isset($pauseData['startDate']) || !isset($pauseData['endDate'])) {
                        continue; // Ignorer les pauses incomplètes
                    }

                    try {
                        // Interpréter les dates comme heure Europe/Paris (saisie utilisateur) puis convertir en UTC pour le stockage
                        $startDate = new \DateTime($pauseData['startDate'], $timezoneParis);
                        $endDate = new \DateTime($pauseData['endDate'], $timezoneParis);
                        $startDate->setTimezone(new \DateTimeZone('UTC'));
                        $endDate->setTimezone(new \DateTimeZone('UTC'));

                        // Vérifier que la pause est dans les dates de la compétition
                        if ($startDate < $competition->getStartDate() || $endDate > $competition->getEndDate()) {
                            continue; // Ignorer les pauses hors des dates de compétition
                        }

                        if ($endDate <= $startDate) {
                            continue; // Ignorer les pauses invalides
                        }

                        $pause = new ScheduledPause();
                        $pause->setCompetition($competition);
                        $pause->setStartDate($startDate);
                        $pause->setEndDate($endDate);
                        $pause->setReason($pauseData['reason'] ?? null);
                        $pause->setIsActive(true);

                        $entityManager->persist($pause);
                    } catch (\Exception $e) {
                        // Log l'erreur mais continue la création de la compétition
                        error_log('Erreur lors de la création d\'une pause programmée: ' . $e->getMessage());
                    }
                }
                $entityManager->flush();
            }

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
                    'isRankingPublic' => $competition->getIsRankingPublic(),
                ]
            ], 201);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la création de la compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'error' => 'Une erreur est survenue lors de la création',
                'message' => 'Une erreur est survenue lors de la création de la compétition. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/competitions/{id}/teams/register', name: 'register_team_to_competition', methods: ['POST'])]
    public function registerTeamToCompetition(
        int $id,
        Request $request,
        CompetitionRepository $competitionRepo,
        TeamRepository $teamRepo,
        EntityManagerInterface $em,
        EmailService $emailService,
        NotificationService $notificationService
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $data = json_decode($request->getContent(), true);
            if (!isset($data['teamId'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'ID de l\'équipe est requis'
                ], 400);
            }

            $competition = $competitionRepo->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            // Définir la date actuelle une seule fois
            $now = new \DateTime();
            
            // Vérifier que la compétition n'est pas terminée
            if ($competition->getEndDate() < $now) {
                return $this->json([
                    'success' => false,
                    'message' => 'Impossible de s\'inscrire à une compétition terminée'
                ], 400);
            }

            // Vérifier que la compétition a commencé ou est à venir
            if ($competition->getStartDate() > $now) {
                // Compétition à venir - OK
            } else {
                // Compétition en cours - OK
            }

            $team = $teamRepo->find($data['teamId']);
            if (!$team) {
                return $this->json([
                    'success' => false,
                    'message' => 'Équipe non trouvée'
                ], 404);
            }

            // Vérifier que l'utilisateur est membre de l'équipe
            if (!$team->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous devez être membre de l\'équipe pour l\'inscrire à une compétition'
                ], 403);
            }

            // Vérifier que l'équipe n'est pas déjà inscrite à une compétition EN COURS ou À VENIR
            // Si l'équipe est inscrite à une compétition terminée, on peut s'inscrire à la nouvelle
            // IMPORTANT: On ne désinscrit PAS de l'ancienne compétition pour préserver l'historique
            // Les snapshots et les prises restent liés à l'équipe et à l'ancienne compétition
            if ($team->getCompetition()) {
                $oldCompetition = $team->getCompetition();
                
                // Si la compétition précédente est terminée, on peut s'inscrire à la nouvelle
                if ($oldCompetition->getEndDate() < $now) {
                    // Permettre l'inscription à la nouvelle compétition
                    // Note: Avec la structure ManyToOne actuelle, on change la compétition "active" de l'équipe
                    // L'historique est préservé via:
                    // 1. Les snapshots (CompetitionTeamSnapshot) créés à la fin de l'ancienne compétition
                    // 2. Les prises (FishCatch) qui restent liées à l'équipe (même si team.competition change)
                    // 3. Les prises peuvent être filtrées par date de création pour retrouver celles de l'ancienne compétition
                    // 
                    // Pour l'instant, on change la compétition active, mais l'historique reste accessible
                    // via les snapshots et les prises filtrées par date
                } else {
                    // La compétition précédente est encore en cours ou à venir
                    return $this->json([
                        'success' => false,
                        'message' => 'Cette équipe est déjà inscrite à une compétition en cours ou à venir'
                    ], 400);
                }
            }

            // Vérifier la taille de l'équipe
            $teamMemberCount = $team->getMembers()->count();
            if ($teamMemberCount !== $competition->getTeamSize()) {
                return $this->json([
                    'success' => false,
                    'message' => "Cette compétition nécessite {$competition->getTeamSize()} membre(s) par équipe, mais votre équipe en a {$teamMemberCount}"
                ], 400);
            }

            // Vérifier les limites de participants si la compétition a une limite
            if (!$competition->getHasNoLimit()) {
                $currentTeamCount = $competition->getTeams()->count();
                $maxTeams = $competition->getMaxParticipants() / $competition->getTeamSize();
                
                if ($currentTeamCount >= $maxTeams) {
                    return $this->json([
                        'success' => false,
                        'message' => 'La compétition a atteint le nombre maximum d\'équipes autorisées'
                    ], 400);
                }
            }

            // Attribuer le numéro d'inscription
            $lastTeam = $teamRepo->findLastTeamNumberByCompetition($competition);
            $team->setRegistrationNumber($lastTeam ? $lastTeam + 1 : 1);
            $team->setCompetition($competition);

            $em->flush();

            // Envoyer les emails de confirmation à tous les membres de l'équipe
            try {
                $emailService->sendCompetitionRegistrationEmail($team, $competition);
            } catch (\Exception $e) {
                // Log l'erreur mais ne pas faire échouer l'inscription
                error_log('Erreur lors de l\'envoi des emails d\'inscription à la compétition: ' . $e->getMessage());
            }

            // Créer des notifications pour tous les membres de l'équipe
            foreach ($team->getMembers() as $member) {
                try {
                    $notificationService->notifyCompetitionRegistration(
                        $member,
                        $competition->getName(),
                        $competition->getId()
                    );
                } catch (\Exception $e) {
                    error_log('Erreur lors de la création de la notification d\'inscription: ' . $e->getMessage());
                }
            }

            return $this->json([
                'success' => true,
                'message' => 'Équipe inscrite à la compétition avec succès',
                'team' => [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'registrationNumber' => $team->getRegistrationNumber(),
                ]
            ], 200);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de l\'inscription à la compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'inscription à la compétition. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/competitions/{id}/teams/unregister', name: 'unregister_team_from_competition', methods: ['POST'])]
    public function unregisterTeamFromCompetition(
        int $id,
        CompetitionRepository $competitionRepo,
        TeamRepository $teamRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $competition = $competitionRepo->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            $now = new \DateTime();
            
            // Vérifier que la compétition est à venir (pas encore commencée)
            if ($competition->getStartDate() <= $now) {
                return $this->json([
                    'success' => false,
                    'message' => 'Impossible de quitter une compétition en cours ou terminée. Vous ne pouvez quitter que les compétitions à venir.'
                ], 400);
            }

            // Trouver l'équipe de l'utilisateur inscrite à cette compétition
            $userTeams = $teamRepo->findBy(['competition' => $competition]);
            $userTeam = null;
            
            foreach ($userTeams as $team) {
                if ($team->getMembers()->contains($user)) {
                    $userTeam = $team;
                    break;
                }
            }

            if (!$userTeam) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas inscrit à cette compétition'
                ], 404);
            }

            // Vérifier que l'utilisateur est membre de l'équipe
            if (!$userTeam->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous devez être membre de l\'équipe pour quitter la compétition'
                ], 403);
            }

            // Retirer l'équipe de la compétition
            $userTeam->setCompetition(null);
            $userTeam->setRegistrationNumber(null);

            $em->flush();

            return $this->json([
                'success' => true,
                'message' => 'Vous avez quitté la compétition avec succès'
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la désinscription de la compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la désinscription. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/competitions/{id}/stats', name: 'app_competition_stats_public', methods: ['GET'])]
    public function getCompetitionStatsPublic(int $id, CompetitionRepository $competitionRepo, FishCatchRepository $catchRepo, CompetitionSpeciesRepository $competitionSpeciesRepo): JsonResponse
    {
        // Utiliser la même méthode que l'endpoint admin, mais accessible publiquement
        return $this->getCompetitionStats($id, $competitionRepo, $catchRepo, $competitionSpeciesRepo);
    }

    #[Route('/admin/competitions/{id}/stats', name: 'app_admin_competition_stats', methods: ['GET'])]
    public function getCompetitionStats(int $id, CompetitionRepository $competitionRepo, FishCatchRepository $catchRepo, CompetitionSpeciesRepository $competitionSpeciesRepo): JsonResponse
    {
        try {
            // Charger la compétition avec ses CompetitionSpecies
            $competition = $competitionRepo->createQueryBuilder('c')
                ->leftJoin('c.competitionSpecies', 'cs')
                ->addSelect('cs')
                ->where('c.id = :id')
                ->setParameter('id', $id)
                ->getQuery()
                ->getOneOrNullResult();
            
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            // Vérifier les permissions : admin OU classement public
            $user = $this->getUser();
            $isAdmin = $user && in_array('ROLE_ADMIN', $user->getRoles());
            $isRankingPublic = $competition->getIsRankingPublic();
            
            if (!$isAdmin && !$isRankingPublic) {
                return $this->json([
                    'success' => false,
                    'message' => 'Les statistiques ne sont pas encore disponibles'
                ], 403);
            }

            // Créer un mapping des espèces vers leurs coefficients de compétition
            $competitionSpeciesMap = [];
            foreach ($competition->getCompetitionSpecies() as $compSpecies) {
                $competitionSpeciesMap[$compSpecies->getSpecies()->getId()] = $compSpecies;
            }

            // Récupérer toutes les prises validées de cette compétition
            // Utiliser la relation directe avec competition pour préserver l'historique
            // IMPORTANT: Filtrer strictement par competition ID pour éviter d'afficher des prises d'autres compétitions
            $catches = $catchRepo->createQueryBuilder('c')
                ->join('c.team', 't')
                ->join('c.species', 's')
                ->leftJoin('c.caughtBy', 'u')
                ->where('c.competition = :competitionId')
                ->andWhere('c.competition IS NOT NULL') // S'assurer que la compétition n'est pas null
                ->andWhere('c.isValidated = :validated')
                ->setParameter('competitionId', $competition->getId())
                ->setParameter('validated', true)
                ->getQuery()
                ->getResult();

            // Statistiques par espèce
            $speciesStats = [];
            $totalCatches = count($catches);
            $top3BySpecies = [];

            foreach ($catches as $catch) {
                $species = $catch->getSpecies();
                $speciesId = $species->getId();
                $speciesName = $species->getName();

                // Récupérer le coefficient de la compétition si disponible, sinon utiliser celui de l'espèce
                $coefficient = $species->getCoefficient();
                if (isset($competitionSpeciesMap[$speciesId])) {
                    $coefficient = $competitionSpeciesMap[$speciesId]->getCoefficient();
                }

                // Compter par espèce
                if (!isset($speciesStats[$speciesId])) {
                    $speciesStats[$speciesId] = [
                        'id' => $speciesId,
                        'name' => $speciesName,
                        'coefficient' => $coefficient,
                        'count' => 0,
                    ];
                }
                $speciesStats[$speciesId]['count']++;

                // Initialiser le tableau pour cette espèce si nécessaire
                if (!isset($top3BySpecies[$speciesId])) {
                    $top3BySpecies[$speciesId] = [];
                }

                // Utiliser le coefficient déjà calculé ci-dessus

                // Ajouter cette prise au tableau de l'espèce
                $top3BySpecies[$speciesId][] = [
                    'id' => $catch->getId(),
                    'size' => $catch->getSize(),
                    'species' => [
                        'id' => $speciesId,
                        'name' => $speciesName,
                        'coefficient' => $coefficient,
                    ],
                    'team' => [
                        'id' => $catch->getTeam()->getId(),
                        'name' => $catch->getTeam()->getName(),
                        'registrationNumber' => $catch->getTeam()->getRegistrationNumber(),
                    ],
                    'caughtBy' => $catch->getCaughtBy() ? [
                        'id' => $catch->getCaughtBy()->getId(),
                        'firstname' => $catch->getCaughtBy()->getFirstname(),
                        'lastname' => $catch->getCaughtBy()->getLastname(),
                    ] : null,
                    'points' => $catch->calculatePoints(),
                    'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                    'latitude' => $catch->getLatitude(),
                    'longitude' => $catch->getLongitude(),
                ];
            }

            // Trier et prendre le top 3 pour chaque espèce
            $top3BySpeciesFormatted = [];
            foreach ($top3BySpecies as $speciesId => $catchesForSpecies) {
                // Trier par taille décroissante
                usort($catchesForSpecies, function($a, $b) {
                    return $b['size'] <=> $a['size'];
                });
                
                // Prendre les 3 premiers
                $top3BySpeciesFormatted[$speciesId] = array_slice($catchesForSpecies, 0, 3);
            }

            // Préparer les données des prises avec coordonnées GPS pour la carte
            $catchesForMap = [];
            foreach ($catches as $catch) {
                if ($catch->getLatitude() && $catch->getLongitude()) {
                    $catchesForMap[] = [
                        'id' => $catch->getId(),
                        'size' => $catch->getSize(),
                        'species' => [
                            'id' => $catch->getSpecies()->getId(),
                            'name' => $catch->getSpecies()->getName(),
                        ],
                        'team' => [
                            'id' => $catch->getTeam()->getId(),
                            'name' => $catch->getTeam()->getName(),
                        ],
                        'caughtBy' => $catch->getCaughtBy() ? [
                            'id' => $catch->getCaughtBy()->getId(),
                            'firstname' => $catch->getCaughtBy()->getFirstname(),
                            'lastname' => $catch->getCaughtBy()->getLastname(),
                        ] : null,
                        'points' => $catch->calculatePoints(),
                        'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                        'latitude' => $catch->getLatitude(),
                        'longitude' => $catch->getLongitude(),
                    ];
                }
            }

            return $this->json([
                'success' => true,
                'competition' => [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                ],
                'stats' => [
                    'totalCatches' => $totalCatches,
                    'speciesStats' => array_values($speciesStats),
                    'top3BySpecies' => $top3BySpeciesFormatted,
                    'catchesForMap' => $catchesForMap, // Ajouter les prises avec GPS pour la carte
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des statistiques de compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la récupération des statistiques',
                'message' => 'Une erreur est survenue lors de la récupération des statistiques. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    /**
     * Met en pause ou reprend une compétition
     */
    #[Route('/admin/competitions/{id}/pause', name: 'app_admin_competition_pause', methods: ['POST'])]
    public function togglePause(int $id, Request $request, CompetitionRepository $repository, EntityManagerInterface $entityManager, NotificationService $notificationService): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competition = $repository->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $isPaused = $data['isPaused'] ?? !$competition->getIsPaused();

            $competition->setIsPaused($isPaused);
            $entityManager->flush();

            // Notifier tous les membres des équipes inscrites
            foreach ($competition->getTeams() as $team) {
                foreach ($team->getMembers() as $member) {
                    try {
                        if ($isPaused) {
                            $notificationService->notifyCompetitionPaused(
                                $member,
                                $competition->getName(),
                                $competition->getId()
                            );
                        } else {
                            $notificationService->notifyCompetitionResumed(
                                $member,
                                $competition->getName(),
                                $competition->getId()
                            );
                        }
                    } catch (\Exception $e) {
                        error_log('Erreur lors de la création de la notification de pause: ' . $e->getMessage());
                    }
                }
            }

            return $this->json([
                'success' => true,
                'message' => $isPaused ? 'Compétition mise en pause' : 'Compétition reprise',
                'competition' => [
                    'id' => $competition->getId(),
                    'isPaused' => $competition->getIsPaused(),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la pause/reprise de la compétition', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue',
                'message' => 'Une erreur est survenue lors de la modification de l\'état de la compétition. Veuillez réessayer plus tard.'
            ], 500);
        }
    }
}
