<?php

namespace App\Repository\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionStaff;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompetitionStaff>
 */
class CompetitionStaffRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompetitionStaff::class);
    }

    public function findOneFor(Competition $competition, User $user): ?CompetitionStaff
    {
        return $this->findOneBy([
            'competition' => $competition,
            'user' => $user,
        ]);
    }

    /** @return list<CompetitionStaff> */
    public function findByCompetition(Competition $competition): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.competition = :competition')
            ->setParameter('competition', $competition)
            ->innerJoin('s.user', 'u')
            ->addSelect('u')
            ->orderBy('s.role', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
