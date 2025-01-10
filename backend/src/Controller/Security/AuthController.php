<?php

declare(strict_types=1);

namespace App\Controller\Security;

use App\Entity\Security\User;
use App\Service\EmailService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\DBAL\Exception\ConnectionException;
use Symfony\Component\Validator\Constraints as Assert;
use Psr\Log\LoggerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use App\Repository\Security\UserRepository;
use Symfony\Component\HttpFoundation\Response;

#[Route('/auth', name: 'app_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly EmailService $emailService,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger,
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        $this->logger->info('Route register appelée');
        try {
            $this->logger->info('Début de la requête register');
            $data = json_decode($request->getContent(), true);
            $this->logger->debug('Données reçues', ['data' => $data]);

            if (!is_array($data)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                ], 400);
            }

            // Validation du mot de passe
            $constraints = new Assert\Collection([
                'password' => [
                    new Assert\NotBlank(),
                    new Assert\Length(['min' => 8]),
                    new Assert\Regex([
                        'pattern' => '/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/',
                        'message' => 'Le mot de passe doit contenir au moins une lettre, un chiffre et un caractère spécial',
                    ]),
                ],
            ]);

            $errors = $this->validator->validate(['password' => $data['password']], $constraints);
            if (count($errors) > 0) {
                return $this->json([
                    'success' => false,
                    'message' => $errors[0]->getMessage(),
                ], 400);
            }

            // Validation des données requises
            $requiredFields = [
                'email',
                'password',
                'firstname',
                'lastname',
                'phone_number',
                'birthdate',
                'country',
                'subscriber_number'
            ];

            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return $this->json([
                        'success' => false,
                        'message' => sprintf('Le champ %s est requis', $field),
                    ], 400);
                }
            }

            // Validation du format de l'email
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Format d\'email invalide',
                ], 400);
            }

            // Validation de la longueur du mot de passe
            if (strlen($data['password']) < 8) {
                return $this->json([
                    'success' => false,
                    'message' => 'Le mot de passe doit contenir au moins 8 caractères',
                ], 400);
            }

            // Validation du format de la date
            try {
                new \DateTime($data['birthdate']);
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'message' => 'Format de date invalide',
                ], 400);
            }

            $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $data['email']]);
            if ($existingUser) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cet email est déjà utilisé',
                ], 400);
            }

            $user = new User();
            $user->setEmail($data['email']);
            $user->setPassword($passwordHasher->hashPassword($user, $data['password']));
            $user->setFirstname($data['firstname']);
            $user->setLastname($data['lastname']);
            $user->setPhoneNumber($data['phone_number']);
            $user->setBirthDate(new \DateTime($data['birthdate']));
            $user->setCountry($data['country']);
            $user->setSubscriberNumber($data['subscriber_number']);
            $verificationToken = bin2hex(random_bytes(32));
            error_log("Longueur du token généré: " . strlen($verificationToken));
            error_log("Token généré lors de l'inscription: " . $verificationToken);
            $user->setVerificationToken($verificationToken);
            $user->setIsVerified(false);
            $user->setRoles(['ROLE_USER']);

            $this->entityManager->persist($user);
            $this->entityManager->flush();

            error_log("Envoi de l'email avec le token: " . $verificationToken);
            $this->emailService->sendVerificationEmail($user);

            return $this->json([
                'success' => true,
                'message' => 'Inscription réussie. Veuillez vérifier votre email.',
            ]);
        } catch (\Doctrine\DBAL\Exception\TableNotFoundException $e) {
            $this->logger->error('Table non trouvée', ['error' => $e->getMessage()]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur de configuration de la base de données',
            ], 500);
        } catch (\Doctrine\DBAL\Exception\DriverException $e) {
            $this->logger->error('Erreur de base de données', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Erreur de base de données',
            ], 500);
        } catch (\Exception $e) {
            $this->logger->error('Erreur inattendue', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'inscription',
            ], 500);
        }
    }

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        // Cette méthode peut être vide car le JWT est géré par le firewall
        return $this->json([
            'user' => $this->getUser() ? $this->getUser()->getUserIdentifier() : null
        ]);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Non authentifié'], 401);
        }

        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'subscriberNumber' => $user->getSubscriberNumber(),
                'roles' => $user->getRoles(),
            ],
        ]);
    }

    #[Route('/verify-email/{token}', name: 'verify_email', methods: ['POST'])]
    public function verifyEmail(string $token): JsonResponse
    {
        try {
            $user = $this->userRepository->findOneBy(['verification_token' => $token]);

            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Token de vérification invalide'
                ], Response::HTTP_BAD_REQUEST);
            }

            if ($user->isVerified()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cet email a déjà été vérifié'
                ]);
            }

            $user->setIsVerified(true);
            $user->setVerificationToken(null);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Email vérifié avec succès'
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la vérification de l\'email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la vérification'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function generateVerificationUrl(string $token): string
    {
        // Utilisez HTTPS au lieu de HTTP
        return "https://localhost:3000/verify-email/{$token}";
    }
}
