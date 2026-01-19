<?php

namespace App\Repository\Competition;

use App\Entity\Competition\ScheduledPause;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ScheduledPause>
 */
class ScheduledPauseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ScheduledPause::class);
    }

    /**
     * Récupère les pauses programmées actives pour une compétition
     */
    public function findActiveByCompetition(int $competitionId): array
    {
        return $this->createQueryBuilder('sp')
            ->where('sp.competition = :competitionId')
            ->andWhere('sp.isActive = :isActive')
            ->setParameter('competitionId', $competitionId)
            ->setParameter('isActive', true)
            ->orderBy('sp.startDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère les pauses qui doivent être activées maintenant
     */
    public function findPausesToActivate(): array
    {
        // Les dates en base sont en UTC, on doit comparer avec l'heure UTC
        $now = new \DateTime('now', new \DateTimeZone('UTC'));
        
        return $this->createQueryBuilder('sp')
            ->where('sp.isActive = :isActive')
            ->andWhere('sp.startDate <= :now')
            ->andWhere('sp.endDate >= :now')
            ->setParameter('isActive', true)
            ->setParameter('now', $now, \Doctrine\DBAL\Types\Types::DATETIME_MUTABLE)
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère les pauses qui doivent être désactivées maintenant
     */
    public function findPausesToDeactivate(): array
    {
        // Les dates en base sont en UTC, on doit comparer avec l'heure UTC
        $now = new \DateTime('now', new \DateTimeZone('UTC'));
        
        return $this->createQueryBuilder('sp')
            ->where('sp.isActive = :isActive')
            ->andWhere('sp.endDate < :now')
            ->setParameter('isActive', true)
            ->setParameter('now', $now, \Doctrine\DBAL\Types\Types::DATETIME_MUTABLE)
            ->getQuery()
            ->getResult();
    }
}
