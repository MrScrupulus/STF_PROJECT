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
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Psr\Log\LoggerInterface;

#[Route('/api/auth')]
class UpdateController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EmailService $emailService,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('/profile', name: 'update_profile', methods: ['POST'])]
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], Response::HTTP_NOT_FOUND);
            }

            $data = json_decode($request->getContent(), true);
            $this->logger->info('Données reçues pour mise à jour:', ['data' => $data]);

            if (isset($data['firstname'])) $user->setFirstname($data['firstname']);
            if (isset($data['lastname'])) $user->setLastname($data['lastname']);
            if (isset($data['email'])) $user->setEmail($data['email']);
            if (isset($data['phone_number'])) $user->setPhoneNumber($data['phone_number']);
            if (isset($data['birthdate'])) {
                $birthdate = $data['birthdate'] ? new \DateTime($data['birthdate']) : null;
                $user->setBirthDate($birthdate);
            }
            if (isset($data['country'])) $user->setCountry($data['country']);
            if (isset($data['subscriber_number'])) $user->setSubscriberNumber($data['subscriber_number']);

            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'user' => [
                    'firstname' => $user->getFirstname(),
                    'lastname' => $user->getLastname(),
                    'email' => $user->getEmail(),
                    'phone_number' => $user->getPhoneNumber(),
                    'birth_date' => $user->getBirthDate()?->format('Y-m-d'),
                    'country' => $user->getCountry(),
                    'subscriber_number' => $user->getSubscriberNumber()
                ]
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur mise à jour profil:', ['error' => $e->getMessage()]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
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

        // Validation du nouveau mot de passe
        $constraints = new Assert\Collection([
            'password' => [
                new Assert\NotBlank(),
                new Assert\Length(['min' => 8]),
                new Assert\Regex([
                    'pattern' => '/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/',
                    'message' => 'Le mot de passe doit contenir au moins une lettre, 
                    un chiffre et un caractère spécial',
                ]),
            ],
        ]);

        $errors = $this->validator->validate(['password' => $data['newPassword']], $constraints);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => $errors[0]->getMessage(),
            ], 400);
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
