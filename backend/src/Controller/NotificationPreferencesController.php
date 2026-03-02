<?php

namespace App\Controller;

use App\Repository\NotificationPreferencesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notification-preferences')]
class NotificationPreferencesController extends AbstractController
{
    #[Route('', name: 'get_notification_preferences', methods: ['GET'])]
    public function getPreferences(NotificationPreferencesRepository $repository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $preferences = $repository->findOrCreateForUser($user);

        return $this->json([
            'success' => true,
            'preferences' => [
                'expoPushToken' => $preferences->getExpoPushToken(),
                'catchValidated' => $preferences->isCatchValidated(),
                'catchRejected' => $preferences->isCatchRejected(),
                'teamInvitation' => $preferences->isTeamInvitation(),
                'competitionRegistered' => $preferences->isCompetitionRegistered(),
                'competitionStarted' => $preferences->isCompetitionStarted(),
                'competitionEnded' => $preferences->isCompetitionEnded(),
                'competitionPaused' => $preferences->isCompetitionPaused(),
                'competitionResumed' => $preferences->isCompetitionResumed(),
                'catchPending' => $preferences->isCatchPending(),
                'receiveEmailNotifications' => $preferences->isReceiveEmailNotifications(),
            ]
        ]);
    }

    #[Route('', name: 'update_notification_preferences', methods: ['PUT'])]
    public function updatePreferences(
        Request $request,
        NotificationPreferencesRepository $repository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $data = json_decode($request->getContent(), true);
        $preferences = $repository->findOrCreateForUser($user);

        // Mettre à jour le token Expo si fourni
        if (isset($data['expoPushToken'])) {
            $preferences->setExpoPushToken($data['expoPushToken']);
        }

        // Mettre à jour les préférences de notifications
        if (isset($data['catchValidated'])) {
            $preferences->setCatchValidated((bool) $data['catchValidated']);
        }
        if (isset($data['catchRejected'])) {
            $preferences->setCatchRejected((bool) $data['catchRejected']);
        }
        if (isset($data['teamInvitation'])) {
            $preferences->setTeamInvitation((bool) $data['teamInvitation']);
        }
        if (isset($data['competitionRegistered'])) {
            $preferences->setCompetitionRegistered((bool) $data['competitionRegistered']);
        }
        if (isset($data['competitionStarted'])) {
            $preferences->setCompetitionStarted((bool) $data['competitionStarted']);
        }
        if (isset($data['competitionEnded'])) {
            $preferences->setCompetitionEnded((bool) $data['competitionEnded']);
        }
        if (isset($data['competitionPaused'])) {
            $preferences->setCompetitionPaused((bool) $data['competitionPaused']);
        }
        if (isset($data['competitionResumed'])) {
            $preferences->setCompetitionResumed((bool) $data['competitionResumed']);
        }

        // catchPending uniquement pour les admins
        if (isset($data['catchPending']) && in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            $preferences->setCatchPending((bool) $data['catchPending']);
        }

        if (isset($data['receiveEmailNotifications'])) {
            $preferences->setReceiveEmailNotifications((bool) $data['receiveEmailNotifications']);
        }

        $entityManager->flush();

        return $this->json([
            'success' => true,
            'message' => 'Préférences mises à jour avec succès',
            'preferences' => [
                'expoPushToken' => $preferences->getExpoPushToken(),
                'catchValidated' => $preferences->isCatchValidated(),
                'catchRejected' => $preferences->isCatchRejected(),
                'teamInvitation' => $preferences->isTeamInvitation(),
                'competitionRegistered' => $preferences->isCompetitionRegistered(),
                'competitionStarted' => $preferences->isCompetitionStarted(),
                'competitionEnded' => $preferences->isCompetitionEnded(),
                'competitionPaused' => $preferences->isCompetitionPaused(),
                'competitionResumed' => $preferences->isCompetitionResumed(),
                'catchPending' => $preferences->isCatchPending(),
                'receiveEmailNotifications' => $preferences->isReceiveEmailNotifications(),
            ]
        ]);
    }
}
