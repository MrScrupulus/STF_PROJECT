<?php

namespace App\Repository\Security;

use App\Entity\Security\InvalidatedToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class InvalidatedTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InvalidatedToken::class);
    }

    public function isTokenInvalidated(string $jti): bool
    {
        return null !== $this->findOneBy(['jti' => $jti]);
    }

    public function invalidateToken(string $jti): void
    {
        $token = new InvalidatedToken($jti);
        $this->getEntityManager()->persist($token);
        $this->getEntityManager()->flush();
    }
}
