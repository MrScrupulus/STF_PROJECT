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

    public function findTeamsByMember(User $user, bool $activeOnly = true): array
    {
        // Trouver les IDs des équipes où l'utilisateur est membre
        $qb = $this->createQueryBuilder('t')
            ->select('DISTINCT t.id')
            ->innerJoin('t.members', 'm')
            ->where('m = :user')
            ->setParameter('user', $user);
        
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
     * Récupère toutes les équipes d'un utilisateur (actives et inactives) pour l'historique
     */
    public function findUserHistory(User $user): array
    {
        return $this->findTeamsByMember($user, false);
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
