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

#[Route('/api')]
class CompetitionController extends AbstractController
{
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
                    'isRankingPublic' => $competition->getIsRankingPublic(),
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
                ];
            }, $competitions);

            return $this->json([
                'success' => true,
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des compétitions en cours: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/competitions/{id}', name: 'get_competition', methods: ['GET'])]
    public function getCompetition(int $id, CompetitionRepository $repository, TeamRepository $teamRepository, CompetitionSnapshotService $snapshotService): JsonResponse
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
        $now = new \DateTime();
        $isEnded = $competition->getEndDate() < $now;
        
        // Déterminer quelles équipes retourner selon les règles de sécurité
        $teamsToReturn = [];
        $useSnapshots = false;

        // La visibilité du classement dépend de isRankingPublic ET du statut de la compétition
        // Si la compétition est terminée ET que le classement est public, tout le monde peut voir
        // Sinon, seuls les admins peuvent voir le classement complet
        $rankingVisible = ($isEnded && $competition->getIsRankingPublic()) || $isAdmin;
        
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
                
                // Trier par score décroissant
                usort($allTeams, function($a, $b) {
                    return ($b->getTotalScore() ?? 0) - ($a->getTotalScore() ?? 0);
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
            'teams' => array_map(function ($teamOrSnapshot) use ($rankingVisible, $isAdmin, $user, $teamRepository, $useSnapshots) {
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
                    return [
                        'id' => $teamOrSnapshot->getId(),
                        'name' => $teamOrSnapshot->getName(),
                        'totalScore' => $showScore ? $teamOrSnapshot->getTotalScore() : null,
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
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la mise à jour',
                'message' => $e->getMessage()
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
            $competition->setIsRankingPublic($data['isRankingPublic'] ?? false);

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
                    'isRankingPublic' => $competition->getIsRankingPublic(),
                ]
            ], 201);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue lors de la création',
                'message' => $e->getMessage()
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
        EmailService $emailService
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

            // Vérifier que la compétition n'est pas terminée
            $now = new \DateTime();
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

            // Vérifier que l'équipe n'est pas déjà inscrite à une compétition EN COURS
            // Si l'équipe est inscrite à une compétition terminée, on peut la désinscrire et s'inscrire à la nouvelle
            if ($team->getCompetition()) {
                $now = new \DateTime();
                $oldCompetition = $team->getCompetition();
                
                // Si la compétition précédente est terminée, on peut s'inscrire à la nouvelle
                if ($oldCompetition->getEndDate() < $now) {
                    // Désinscrire de l'ancienne compétition
                    $team->setCompetition(null);
                    $team->setRegistrationNumber(null);
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
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription à la compétition: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/competitions/{id}/stats', name: 'app_admin_competition_stats', methods: ['GET'])]
    public function getCompetitionStats(int $id, CompetitionRepository $competitionRepo, FishCatchRepository $catchRepo): JsonResponse
    {
        try {
            $competition = $competitionRepo->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            // Vérifier les permissions : admin OU classement public
            $isAdmin = $this->isGranted('ROLE_ADMIN');
            $isRankingPublic = $competition->getIsRankingPublic();
            
            if (!$isAdmin && !$isRankingPublic) {
                return $this->json([
                    'success' => false,
                    'message' => 'Les statistiques ne sont pas encore disponibles'
                ], 403);
            }

            // Récupérer toutes les prises validées de cette compétition
            $catches = $catchRepo->createQueryBuilder('c')
                ->join('c.team', 't')
                ->join('c.species', 's')
                ->leftJoin('c.caughtBy', 'u')
                ->where('t.competition = :competitionId')
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

                // Compter par espèce
                if (!isset($speciesStats[$speciesId])) {
                    $speciesStats[$speciesId] = [
                        'id' => $speciesId,
                        'name' => $speciesName,
                        'coefficient' => $species->getCoefficient(),
                        'count' => 0,
                    ];
                }
                $speciesStats[$speciesId]['count']++;

                // Initialiser le tableau pour cette espèce si nécessaire
                if (!isset($top3BySpecies[$speciesId])) {
                    $top3BySpecies[$speciesId] = [];
                }

                // Ajouter cette prise au tableau de l'espèce
                $top3BySpecies[$speciesId][] = [
                    'id' => $catch->getId(),
                    'size' => $catch->getSize(),
                    'species' => [
                        'id' => $speciesId,
                        'name' => $speciesName,
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
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'Une erreur est survenue lors de la récupération des statistiques',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
