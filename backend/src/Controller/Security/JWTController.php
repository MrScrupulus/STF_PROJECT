<?php

namespace App\Controller\Security;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\User;
use App\Entity\Team;

#[Route('/jwt')]
class JWTController extends AbstractController
{
    #[Route('/test', name: 'test_jwt', methods: ['GET'])]
    public function test(): JsonResponse
    {
        return $this->json(['message' => 'JWT valide']);
    }

    #[Route('/me', name: 'app_jwt_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        // Récupérer l'équipe de l'utilisateur
        $team = $this->entityManager->getRepository(Team::class)->findOneByMember($user);

        return $this->json([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'phone_number' => $user->getPhoneNumber(),
                'team' => $team ? [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'competition' => $team->getCompetition() ? [
                        'id' => $team->getCompetition()->getId(),
                        'name' => $team->getCompetition()->getName(),
                    ] : null,
                ] : null,
            ]
        ]);
    }
}
