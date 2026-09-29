<?php

namespace App\Repository\Competition;

use App\Entity\Competition\Team;
use App\Entity\Competition\Competition;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\HttpKernel\Attribute\AsRepository;

#[AsRepository]
class TeamRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Team::class);
    }

    public function findByCompetition(int $competitionId): array
    {
        return $this->createQueryBuilder('t')
            ->select('t', 'm', 'comp')
            ->leftJoin('t.members', 'm')
            ->leftJoin('t.competition', 'comp')
            ->where('t.competition = :competitionId')
            ->andWhere('t.isActive = :isActive')
            ->setParameter('competitionId', $competitionId)
            ->setParameter('isActive', true)
            ->orderBy('t.registrationNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findLastTeamNumberByCompetition(Competition $competition): ?int
    {
        $result = $this->createQueryBuilder('t')
            ->select('MAX(t.registrationNumber) as lastNumber')
            ->where('t.competition = :competition')
            ->andWhere('t.isActive = :isActive')
            ->setParameter('competition', $competition)
            ->setParameter('isActive', true)
            ->getQuery()
            ->getOneOrNullResult();

        return $result && isset($result['lastNumber']) ? (int) $result['lastNumber'] : null;
    }

    /**
     * @param bool $excludePersonalJournal si true, n'inclut pas l'équipe « Journal personnel » (utile pour les règles métier équipes de compétition)
     */
    public function findTeamsByMember(User $user, bool $activeOnly = true, bool $excludePersonalJournal = false): array
    {
        // Trouver les IDs des équipes où l'utilisateur est membre
        $qb = $this->createQueryBuilder('t')
            ->select('DISTINCT t.id')
            ->innerJoin('t.members', 'm')
            ->where('m = :user')
            ->setParameter('user', $user);

        if ($excludePersonalJournal) {
            $qb->andWhere('t.isPersonalJournal = :notPj')
                ->setParameter('notPj', false);
        }
        
        if ($activeOnly) {
            $qb->andWhere('t.isActive = :isActive')
               ->setParameter('isActive', true);
        }
        
        $teamIds = $qb->getQuery()->getScalarResult();
        $teamIds = array_column($teamIds, 'id');
        
        if (empty($teamIds)) {
            return [];
        }
        
        // Charger toutes les équipes avec tous leurs membres
        return $this->createQueryBuilder('t')
            ->select('t', 'm', 'comp')
            ->leftJoin('t.members', 'm')
            ->leftJoin('t.competition', 'comp')
            ->where('t.id IN (:teamIds)')
            ->setParameter('teamIds', $teamIds)
            ->orderBy('t.isActive', 'DESC') // Actives en premier
            ->addOrderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findTeamsWithoutCompetition(): array
    {
        return $this->createQueryBuilder('t')
            ->where('t.competition IS NULL')
            ->andWhere('t.isActive = :isActive')
            ->setParameter('isActive', true)
            ->getQuery()
            ->getResult();
    }

    public function findAll(): array
    {
        return $this->createQueryBuilder('t')
            ->select('t', 'm')
            ->leftJoin('t.members', 'm')
            ->where('t.isActive = :isActive')
            ->setParameter('isActive', true)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findAllWithDetails(): array
    {
        return $this->createQueryBuilder('t')
            ->select('t', 'm', 'c', 's')
            ->leftJoin('t.members', 'm')
            ->leftJoin('t.catches', 'c')
            ->leftJoin('c.species', 's')
            ->where('t.isActive = :isActive')
            ->setParameter('isActive', true)
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Historique : équipes dont l'utilisateur est (ou a été) membre,
     * plus celles où il a des prises (caughtBy), hors journal personnel.
     */
    public function findUserHistory(User $user): array
    {
        $memberRows = $this->createQueryBuilder('t')
            ->select('DISTINCT t.id')
            ->innerJoin('t.members', 'm')
            ->where('m = :user')
            ->andWhere('t.isPersonalJournal = :notPj')
            ->setParameter('user', $user)
            ->setParameter('notPj', false)
            ->getQuery()
            ->getScalarResult();
        $memberIds = array_map(static fn ($row) => (int) $row['id'], $memberRows);

        $catchRows = $this->getEntityManager()->createQueryBuilder()
            ->select('DISTINCT IDENTITY(c.team) AS tid')
            ->from(\App\Entity\Competition\FishCatch::class, 'c')
            ->where('c.caughtBy = :user')
            ->andWhere('c.team IS NOT NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();
        $catchTeamIds = [];
        foreach ($catchRows as $row) {
            $id = (int) ($row['tid'] ?? 0);
            if ($id > 0) {
                $catchTeamIds[] = $id;
            }
        }

        $teamIds = array_values(array_unique(array_merge($memberIds, $catchTeamIds)));
        if ($teamIds === []) {
            return [];
        }

        return $this->createQueryBuilder('t')
            ->select('t', 'm', 'comp')
            ->leftJoin('t.members', 'm')
            ->leftJoin('t.competition', 'comp')
            ->where('t.id IN (:teamIds)')
            ->andWhere('t.isPersonalJournal = :notPj')
            ->setParameter('teamIds', $teamIds)
            ->setParameter('notPj', false)
            ->orderBy('t.isActive', 'DESC')
            ->addOrderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPersonalJournalTeam(User $user): ?Team
    {
        return $this->createQueryBuilder('t')
            ->innerJoin('t.members', 'm')
            ->where('m = :user')
            ->andWhere('t.isPersonalJournal = :pj')
            ->setParameter('user', $user)
            ->setParameter('pj', true)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
