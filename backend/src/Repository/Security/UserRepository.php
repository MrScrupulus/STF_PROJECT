<?php

namespace App\Repository\Security;

use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function findByRole(string $role): array
    {
        // Utilise une condition LIKE sur le champ JSON/string des rôles pour rester compatible
        // avec différents moteurs SQL (MySQL, PostgreSQL, etc.).
        // On recherche la chaîne "ROLE_XYZ" entourée de guillemets pour éviter les faux positifs.
        return $this->createQueryBuilder('u')
            ->andWhere('u.roles LIKE :role')
            ->setParameter('role', '%"' . $role . '"%')
            ->getQuery()
            ->getResult();
    }
}
