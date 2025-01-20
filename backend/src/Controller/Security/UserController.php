<?php

namespace App\Controller\Security;

use App\DTO\Security\UpdateProfileRequest;
use App\Entity\Security\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/profile')]
class UserController extends AbstractController
{
    #[Route('', name: 'profile_get', methods: ['GET'])]
    public function getProfile(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->json([
            'email' => $user->getUserIdentifier(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'subscriber_number' => $user->getSubscriberNumber(),
            'country' => $user->getCountry(),
            'phone_number' => $user->getPhoneNumber(),
        ]);
    }

    #[Route('', name: 'profile_update', methods: ['PATCH'])]
    public function updateProfile(
        Request $request,
        SerializerInterface $serializer,
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $updateRequest = $serializer->deserialize(
            $request->getContent(),
            UpdateProfileRequest::class,
            'json'
        );

        $errors = $validator->validate($updateRequest);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        // Mise à jour uniquement des champs fournis
        if ($updateRequest->getEmail() !== null) {
            $user->setEmail($updateRequest->getEmail());
        }
        if ($updateRequest->getFirstname() !== null) {
            $user->setFirstname($updateRequest->getFirstname());
        }
        if ($updateRequest->getLastname() !== null) {
            $user->setLastname($updateRequest->getLastname());
        }
        if ($updateRequest->getSubscriberNumber() !== null) {
            $user->setSubscriberNumber($updateRequest->getSubscriberNumber());
        }
        if ($updateRequest->getCountry() !== null) {
            $user->setCountry($updateRequest->getCountry());
        }
        if ($updateRequest->getPhoneNumber() !== null) {
            $user->setPhoneNumber($updateRequest->getPhoneNumber());
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'email' => $user->getUserIdentifier(),
                'firstname' => $user->getFirstname(),
                'lastname' => $user->getLastname(),
                'subscriber_number' => $user->getSubscriberNumber(),
                'country' => $user->getCountry(),
                'phone_number' => $user->getPhoneNumber(),
            ]
        ]);
    }
}
