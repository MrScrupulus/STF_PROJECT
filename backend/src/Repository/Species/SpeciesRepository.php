<?php

namespace App\Repository\Species;

use App\Entity\Species\Species;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SpeciesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Species::class);
    }

    /**
     * @return Species[]
     */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('s')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findByName(string $name): ?Species
    {
        return $this->createQueryBuilder('s')
            ->where('s.name = :name')
            ->setParameter('name', $name)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Évite les doublons « brochet » / « Brochet » / espaces superflus.
     */
    public function findOneByNormalizedName(string $name): ?Species
    {
        $norm = mb_strtolower(trim($name));
        if ($norm === '') {
            return null;
        }

        return $this->createQueryBuilder('s')
            ->where('LOWER(TRIM(s.name)) = :norm')
            ->setParameter('norm', $norm)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
