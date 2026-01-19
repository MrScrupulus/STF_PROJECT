<?php

namespace App\Repository\Competition;

use App\Entity\Competition\CompetitionPerimeter;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompetitionPerimeter>
 */
class CompetitionPerimeterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompetitionPerimeter::class);
    }

    /**
     * Récupère les périmètres actifs d'une compétition
     */
    public function findActiveByCompetition(int $competitionId): array
    {
        return $this->createQueryBuilder('cp')
            ->where('cp.competition = :competitionId')
            ->andWhere('cp.isActive = :isActive')
            ->setParameter('competitionId', $competitionId)
            ->setParameter('isActive', true)
            ->getQuery()
            ->getResult();
    }
}
