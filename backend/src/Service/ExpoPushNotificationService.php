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
        $tokens = $preferences->getAllExpoPushTokens();
        if ($tokens === []) {
            return false; // Pas de token, pas de notification push
        }

        try {
            $messages = [];
            foreach ($tokens as $token) {
                $messages[] = [
                    'to' => $token,
                    'title' => $title,
                    'body' => $body,
                    'data' => $data ?? new \stdClass(),
                    'sound' => 'default',
                    'priority' => 'high',
                    'channelId' => 'default',
                    'badge' => 1,
                    'ttl' => 86400,
                    'android' => [
                        'channelId' => 'default',
                        'priority' => 'high',
                    ],
                ];
            }

            $response = $this->httpClient->request('POST', self::EXPO_API_URL, [
                'headers' => [
                    'Accept' => 'application/json',
                    'Accept-Encoding' => 'gzip, deflate',
                    'Content-Type' => 'application/json',
                ],
                'json' => $messages,
            ]);

            $statusCode = $response->getStatusCode();
            $content = $response->toArray();
            $tickets = $content['data'] ?? [];
            $ok = false;

            if ($statusCode === 200 && is_array($tickets)) {
                foreach ($tickets as $index => $ticket) {
                    if (($ticket['status'] ?? '') === 'ok') {
                        $ok = true;
                        continue;
                    }
                    if (($ticket['status'] ?? '') !== 'error') {
                        continue;
                    }
                    $errorMessage = $ticket['message'] ?? 'Unknown error';
                    $this->logger->warning('Expo push notification error', [
                        'token' => substr($tokens[$index] ?? '', 0, 20) . '...',
                        'error' => $errorMessage,
                    ]);
                    if (str_contains($errorMessage, 'Invalid') || str_contains($errorMessage, 'DeviceNotRegistered')) {
                        $preferences->removeExpoPushToken($tokens[$index] ?? '');
                    }
                }
                if ($ok || $preferences->getAllExpoPushTokens() !== $tokens) {
                    $this->entityManager->flush();
                }
                return $ok;
            }

            return false;
        } catch (\Exception $e) {
            $this->logger->error('Error sending Expo push notification', [
                'error' => $e->getMessage(),
                'token' => substr($tokens[0] ?? '', 0, 20) . '...',
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
