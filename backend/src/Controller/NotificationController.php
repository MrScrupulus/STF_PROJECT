<?php

namespace App\Controller;

use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    #[Route('', name: 'get_notifications', methods: ['GET'])]
    public function getNotifications(NotificationRepository $repository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $notifications = $repository->findByUser($user, 50);
        $unreadCount = $repository->countUnreadByUser($user);

        $notificationsData = array_map(function ($notification) {
            return [
                'id' => $notification->getId(),
                'type' => $notification->getType(),
                'message' => $notification->getMessage(),
                'data' => $notification->getData(),
                'isRead' => $notification->isRead(),
                'createdAt' => $notification->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }, $notifications);

        return $this->json([
            'success' => true,
            'notifications' => $notificationsData,
            'unreadCount' => $unreadCount,
        ]);
    }

    #[Route('/unread', name: 'get_unread_notifications', methods: ['GET'])]
    public function getUnreadNotifications(NotificationRepository $repository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $notifications = $repository->findUnreadByUser($user);
        $unreadCount = count($notifications);

        $notificationsData = array_map(function ($notification) {
            return [
                'id' => $notification->getId(),
                'type' => $notification->getType(),
                'message' => $notification->getMessage(),
                'data' => $notification->getData(),
                'isRead' => $notification->isRead(),
                'createdAt' => $notification->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }, $notifications);

        return $this->json([
            'success' => true,
            'notifications' => $notificationsData,
            'unreadCount' => $unreadCount,
        ]);
    }

    #[Route('/{id}/read', name: 'mark_notification_read', methods: ['PUT'])]
    public function markAsRead(int $id, NotificationRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $notification = $repository->find($id);
        if (!$notification) {
            return $this->json([
                'success' => false,
                'message' => 'Notification non trouvée'
            ], 404);
        }

        // Vérifier que la notification appartient à l'utilisateur
        if ($notification->getUser()->getId() !== $user->getId()) {
            return $this->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        $notification->setIsRead(true);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
        ]);
    }

    #[Route('/read-all', name: 'mark_all_notifications_read', methods: ['PUT'])]
    public function markAllAsRead(NotificationRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $unreadNotifications = $repository->findUnreadByUser($user);
        foreach ($unreadNotifications as $notification) {
            $notification->setIsRead(true);
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues',
            'count' => count($unreadNotifications),
        ]);
    }

    #[Route('/count', name: 'get_notification_count', methods: ['GET'])]
    public function getNotificationCount(NotificationRepository $repository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur non connecté'
            ], 401);
        }

        $unreadCount = $repository->countUnreadByUser($user);

        return $this->json([
            'success' => true,
            'unreadCount' => $unreadCount,
        ]);
    }
}
