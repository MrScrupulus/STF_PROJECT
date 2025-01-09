<?php

namespace App\Controller\Security;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/jwt')]
class JWTController extends AbstractController
{
    #[Route('/test', name: 'test_jwt', methods: ['GET'])]
    public function test(): JsonResponse
    {
        return $this->json(['message' => 'JWT valide']);
    }
}
