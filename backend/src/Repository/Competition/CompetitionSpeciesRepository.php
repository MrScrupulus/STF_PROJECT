<?php

namespace App\Repository\Competition;

use App\Entity\Competition\CompetitionSpecies;
use App\Entity\Competition\Competition;
use App\Entity\Species\Species;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompetitionSpecies>
 */
class CompetitionSpeciesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompetitionSpecies::class);
    }

    /**
     * Trouve le CompetitionSpecies pour une compétition et une espèce données
     */
    public function findByCompetitionAndSpecies(Competition $competition, Species $species): ?CompetitionSpecies
    {
        return $this->createQueryBuilder('cs')
            ->where('cs.competition = :competition')
            ->andWhere('cs.species = :species')
            ->setParameter('competition', $competition)
            ->setParameter('species', $species)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
