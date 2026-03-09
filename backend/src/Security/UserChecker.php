<?php

namespace App\Security;

use App\Entity\Security\User;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class UserChecker implements UserCheckerInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager
    ) {}

    public function checkPreAuth(UserInterface $user): void
    {
        // Ne pas vérifier avant l'authentification pour permettre la vérification du mot de passe
        // La vérification de l'email se fera dans checkPostAuth après l'authentification réussie
    }

    public function checkPostAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        try {
            // Recharger l'utilisateur depuis la base de données pour avoir les données à jour
            // (au cas où is_verified a été modifié directement en base)
            $this->entityManager->refresh($user);
        } catch (\Throwable $e) {
            // Si l'utilisateur n'est pas géré par Doctrine ou erreur de refresh, continuer tel quel
        }

        // Vérifier que l'email est vérifié après l'authentification réussie
        if (!$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException(
                'Votre compte n\'est pas encore activé. Veuillez vérifier votre adresse email en cliquant sur le lien reçu lors de votre inscription. Si vous n\'avez pas reçu l\'email, vérifiez votre dossier spam ou contactez le support.'
            );
        }
    }
}
