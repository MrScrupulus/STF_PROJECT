<?php

namespace App\Repository\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionParticipantInvitation;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CompetitionParticipantInvitation>
 */
class CompetitionParticipantInvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CompetitionParticipantInvitation::class);
    }

    public function findByCode(string $code): ?CompetitionParticipantInvitation
    {
        $code = strtoupper(trim($code));
        if ($code === '') {
            return null;
        }

        return $this->findOneBy(['code' => $code]);
    }

    public function findForCompetitionAndEmail(Competition $competition, string $email): ?CompetitionParticipantInvitation
    {
        return $this->findOneBy([
            'competition' => $competition,
            'email' => mb_strtolower(trim($email)),
        ]);
    }

    public function isUserInvited(Competition $competition, User $user): bool
    {
        $email = mb_strtolower((string) $user->getEmail());
        $qb = $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->andWhere('i.competition = :competition')
            ->andWhere('i.invitedUser = :user OR i.email = :email')
            ->setParameter('competition', $competition)
            ->setParameter('user', $user)
            ->setParameter('email', $email)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $qb > 0;
    }

    /** @return list<int> */
    public function findCompetitionIdsForUser(User $user): array
    {
        $rows = $this->createQueryBuilder('i')
            ->select('IDENTITY(i.competition) AS cid')
            ->andWhere('i.invitedUser = :user OR i.email = :email')
            ->setParameter('user', $user)
            ->setParameter('email', mb_strtolower((string) $user->getEmail()))
            ->getQuery()
            ->getScalarResult();

        $ids = [];
        foreach ($rows as $row) {
            $id = (int) ($row['cid'] ?? 0);
            if ($id > 0) {
                $ids[$id] = $id;
            }
        }

        return array_values($ids);
    }
}
