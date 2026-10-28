<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Competition\CompetitionStaff;
use App\Entity\Competition\CompetitionStaffInvitation;
use App\Entity\Security\User;
use App\Repository\Competition\CompetitionStaffInvitationRepository;
use App\Repository\Competition\CompetitionStaffRepository;
use App\Repository\Security\UserRepository;
use App\Security\AppRoles;
use Doctrine\ORM\EntityManagerInterface;

final class CompetitionStaffInvitationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CompetitionStaffInvitationRepository $invitationRepository,
        private readonly CompetitionStaffRepository $staffRepository,
        private readonly UserRepository $userRepository,
    ) {
    }

    /**
     * @return array{ok: bool, code: string, message: string, invitation: ?CompetitionStaffInvitation}
     */
    public function acceptByToken(string $token): array
    {
        $invitation = $this->invitationRepository->findOneBy(['token' => $token]);
        if (!$invitation) {
            return $this->result(false, 'not_found', 'Invitation introuvable.', null);
        }

        $user = $this->resolveInvitedUser($invitation);
        if (!$user instanceof User) {
            return $this->result(
                false,
                'no_account',
                'Aucun compte Street Fishing n’est associé à cet e-mail. Créez un compte dans l’application avec la même adresse, puis rouvrez ce lien.',
                $invitation
            );
        }

        return $this->acceptForUser($invitation, $user);
    }

    /**
     * @return array{ok: bool, code: string, message: string, invitation: ?CompetitionStaffInvitation}
     */
    public function rejectByToken(string $token): array
    {
        $invitation = $this->invitationRepository->findOneBy(['token' => $token]);
        if (!$invitation) {
            return $this->result(false, 'not_found', 'Invitation introuvable.', null);
        }

        if ($invitation->getStatus() === 'rejected') {
            return $this->result(true, 'already_rejected', 'Invitation déjà refusée.', $invitation);
        }
        if (!$invitation->isPending()) {
            return $this->result(false, 'already_processed', 'Invitation déjà traitée.', $invitation);
        }

        $user = $this->resolveInvitedUser($invitation);
        if ($user instanceof User) {
            $invitation->setInvitedUser($user);
        }
        $invitation->setStatus('rejected');
        $invitation->setRespondedAt(new \DateTime());
        $this->entityManager->flush();

        return $this->result(true, 'rejected', 'Invitation commissaire refusée.', $invitation);
    }

    /**
     * @return array{ok: bool, code: string, message: string, invitation: ?CompetitionStaffInvitation}
     */
    public function acceptForUser(CompetitionStaffInvitation $invitation, User $user): array
    {
        if ($invitation->getStatus() === 'accepted' && $invitation->isForUser($user)) {
            $this->ensureStaffAndRole($invitation, $user);
            $this->entityManager->flush();

            return $this->result(true, 'already_accepted', 'Vous êtes commissaire sur cette compétition.', $invitation);
        }
        if (!$invitation->isPending() || !$invitation->isForUser($user)) {
            return $this->result(false, 'not_for_user', 'Invitation introuvable ou déjà traitée.', $invitation);
        }

        $this->ensureStaffAndRole($invitation, $user);
        $invitation->setInvitedUser($user);
        $invitation->setStatus('accepted');
        $invitation->setRespondedAt(new \DateTime());
        $this->entityManager->flush();

        return $this->result(true, 'accepted', 'Vous êtes commissaire sur cette compétition.', $invitation);
    }

    /**
     * @return array{ok: bool, code: string, message: string, invitation: ?CompetitionStaffInvitation}
     */
    public function rejectForUser(CompetitionStaffInvitation $invitation, User $user): array
    {
        if ($invitation->getStatus() === 'rejected' && $invitation->isForUser($user)) {
            return $this->result(true, 'already_rejected', 'Invitation déjà refusée.', $invitation);
        }
        if (!$invitation->isPending() || !$invitation->isForUser($user)) {
            return $this->result(false, 'not_for_user', 'Invitation introuvable ou déjà traitée.', $invitation);
        }

        $invitation->setInvitedUser($user);
        $invitation->setStatus('rejected');
        $invitation->setRespondedAt(new \DateTime());
        $this->entityManager->flush();

        return $this->result(true, 'rejected', 'Invitation refusée.', $invitation);
    }

    private function ensureStaffAndRole(CompetitionStaffInvitation $invitation, User $user): void
    {
        $competition = $invitation->getCompetition();
        if ($competition && !$this->staffRepository->findOneFor($competition, $user)) {
            $staff = new CompetitionStaff();
            $staff->setUser($user);
            $staff->setRole($invitation->getRole());
            $competition->addStaff($staff);
            $this->entityManager->persist($staff);
        }

        $user->setRoles(AppRoles::normalize(array_merge($user->getRoles(), [AppRoles::COMMISSAIRE])));
        $this->entityManager->persist($user);
    }

    private function resolveInvitedUser(CompetitionStaffInvitation $invitation): ?User
    {
        $user = $invitation->getInvitedUser();
        if ($user instanceof User && !$user->isDeleted()) {
            return $user;
        }

        $found = $this->userRepository->findByEmailOrUsername($invitation->getEmail());
        if ($found instanceof User && !$found->isDeleted()) {
            return $found;
        }

        return null;
    }

    /**
     * @return array{ok: bool, code: string, message: string, invitation: ?CompetitionStaffInvitation}
     */
    private function result(bool $ok, string $code, string $message, ?CompetitionStaffInvitation $invitation): array
    {
        return [
            'ok' => $ok,
            'code' => $code,
            'message' => $message,
            'invitation' => $invitation,
        ];
    }
}
