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

        return $result['lastNumber'];
    }

    public function findTeamsByMember(User $user): array
    {
        return $this->createQueryBuilder('t')
            ->select('t', 'm', 'comp')
            ->innerJoin('t.members', 'm')
            ->leftJoin('t.competition', 'comp')
            ->where('m = :user')
            ->setParameter('user', $user)
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
