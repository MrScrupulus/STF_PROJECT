<?php

namespace App\Repository\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionStaffInvitation;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompetitionStaffInvitation>
 */
class CompetitionStaffInvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompetitionStaffInvitation::class);
    }

    /** @return list<CompetitionStaffInvitation> */
    public function findPendingForUser(User $user): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.status = :pending')
            ->andWhere('i.invitedUser = :user OR i.email = :email')
            ->setParameter('pending', 'pending')
            ->setParameter('user', $user)
            ->setParameter('email', mb_strtolower((string) $user->getEmail()))
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPendingForCompetitionAndEmail(Competition $competition, string $email): ?CompetitionStaffInvitation
    {
        return $this->findOneBy([
            'competition' => $competition,
            'email' => mb_strtolower(trim($email)),
            'status' => 'pending',
        ]);
    }
}
