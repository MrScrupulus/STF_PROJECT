<?php

namespace App\Controller\Security;

use App\Entity\Security\User;
use App\Service\UserAnonymizerService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/users')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly UserAnonymizerService $userAnonymizerService,
    ) {}

    #[Route('/profile', name: 'app_user_profile', methods: ['GET'])]
    public function getProfile(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'phoneNumber' => $user->getPhoneNumber(),
                'isVerified' => $user->isVerified(),
                'roles' => $user->getRoles(),
            ]
        ]);
    }

    #[Route('/profile', name: 'app_user_update', methods: ['POST'])]
    public function updateProfile(Request $request): JsonResponse
    {
        // Implementation of updateProfile method
        return $this->json(['message' => 'Update profile method not implemented']);
    }

    #[Route('/profile', name: 'app_user_delete', methods: ['DELETE'])]
    public function deleteProfile(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->isDeleted()) {
            return $this->json(['message' => 'Ce compte est déjà supprimé.'], Response::HTTP_BAD_REQUEST);
        }

        $this->userAnonymizerService->anonymize($user);

        return $this->json([
            'message' => 'Compte supprimé avec succès. Vos prises restent visibles sous "Anonyme" dans les historiques.'
        ]);
    }
}
