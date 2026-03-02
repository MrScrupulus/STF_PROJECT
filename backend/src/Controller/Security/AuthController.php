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
use App\Service\UserAnonymizerService;
use Symfony\Component\HttpFoundation\Response;

#[Route('/api/auth', name: 'app_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly EmailService $emailService,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger,
        private readonly UserRepository $userRepository,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly UserAnonymizerService $userAnonymizerService,
    ) {}

    #[Route('/register', name: 'auth_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        $this->logger->info('Route register appelée');
        try {
            $this->logger->info('Début de la requête register');
            $data = json_decode($request->getContent(), true);
            $this->logger->info('Données reçues:', ['data' => $data]);

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

            // Validation des données requises (seuls email, password, firstname, lastname sont obligatoires)
            $requiredFields = [
                'email',
                'password',
                'firstname',
                'lastname',
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

            // Validation du format de la date si fournie
            $birthDate = null;
            if (isset($data['birthdate']) && !empty($data['birthdate'])) {
                try {
                    $birthDate = new \DateTime($data['birthdate']);
                    $this->logger->info('Date convertie:', ['date' => $birthDate->format('Y-m-d')]);
                } catch (\Exception $e) {
                    $this->logger->error('Erreur conversion date:', ['error' => $e->getMessage()]);
                    return $this->json([
                        'success' => false,
                        'message' => 'Format de date invalide. Utilisez le format YYYY-MM-DD',
                    ], 400);
                }
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
            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
            $user->setFirstname($data['firstname']);
            $user->setLastname($data['lastname']);
            $user->setPhoneNumber(!empty($data['phone_number']) ? $data['phone_number'] : null);
            $user->setCountry(!empty($data['country']) ? $data['country'] : null);
            $user->setBirthDate($birthDate);
            $user->setSubscriberNumber(!empty($data['subscriber_number']) ? $data['subscriber_number'] : null);
            $verificationToken = bin2hex(random_bytes(32));
            error_log("Longueur du token généré: " . strlen($verificationToken));
            error_log("Token généré lors de l'inscription: " . $verificationToken);
            $user->setVerificationToken($verificationToken);
            $user->setIsVerified(false);
            $user->setRoles(['ROLE_USER']);

            $this->entityManager->persist($user);
            $this->entityManager->flush();

            error_log("Envoi de l'email avec le token: " . $verificationToken);
            try {
                $this->emailService->sendVerificationEmail($user);
            } catch (\Exception $emailException) {
                error_log("ERREUR lors de l'envoi de l'email (non bloquant): " . $emailException->getMessage());
                // L'utilisateur est créé même si l'email échoue
            }

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
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Identifiants invalides'
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Recharger l'utilisateur depuis la base de données pour avoir les données à jour
        // (au cas où is_verified a été modifié directement en base)
        $this->entityManager->refresh($user);

        // Vérifier que l'email est vérifié
        if (!$user->isVerified()) {
            return $this->json([
                'success' => false,
                'message' => 'Votre compte n\'est pas encore activé. Veuillez vérifier votre adresse email en cliquant sur le lien reçu lors de votre inscription. Si vous n\'avez pas reçu l\'email, vérifiez votre dossier spam ou contactez le support.',
                'requiresVerification' => true
            ], Response::HTTP_FORBIDDEN);
        }

        // Générer le token JWT
        $token = $this->jwtManager->create($user);

        return $this->json([
            'success' => true,
            'token' => $token,
            'user' => $user->getUserIdentifier(),
            'roles' => $user->getRoles()
        ]);
    }

    #[Route('/account', name: 'auth_delete_account', methods: ['DELETE'])]
    public function deleteAccount(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }
        if ($user->isDeleted()) {
            return $this->json(['success' => false, 'message' => 'Ce compte est déjà supprimé.'], Response::HTTP_BAD_REQUEST);
        }
        $this->userAnonymizerService->anonymize($user);
        return $this->json([
            'success' => true,
            'message' => 'Compte supprimé avec succès. Vos prises restent visibles sous "Anonyme" dans les historiques.',
        ]);
    }

    #[Route('/me', name: 'auth_me', methods: ['GET', 'OPTIONS'])]
    public function getCurrentUser(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        return $this->json([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'phone_number' => $user->getPhoneNumber() ?? null,
                'birth_date' => $user->getBirthDate() ? $user->getBirthDate()->format('Y-m-d') : null,
                'country' => $user->getCountry() ?? null,
                'subscriber_number' => $user->getSubscriberNumber() ?? null,
            ]
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
                'message' => 'Email vérifié avec succès',
                'email' => $user->getEmail() // Retourner l'email pour pré-remplir le formulaire de login
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

    #[Route('/admin/verify-user/{id}', name: 'admin_verify_user', methods: ['POST'])]
    public function adminVerifyUser(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], Response::HTTP_NOT_FOUND);
            }

            $user->setIsVerified(true);
            $user->setVerificationToken(null);
            $this->entityManager->flush();

            return $this->json([
                'success' => true,
                'message' => 'Email vérifié avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
