<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionStaff;
use App\Entity\Competition\CompetitionStaffInvitation;
use App\Entity\Security\User;
use App\Repository\Competition\CompetitionStaffInvitationRepository;
use App\Repository\Competition\CompetitionStaffRepository;
use App\Repository\Security\UserRepository;
use App\Security\AppRoles;
use App\Service\CompetitionAccessService;
use App\Service\CompetitionStaffInvitationService;
use App\Service\EmailService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class CompetitionStaffInvitationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CompetitionAccessService $access,
        private readonly CompetitionStaffInvitationRepository $invitationRepository,
        private readonly CompetitionStaffRepository $staffRepository,
        private readonly UserRepository $userRepository,
        private readonly EmailService $emailService,
        private readonly NotificationService $notificationService,
        private readonly CompetitionStaffInvitationService $staffInvitations,
    ) {
    }

    #[Route('/competitions/{id}/staff', name: 'competition_staff_list', methods: ['GET'])]
    public function listStaff(Competition $competition): JsonResponse
    {
        $this->access->denyUnlessManage($this->getUser(), $competition);

        return $this->json([
            'success' => true,
            'createdBy' => $this->serializePerson($competition->getCreatedBy()),
            'staff' => array_map(
                fn (CompetitionStaff $staff) => [
                    'id' => $staff->getId(),
                    'role' => $staff->getRole(),
                    'user' => $this->serializePerson($staff->getUser()),
                ],
                $this->staffRepository->findByCompetition($competition)
            ),
            'invitations' => array_map(
                fn (CompetitionStaffInvitation $invitation) => $this->serializeInvitation($invitation),
                $this->invitationRepository->findBy(['competition' => $competition, 'status' => 'pending'])
            ),
        ]);
    }

    #[Route('/competitions/{id}/staff-invitations', name: 'competition_staff_invite', methods: ['POST'])]
    public function invite(Request $request, Competition $competition): JsonResponse
    {
        $this->access->denyUnlessManage($this->getUser(), $competition);
        $inviter = $this->getUser();
        if (!$inviter instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $email = mb_strtolower(trim((string) ($data['email'] ?? '')));
        $role = (string) ($data['role'] ?? AppRoles::STAFF_JUDGE);
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['success' => false, 'message' => 'Adresse e-mail invalide.'], 400);
        }
        if ($role !== AppRoles::STAFF_JUDGE) {
            return $this->json(['success' => false, 'message' => 'Seule une invitation commissaire est autorisée.'], 400);
        }
        if (mb_strtolower((string) $inviter->getEmail()) === $email) {
            return $this->json(['success' => false, 'message' => 'Vous ne pouvez pas vous inviter vous-même.'], 400);
        }

        $invitedUser = $this->userRepository->findByEmailOrUsername($email);
        if ($invitedUser instanceof User && $invitedUser->isDeleted()) {
            $invitedUser = null;
        }

        if ($invitedUser && $this->staffRepository->findOneFor($competition, $invitedUser)) {
            return $this->json(['success' => false, 'message' => 'Cette personne est déjà commissaire sur cette compétition.'], 400);
        }

        $existing = $this->invitationRepository->findPendingForCompetitionAndEmail($competition, $email);
        if ($existing) {
            $invitation = $existing;
        } else {
            $invitation = new CompetitionStaffInvitation();
            $invitation->setCompetition($competition);
            $invitation->setEmail($email);
            $invitation->setInvitedUser($invitedUser);
            $invitation->setInvitedBy($inviter);
            $invitation->setRole($role);
            $this->entityManager->persist($invitation);
            $this->entityManager->flush();
        }

        try {
            $this->emailService->sendStaffInvitationEmail($invitation);
        } catch (\Throwable $e) {
            return $this->json([
                'success' => true,
                'message' => 'Invitation enregistrée, mais l\'e-mail n\'a pas pu partir. Réessayez ou demandez à la personne d\'ouvrir Invitations dans l\'app.',
                'invitation' => $this->serializeInvitation($invitation),
                'emailSent' => false,
            ], 201);
        }

        if ($invitedUser && !$existing) {
            try {
                $this->notificationService->notifyStaffInvitation(
                    $invitedUser,
                    $competition->getName() ?? '',
                    (int) $competition->getId()
                );
            } catch (\Throwable) {
            }
        }

        return $this->json([
            'success' => true,
            'message' => 'Invitation commissaire envoyée par e-mail.',
            'invitation' => $this->serializeInvitation($invitation),
            'emailSent' => true,
        ], 201);
    }

    #[Route('/staff-invitations/my', name: 'my_staff_invitations', methods: ['GET'])]
    public function myInvitations(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        return $this->json([
            'success' => true,
            'invitations' => array_map(
                fn (CompetitionStaffInvitation $invitation) => $this->serializeInvitation($invitation),
                $this->invitationRepository->findPendingForUser($user)
            ),
        ]);
    }

    #[Route('/staff-invitations/by-token/{token}/accept', name: 'accept_staff_invitation_token', methods: ['POST'])]
    public function acceptByToken(string $token): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        $invitation = $this->invitationRepository->findOneBy(['token' => $token]);
        if (!$invitation) {
            return $this->json(['success' => false, 'message' => 'Invitation introuvable.'], 404);
        }

        return $this->jsonFromStaffResult($this->staffInvitations->acceptForUser($invitation, $user));
    }

    #[Route('/staff-invitations/by-token/{token}/reject', name: 'reject_staff_invitation_token', methods: ['POST'])]
    public function rejectByToken(string $token): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        $invitation = $this->invitationRepository->findOneBy(['token' => $token]);
        if (!$invitation) {
            return $this->json(['success' => false, 'message' => 'Invitation introuvable.'], 404);
        }

        return $this->jsonFromStaffResult($this->staffInvitations->rejectForUser($invitation, $user));
    }

    #[Route('/staff-invitations/{id}/accept', name: 'accept_staff_invitation', methods: ['POST'])]
    public function accept(CompetitionStaffInvitation $invitation): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        return $this->jsonFromStaffResult($this->staffInvitations->acceptForUser($invitation, $user));
    }

    #[Route('/staff-invitations/{id}/reject', name: 'reject_staff_invitation', methods: ['POST'])]
    public function reject(CompetitionStaffInvitation $invitation): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        return $this->jsonFromStaffResult($this->staffInvitations->rejectForUser($invitation, $user));
    }

    /**
     * @param array{ok: bool, code: string, message: string, invitation: ?CompetitionStaffInvitation} $result
     */
    private function jsonFromStaffResult(array $result): JsonResponse
    {
        $invitation = $result['invitation'];
        $competition = $invitation?->getCompetition();
        $status = $result['ok'] ? 200 : ($result['code'] === 'not_found' ? 404 : 400);

        return $this->json([
            'success' => $result['ok'],
            'message' => $result['message'],
            'competition' => $competition ? [
                'id' => $competition->getId(),
                'name' => $competition->getName(),
            ] : null,
        ], $status);
    }

    private function serializeInvitation(CompetitionStaffInvitation $invitation): array
    {
        return [
            'id' => $invitation->getId(),
            'kind' => 'staff',
            'role' => $invitation->getRole(),
            'status' => $invitation->getStatus(),
            'email' => $invitation->getEmail(),
            'createdAt' => $invitation->getCreatedAt()?->format('Y-m-d H:i:s'),
            'competition' => [
                'id' => $invitation->getCompetition()?->getId(),
                'name' => $invitation->getCompetition()?->getName(),
            ],
            'invitedBy' => $this->serializePerson($invitation->getInvitedBy()),
        ];
    }

    private function serializePerson(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->getId(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'email' => $user->getEmail(),
            'username' => $user->getUsername(),
        ];
    }
}
