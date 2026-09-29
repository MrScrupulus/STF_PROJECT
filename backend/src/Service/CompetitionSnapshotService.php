<?php

namespace App\Service;

use App\Entity\Competition\Competition;
use App\Entity\Competition\FishCatch;
use App\Entity\Competition\Team;
use App\Entity\CompetitionTeamSnapshot;
use App\Entity\Security\User;
use App\Repository\CompetitionTeamSnapshotRepository;
use Doctrine\ORM\EntityManagerInterface;

final class CompetitionSnapshotService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private CompetitionTeamSnapshotRepository $snapshotRepository
    ) {
    }

    /**
     * Roster figé : membres actuels ∪ snapshot précédent ∪ auteurs de prises de cette manche.
     *
     * @param array<int, array<string, mixed>> $previousMembers
     * @return list<array{id: int, firstname: string, lastname: string}>
     */
    public function collectMembers(Team $team, Competition $competition, array $previousMembers = []): array
    {
        $byId = [];

        foreach ($previousMembers as $member) {
            $id = (int) ($member['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }
            $byId[$id] = [
                'id' => $id,
                'firstname' => (string) ($member['firstname'] ?? ''),
                'lastname' => (string) ($member['lastname'] ?? ''),
            ];
        }

        foreach ($team->getMembers() as $member) {
            $byId[$member->getId()] = [
                'id' => $member->getId(),
                'firstname' => (string) $member->getFirstname(),
                'lastname' => (string) $member->getLastname(),
            ];
        }

        foreach ($team->getCatches() as $catch) {
            $catchCompetition = $catch->getCompetition();
            if ($catchCompetition !== null && $catchCompetition->getId() !== $competition->getId()) {
                continue;
            }
            $caughtBy = $catch->getCaughtBy();
            if ($caughtBy === null) {
                continue;
            }
            $byId[$caughtBy->getId()] = [
                'id' => $caughtBy->getId(),
                'firstname' => (string) $caughtBy->getFirstname(),
                'lastname' => (string) $caughtBy->getLastname(),
            ];
        }

        return array_values($byId);
    }

    /**
     * Crée les snapshots pour toutes les équipes d'une compétition terminée
     */
    public function createSnapshotsForCompetition(Competition $competition, bool $force = false): void
    {
        $existingSnapshots = $this->snapshotRepository->findBy(['competition' => $competition]);
        $previousByTeamId = [];
        foreach ($existingSnapshots as $snapshot) {
            $teamId = $snapshot->getTeam()?->getId();
            if ($teamId) {
                $previousByTeamId[$teamId] = $snapshot->getMembers();
            }
        }

        if (!$force && $existingSnapshots !== []) {
            return;
        }

        if ($force) {
            foreach ($existingSnapshots as $snapshot) {
                $this->entityManager->remove($snapshot);
            }
            $this->entityManager->flush();
        }

        $qb = $this->entityManager->createQueryBuilder();
        $teams = $qb->select('t', 'm')
            ->from(Team::class, 't')
            ->leftJoin('t.members', 'm')
            ->where('t.competition = :competitionId')
            ->setParameter('competitionId', $competition->getId())
            ->getQuery()
            ->getResult();

        foreach ($teams as $team) {
            $snapshot = new CompetitionTeamSnapshot();
            $snapshot->setCompetition($competition);
            $snapshot->setTeam($team);
            $snapshot->setTeamName($team->getName());
            $snapshot->setRegistrationNumber($team->getRegistrationNumber());
            $snapshot->setTotalScore($team->getScoreForCompetition($competition));
            $snapshot->setMembers($this->collectMembers(
                $team,
                $competition,
                $previousByTeamId[$team->getId()] ?? []
            ));
            $snapshot->setSnapshotDate(new \DateTime());

            $this->entityManager->persist($snapshot);
        }

        $this->entityManager->flush();
    }

    /**
     * Met à jour (ou crée) le snapshot d'une équipe avant un départ, pour ne pas perdre le roster.
     */
    public function freezeTeamParticipation(Team $team): void
    {
        $competition = $team->getCompetition();
        if ($competition === null) {
            return;
        }

        $existing = $this->snapshotRepository->findOneBy([
            'competition' => $competition,
            'team' => $team,
        ]);
        $previous = $existing?->getMembers() ?? [];
        $members = $this->collectMembers($team, $competition, $previous);

        if ($existing === null) {
            $existing = new CompetitionTeamSnapshot();
            $existing->setCompetition($competition);
            $existing->setTeam($team);
            $this->entityManager->persist($existing);
        }

        $existing->setTeamName($team->getName());
        $existing->setRegistrationNumber($team->getRegistrationNumber());
        $existing->setTotalScore($team->getScoreForCompetition($competition));
        $existing->setMembers($members);
        $existing->setSnapshotDate(new \DateTime());
        $this->entityManager->flush();
    }

    /**
     * @return CompetitionTeamSnapshot[]
     */
    public function getSnapshotsForCompetition(Competition $competition): array
    {
        return $this->snapshotRepository->findBy(
            ['competition' => $competition],
            ['totalScore' => 'DESC']
        );
    }

    public function hasSnapshots(Competition $competition): bool
    {
        return $this->snapshotRepository->count(['competition' => $competition]) > 0;
    }

    public function findSnapshotForTeam(Competition $competition, Team $team): ?CompetitionTeamSnapshot
    {
        return $this->snapshotRepository->findOneBy([
            'competition' => $competition,
            'team' => $team,
        ]);
    }

    /**
     * Équipe de l'utilisateur pour cette manche : membre actuel, snapshot, ou prises.
     */
    public function findTeamIdForUser(Competition $competition, User $user): ?int
    {
        foreach ($competition->getTeams() as $team) {
            if ($team->isPersonalJournal()) {
                continue;
            }
            if ($team->getMembers()->contains($user)) {
                return $team->getId();
            }
        }

        foreach ($this->getSnapshotsForCompetition($competition) as $snapshot) {
            foreach ($snapshot->getMembers() as $member) {
                if ((int) ($member['id'] ?? 0) === $user->getId()) {
                    return $snapshot->getTeam()?->getId();
                }
            }
        }

        $catch = $this->entityManager->createQueryBuilder()
            ->select('c')
            ->from(FishCatch::class, 'c')
            ->where('c.caughtBy = :user')
            ->andWhere('c.competition = :competition')
            ->setParameter('user', $user)
            ->setParameter('competition', $competition)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $catch?->getTeam()?->getId();
    }
}
