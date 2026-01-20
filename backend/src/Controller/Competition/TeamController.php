<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Team;
use App\Entity\Competition\TeamInvitation;
use App\Repository\Competition\TeamRepository;
use App\Repository\Competition\TeamInvitationRepository;
use App\Repository\Competition\FishCatchRepository;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\CompetitionSpeciesRepository;
use App\DTO\Competition\CreateTeamRequest;
use Psr\Log\LoggerInterface;
use Symfony\Component\Serializer\SerializerInterface;
use App\Service\EmailService;
use App\Service\NotificationService;

#[Route('/api/teams', name: 'team_')]
class TeamController extends AbstractController
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer,
        private EmailService $emailService,
        private NotificationService $notificationService
    ) {}

    private function isTeamMember(Team $team): bool
    {
        $user = $this->getUser();
        return $user && $team->getMembers()->contains($user);
    }

    #[Route('/my-teams', name: 'my_teams', methods: ['GET'])]
    public function getMyTeams(TeamRepository $repository): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $teams = $repository->findTeamsByMember($user);
            
            // Retourner toutes les équipes de l'utilisateur (avec ou sans compétition)
            // Transformer manuellement les données pour éviter les références circulaires et réduire la taille
            $teamsData = array_map(function ($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'totalScore' => $team->getTotalScore(),
                    'hasBonus' => $team->getHasBonus(),
                    'registrationNumber' => $team->getRegistrationNumber(),
                    'members' => array_map(function ($member) {
                        return [
                            'id' => $member->getId(),
                            'firstname' => $member->getFirstname(),
                            'lastname' => $member->getLastname(),
                            'email' => $member->getEmail(),
                        ];
                    }, $team->getMembers()->toArray()),
                    'competition' => $team->getCompetition() ? [
                        'id' => $team->getCompetition()->getId(),
                        'name' => $team->getCompetition()->getName(),
                        'startDate' => $team->getCompetition()->getStartDate()->format('Y-m-d H:i:s'),
                        'endDate' => $team->getCompetition()->getEndDate()->format('Y-m-d H:i:s'),
                    ] : null,
                    'isActive' => $team->getIsActive(),
                ];
            }, array_values($teams));

            return $this->json([
                'success' => true,
                'teams' => $teamsData
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des équipes: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/my-history', name: 'my_history', methods: ['GET'])]
    public function getMyHistory(
        TeamRepository $teamRepository,
        FishCatchRepository $catchRepository
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Récupérer toutes les équipes de l'utilisateur (actives et inactives)
            $allTeams = $teamRepository->findUserHistory($user);
            
            // Récupérer TOUTES les prises de l'utilisateur :
            // 1. Toutes les prises où l'utilisateur est "caughtBy" (même s'il n'est plus membre de l'équipe)
            // 2. OU toutes les prises des équipes où l'utilisateur était membre
            $teamIds = array_map(function($team) {
                return $team->getId();
            }, $allTeams);
            
            $qb = $catchRepository->createQueryBuilder('c')
                ->join('c.team', 't')
                ->leftJoin('c.species', 's')
                ->leftJoin('c.caughtBy', 'u')
                ->leftJoin('c.competition', 'comp'); // Utiliser la relation directe avec competition
            
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

            // Transformer les équipes
            $teamsData = array_map(function ($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'totalScore' => $team->getTotalScore(),
                    'hasBonus' => $team->getHasBonus(),
                    'registrationNumber' => $team->getRegistrationNumber(),
                    'isActive' => $team->getIsActive(),
                    'members' => array_map(function ($member) {
                        return [
                            'id' => $member->getId(),
                            'firstname' => $member->getFirstname(),
                            'lastname' => $member->getLastname(),
                        ];
                    }, $team->getMembers()->toArray()),
                    'competition' => $team->getCompetition() ? [
                        'id' => $team->getCompetition()->getId(),
                        'name' => $team->getCompetition()->getName(),
                        'startDate' => $team->getCompetition()->getStartDate()->format('Y-m-d H:i:s'),
                        'endDate' => $team->getCompetition()->getEndDate()->format('Y-m-d H:i:s'),
                    ] : null,
                    'catchesCount' => $team->getCatches()->count(),
                ];
            }, $allTeams);

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
                    'points' => $catch->calculatePoints(),
                    'photoUrl' => $catch->getPhotoUrl(),
                    'comment' => $catch->getComment(),
                    'isValidated' => $catch->isValidated(),
                    'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                    'caughtBy' => $catch->getCaughtBy() ? [
                        'id' => $catch->getCaughtBy()->getId(),
                        'firstname' => $catch->getCaughtBy()->getFirstname(),
                        'lastname' => $catch->getCaughtBy()->getLastname(),
                    ] : null,
                    'team' => [
                        'id' => $catch->getTeam()->getId(),
                        'name' => $catch->getTeam()->getName(),
                        'isActive' => $catch->getTeam()->getIsActive(),
                    ],
                    'competition' => $catch->getCompetition() ? [
                        'id' => $catch->getCompetition()->getId(),
                        'name' => $catch->getCompetition()->getName(),
                        'startDate' => $catch->getCompetition()->getStartDate()->format('Y-m-d H:i:s'),
                        'endDate' => $catch->getCompetition()->getEndDate()->format('Y-m-d H:i:s'),
                    ] : null,
                ];
            }, $allCatches);

            // Calculer les statistiques
            $totalCatches = count($allCatches);
            $validatedCatches = array_filter($allCatches, function($c) {
                return $c->isValidated();
            });
            $totalPoints = array_sum(array_map(function($c) {
                return $c->calculatePoints();
            }, $validatedCatches));
            
            $speciesStats = [];
            foreach ($validatedCatches as $catch) {
                $speciesId = $catch->getSpecies()->getId();
                $speciesName = $catch->getSpecies()->getName();
                if (!isset($speciesStats[$speciesId])) {
                    $speciesStats[$speciesId] = [
                        'id' => $speciesId,
                        'name' => $speciesName,
                        'count' => 0,
                        'totalPoints' => 0,
                    ];
                }
                $speciesStats[$speciesId]['count']++;
                $speciesStats[$speciesId]['totalPoints'] += $catch->calculatePoints();
            }

            return $this->json([
                'success' => true,
                'teams' => $teamsData,
                'catches' => $catchesData,
                'statistics' => [
                    'totalCatches' => $totalCatches,
                    'validatedCatches' => count($validatedCatches),
                    'totalPoints' => $totalPoints,
                    'speciesStats' => array_values($speciesStats),
                    'activeTeamsCount' => count(array_filter($allTeams, function($t) { return $t->getIsActive(); })),
                    'inactiveTeamsCount' => count(array_filter($allTeams, function($t) { return !$t->getIsActive(); })),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération de l\'historique', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function index(TeamRepository $repository): JsonResponse
    {
        try {
            $teams = $repository->findAllWithDetails();

            // Transformer manuellement les données pour éviter les références circulaires et réduire la taille
            $teamsData = array_map(function ($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'totalScore' => $team->getTotalScore(),
                    'hasBonus' => $team->getHasBonus(),
                    'registrationNumber' => $team->getRegistrationNumber(),
                    'members' => array_map(function ($member) {
                        return [
                            'id' => $member->getId(),
                            'firstname' => $member->getFirstname(),
                            'lastname' => $member->getLastname(),
                            'email' => $member->getEmail(),
                        ];
                    }, $team->getMembers()->toArray()),
                    'competition' => $team->getCompetition() ? [
                        'id' => $team->getCompetition()->getId(),
                        'name' => $team->getCompetition()->getName(),
                        'startDate' => $team->getCompetition()->getStartDate()->format('Y-m-d H:i:s'),
                        'endDate' => $team->getCompetition()->getEndDate()->format('Y-m-d H:i:s'),
                    ] : null,
                ];
            }, $teams);

            return $this->json([
                'success' => true,
                'teams' => $teamsData
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des équipes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des équipes: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);

            // Validation des données reçues
            if (!isset($data['name']) || empty($data['name'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'Le nom de l\'équipe est requis'
                ], 400);
            }

            // Le second participant est maintenant optionnel
            // Si fourni, on l'ajoute à l'équipe, sinon on crée l'équipe avec un seul membre

            // Validation de l'utilisateur connecté
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Vérifier si l'utilisateur connecté a déjà une équipe active
            $existingTeam = $this->entityManager->getRepository(Team::class)->findTeamsByMember($user, true);
            if (count($existingTeam) > 0) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous êtes déjà membre d\'une équipe active'
                ], 400);
            }

            // Création de l'équipe
            $team = new Team();
            $team->setName($data['name']);
            $team->setIsActive(true); // S'assurer que l'équipe est active
            $team->addMember($user);

            // Persister l'équipe d'abord pour qu'elle ait un ID
            $this->entityManager->persist($team);
            $this->entityManager->flush();

            $invitation = null; // Variable pour stocker l'invitation si créée

            // Créer une invitation pour le second participant s'il est fourni
            if (isset($data['participant2Email']) && !empty($data['participant2Email'])) {
                $participant2 = $userRepository->findOneByEmail($data['participant2Email']);
                if (!$participant2) {
                    // Supprimer l'équipe créée si l'utilisateur n'existe pas
                    $this->entityManager->remove($team);
                    $this->entityManager->flush();
                    return $this->json([
                        'success' => false,
                        'message' => 'Aucun utilisateur trouvé avec cet email'
                    ], 404);
                }

                // Vérifier si le second participant a déjà une équipe active
                $existingTeam2 = $this->entityManager->getRepository(Team::class)->findTeamsByMember($participant2, true);
                if (count($existingTeam2) > 0) {
                    // Supprimer l'équipe créée si le participant a déjà une équipe
                    $this->entityManager->remove($team);
                    $this->entityManager->flush();
                    return $this->json([
                        'success' => false,
                        'message' => 'Le second participant est déjà membre d\'une équipe active'
                    ], 400);
                }

                if ($participant2 === $user) {
                    // Supprimer l'équipe créée si l'utilisateur essaie de s'ajouter lui-même
                    $this->entityManager->remove($team);
                    $this->entityManager->flush();
                    return $this->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas vous ajouter vous-même comme second participant'
                    ], 400);
                }

                // Vérifier qu'il n'y a pas déjà une invitation en attente pour cet utilisateur
                // On vérifie toutes les invitations en attente de cet utilisateur
                $invitationRepo = $this->entityManager->getRepository(TeamInvitation::class);
                $existingInvitation = $invitationRepo->findInvitation($team, $participant2);
                if ($existingInvitation) {
                    // Supprimer l'équipe créée si une invitation existe déjà
                    $this->entityManager->remove($team);
                    $this->entityManager->flush();
                    return $this->json([
                        'success' => false,
                        'message' => 'Une invitation est déjà en attente pour cet utilisateur'
                    ], 400);
                }

                // Créer une invitation au lieu d'ajouter directement le membre
                $invitation = new TeamInvitation();
                $invitation->setTeam($team);
                $invitation->setInvitedUser($participant2);
                $invitation->setInvitedBy($user);
                $invitation->setStatus('pending');
                $this->entityManager->persist($invitation);
                $this->entityManager->flush();
            }

            // Envoyer les emails de confirmation et d'invitation
            try {
                // Email de création pour le créateur
                $this->emailService->sendTeamCreationEmail($team);
                
                // Email d'invitation pour le participant2 si une invitation a été créée
                if (isset($data['participant2Email']) && !empty($data['participant2Email']) && isset($invitation)) {
                    $this->emailService->sendTeamInvitationEmail($team, $invitation->getInvitedUser());
                    
                    // Créer une notification pour l'invité
                    try {
                        $this->notificationService->notifyTeamInvitation(
                            $invitation->getInvitedUser(),
                            $team->getName(),
                            $team->getId()
                        );
                    } catch (\Exception $e) {
                        $this->logger->error('Erreur lors de la création de la notification d\'invitation', [
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            } catch (\Exception $e) {
                // Log l'erreur mais ne pas faire échouer la création de l'équipe
                $this->logger->error('Erreur lors de l\'envoi des emails de création d\'équipe', [
                    'team_id' => $team->getId(),
                    'error' => $e->getMessage()
                ]);
            }

            // Transformer manuellement les données pour éviter les références circulaires
            $teamData = [
                'id' => $team->getId(),
                'name' => $team->getName(),
                'totalScore' => $team->getTotalScore(),
                'hasBonus' => $team->getHasBonus(),
                'registrationNumber' => $team->getRegistrationNumber(),
                'members' => array_map(function ($member) {
                    return [
                        'id' => $member->getId(),
                        'firstname' => $member->getFirstname(),
                        'lastname' => $member->getLastname(),
                        'email' => $member->getEmail(),
                    ];
                }, $team->getMembers()->toArray()),
            ];

            return $this->json([
                'success' => true,
                'team' => $teamData,
                'message' => 'Équipe créée avec succès'
            ], 201);
        } catch (\Exception $e) {
            // Log l'erreur pour le débogage
            $this->logger->error('Erreur lors de la création de l\'équipe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'équipe: ' . $e->getMessage()
            ], 500);
        }
    }

    // Route déplacée vers CompetitionController::registerTeamToCompetition
    // Utilisez /api/competitions/{id}/teams/register à la place

    #[Route('/{id}/invite', name: 'invite_member', methods: ['POST'])]
    public function inviteMember(Team $team, Request $request, UserRepository $userRepository): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            if (!$team->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous devez être membre de l\'équipe pour inviter quelqu\'un'
                ], 403);
            }

            $data = json_decode($request->getContent(), true);
            if (!isset($data['email']) || empty($data['email'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'email est requis'
                ], 400);
            }

            // Déterminer la taille maximale de l'équipe
            // Si l'équipe est inscrite à une compétition, utiliser la taille requise par la compétition
            // Sinon, permettre jusqu'à 2 membres minimum
            $maxTeamSize = 2; // Par défaut, 2 membres
            if ($team->getCompetition()) {
                $maxTeamSize = $team->getCompetition()->getTeamSize();
            }
            
            // Vérifier que l'équipe n'est pas complète
            if ($team->getMembers()->count() >= $maxTeamSize) {
                return $this->json([
                    'success' => false,
                    'message' => "L'équipe est déjà complète ({$maxTeamSize} membre(s) maximum)"
                ], 400);
            }

            // Trouver l'utilisateur à inviter
            $invitedUser = $userRepository->findOneByEmail($data['email']);
            if (!$invitedUser) {
                return $this->json([
                    'success' => false,
                    'message' => 'Aucun utilisateur trouvé avec cet email'
                ], 404);
            }

            // Vérifier que l'utilisateur invité n'est pas déjà membre de l'équipe
            if ($team->getMembers()->contains($invitedUser)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cet utilisateur est déjà membre de l\'équipe'
                ], 400);
            }

            // Vérifier que l'utilisateur invité n'est pas déjà dans une équipe active
            $existingTeam = $this->entityManager->getRepository(Team::class)->findTeamsByMember($invitedUser, true);
            if (count($existingTeam) > 0) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cet utilisateur est déjà membre d\'une équipe active'
                ], 400);
            }

            // Vérifier qu'il n'y a pas déjà une invitation en attente
            $invitationRepo = $this->entityManager->getRepository(TeamInvitation::class);
            $existingInvitation = $invitationRepo->findInvitation($team, $invitedUser);
            if ($existingInvitation) {
                return $this->json([
                    'success' => false,
                    'message' => 'Une invitation est déjà en attente pour cet utilisateur'
                ], 400);
            }

            // Créer une invitation au lieu d'ajouter directement le membre
            $invitation = new TeamInvitation();
            $invitation->setTeam($team);
            $invitation->setInvitedUser($invitedUser);
            $invitation->setInvitedBy($user);
            $invitation->setStatus('pending');
            
            $this->entityManager->persist($invitation);
            $this->entityManager->flush();

            // Envoyer un email d'invitation
            try {
                $this->emailService->sendTeamInvitationEmail($team, $invitedUser);
            } catch (\Exception $e) {
                $this->logger->error('Erreur lors de l\'envoi de l\'email d\'invitation', [
                    'error' => $e->getMessage()
                ]);
            }
            
            // Créer une notification
            try {
                $this->notificationService->notifyTeamInvitation(
                    $invitedUser,
                    $team->getName(),
                    $team->getId()
                );
            } catch (\Exception $e) {
                $this->logger->error('Erreur lors de la création de la notification d\'invitation', [
                    'error' => $e->getMessage()
                ]);
            }

            return $this->json([
                'success' => true,
                'message' => 'Invitation envoyée avec succès',
                'invitation' => [
                    'id' => $invitation->getId(),
                    'team' => [
                        'id' => $team->getId(),
                        'name' => $team->getName(),
                    ],
                    'invitedUser' => [
                        'id' => $invitedUser->getId(),
                        'email' => $invitedUser->getEmail(),
                    ],
                    'status' => $invitation->getStatus(),
                    'createdAt' => $invitation->getCreatedAt()->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de l\'invitation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'invitation: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'competition_team_show', methods: ['GET'])]
    public function show(Team $team, CompetitionSpeciesRepository $competitionSpeciesRepo): JsonResponse
    {
        // Filtrer les prises par compétition si l'équipe a une compétition
        $competitionCatches = [];
        if ($team->getCompetition()) {
            foreach ($team->getCatches() as $catch) {
                if ($catch->getCompetition() && $catch->getCompetition()->getId() === $team->getCompetition()->getId()) {
                    $competitionCatches[] = $catch;
                }
            }
        } else {
            $competitionCatches = $team->getCatches()->toArray();
        }

        // Créer un mapping des espèces vers leurs coefficients de compétition si l'équipe a une compétition
        $competitionSpeciesMap = [];
        if ($team->getCompetition()) {
            foreach ($team->getCompetition()->getCompetitionSpecies() as $compSpecies) {
                $competitionSpeciesMap[$compSpecies->getSpecies()->getId()] = $compSpecies;
            }
        }

        // Calculer le bonus de l'équipe avec les prises filtrées
        $validatedCatches = [];
        $uniqueSpecies = [];
        $hasGobi = false;
        foreach ($competitionCatches as $catch) {
            if ($catch->isValidated()) {
                $validatedCatches[] = $catch;
                $speciesId = $catch->getSpecies()->getId();
                $uniqueSpecies[$speciesId] = true;
                
                // Vérifier si c'est un gobi (coefficient 0)
                if ($catch->getSpecies()->getCoefficient() == 0) {
                    $hasGobi = true;
                }
            }
        }
        
        $uniqueSpeciesCount = count($uniqueSpecies);
        $bonus = 0;
        
        // Cas spécial : si gobi est la seule espèce, pas de bonus
        if ($uniqueSpeciesCount === 1 && $hasGobi) {
            $bonus = 0;
        } else {
            if ($uniqueSpeciesCount >= 2) {
                $bonus = ($uniqueSpeciesCount - 1) * 50;
                if ($bonus > 200) {
                    $bonus = 200;
                }
            }
        }

        // Utiliser le score filtré par compétition
        $teamScore = $team->getCompetition() 
            ? $team->getScoreForCompetition($team->getCompetition())
            : $team->getTotalScore();
        
        // Transformer manuellement les données pour éviter les références circulaires
        return $this->json([
            'success' => true,
            'team' => [
                'id' => $team->getId(),
                'name' => $team->getName(),
                'totalScore' => $teamScore,
                'hasBonus' => $team->getHasBonus(),
                'bonus' => $bonus,
                'registrationNumber' => $team->getRegistrationNumber(),
                'members' => array_map(function ($member) {
                    return [
                        'id' => $member->getId(),
                        'firstname' => $member->getFirstname(),
                        'lastname' => $member->getLastname(),
                        'email' => $member->getEmail(),
                    ];
                }, $team->getMembers()->toArray()),
                'competition' => $team->getCompetition() ? [
                    'id' => $team->getCompetition()->getId(),
                    'name' => $team->getCompetition()->getName(),
                    'teamSize' => $team->getCompetition()->getTeamSize(),
                    'startDate' => $team->getCompetition()->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $team->getCompetition()->getEndDate()->format('Y-m-d H:i:s'),
                ] : null,
                'catches' => array_map(function ($catch) use ($competitionSpeciesMap) {
                    // Récupérer le coefficient de la compétition si disponible, sinon utiliser celui de l'espèce
                    $speciesId = $catch->getSpecies()->getId();
                    $coefficient = $catch->getSpecies()->getCoefficient();
                    if (isset($competitionSpeciesMap[$speciesId])) {
                        $coefficient = $competitionSpeciesMap[$speciesId]->getCoefficient();
                    }

                    return [
                        'id' => $catch->getId(),
                        'species' => [
                            'id' => $speciesId,
                            'name' => $catch->getSpecies()->getName(),
                            'coefficient' => $coefficient,
                        ],
                        'size' => $catch->getSize(),
                        'points' => $catch->calculatePoints(),
                        'photoUrl' => $catch->getPhotoUrl(),
                        'comment' => $catch->getComment(),
                        'isValidated' => $catch->isValidated(),
                        'rejectionReason' => $catch->getRejectionReason(),
                        'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                        'caughtBy' => $catch->getCaughtBy() ? [
                            'id' => $catch->getCaughtBy()->getId(),
                            'firstname' => $catch->getCaughtBy()->getFirstname(),
                            'lastname' => $catch->getCaughtBy()->getLastname(),
                        ] : null,
                        'competition' => $catch->getCompetition() ? [
                            'id' => $catch->getCompetition()->getId(),
                            'name' => $catch->getCompetition()->getName(),
                        ] : null,
                    ];
                }, $competitionCatches),
            ]
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(Team $team, Request $request, UserRepository $userRepository): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            if (!$this->isTeamMember($team)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous devez être membre de l\'équipe pour la modifier'
                ], 403);
            }

            // Vérifier que l'équipe n'est pas inscrite dans une compétition active
            if ($team->getCompetition()) {
                $now = new \DateTime();
                $competitionEndDate = $team->getCompetition()->getEndDate();
                if ($competitionEndDate && $competitionEndDate >= $now) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Impossible de modifier une équipe inscrite dans une compétition active'
                    ], 400);
                }
            }

            $data = json_decode($request->getContent(), true);

            // Modifier le nom si fourni
            if (isset($data['name']) && !empty($data['name'])) {
                $team->setName(trim($data['name']));
            }

            // Modifier les membres si fourni
            if (isset($data['memberIds']) && is_array($data['memberIds'])) {
                // Vérifier que l'utilisateur actuel est dans la liste
                if (!in_array($user->getId(), $data['memberIds'])) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Vous devez rester membre de l\'équipe'
                    ], 400);
                }

                // Vérifier que tous les membres existent
                $newMembers = [];
                foreach ($data['memberIds'] as $memberId) {
                    $member = $userRepository->find($memberId);
                    if (!$member) {
                        return $this->json([
                            'success' => false,
                            'message' => "Membre avec l'ID {$memberId} non trouvé"
                        ], 404);
                    }

                    // Vérifier que le membre n'est pas déjà dans une autre équipe active
                    if ($member->getId() !== $user->getId()) {
                        $existingTeam = $this->entityManager->getRepository(Team::class)->findTeamsByMember($member, true);
                        foreach ($existingTeam as $existing) {
                            if ($existing->getId() !== $team->getId()) {
                                return $this->json([
                                    'success' => false,
                                    'message' => "L'utilisateur {$member->getEmail()} est déjà membre d'une autre équipe active"
                                ], 400);
                            }
                        }
                    }

                    $newMembers[] = $member;
                }

                // Déterminer la taille maximale de l'équipe
                $maxTeamSize = 2; // Par défaut
                if ($team->getCompetition()) {
                    $maxTeamSize = $team->getCompetition()->getTeamSize();
                }

                // Vérifier qu'il n'y a pas plus de membres que la taille maximale
                if (count($newMembers) > $maxTeamSize) {
                    return $this->json([
                        'success' => false,
                        'message' => "Une équipe ne peut pas avoir plus de {$maxTeamSize} membre(s)"
                    ], 400);
                }

                // Vérifier qu'il y a au moins un membre
                if (count($newMembers) < 1) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Une équipe doit avoir au moins un membre'
                    ], 400);
                }

                // Remplacer les membres
                $team->getMembers()->clear();
                foreach ($newMembers as $member) {
                    $team->addMember($member);
                }
            }

            $this->entityManager->flush();

            // Transformer manuellement les données pour éviter les références circulaires
            $teamData = [
                'id' => $team->getId(),
                'name' => $team->getName(),
                'totalScore' => $team->getTotalScore(),
                'hasBonus' => $team->getHasBonus(),
                'registrationNumber' => $team->getRegistrationNumber(),
                'isActive' => $team->getIsActive(),
                'members' => array_map(function ($member) {
                    return [
                        'id' => $member->getId(),
                        'firstname' => $member->getFirstname(),
                        'lastname' => $member->getLastname(),
                        'email' => $member->getEmail(),
                    ];
                }, $team->getMembers()->toArray()),
                'competition' => $team->getCompetition() ? [
                    'id' => $team->getCompetition()->getId(),
                    'name' => $team->getCompetition()->getName(),
                ] : null,
            ];

            return $this->json([
                'success' => true,
                'message' => 'Équipe modifiée avec succès',
                'team' => $teamData
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la modification de l\'équipe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'équipe: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Team $team): JsonResponse
    {
        if (!$this->isTeamMember($team)) {
            return $this->json([
                'message' => 'Vous devez être membre de l\'équipe pour la supprimer'
            ], 403);
        }

        try {
            $this->entityManager->remove($team);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Équipe supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/leave', name: 'team_leave', methods: ['POST'])]
    public function leaveTeam(Team $team): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            if (!$team->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas membre de cette équipe'
                ], 403);
            }

            // Retirer l'utilisateur de l'équipe
            $team->removeMember($user);

            // Si l'équipe n'a plus de membres, la marquer comme inactive (pour conserver l'historique)
            if ($team->getMembers()->isEmpty()) {
                // Marquer l'équipe comme inactive au lieu de la supprimer
                $team->setIsActive(false);
                
                // Ne pas retirer la compétition si elle est terminée (pour préserver l'historique)
                if ($team->getCompetition()) {
                    $now = new \DateTime();
                    $competitionEnded = $team->getCompetition()->getEndDate() < $now;
                    
                    // Si la compétition est terminée, garder la référence pour l'historique
                    if (!$competitionEnded) {
                        $team->setCompetition(null);
                        $team->setRegistrationNumber(null);
                    }
                }
            } else {
                // Si l'équipe avait une compétition et qu'elle n'est pas terminée, la désinscrire
                if ($team->getCompetition()) {
                    $now = new \DateTime();
                    $competitionEnded = $team->getCompetition()->getEndDate() < $now;
                    
                    // Si la compétition est terminée, garder la référence pour l'historique
                    if (!$competitionEnded) {
                        $team->setCompetition(null);
                        $team->setRegistrationNumber(null);
                    }
                }
            }

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Vous avez quitté l\'équipe avec succès'
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors du départ de l\'équipe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors du départ de l\'équipe: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/reactivate', name: 'reactivate', methods: ['POST'])]
    public function reactivateTeam(
        Team $team,
        Request $request,
        UserRepository $userRepository
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Vérifier que l'équipe est inactive
            if ($team->getIsActive()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette équipe est déjà active'
                ], 400);
            }

            // Vérifier que l'utilisateur était membre de l'équipe
            if (!$team->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'étiez pas membre de cette équipe'
                ], 403);
            }

            // Optionnel : permettre de modifier les membres lors de la réactivation
            $data = json_decode($request->getContent(), true);
            if (isset($data['memberIds']) && is_array($data['memberIds'])) {
                // Vérifier que l'utilisateur actuel est dans la liste
                if (!in_array($user->getId(), $data['memberIds'])) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Vous devez être membre de l\'équipe'
                    ], 400);
                }

                // Vérifier que tous les membres existent
                $newMembers = [];
                foreach ($data['memberIds'] as $memberId) {
                    $member = $userRepository->find($memberId);
                    if (!$member) {
                        return $this->json([
                            'success' => false,
                            'message' => "Membre avec l'ID {$memberId} non trouvé"
                        ], 404);
                    }
                    $newMembers[] = $member;
                }

                // Vérifier qu'il n'y a pas plus de 2 membres
                if (count($newMembers) > 2) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Une équipe ne peut pas avoir plus de 2 membres'
                    ], 400);
                }

                // Remplacer les membres
                $team->getMembers()->clear();
                foreach ($newMembers as $member) {
                    $team->addMember($member);
                }
            } else {
                // Si aucun membre n'est fourni, vérifier que l'équipe a au moins un membre
                if ($team->getMembers()->isEmpty()) {
                    // Si l'équipe n'a plus de membres, ajouter l'utilisateur actuel
                    $team->addMember($user);
                }
            }

            // Réactiver l'équipe
            $team->setIsActive(true);
            
            // Réinitialiser le score et la compétition pour la nouvelle compétition
            $team->setTotalScore(0);
            $team->setHasBonus(false);
            $team->setCompetition(null);
            $team->setRegistrationNumber(null);

            $this->entityManager->flush();

            // Envoyer les emails de réactivation à tous les membres
            try {
                $this->emailService->sendTeamCreationEmail($team);
            } catch (\Exception $e) {
                $this->logger->error('Erreur lors de l\'envoi des emails de réactivation', [
                    'team_id' => $team->getId(),
                    'error' => $e->getMessage()
                ]);
            }

            return $this->json([
                'success' => true,
                'message' => 'Équipe réactivée avec succès',
                'team' => [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'isActive' => $team->getIsActive(),
                    'totalScore' => $team->getTotalScore(),
                    'members' => array_map(function ($member) {
                        return [
                            'id' => $member->getId(),
                            'firstname' => $member->getFirstname(),
                            'lastname' => $member->getLastname(),
                            'email' => $member->getEmail(),
                        ];
                    }, $team->getMembers()->toArray()),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la réactivation de l\'équipe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la réactivation de l\'équipe: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/invitations/my', name: 'my_invitations', methods: ['GET'])]
    public function getMyInvitations(TeamInvitationRepository $invitationRepo): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $invitations = $invitationRepo->findPendingInvitationsForUser($user);

            $invitationsData = array_map(function ($invitation) {
                return [
                    'id' => $invitation->getId(),
                    'team' => [
                        'id' => $invitation->getTeam()->getId(),
                        'name' => $invitation->getTeam()->getName(),
                    ],
                    'invitedBy' => [
                        'id' => $invitation->getInvitedBy()->getId(),
                        'firstname' => $invitation->getInvitedBy()->getFirstname(),
                        'lastname' => $invitation->getInvitedBy()->getLastname(),
                        'email' => $invitation->getInvitedBy()->getEmail(),
                    ],
                    'status' => $invitation->getStatus(),
                    'createdAt' => $invitation->getCreatedAt()->format('Y-m-d H:i:s'),
                ];
            }, $invitations);

            return $this->json([
                'success' => true,
                'invitations' => $invitationsData
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des invitations', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des invitations: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/invitations/{id}/accept', name: 'accept_invitation', methods: ['POST'])]
    public function acceptInvitation(int $id, TeamInvitationRepository $invitationRepo): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $invitation = $invitationRepo->find($id);
            if (!$invitation) {
                return $this->json([
                    'success' => false,
                    'message' => 'Invitation non trouvée'
                ], 404);
            }

            // Vérifier que l'invitation est pour l'utilisateur connecté
            if ($invitation->getInvitedUser()->getId() !== $user->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à accepter cette invitation'
                ], 403);
            }

            // Vérifier que l'invitation est en attente
            if (!$invitation->isPending()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette invitation a déjà été traitée'
                ], 400);
            }

            $team = $invitation->getTeam();

            // Vérifier que l'équipe n'est pas complète
            $maxTeamSize = 2;
            if ($team->getCompetition()) {
                $maxTeamSize = $team->getCompetition()->getTeamSize();
            }
            
            if ($team->getMembers()->count() >= $maxTeamSize) {
                return $this->json([
                    'success' => false,
                    'message' => "L'équipe est déjà complète ({$maxTeamSize} membre(s) maximum)"
                ], 400);
            }

            // Vérifier que l'utilisateur n'est pas déjà dans une équipe active
            $existingTeam = $this->entityManager->getRepository(Team::class)->findTeamsByMember($user, true);
            if (count($existingTeam) > 0) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous êtes déjà membre d\'une équipe active'
                ], 400);
            }

            // Ajouter le membre à l'équipe
            $team->addMember($user);
            
            // Marquer l'invitation comme acceptée
            $invitation->setStatus('accepted');
            $invitation->setRespondedAt(new \DateTime());
            
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Invitation acceptée avec succès',
                'team' => [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de l\'acceptation de l\'invitation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'acceptation de l\'invitation: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/invitations/{id}/reject', name: 'reject_invitation', methods: ['POST'])]
    public function rejectInvitation(int $id, TeamInvitationRepository $invitationRepo): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $invitation = $invitationRepo->find($id);
            if (!$invitation) {
                return $this->json([
                    'success' => false,
                    'message' => 'Invitation non trouvée'
                ], 404);
            }

            // Vérifier que l'invitation est pour l'utilisateur connecté
            if ($invitation->getInvitedUser()->getId() !== $user->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas autorisé à rejeter cette invitation'
                ], 403);
            }

            // Vérifier que l'invitation est en attente
            if (!$invitation->isPending()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette invitation a déjà été traitée'
                ], 400);
            }

            // Marquer l'invitation comme rejetée
            $invitation->setStatus('rejected');
            $invitation->setRespondedAt(new \DateTime());
            
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Invitation rejetée'
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors du rejet de l\'invitation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors du rejet de l\'invitation: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}/invitations', name: 'team_invitations', methods: ['GET'])]
    public function getTeamInvitations(Team $team, TeamInvitationRepository $invitationRepo): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Vérifier que l'utilisateur est membre de l'équipe
            if (!$team->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous devez être membre de l\'équipe pour voir les invitations'
                ], 403);
            }

            $invitations = $invitationRepo->findPendingInvitationsForTeam($team);

            $invitationsData = array_map(function ($invitation) {
                return [
                    'id' => $invitation->getId(),
                    'invitedUser' => [
                        'id' => $invitation->getInvitedUser()->getId(),
                        'firstname' => $invitation->getInvitedUser()->getFirstname(),
                        'lastname' => $invitation->getInvitedUser()->getLastname(),
                        'email' => $invitation->getInvitedUser()->getEmail(),
                    ],
                    'invitedBy' => [
                        'id' => $invitation->getInvitedBy()->getId(),
                        'firstname' => $invitation->getInvitedBy()->getFirstname(),
                        'lastname' => $invitation->getInvitedBy()->getLastname(),
                    ],
                    'status' => $invitation->getStatus(),
                    'createdAt' => $invitation->getCreatedAt()->format('Y-m-d H:i:s'),
                ];
            }, $invitations);

            return $this->json([
                'success' => true,
                'invitations' => $invitationsData
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des invitations de l\'équipe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des invitations: ' . $e->getMessage()
            ], 500);
        }
    }
}
