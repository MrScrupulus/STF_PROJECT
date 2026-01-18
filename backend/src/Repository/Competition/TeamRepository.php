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
            ->setParameter('competitionId', $competitionId)
            ->orderBy('t.registrationNumber', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findLastTeamNumberByCompetition(Competition $competition): ?int
    {
        $result = $this->createQueryBuilder('t')
            ->select('MAX(t.registrationNumber) as lastNumber')
            ->where('t.competition = :competition')
            ->setParameter('competition', $competition)
            ->getQuery()
            ->getOneOrNullResult();

        return $result && isset($result['lastNumber']) ? (int) $result['lastNumber'] : null;
    }

    public function findTeamsByMember(User $user): array
    {
        // Trouver les IDs des équipes où l'utilisateur est membre
        $teamIds = $this->createQueryBuilder('t')
            ->select('DISTINCT t.id')
            ->innerJoin('t.members', 'm')
            ->where('m = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getScalarResult();
        
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
            ->getQuery()
            ->getResult();
    }

    public function findTeamsWithoutCompetition(): array
    {
        return $this->createQueryBuilder('t')
            ->where('t.competition IS NULL')
            ->getQuery()
            ->getResult();
    }

    public function findAll(): array
    {
        return $this->createQueryBuilder('t')
            ->select('t', 'm')
            ->leftJoin('t.members', 'm')
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
            ->orderBy('t.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
