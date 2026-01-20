<?php

namespace App\Service;

use App\Entity\NotificationPreferences;
use App\Repository\NotificationPreferencesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class ExpoPushNotificationService
{
    private const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly NotificationPreferencesRepository $preferencesRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly LoggerInterface $logger
    ) {
    }

    /**
     * Envoie une notification push à un utilisateur
     */
    public function sendPushNotification(
        NotificationPreferences $preferences,
        string $title,
        string $body,
        ?array $data = null
    ): bool {
        if (!$preferences->getExpoPushToken()) {
            return false; // Pas de token, pas de notification push
        }

        try {
            $response = $this->httpClient->request('POST', self::EXPO_API_URL, [
                'headers' => [
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'to' => $preferences->getExpoPushToken(),
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'sound' => 'default',
                    'priority' => 'high',
                ],
            ]);

            $statusCode = $response->getStatusCode();
            $content = $response->toArray();

            if ($statusCode === 200 && isset($content['data'][0]['status']) && $content['data'][0]['status'] === 'ok') {
                return true;
            }

            // Gérer les erreurs Expo
            if (isset($content['data'][0]['status']) && $content['data'][0]['status'] === 'error') {
                $errorMessage = $content['data'][0]['message'] ?? 'Unknown error';
                $this->logger->warning('Expo push notification error', [
                    'token' => substr($preferences->getExpoPushToken(), 0, 20) . '...',
                    'error' => $errorMessage,
                ]);

                // Si le token est invalide, le supprimer
                if (str_contains($errorMessage, 'Invalid') || str_contains($errorMessage, 'DeviceNotRegistered')) {
                    $preferences->setExpoPushToken(null);
                    $this->entityManager->flush();
                }
            }

            return false;
        } catch (\Exception $e) {
            $this->logger->error('Error sending Expo push notification', [
                'error' => $e->getMessage(),
                'token' => substr($preferences->getExpoPushToken() ?? '', 0, 20) . '...',
            ]);
            return false;
        }
    }

    /**
     * Envoie une notification push à plusieurs utilisateurs
     */
    public function sendPushNotificationsToMultiple(
        array $preferencesList,
        string $title,
        string $body,
        ?array $data = null
    ): array {
        $results = [];
        foreach ($preferencesList as $preferences) {
            $results[] = $this->sendPushNotification($preferences, $title, $body, $data);
        }
        return $results;
    }
}
