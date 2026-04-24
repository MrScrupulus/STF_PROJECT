<?php

namespace App\Service;

use App\Entity\Competition\Team;
use App\Entity\Security\User;
use App\Repository\Competition\TeamRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Équipe technique « Journal personnel » : une par utilisateur, sans compétition, pour les prises hors concours.
 */
final class PersonalJournalTeamService
{
    public const TEAM_NAME = 'Journal personnel';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TeamRepository $teamRepository,
    ) {
    }

    public function getOrCreateForUser(User $user): Team
    {
        $existing = $this->teamRepository->findPersonalJournalTeam($user);
        if (null !== $existing) {
            return $existing;
        }

        $team = new Team();
        $team->setName(self::TEAM_NAME);
        $team->setCompetition(null);
        $team->setPersonalJournal(true);
        $team->setIsActive(true);
        $team->addMember($user);

        $this->entityManager->persist($team);
        $this->entityManager->flush();

        return $team;
    }
}
