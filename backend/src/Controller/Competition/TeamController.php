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

#[Route('/teams', name: 'team_')]
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

    #[Route('', name: 'list', methods: ['GET'])]
    public function index(TeamRepository $repository): JsonResponse
    {
        try {
            $teams = $repository->findAllWithDetails();

            // Debug
            $this->logger->debug('Teams data:', [
                'first_team' => isset($teams[0]) ? [
                    'id' => $teams[0]->getId(),
                    'name' => $teams[0]->getName(),
                    'members' => array_map(fn($m) => [
                        'id' => $m->getId(),
                        'firstname' => $m->getFirstname(),
                        'lastname' => $m->getLastname()
                    ], $teams[0]->getMembers()->toArray())
                ] : null
            ]);

            return $this->json([
                'success' => true,
                'teams' => $teams
            ], 200, [], [
                'groups' => ['team:read', 'user:read', 'catch:read', 'species:read'],
                'circular_reference_handler' => function ($object) {
                    return $object->getId();
                }
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

            return $this->json([
                'success' => true,
                'team' => $team,
                'message' => 'Équipe créée avec succès'
            ], 201, [], ['groups' => ['team:read', 'user:read']]);
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

    #[Route('/competitions/{competitionId}/register', name: 'register_to_competition', methods: ['POST'])]
    public function registerToCompetition(
        int $competitionId,
        Request $request,
        CompetitionRepository $competitionRepo,
        TeamRepository $teamRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        try {
            $data = json_decode($request->getContent(), true);
            if (!isset($data['teamId'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'ID de l\'équipe est requis'
                ], 400);
            }

            $competition = $competitionRepo->find($competitionId);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            $team = $teamRepo->find($data['teamId']);
            if (!$team) {
                return $this->json([
                    'success' => false,
                    'message' => 'Équipe non trouvée'
                ], 404);
            }

            if ($team->getCompetition()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette équipe est déjà inscrite à une compétition'
                ], 400);
            }

            // Attribuer le numéro d'inscription
            $lastTeam = $teamRepo->findLastTeamNumberByCompetition($competition);
            $team->setRegistrationNumber($lastTeam ? $lastTeam->getRegistrationNumber() + 1 : 1);
            $team->setCompetition($competition);

            $em->flush();

            return $this->json([
                'success' => true,
                'team' => $team
            ], 200, [], ['groups' => ['team:read', 'user:read']]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription à la compétition: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'competition_team_show', methods: ['GET'])]
    public function show(int $competitionId, Team $team): JsonResponse
    {
        return $this->json($team, 200, [], ['groups' => ['team:read', 'user:read']]);
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

            return $this->json([
                'success' => true,
                'team' => $team
            ], 200, [], ['groups' => ['team:read', 'user:read']]);
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
        $user = $this->getUser();
        if (!$team->getMembers()->contains($user)) {
            return $this->json([
                'message' => 'Vous n\'êtes pas membre de cette équipe'
            ], 403);
        }

        try {
            $team->removeMember($user);

            // Si l'équipe n'a plus de membres, la supprimer
            if ($team->getMembers()->isEmpty()) {
                $this->entityManager->remove($team);
            }

            $this->entityManager->flush();

            return $this->json([
                'message' => 'Vous avez quitté l\'équipe avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors du départ de l\'équipe: ' . $e->getMessage()
            ], 500);
        }
    }
}
