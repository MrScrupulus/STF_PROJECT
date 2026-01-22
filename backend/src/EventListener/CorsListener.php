<?php

namespace App\EventListener;

use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpFoundation\Response;

class CorsListener
{
    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        
        // Gérer les requêtes OPTIONS (preflight)
        if ($request->getMethod() === 'OPTIONS' && str_starts_with($request->getPathInfo(), '/api')) {
            $response = new Response();
            $origin = $request->headers->get('Origin');
            
            $allowedOrigins = [
                'http://localhost:3000',
                'http://frontend:3000',
                'http://localhost:8081',
                'exp://localhost:8081',
            ];

            if ($origin && in_array($origin, $allowedOrigins)) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
            } else {
                $response->headers->set('Access-Control-Allow-Origin', '*');
            }

            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Max-Age', '3600');
            $response->setStatusCode(200);
            
            $event->setResponse($response);
            $event->stopPropagation();
        }
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $response = $event->getResponse();

        // Ajouter les headers CORS pour toutes les requêtes vers /api
        if (str_starts_with($request->getPathInfo(), '/api')) {
            $this->addCorsHeaders($request, $response);
        }
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        
        // Ajouter les headers CORS pour les erreurs sur les routes API
        if (str_starts_with($request->getPathInfo(), '/api')) {
            $response = $event->getResponse();
            // Si aucune réponse n'existe encore, créer une réponse d'erreur générique
            if (!$response) {
                $response = new Response('', 500);
                $event->setResponse($response);
            }
            $this->addCorsHeaders($request, $response);
        }
    }

    private function addCorsHeaders($request, $response): void
    {
        $origin = $request->headers->get('Origin');
        
        // Liste des origines autorisées
        $allowedOrigins = [
            'http://localhost:3000',
            'http://frontend:3000',
            'http://localhost:8081',
            'exp://localhost:8081',
        ];

        if ($origin && in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } else {
            $response->headers->set('Access-Control-Allow-Origin', '*');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '3600');
    }
}

