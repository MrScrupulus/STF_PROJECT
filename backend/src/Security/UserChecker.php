<?php

namespace App\Security;

use App\Entity\Security\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User) {
            return;
        }

        // Vérifier que l'email est vérifié avant d'autoriser l'accès
        if (!$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException(
                'Votre email n\'a pas été vérifié. Veuillez vérifier votre boîte mail et cliquer sur le lien de vérification.'
            );
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
        // Aucune vérification post-authentification nécessaire
    }
}
