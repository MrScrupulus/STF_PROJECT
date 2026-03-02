<?php

declare(strict_types=1);

namespace App\Controller\Security;

use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class RedirectController extends AbstractController
{
    public function __construct(
        private readonly ParameterBagInterface $params,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {}

    /**
     * Redirige vers la vérification d'email (mobile : page qui ouvre l'app, sinon web)
     */
    #[Route('/redirect/verify-email/{token}', name: 'redirect_verify_email', methods: ['GET'])]
    public function redirectVerifyEmail(string $token, Request $request): Response
    {
        $userAgent = $request->headers->get('User-Agent', '');
        $isMobile = $this->isMobileDevice($userAgent);
        $backendUrl = rtrim($this->params->get('app.backend_url'), '/');
        $tokenEncoded = rawurlencode($token);
        $deepLink = 'stf://verify-email/' . $tokenEncoded;
        $webUrl = $backendUrl . '/redirect/verify-email/' . $tokenEncoded . '/confirm';

        if ($isMobile) {
            return $this->mobileRedirectPage(
                'Vérification de votre email',
                'Ouvrez l’application Street Fishing pour valider votre compte, ou validez directement dans le navigateur.',
                $deepLink,
                $webUrl,
                'Ouvrir l’application',
                'Valider dans le navigateur'
            );
        }

        $frontendUrl = rtrim($this->params->get('app.frontend_url'), '/');
        return new RedirectResponse($frontendUrl . '/verify-email/' . $tokenEncoded);
    }

    /**
     * Vérification de l'email depuis le navigateur (lien "Valider dans le navigateur" sur mobile).
     */
    #[Route('/redirect/verify-email/{token}/confirm', name: 'redirect_verify_email_confirm', methods: ['GET'])]
    public function verifyEmailConfirm(string $token): Response
    {
        $user = $this->userRepository->findOneBy(['verification_token' => $token]);

        if (!$user) {
            return $this->htmlResponse(
                'Lien invalide ou expiré',
                'Ce lien de vérification n’est pas valide ou a déjà été utilisé. Vous pouvez demander un nouvel email depuis l’application.',
                false
            );
        }

        $user->setIsVerified(true);
        $user->setVerificationToken(null);
        $this->entityManager->flush();

        return $this->htmlResponse(
            'Email vérifié !',
            'Votre compte est maintenant activé. Vous pouvez fermer cette page et vous connecter à l’application Street Fishing.',
            true
        );
    }

    /**
     * Redirige vers le reset de mot de passe (mobile : page qui ouvre l'app, sinon web)
     */
    #[Route('/redirect/reset-password/{token}', name: 'redirect_reset_password', methods: ['GET'])]
    public function redirectResetPassword(string $token, Request $request): Response
    {
        $userAgent = $request->headers->get('User-Agent', '');
        $isMobile = $this->isMobileDevice($userAgent);
        $tokenEncoded = rawurlencode($token);
        $deepLink = 'stf://reset-password/' . $tokenEncoded;
        $frontendUrl = rtrim($this->params->get('app.frontend_url'), '/');
        $webUrl = $frontendUrl . '/reset-password/' . $tokenEncoded;

        if ($isMobile) {
            return $this->mobileRedirectPage(
                'Réinitialisation du mot de passe',
                'Ouvrez l’application Street Fishing pour définir un nouveau mot de passe.',
                $deepLink,
                $webUrl,
                'Ouvrir l’application',
                'Continuer dans le navigateur'
            );
        }

        return new RedirectResponse($webUrl);
    }

    /**
     * Page HTML pour mobile : bouton pour ouvrir l'app + lien "Valider dans le navigateur" (backend).
     */
    private function mobileRedirectPage(
        string $title,
        string $message,
        string $deepLink,
        string $webUrl,
        string $buttonApp,
        string $linkWeb
    ): Response {
        $deepLinkEsc = htmlspecialchars($deepLink, \ENT_QUOTES, 'UTF-8');
        $webUrlEsc = htmlspecialchars($webUrl, \ENT_QUOTES, 'UTF-8');
        $titleEsc = htmlspecialchars($title, \ENT_QUOTES, 'UTF-8');
        $messageEsc = htmlspecialchars($message, \ENT_QUOTES, 'UTF-8');
        $buttonAppEsc = htmlspecialchars($buttonApp, \ENT_QUOTES, 'UTF-8');
        $linkWebEsc = htmlspecialchars($linkWeb, \ENT_QUOTES, 'UTF-8');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$titleEsc} - Street Fishing</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
        .card { background: #fff; border-radius: 12px; padding: 24px; max-width: 360px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        h1 { font-size: 20px; color: #333; margin: 0 0 12px 0; text-align: center; }
        p { font-size: 15px; color: #666; margin: 0 0 20px 0; line-height: 1.5; text-align: center; }
        a { display: block; text-align: center; padding: 14px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-bottom: 12px; }
        .btn-app { background: #007AFF; color: #fff !important; }
        .btn-web { background: transparent; color: #007AFF; border: 2px solid #007AFF; }
    </style>
</head>
<body>
    <div class="card">
        <h1>{$titleEsc}</h1>
        <p>{$messageEsc}</p>
        <a href="{$deepLinkEsc}" class="btn-app">{$buttonAppEsc}</a>
        <a href="{$webUrlEsc}" class="btn-web">{$linkWebEsc}</a>
    </div>
</body>
</html>
HTML;

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    private function htmlResponse(string $title, string $message, bool $success): Response
    {
        $titleEsc = htmlspecialchars($title, \ENT_QUOTES, 'UTF-8');
        $messageEsc = nl2br(htmlspecialchars($message, \ENT_QUOTES, 'UTF-8'));
        $color = $success ? '#34C759' : '#FF3B30';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$titleEsc} - Street Fishing</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
        .card { background: #fff; border-radius: 12px; padding: 24px; max-width: 360px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        h1 { font-size: 20px; color: {$color}; margin: 0 0 12px 0; text-align: center; }
        p { font-size: 15px; color: #666; margin: 0; line-height: 1.5; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <h1>{$titleEsc}</h1>
        <p>{$messageEsc}</p>
    </div>
</body>
</html>
HTML;

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
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
