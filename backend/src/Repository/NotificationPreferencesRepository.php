<?php

namespace App\Repository;

use App\Entity\NotificationPreferences;
use App\Entity\Security\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<NotificationPreferences>
 */
class NotificationPreferencesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, NotificationPreferences::class);
    }

    /**
     * Trouve les préférences d'un utilisateur ou les crée avec les valeurs par défaut
     */
    public function findOrCreateForUser(User $user): NotificationPreferences
    {
        $preferences = $this->findOneBy(['user' => $user]);
        
        if (!$preferences) {
            $preferences = new NotificationPreferences();
            $preferences->setUser($user);
            $this->getEntityManager()->persist($preferences);
            $this->getEntityManager()->flush();
        }
        
        return $preferences;
    }

    /**
     * Trouve les préférences d'un utilisateur
     */
    public function findByUser(User $user): ?NotificationPreferences
    {
        return $this->findOneBy(['user' => $user]);
    }
}
