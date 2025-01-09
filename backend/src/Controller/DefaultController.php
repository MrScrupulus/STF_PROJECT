<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class DefaultController extends AbstractController
{
    #[Route('/', name: 'root_redirect', methods: ['GET'])]
    public function root(): JsonResponse
    {
        return $this->json([
            'message' => 'Please use /api endpoint'
        ]);
    }

    #[Route('/api', name: 'api_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json([
            'api' => 'Street Fishing API',
            'version' => '1.0',
            'endpoints' => [
                'auth' => '/api/auth',
                'competitions' => '/api/competitions',
                'species' => '/api/species',
                'profile' => '/api/profile'
            ]
        ]);
    }
}
