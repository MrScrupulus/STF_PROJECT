<?php

namespace App\Controller\Admin;

use App\Entity\Security\User;
use App\Repository\Security\UserRepository;
use App\Security\AppRoles;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\Competition\Team;
use App\Service\UserAnonymizerService;
use App\Service\CompetitionAccessService;
use App\Service\CreationCreditService;
use App\Entity\Competition\CreationCredit;

#[Route('/admin')]
class AdminController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private UserAnonymizerService $userAnonymizerService,
        private CompetitionAccessService $competitionAccess,
        private CreationCreditService $creationCredits,
    ) {}

    #[Route('/users', name: 'admin_users_list', methods: ['GET'])]
    public function listUsers(Request $request): JsonResponse
    {
        $email = trim((string) $request->query->get('email', ''));
        if ($email !== '') {
            $found = $this->userRepository->findActiveByEmail($email);
            $users = $found ? [$found] : [];
        } else {
            $users = $this->userRepository->findAllActive();
        }

        $usersData = array_map(fn (User $user) => $this->serializeAdminUser($user), $users);

        return $this->json(['users' => $usersData]);
    }

    #[Route('/roles', name: 'admin_roles_list', methods: ['GET'])]
    public function listRoles(): JsonResponse
    {
        $items = [];
        foreach (AppRoles::ASSIGNABLE as $role) {
            $items[] = [
                'id' => $role,
                'label' => AppRoles::labels()[$role] ?? $role,
            ];
        }

        return $this->json(['roles' => $items]);
    }

    #[Route('/users/{id}/roles', name: 'admin_set_user_roles', methods: ['PUT'])]
    public function setUserRoles(Request $request, User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $incoming = $data['roles'] ?? null;
        if (!\is_array($incoming)) {
            return $this->json(['message' => 'Le champ roles est requis.'], 400);
        }

        $normalized = AppRoles::normalize($incoming);
        $error = $this->guardAdminRoleChange($user, $normalized);
        if ($error !== null) {
            return $this->json(['message' => $error], 400);
        }

        $user->setRoles($normalized);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Rôles mis à jour avec succès',
            'roles' => $user->getRoles(),
        ]);
    }

    #[Route('/users/{id}/creation-credits', name: 'admin_grant_creation_credit', methods: ['POST'])]
    public function grantCreationCredit(Request $request, User $user): JsonResponse
    {
        if (\in_array(AppRoles::ADMIN, $user->getRoles(), true)) {
            return $this->json(['message' => 'Un administrateur n’a pas besoin de crédit de création.'], 400);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $days = isset($data['days']) ? (int) $data['days'] : CreationCreditService::DEFAULT_DAYS;
        $complimentary = !array_key_exists('complimentary', $data) || (bool) $data['complimentary'];
        $granter = $this->getUser() instanceof User ? $this->getUser() : null;
        $credit = $this->creationCredits->grant($user, $granter, $days, $complimentary);

        return $this->json([
            'success' => true,
            'message' => 'Crédit de création attribué. Un e-mail a été envoyé au créateur.',
            'credit' => $this->creationCredits->serialize($credit),
            'creationRights' => $this->creationCredits->rightsFor(
                $user,
                \in_array(AppRoles::ADMIN, $user->getRoles(), true)
            ),
        ], 201);
    }

    #[Route('/creation-credits/{id}', name: 'admin_cancel_creation_credit', methods: ['DELETE'])]
    public function cancelCreationCredit(CreationCredit $credit): JsonResponse
    {
        $user = $credit->getUser();
        $this->creationCredits->cancel($credit);

        return $this->json([
            'success' => true,
            'message' => 'Crédit annulé.',
            'creationRights' => $user ? $this->creationCredits->rightsFor(
                $user,
                \in_array(AppRoles::ADMIN, $user->getRoles(), true)
            ) : null,
        ]);
    }

    #[Route('/users/{id}/toggle-role', name: 'admin_toggle_role', methods: ['PUT'])]
    public function toggleUserRole(User $user): JsonResponse
    {
        $roles = $user->getRoles();
        if (in_array(AppRoles::ADMIN, $roles, true)) {
            $roles = array_values(array_filter(
                $roles,
                static fn (string $role) => $role !== AppRoles::ADMIN
            ));
        } else {
            $roles[] = AppRoles::ADMIN;
        }
        $normalized = AppRoles::normalize($roles);
        $error = $this->guardAdminRoleChange($user, $normalized);
        if ($error !== null) {
            return $this->json(['message' => $error], 400);
        }

        $user->setRoles($normalized);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Rôles mis à jour avec succès',
            'roles' => $user->getRoles(),
        ]);
    }

    /** @param list<string> $normalized */
    private function guardAdminRoleChange(User $user, array $normalized): ?string
    {
        $current = $this->getUser();
        $wasAdmin = in_array(AppRoles::ADMIN, $user->getRoles(), true);
        $willBeAdmin = in_array(AppRoles::ADMIN, $normalized, true);

        if ($current instanceof User && $current->getId() === $user->getId() && $wasAdmin && !$willBeAdmin) {
            return 'Vous ne pouvez pas retirer votre propre rôle administrateur.';
        }

        if ($wasAdmin && !$willBeAdmin && count($this->userRepository->findByRole(AppRoles::ADMIN)) <= 1) {
            return 'Impossible de retirer le dernier administrateur.';
        }

        return null;
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
        $user = $this->getUser();
        $this->competitionAccess->denyUnlessOrganizer($user);

        $teams = $this->entityManager->getRepository(Team::class)->findAll();
        if (!$this->competitionAccess->isAdmin($user)) {
            $teams = array_values(array_filter(
                $teams,
                function (Team $team) use ($user) {
                    $competition = $team->getCompetition();
                    return $competition && $this->competitionAccess->canManageCompetition($user, $competition);
                }
            ));
        }

        $teamsData = array_map(function ($team) {
            return [
                'id' => $team->getId(),
                'name' => $team->getName(),
                'members' => array_map(function ($member) {
                    return [
                        'id' => $member->getId(),
                        'firstname' => $member->getFirstname(),
                        'lastname' => $member->getLastname(),
                        'username' => $member->getUsername(),
                    ];
                }, $team->getMembers()->toArray()),
                'competition' => $team->getCompetition() ? [
                    'id' => $team->getCompetition()->getId(),
                    'name' => $team->getCompetition()->getName(),
                ] : null,
                'isPersonalJournal' => $team->isPersonalJournal(),
                'isDisqualified' => $team->isDisqualified(),
                'disqualificationReason' => $team->getDisqualificationReason(),
            ];
        }, $teams);

        return $this->json(['teams' => $teamsData]);
    }

    /** @return array<string, mixed> */
    private function serializeAdminUser(User $user): array
    {
        $isAdmin = \in_array(AppRoles::ADMIN, $user->getRoles(), true);

        return [
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'phoneNumber' => $user->getPhoneNumber(),
            'isVerified' => $user->isVerified(),
            'creationRights' => $this->creationCredits->rightsFor($user, $isAdmin),
        ];
    }
}
