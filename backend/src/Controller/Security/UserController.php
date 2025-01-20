<?php

namespace App\Controller\Security;

use App\Entity\Security\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/users')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
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

    #[Route('/profile', name: 'app_user_delete', methods: ['DELETE'])]
    public function deleteProfile(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Compte supprimé avec succès'
        ]);
    }
}
