<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Team;
use App\Repository\Competition\TeamRepository;
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

#[Route('/api/teams', name: 'team_')]
class TeamController extends AbstractController
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer
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

            if (!isset($data['participant2Email']) || empty($data['participant2Email'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'email du second participant est requis'
                ], 400);
            }

            // Validation de l'utilisateur connecté
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Vérifier si l'utilisateur connecté a déjà une équipe
            $existingTeam = $this->entityManager->getRepository(Team::class)->findTeamsByMember($user);
            if (count($existingTeam) > 0) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous êtes déjà membre d\'une équipe'
                ], 400);
            }

            // Validation du second participant
            $participant2 = $userRepository->findOneByEmail($data['participant2Email']);
            if (!$participant2) {
                return $this->json([
                    'success' => false,
                    'message' => 'Aucun utilisateur trouvé avec cet email'
                ], 404);
            }

            // Vérifier si le second participant a déjà une équipe
            $existingTeam2 = $this->entityManager->getRepository(Team::class)->findTeamsByMember($participant2);
            if (count($existingTeam2) > 0) {
                return $this->json([
                    'success' => false,
                    'message' => 'Le second participant est déjà membre d\'une équipe'
                ], 400);
            }

            if ($participant2 === $user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez pas vous ajouter vous-même comme second participant'
                ], 400);
            }

            // Création de l'équipe
            $team = new Team();
            $team->setName($data['name']);
            $team->addMember($user);
            $team->addMember($participant2);

            $this->entityManager->persist($team);
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

            // Si l'équipe n'a plus de membres, la supprimer
            if ($team->getMembers()->isEmpty()) {
                $this->entityManager->remove($team);
            } else {
                // Si l'équipe avait une compétition, la désinscrire
                if ($team->getCompetition()) {
                    $team->setCompetition(null);
                    $team->setRegistrationNumber(null);
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
}
