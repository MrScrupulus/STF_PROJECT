<?php

namespace App\Repository\Competition;

use App\Entity\Competition\TeamInvitation;
use App\Entity\Security\User;
use App\Entity\Competition\Team;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TeamInvitation>
 */
class TeamInvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TeamInvitation::class);
    }

    /**
     * Trouve les invitations en attente pour un utilisateur
     */
    public function findPendingInvitationsForUser(User $user): array
    {
        return $this->createQueryBuilder('ti')
            ->where('ti.invitedUser = :user')
            ->andWhere('ti.status = :status')
            ->setParameter('user', $user)
            ->setParameter('status', 'pending')
            ->orderBy('ti.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les invitations en attente pour une équipe
     */
    public function findPendingInvitationsForTeam(Team $team): array
    {
        return $this->createQueryBuilder('ti')
            ->where('ti.team = :team')
            ->andWhere('ti.status = :status')
            ->setParameter('team', $team)
            ->setParameter('status', 'pending')
            ->orderBy('ti.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve une invitation spécifique
     */
    public function findInvitation(Team $team, User $user): ?TeamInvitation
    {
        return $this->createQueryBuilder('ti')
            ->where('ti.team = :team')
            ->andWhere('ti.invitedUser = :user')
            ->andWhere('ti.status = :status')
            ->setParameter('team', $team)
            ->setParameter('user', $user)
            ->setParameter('status', 'pending')
            ->getQuery()
            ->getOneOrNullResult();
    }
}
