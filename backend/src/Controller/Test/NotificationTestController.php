<?php

namespace App\Controller\Test;

use App\Service\NotificationService;
use App\Repository\Security\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Contrôleur de test pour les notifications push
 * Accessible uniquement aux admins et en environnement de développement
 */
#[Route('/api/test/notifications')]
#[IsGranted('ROLE_ADMIN')]
class NotificationTestController extends AbstractController
{
    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly UserRepository $userRepository
    ) {
    }

    /**
     * Liste tous les types de notifications disponibles pour les tests
     */
    #[Route('/types', name: 'test_notifications_types', methods: ['GET'])]
    public function getNotificationTypes(): JsonResponse
    {
        return $this->json([
            'success' => true,
            'types' => [
                'catch_validated' => 'Prise validée',
                'catch_rejected' => 'Prise rejetée',
                'team_invitation' => 'Invitation d\'équipe',
                'competition_registered' => 'Inscription compétition',
                'competition_started' => 'Compétition démarrée',
                'competition_ended' => 'Compétition terminée',
                'competition_paused' => 'Compétition en pause',
                'competition_resumed' => 'Compétition reprise',
                'catch_pending' => 'Nouvelle prise en attente (admin)',
            ],
        ]);
    }

    /**
     * Envoie une notification de test au utilisateur connecté
     * POST /api/test/notifications/send
     * Body: { "type": "catch_validated", "userId": 1 } (userId optionnel, par défaut utilisateur connecté)
     */
    #[Route('/send', name: 'test_notifications_send', methods: ['POST'])]
    public function sendTestNotification(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $type = $data['type'] ?? null;
        $targetUserId = $data['userId'] ?? null;

        if (!$type) {
            return $this->json([
                'success' => false,
                'message' => 'Le type de notification est requis',
            ], 400);
        }

        // Utiliser l'utilisateur cible ou l'utilisateur connecté
        $targetUser = $targetUserId 
            ? $this->userRepository->find($targetUserId)
            : $this->getUser();

        if (!$targetUser) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
            ], 404);
        }

        try {
            $this->sendNotificationByType($targetUser, $type);
            
            return $this->json([
                'success' => true,
                'message' => "Notification de test '{$type}' envoyée avec succès à {$targetUser->getEmail()}",
                'type' => $type,
                'userId' => $targetUser->getId(),
            ]);
        } catch (\Exception $e) {
            // On logue l'erreur pour le débogage, mais on ne renvoie pas le détail au client
            // car ce contrôleur peut être utilisé en environnement réel par des admins
            $this->container->get('logger')->error('Erreur lors de l\'envoi de la notification de test', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de la notification de test. Veuillez réessayer plus tard.',
            ], 500);
        }
    }

    /**
     * Envoie toutes les notifications de test à l'utilisateur connecté (ou userId spécifié)
     * POST /api/test/notifications/send-all
     * Body: { "userId": 1 } (optionnel)
     */
    #[Route('/send-all', name: 'test_notifications_send_all', methods: ['POST'])]
    public function sendAllTestNotifications(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $targetUserId = $data['userId'] ?? null;

        $targetUser = $targetUserId 
            ? $this->userRepository->find($targetUserId)
            : $this->getUser();

        if (!$targetUser) {
            return $this->json([
                'success' => false,
                'message' => 'Utilisateur introuvable',
            ], 404);
        }

        $types = [
            'catch_validated',
            'catch_rejected',
            'team_invitation',
            'competition_registered',
            'competition_started',
            'competition_ended',
            'competition_paused',
            'competition_resumed',
        ];

        // catch_pending uniquement pour les admins
        if (in_array('ROLE_ADMIN', $targetUser->getRoles(), true)) {
            $types[] = 'catch_pending';
        }

        $results = [];
        foreach ($types as $type) {
            try {
                $this->sendNotificationByType($targetUser, $type);
                $results[$type] = 'success';
            } catch (\Exception $e) {
                $results[$type] = 'error: ' . $e->getMessage();
            }
        }

        return $this->json([
            'success' => true,
            'message' => "Toutes les notifications de test ont été envoyées à {$targetUser->getEmail()}",
            'userId' => $targetUser->getId(),
            'results' => $results,
        ]);
    }

    /**
     * Envoie une notification selon son type
     */
    private function sendNotificationByType($user, string $type): void
    {
        switch ($type) {
            case 'catch_validated':
                $this->notificationService->notifyCatchValidated($user, 999, 'Truite arc-en-ciel', 45.5, 1);
                break;

            case 'catch_rejected':
                $this->notificationService->notifyCatchRejected($user, 999, 'Truite arc-en-ciel', 45.5, 'Taille insuffisante', 1);
                break;

            case 'team_invitation':
                $this->notificationService->notifyTeamInvitation($user, 'Équipe Test', 999);
                break;

            case 'competition_registered':
                $this->notificationService->notifyCompetitionRegistration($user, 'Compétition Test', 999);
                break;

            case 'competition_started':
                $this->notificationService->notifyCompetitionStarted($user, 'Compétition Test', 999);
                break;

            case 'competition_ended':
                $this->notificationService->notifyCompetitionEnded($user, 'Compétition Test', 999);
                break;

            case 'competition_paused':
                $this->notificationService->notifyCompetitionPaused($user, 'Compétition Test', 999);
                break;

            case 'competition_resumed':
                $this->notificationService->notifyCompetitionResumed($user, 'Compétition Test', 999);
                break;

            case 'catch_pending':
                // Pour catch_pending, on utilise la méthode qui notifie tous les admins
                $this->notificationService->notifyAdminsPendingCatch(999, 'Équipe Test', 'Truite arc-en-ciel', 45.5, $user->getFirstName() . ' ' . $user->getLastName());
                break;

            default:
                throw new \InvalidArgumentException("Type de notification inconnu : {$type}");
        }
    }
}
