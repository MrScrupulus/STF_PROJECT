<?php

namespace App\Service;

use App\Entity\Competition\Competition;
use App\Entity\Competition\FishCatch;
use App\Entity\Security\User;
use App\Repository\Competition\CompetitionParticipantInvitationRepository;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\CompetitionStaffRepository;
use App\Repository\Competition\CreationCreditRepository;
use App\Security\AppRoles;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Security\Core\User\UserInterface;

class CompetitionAccessService
{
    public function __construct(
        private readonly CompetitionStaffRepository $staffRepository,
        private readonly CompetitionRepository $competitionRepository,
        private readonly CreationCreditRepository $creationCredits,
        private readonly CompetitionParticipantInvitationRepository $participantInvitations,
    ) {
    }

    public function isAdmin(?UserInterface $user): bool
    {
        return $this->hasRole($user, AppRoles::ADMIN);
    }

    public function isOrganizer(?UserInterface $user): bool
    {
        return $this->hasRole($user, AppRoles::ORGANIZER) || $this->isAdmin($user);
    }

    public function isScience(?UserInterface $user): bool
    {
        return $this->hasRole($user, AppRoles::SCIENCE) || $this->isAdmin($user);
    }

    public function isCommissaire(?UserInterface $user): bool
    {
        return $this->hasRole($user, AppRoles::COMMISSAIRE) || $this->isAdmin($user);
    }

    public function canCreateCompetition(?UserInterface $user): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }
        if (!$user instanceof User) {
            return false;
        }

        return $this->creationCredits->findAvailable($user) !== [];
    }

    public function canManageCompetition(?UserInterface $user, Competition $competition): bool
    {
        if (!$user instanceof User) {
            return false;
        }
        if ($this->isAdmin($user)) {
            return true;
        }
        if ($competition->getCreatedBy()?->getId() === $user->getId()) {
            return true;
        }
        $staff = $this->staffRepository->findOneFor($competition, $user);

        return $staff?->isManager() === true;
    }

    /**
     * Créateur ou staff (commissaire / co-gestionnaire) de CETTE compétition.
     * Un admin plateforme qui n'est pas affecté n'est pas « officiel » ici.
     */
    public function isOfficialOnCompetition(?UserInterface $user, Competition $competition): bool
    {
        if (!$user instanceof User) {
            return false;
        }
        if ($competition->getCreatedBy()?->getId() === $user->getId()) {
            return true;
        }

        return $this->staffRepository->findOneFor($competition, $user) !== null;
    }

    public function canViewCompetition(?UserInterface $user, Competition $competition, ?string $accessCode = null): bool
    {
        if (!$competition->isPrivate()) {
            return true;
        }
        if ($this->canManageCompetition($user, $competition) || $this->canJudgeCompetition($user, $competition)) {
            return true;
        }
        if ($user instanceof User) {
            foreach ($competition->getTeams() as $team) {
                if ($team->isPersonalJournal()) {
                    continue;
                }
                if ($team->getMembers()->contains($user)) {
                    return true;
                }
            }
            if ($this->participantInvitations->isUserInvited($competition, $user)) {
                return true;
            }
        }
        if ($user instanceof User && $accessCode) {
            $invitation = $this->participantInvitations->findByCode($accessCode);
            if (
                $invitation
                && $invitation->getCompetition()?->getId() === $competition->getId()
                && $invitation->isForUser($user)
            ) {
                return true;
            }
        }

        return false;
    }

    public function canJudgeCompetition(?UserInterface $user, Competition $competition): bool
    {
        if ($this->canManageCompetition($user, $competition)) {
            return true;
        }
        if (!$user instanceof User) {
            return false;
        }
        $staff = $this->staffRepository->findOneFor($competition, $user);

        return $staff?->isJudge() === true;
    }

    public function canAccessScience(?UserInterface $user): bool
    {
        return $this->isScience($user);
    }

    public function denyUnlessManage(?UserInterface $user, Competition $competition): void
    {
        if (!$this->canManageCompetition($user, $competition)) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas gérer cette compétition.');
        }
    }

    public function denyUnlessJudge(?UserInterface $user, Competition $competition): void
    {
        if (!$this->canJudgeCompetition($user, $competition)) {
            throw new AccessDeniedHttpException('Vous n\'êtes pas commissaire sur cette compétition.');
        }
    }

    public function denyUnlessCreate(?UserInterface $user): void
    {
        if (!$this->canCreateCompetition($user)) {
            throw new AccessDeniedHttpException(
                'Vous n’avez pas de bon de création valide. Un administrateur peut vous en attribuer un.'
            );
        }
    }

    public function denyUnlessOrganizer(?UserInterface $user): void
    {
        if (!$this->isOrganizer($user)) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas gérer de compétition.');
        }
    }

    public function denyUnlessManageTeam(?UserInterface $user, \App\Entity\Competition\Team $team): void
    {
        $competition = $team->getCompetition();
        if (!$competition instanceof Competition) {
            throw new AccessDeniedHttpException('Cette équipe n’est rattachée à aucune compétition.');
        }
        $this->denyUnlessManage($user, $competition);
    }

    /**
     * createur | commissaire | admin — figé au moment de la saisie officielle.
     */
    public function officialRecordedByRole(?UserInterface $user, Competition $competition): string
    {
        if ($user instanceof User && $competition->getCreatedBy()?->getId() === $user->getId()) {
            return 'createur';
        }
        if ($user instanceof User) {
            $staff = $this->staffRepository->findOneFor($competition, $user);
            if ($staff !== null) {
                return 'commissaire';
            }
        }

        return 'admin';
    }

    public function denyUnlessJudgeCatch(?UserInterface $user, FishCatch $catch): void
    {
        $competition = $catch->getCompetition() ?? $catch->getTeam()?->getCompetition();
        if (!$competition instanceof Competition) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas traiter cette prise.');
        }
        $this->denyUnlessJudge($user, $competition);
    }

    /**
     * null = toutes les compétitions (admin). Sinon ids jugeables / gérables.
     *
     * @return list<int>|null
     */
    public function getJudgeableCompetitionIds(?UserInterface $user): ?array
    {
        if (!$user instanceof User) {
            return [];
        }
        if ($this->isAdmin($user)) {
            return null;
        }

        $ids = [];
        foreach ($this->competitionRepository->findBy(['createdBy' => $user]) as $competition) {
            $id = $competition->getId();
            if ($id) {
                $ids[$id] = $id;
            }
        }
        foreach ($this->staffRepository->findBy(['user' => $user]) as $staff) {
            $id = $staff->getCompetition()?->getId();
            if ($id) {
                $ids[$id] = $id;
            }
        }

        return array_values($ids);
    }

    /** @return list<int> */
    public function getInvitedCompetitionIds(?UserInterface $user): array
    {
        if (!$user instanceof User) {
            return [];
        }

        return $this->participantInvitations->findCompetitionIdsForUser($user);
    }

    private function hasRole(?UserInterface $user, string $role): bool
    {
        if (!$user instanceof User) {
            return false;
        }

        return \in_array($role, $user->getRoles(), true);
    }
}
