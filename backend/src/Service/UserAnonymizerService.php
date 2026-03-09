<?php

namespace App\Service;

use App\Entity\Security\User;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Anonymise un utilisateur au lieu de le supprimer.
 * Garde l'utilisateur en base pour conserver les prises (caughtBy) et l'historique,
 * mais le rend non connectable et affiché "Anonyme" partout.
 */
class UserAnonymizerService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    public function anonymize(User $user): void
    {
        $userId = $user->getId();
        $user->setFirstname('Anonyme');
        $user->setLastname('');
        $user->setEmail(sprintf('deleted_%d_@anonymized.local', $userId));
        $user->setPassword(password_hash(bin2hex(random_bytes(16)), \PASSWORD_BCRYPT));
        $user->setPhoneNumber(null);
        $user->setVerificationToken(null);
        $user->setIsVerified(false);
        $user->setIsDeleted(true);
        $user->setRoles([]);

        $this->entityManager->flush();
    }
}
