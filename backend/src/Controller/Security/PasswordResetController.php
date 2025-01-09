<?php

namespace App\Controller\Security;

use App\DTO\Security\RequestPasswordResetRequest;
use App\DTO\Security\ResetPasswordRequest;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/password-reset')]
class PasswordResetController extends AbstractController
{
    #[Route('/request', name: 'request_password_reset', methods: ['POST'])]
    public function requestReset(
        Request $request,
        UserRepository $userRepository,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var RequestPasswordResetRequest $resetRequest */
        $resetRequest = $serializer->deserialize(
            $request->getContent(),
            RequestPasswordResetRequest::class,
            'json'
        );

        $user = $userRepository->findOneBy(['email' => $resetRequest->getEmail()]);

        if (!$user) {
            return $this->json(['message' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Logique de réinitialisation
        return $this->json(['message' => 'Email de réinitialisation envoyé']);
    }

    #[Route('/reset', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(
        Request $request,
        UserRepository $userRepository,
        SerializerInterface $serializer,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var ResetPasswordRequest $resetRequest */
        $resetRequest = $serializer->deserialize(
            $request->getContent(),
            ResetPasswordRequest::class,
            'json'
        );

        // Logique de réinitialisation
        return $this->json(['message' => 'Mot de passe réinitialisé avec succès']);
    }
}
