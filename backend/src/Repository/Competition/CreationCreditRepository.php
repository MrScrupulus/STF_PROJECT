<?php

namespace App\Repository\Competition;

use App\Entity\Competition\CreationCredit;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CreationCredit>
 */
class CreationCreditRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CreationCredit::class);
    }

    /** @return list<CreationCredit> */
    public function findAvailable(User $user, \DateTimeImmutable $now = new \DateTimeImmutable()): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.user = :user')
            ->andWhere('c.consumedAt IS NULL')
            ->andWhere('c.cancelledAt IS NULL')
            ->andWhere('c.expiresAt > :now')
            ->setParameter('user', $user)
            ->setParameter('now', $now)
            ->orderBy('c.expiresAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneAvailableForUpdate(User $user, \DateTimeImmutable $now = new \DateTimeImmutable()): ?CreationCredit
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.user = :user')
            ->andWhere('c.consumedAt IS NULL')
            ->andWhere('c.cancelledAt IS NULL')
            ->andWhere('c.expiresAt > :now')
            ->setParameter('user', $user)
            ->setParameter('now', $now)
            ->orderBy('c.expiresAt', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->setLockMode(LockMode::PESSIMISTIC_WRITE)
            ->getOneOrNullResult();
    }
}
