<?php

namespace App\Repository\Competition;

use App\Entity\Competition\FishCatch;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class FishCatchRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FishCatch::class);
    }

    /**
     * Retourne les prises dont la photo est stockée en base64 (data:image/...).
     */
    public function findWithBase64Photos(): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.photoUrl LIKE :prefix')
            ->setParameter('prefix', 'data:%')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne uniquement les IDs des prises avec photo base64 (requête légère, pas de chargement des blobs).
     */
    public function findIdsWithBase64Photos(): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $result = $conn->executeQuery(
            'SELECT id FROM fish_catch WHERE photo_url LIKE ?',
            ['data:%'],
            [\PDO::PARAM_STR]
        );
        return array_column($result->fetchAllAssociative(), 'id');
    }
}
