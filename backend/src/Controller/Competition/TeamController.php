<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Team;
use App\Repository\Competition\TeamRepository;
use App\Repository\Competition\FishCatchRepository;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\Competition\CompetitionRepository;
use App\DTO\Competition\CreateTeamRequest;
use Psr\Log\LoggerInterface;
use Symfony\Component\Serializer\SerializerInterface;
use App\Service\EmailService;

#[Route('/api/teams', name: 'team_')]
class TeamController extends AbstractController
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer,
        private EmailService $emailService
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
                ->leftJoin('t.competition', 'comp');
            
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
                    'competition' => $catch->getTeam()->getCompetition() ? [
                        'id' => $catch->getTeam()->getCompetition()->getId(),
                        'name' => $catch->getTeam()->getCompetition()->getName(),
                        'startDate' => $catch->getTeam()->getCompetition()->getStartDate()->format('Y-m-d H:i:s'),
                        'endDate' => $catch->getTeam()->getCompetition()->getEndDate()->format('Y-m-d H:i:s'),
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
            $team->addMember($user);

            // Ajouter le second participant s'il est fourni
            if (isset($data['participant2Email']) && !empty($data['participant2Email'])) {
                $participant2 = $userRepository->findOneByEmail($data['participant2Email']);
                if (!$participant2) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Aucun utilisateur trouvé avec cet email'
                    ], 404);
                }

                // Vérifier si le second participant a déjà une équipe active
                $existingTeam2 = $this->entityManager->getRepository(Team::class)->findTeamsByMember($participant2, true);
                if (count($existingTeam2) > 0) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Le second participant est déjà membre d\'une équipe active'
                    ], 400);
                }

                if ($participant2 === $user) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas vous ajouter vous-même comme second participant'
                    ], 400);
                }

                $team->addMember($participant2);
            }

            $this->entityManager->persist($team);
            $this->entityManager->flush();

            // Envoyer les emails de confirmation à tous les membres
            try {
                $this->emailService->sendTeamCreationEmail($team);
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

            // Ajouter le membre à l'équipe
            $team->addMember($invitedUser);
            $this->entityManager->flush();

            // Envoyer un email d'invitation
            try {
                $this->emailService->sendTeamInvitationEmail($team, $invitedUser);
            } catch (\Exception $e) {
                $this->logger->error('Erreur lors de l\'envoi de l\'email d\'invitation', [
                    'error' => $e->getMessage()
                ]);
            }

            return $this->json([
                'success' => true,
                'message' => 'Membre invité avec succès',
                'team' => [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
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
    public function show(Team $team): JsonResponse
    {
        // Calculer le bonus de l'équipe
        $validatedCatches = [];
        $uniqueSpecies = [];
        $hasGobi = false;
        foreach ($team->getCatches() as $catch) {
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
        
        // Transformer manuellement les données pour éviter les références circulaires
        return $this->json([
            'success' => true,
            'team' => [
                'id' => $team->getId(),
                'name' => $team->getName(),
                'totalScore' => $team->getTotalScore(),
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
                'catches' => array_map(function ($catch) {
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
                        'rejectionReason' => $catch->getRejectionReason(),
                        'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                        'caughtBy' => $catch->getCaughtBy() ? [
                            'id' => $catch->getCaughtBy()->getId(),
                            'firstname' => $catch->getCaughtBy()->getFirstname(),
                            'lastname' => $catch->getCaughtBy()->getLastname(),
                        ] : null,
                    ];
                }, $team->getCatches()->toArray()),
            ]
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(Team $team, Request $request): JsonResponse
    {
        if (!$this->isTeamMember($team)) {
            return $this->json([
                'success' => false,
                'message' => 'Vous devez être membre de l\'équipe pour la modifier'
            ], 403);
        }

        try {
            $data = json_decode($request->getContent(), true);

            if (isset($data['name'])) {
                $team->setName($data['name']);
            }

            $this->entityManager->flush();

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
                'team' => $teamData
            ]);
        } catch (\Exception $e) {
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
}
