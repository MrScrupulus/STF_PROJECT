<?php

namespace App\Controller\Admin;

use App\Entity\Security\User;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\Competition\Team;
use App\Service\UserAnonymizerService;

#[Route('/admin')]
class AdminController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private UserAnonymizerService $userAnonymizerService
    ) {}

    #[Route('/users', name: 'admin_users_list', methods: ['GET'])]
    public function listUsers(): JsonResponse
    {
        $users = $this->userRepository->findAllActive();
        $usersData = array_map(function ($user) {
            return [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'phoneNumber' => $user->getPhoneNumber(),
                'isVerified' => $user->isVerified(),
            ];
        }, $users);

        return $this->json(['users' => $usersData]);
    }

    #[Route('/users/{id}/toggle-role', name: 'admin_toggle_role', methods: ['PUT'])]
    public function toggleUserRole(User $user): JsonResponse
    {
        $roles = $user->getRoles();
        if (in_array('ROLE_ADMIN', $roles)) {
            $user->setRoles(['ROLE_USER']);
        } else {
            $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
        }

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Rôles mis à jour avec succès',
            'roles' => $user->getRoles()
        ]);
    }

    #[Route('/users/{id}', name: 'admin_update_user', methods: ['PUT'])]
    public function updateUser(Request $request, User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['firstname'])) $user->setFirstname($data['firstname']);
        if (isset($data['lastname'])) $user->setLastname($data['lastname']);
        if (isset($data['phoneNumber'])) $user->setPhoneNumber($data['phoneNumber']);

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'phoneNumber' => $user->getPhoneNumber(),
                'isVerified' => $user->isVerified(),
            ]
        ]);
    }

    #[Route('/users/{id}', name: 'admin_delete_user', methods: ['DELETE'])]
    public function deleteUser(User $user): JsonResponse
    {
        if ($user->isDeleted()) {
            return $this->json(['message' => 'Ce compte est déjà supprimé.'], 400);
        }
        $this->userAnonymizerService->anonymize($user);
        return $this->json([
            'message' => 'Utilisateur supprimé avec succès. Ses prises restent visibles sous "Anonyme" dans les historiques.'
        ]);
    }

    #[Route('/users/{id}/verify', name: 'admin_verify_user', methods: ['PUT'])]
    public function verifyUser(User $user): JsonResponse
    {
        $user->setIsVerified(true);
        $user->setVerificationToken(null);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur vérifié avec succès',
            'isVerified' => true
        ]);
    }

    #[Route('/teams', name: 'admin_teams_list', methods: ['GET'])]
    public function listTeams(): JsonResponse
    {
        $teams = $this->entityManager->getRepository(Team::class)->findAll();

        $teamsData = array_map(function ($team) {
            return [
                'id' => $team->getId(),
                'name' => $team->getName(),
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
                ] : null,
            ];
        }, $teams);

        return $this->json(['teams' => $teamsData]);
    }
}
