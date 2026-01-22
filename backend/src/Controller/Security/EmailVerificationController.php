<?php

namespace App\Controller\Security;

use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class EmailVerificationController extends AbstractController
{
    #[Route('/api/auth/verify-email/{token}', name: 'api_verify_email', methods: ['GET'])]
    public function verifyEmail(
        string $token,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager
    ): Response {
        $user = $userRepository->findOneBy(['verification_token' => $token]);

        if (!$user) {
            return $this->json(
                ['success' => false, 'message' => 'Token invalide'],
                Response::HTTP_NOT_FOUND
            );
        }

        $user->setIsVerified(true);
        $user->setVerificationToken(null);

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'email' => $user->getEmail() // Retourner l'email pour pré-remplir le formulaire de login
        ]);
    }
}
