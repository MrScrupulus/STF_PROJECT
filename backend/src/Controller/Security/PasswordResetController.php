<?php

namespace App\Controller\Security;

use App\DTO\Security\RequestPasswordResetRequest;
use App\DTO\Security\ResetPasswordRequest;
use App\Repository\Security\UserRepository;
use App\Repository\Security\PasswordResetTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Service\EmailService;
use App\Entity\Security\PasswordResetToken;

#[Route('/password-reset')]
class PasswordResetController extends AbstractController
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EmailService $emailService,
        private readonly PasswordResetTokenRepository $resetTokenRepository
    ) {}

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
            // Pour des raisons de sécurité, on renvoie toujours un succès même si l'email n'existe pas
            return $this->json(['message' => 'Si l\'adresse existe, un email a été envoyé']);
        }

        // Générer un token unique
        $token = bin2hex(random_bytes(32));
        $expiresAt = new \DateTimeImmutable('+1 hour');

        // Créer et sauvegarder le token
        $resetToken = new PasswordResetToken($user, $token, $expiresAt);
        $entityManager->persist($resetToken);
        $entityManager->flush();

        // Envoyer l'email
        $this->emailService->sendPasswordResetEmail($user, $token);

        return $this->json(['message' => 'Email de réinitialisation envoyé']);
    }

    #[Route('/reset', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(
        string $token,
        Request $request,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $resetToken = $this->resetTokenRepository->findOneBy(['token' => $token]);

        if (!$resetToken || $resetToken->isExpired()) {
            return $this->json(
                ['message' => 'Token invalide ou expiré'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $user = $resetToken->getUser();

        /** @var ResetPasswordRequest $resetRequest */
        $resetRequest = $this->serializer->deserialize(
            $request->getContent(),
            ResetPasswordRequest::class,
            'json'
        );

        $newPassword = $resetRequest->getPassword();

        // Hasher et mettre à jour le mot de passe
        $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashedPassword);

        // Supprimer le token utilisé
        $entityManager->remove($resetToken);
        $entityManager->flush();

        return $this->json(['message' => 'Mot de passe réinitialisé avec succès']);
    }
}
