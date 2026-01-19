<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Notification>
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /**
     * Récupère les notifications non lues d'un utilisateur
     */
    public function findUnreadByUser(User $user): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->andWhere('n.isRead = :isRead')
            ->setParameter('user', $user)
            ->setParameter('isRead', false)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère toutes les notifications d'un utilisateur (lues et non lues)
     */
    public function findByUser(User $user, ?int $limit = null): array
    {
        $qb = $this->createQueryBuilder('n')
            ->where('n.user = :user')
            ->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC');

        if ($limit !== null) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Compte les notifications non lues d'un utilisateur
     */
    public function countUnreadByUser(User $user): int
    {
        return $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.user = :user')
            ->andWhere('n.isRead = :isRead')
            ->setParameter('user', $user)
            ->setParameter('isRead', false)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
