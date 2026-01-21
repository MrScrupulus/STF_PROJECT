<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Convertit les erreurs 404 en JSON pour les routes API
 */
class Json404Listener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        $request = $event->getRequest();

        // Ne traiter que les requêtes API (qui commencent par /api)
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        // Ne traiter que les erreurs 404
        if (!$exception instanceof NotFoundHttpException) {
            return;
        }

        // Ne traiter que les requêtes qui acceptent JSON
        $acceptHeader = $request->headers->get('Accept', '');
        if (!str_contains($acceptHeader, 'application/json') && 
            !str_contains($request->headers->get('Content-Type', ''), 'application/json')) {
            // Si la requête n'est pas JSON, laisser Symfony gérer normalement
            // Mais on peut quand même retourner du JSON pour les routes API
        }

        // Extraire un message clair de l'exception
        $message = $exception->getMessage();
        
        // Nettoyer le message si il contient des détails techniques
        if (str_contains($message, 'object not found')) {
            // Extraire le nom de l'entité si possible
            if (preg_match('/"([^"]+)" object not found/', $message, $matches)) {
                $entityName = $matches[1] ?? 'Ressource';
                // Nettoyer le nom de l'entité (enlever le namespace)
                $entityName = basename(str_replace('\\', '/', $entityName));
                
                // Messages spécifiques selon le type d'entité
                $entityMessages = [
                    'Team' => 'Équipe non trouvée',
                    'Competition' => 'Compétition non trouvée',
                    'FishCatch' => 'Prise non trouvée',
                    'User' => 'Utilisateur non trouvé',
                    'TeamInvitation' => 'Invitation non trouvée',
                ];
                
                $message = $entityMessages[$entityName] ?? ucfirst($entityName) . ' non trouvé(e)';
            } else {
                $message = 'Ressource non trouvée';
            }
        } elseif (empty($message) || str_contains($message, 'No route found')) {
            $message = 'Ressource non trouvée';
        }

        // Retourner une réponse JSON propre
        $response = new JsonResponse([
            'success' => false,
            'message' => $message,
            'error' => 'Not Found'
        ], 404);

        $event->setResponse($response);
    }
}
