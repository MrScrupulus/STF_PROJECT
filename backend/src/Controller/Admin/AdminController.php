<?php

namespace App\Controller\Admin;

use App\Entity\Security\User;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin')]
class AdminController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository
    ) {}

    #[Route('/users', name: 'admin_users_list', methods: ['GET'])]
    public function listUsers(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        $usersData = array_map(function ($user) {
            return [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'subscriberNumber' => $user->getSubscriberNumber(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'country' => $user->getCountry(),
                'phoneNumber' => $user->getPhoneNumber(),
                'isVerified' => $user->isVerified(),
            ];
        }, $users);

        return $this->json(['users' => $usersData]);
    }

    #[Route('/users/{id}/toggle-role', name: 'admin_toggle_role', methods: ['PUT'])]
    public function toggleUserRole(User $user): JsonResponse
    {
        $roles = $user->getRoles();
        if (in_array('ROLE_ADMIN', $roles)) {
            $user->setRoles(['ROLE_USER']);
        } else {
            $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
        }

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Rôles mis à jour avec succès',
            'roles' => $user->getRoles()
        ]);
    }

    #[Route('/users/{id}', name: 'admin_update_user', methods: ['PUT'])]
    public function updateUser(Request $request, User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['firstname'])) $user->setFirstname($data['firstname']);
        if (isset($data['lastname'])) $user->setLastname($data['lastname']);
        if (isset($data['country'])) $user->setCountry($data['country']);
        if (isset($data['phoneNumber'])) $user->setPhoneNumber($data['phoneNumber']);
        if (isset($data['subscriberNumber'])) $user->setSubscriberNumber($data['subscriberNumber']);

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
                'subscriberNumber' => $user->getSubscriberNumber(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'country' => $user->getCountry(),
                'phoneNumber' => $user->getPhoneNumber(),
                'isVerified' => $user->isVerified(),
            ]
        ]);
    }

    #[Route('/users/{id}', name: 'admin_delete_user', methods: ['DELETE'])]
    public function deleteUser(User $user): JsonResponse
    {
        $this->entityManager->remove($user);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }

    #[Route('/users/{id}/verify', name: 'admin_verify_user', methods: ['PUT'])]
    public function verifyUser(User $user): JsonResponse
    {
        $user->setIsVerified(true);
        $user->setVerificationToken(null);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Utilisateur vérifié avec succès',
            'isVerified' => true
        ]);
    }
}
