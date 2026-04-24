<?php

namespace App\Repository\Competition;

use App\Entity\Competition\FishCatch;
use App\Entity\Security\User;
use App\Entity\Competition\Team;
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

    /**
     * Prises validées pour une compétition, attribuées à l'utilisateur (caughtBy).
     * Ordre chronologique croissant (pour courbes et cumuls).
     *
     * @return FishCatch[]
     */
    public function findValidatedByCaughtByUserAndCompetition(User $user, int $competitionId): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.team', 't')
            ->addSelect('t')
            ->join('c.species', 's')
            ->addSelect('s')
            ->join('c.competition', 'comp')
            ->addSelect('comp')
            ->where('comp.id = :competitionId')
            ->andWhere('c.caughtBy = :user')
            ->andWhere('c.isValidated = :validated')
            ->setParameter('competitionId', $competitionId)
            ->setParameter('user', $user)
            ->setParameter('validated', true)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Prises validées pour une compétition et une équipe (tous les membres).
     *
     * @return FishCatch[]
     */
    public function findValidatedByTeamAndCompetition(Team $team, int $competitionId): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.team', 't')
            ->addSelect('t')
            ->join('c.species', 's')
            ->addSelect('s')
            ->join('c.competition', 'comp')
            ->addSelect('comp')
            ->leftJoin('c.caughtBy', 'u')
            ->addSelect('u')
            ->where('t.id = :teamId')
            ->andWhere('comp.id = :competitionId')
            ->andWhere('c.isValidated = :validated')
            ->setParameter('teamId', $team->getId())
            ->setParameter('competitionId', $competitionId)
            ->setParameter('validated', true)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Toutes les prises validées dont l'utilisateur est l'auteur (toutes compétitions confondues).
     * Ordre chronologique croissant.
     *
     * @return FishCatch[]
     */
    public function findValidatedByCaughtByUserGlobally(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->join('c.team', 't')
            ->addSelect('t')
            ->join('c.species', 's')
            ->addSelect('s')
            ->join('c.competition', 'comp')
            ->addSelect('comp')
            ->leftJoin('c.caughtBy', 'u')
            ->addSelect('u')
            ->where('c.caughtBy = :user')
            ->andWhere('c.isValidated = :validated')
            ->andWhere('c.competition IS NOT NULL')
            ->setParameter('user', $user)
            ->setParameter('validated', true)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
