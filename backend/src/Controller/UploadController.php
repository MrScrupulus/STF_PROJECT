<?php

namespace App\Controller;

use App\Service\CatchPhotoStorageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/uploads')]
class UploadController extends AbstractController
{
    public function __construct(
        private CatchPhotoStorageService $storageService
    ) {
    }

    /**
     * Sert les photos de prises stockées sur le disque.
     */
    #[Route('/{path}', name: 'upload_serve', requirements: ['path' => 'catches/.+'], methods: ['GET'])]
    public function serve(string $path): Response
    {
        if (str_contains($path, '..')) {
            return new Response('Forbidden', Response::HTTP_FORBIDDEN);
        }

        $absolutePath = $this->storageService->getAbsolutePath($path);
        if (!is_file($absolutePath)) {
            return new Response('Not Found', Response::HTTP_NOT_FOUND);
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $contentType = match ($ext) {
            'png' => 'image/png',
            'webp' => 'image/webp',
            default => 'image/jpeg',
        };

        $content = file_get_contents($absolutePath);
        if (false === $content) {
            return new Response('Error reading file', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $response = new Response($content);
        $response->headers->set('Content-Type', $contentType);
        $response->headers->set('Content-Length', (string) \strlen($content));
        $response->headers->set('Cache-Control', 'public, max-age=86400');

        return $response;
    }
}
