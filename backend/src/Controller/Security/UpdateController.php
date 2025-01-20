<?php

namespace App\Controller\Security;

use App\Entity\Security\User;
use App\Service\EmailService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[Route('/users/update')]
class UpdateController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EmailService $emailService,
    ) {}

    #[Route('/profile', name: 'app_update_profile', methods: ['PUT'])]
    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        // Mise à jour des informations de base
        if (isset($data['firstname'])) $user->setFirstname($data['firstname']);
        if (isset($data['lastname'])) $user->setLastname($data['lastname']);
        if (isset($data['phoneNumber'])) $user->setPhoneNumber($data['phoneNumber']);
        if (isset($data['country'])) $user->setCountry($data['country']);
        if (isset($data['birthdate'])) $user->setBirthDate(new \DateTime($data['birthdate']));
        if (isset($data['subscriberNumber'])) $user->setSubscriberNumber($data['subscriberNumber']);

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'subscriberNumber' => $user->getSubscriberNumber(),
                'phoneNumber' => $user->getPhoneNumber(),
                'country' => $user->getCountry(),
                'birthdate' => $user->getBirthDate()?->format('Y-m-d'),
                'isVerified' => $user->isVerified(),
                'roles' => $user->getRoles(),
            ]
        ]);
    }

    #[Route('/email', name: 'app_update_email', methods: ['PUT'])]
    public function updateEmail(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email'])) {
            return $this->json(['message' => 'Email requis'], Response::HTTP_BAD_REQUEST);
        }

        if ($data['email'] !== $user->getEmail()) {
            $user->setEmail($data['email']);
            $user->setIsVerified(false);
            $verificationToken = bin2hex(random_bytes(32));
            $user->setVerificationToken($verificationToken);
            $this->emailService->sendVerificationEmail($user);
        }

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Email mis à jour avec succès. Veuillez vérifier votre nouvel email.',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'subscriberNumber' => $user->getSubscriberNumber(),
                'phoneNumber' => $user->getPhoneNumber(),
                'country' => $user->getCountry(),
                'birthdate' => $user->getBirthDate()?->format('Y-m-d'),
                'isVerified' => $user->isVerified(),
                'roles' => $user->getRoles(),
            ]
        ]);
    }

    #[Route('/password', name: 'app_update_password', methods: ['PUT'])]
    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!isset($data['currentPassword']) || !isset($data['newPassword'])) {
            return $this->json([
                'message' => 'Les mots de passe sont requis'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier l'ancien mot de passe
        if (!$this->passwordHasher->isPasswordValid($user, $data['currentPassword'])) {
            return $this->json([
                'message' => 'Mot de passe actuel incorrect'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Hasher et sauvegarder le nouveau mot de passe
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $data['newPassword']
        );
        $user->setPassword($hashedPassword);

        try {
            $this->entityManager->flush();
            return $this->json([
                'message' => 'Mot de passe mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la mise à jour du mot de passe'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
