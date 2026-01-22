<?php

declare(strict_types=1);

namespace App\Controller\Security;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

final class RedirectController extends AbstractController
{
    public function __construct(
        private readonly ParameterBagInterface $params,
    ) {}

    /**
     * Redirige vers la vérification d'email (mobile ou web selon la plateforme)
     */
    #[Route('/redirect/verify-email/{token}', name: 'redirect_verify_email', methods: ['GET'])]
    public function redirectVerifyEmail(string $token, Request $request): RedirectResponse
    {
        $userAgent = $request->headers->get('User-Agent', '');
        
        // Détecter si c'est un appareil mobile
        $isMobile = $this->isMobileDevice($userAgent);
        
        if ($isMobile) {
            // Rediriger vers le deep link mobile
            $deepLink = "stf://verify-email/{$token}";
            return $this->redirect($deepLink);
        }
        
        // Sinon, rediriger vers la page web
        $frontendUrl = $this->params->get('app.frontend_url');
        $webUrl = rtrim($frontendUrl, '/') . "/verify-email/{$token}";
        return $this->redirect($webUrl);
    }

    /**
     * Redirige vers le reset de mot de passe (mobile ou web selon la plateforme)
     */
    #[Route('/redirect/reset-password/{token}', name: 'redirect_reset_password', methods: ['GET'])]
    public function redirectResetPassword(string $token, Request $request): RedirectResponse
    {
        $userAgent = $request->headers->get('User-Agent', '');
        
        // Détecter si c'est un appareil mobile
        $isMobile = $this->isMobileDevice($userAgent);
        
        if ($isMobile) {
            // Rediriger vers le deep link mobile
            $deepLink = "stf://reset-password/{$token}";
            return $this->redirect($deepLink);
        }
        
        // Sinon, rediriger vers la page web
        $frontendUrl = $this->params->get('app.frontend_url');
        $webUrl = rtrim($frontendUrl, '/') . "/reset-password/{$token}";
        return $this->redirect($webUrl);
    }

    /**
     * Détecte si le User-Agent correspond à un appareil mobile
     */
    private function isMobileDevice(string $userAgent): bool
    {
        $mobileKeywords = [
            'Mobile',
            'Android',
            'iPhone',
            'iPad',
            'iPod',
            'BlackBerry',
            'Windows Phone',
            'Opera Mini',
            'IEMobile',
        ];

        $userAgentLower = strtolower($userAgent);
        
        foreach ($mobileKeywords as $keyword) {
            if (stripos($userAgentLower, strtolower($keyword)) !== false) {
                return true;
            }
        }

        return false;
    }
}
