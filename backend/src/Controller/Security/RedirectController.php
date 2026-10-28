<?php

declare(strict_types=1);

namespace App\Controller\Security;

use App\Repository\Security\UserRepository;
use App\Repository\Security\PasswordResetTokenRepository;
use App\Service\CompetitionStaffInvitationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

final class RedirectController extends AbstractController
{
    public function __construct(
        private readonly ParameterBagInterface $params,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly PasswordResetTokenRepository $passwordResetTokenRepository,
        private readonly CompetitionStaffInvitationService $staffInvitations,
    ) {}

    /**
     * Redirige vers la vérification d'email (mobile : page qui ouvre l'app, sinon web)
     */
    #[Route('/redirect/verify-email/{token}', name: 'redirect_verify_email', methods: ['GET'])]
    public function redirectVerifyEmail(string $token, Request $request): Response
    {
        $tokenEncoded = rawurlencode($token);

        return $this->openAppPage(
            'Vérification de votre email',
            'Ouvrez Street Fishing pour activer votre compte.',
            'stf://verify-email/' . $tokenEncoded
        );
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
     * Formulaire de réinitialisation servi par le backend (Safari mobile : même origine que le lien du mail si APP_FRONTEND_URL est injoignable depuis le téléphone).
     */
    #[Route('/redirect/reset-password/{token}/form', name: 'redirect_reset_password_form', methods: ['GET'])]
    public function resetPasswordBrowserForm(string $token): Response
    {
        $resetToken = $this->passwordResetTokenRepository->findOneBy(['token' => $token]);
        if (!$resetToken || $resetToken->isExpired()) {
            return $this->htmlResponse(
                'Lien invalide ou expiré',
                'Ce lien n’est pas valide ou a expiré. Demandez un nouvel email de réinitialisation depuis l’application.',
                false
            );
        }

        $tokenJs = json_encode($token, \JSON_HEX_TAG | \JSON_HEX_AMP | \JSON_HEX_APOS | \JSON_HEX_QUOT | JSON_THROW_ON_ERROR);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau mot de passe – Street Fishing</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
        .card { background: #fff; border-radius: 12px; padding: 24px; max-width: 360px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        h1 { font-size: 20px; color: #333; margin: 0 0 8px 0; text-align: center; }
        .hint { font-size: 13px; color: #666; margin: 0 0 20px 0; line-height: 1.4; text-align: center; }
        label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
        input { width: 100%; box-sizing: border-box; padding: 14px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 14px; }
        button[type="submit"] { width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; background: #007AFF; color: #fff; cursor: pointer; margin-top: 4px; }
        button[disabled] { opacity: 0.6; cursor: not-allowed; }
        .err { display: none; color: #FF3B30; font-size: 14px; margin-top: -8px; margin-bottom: 12px; }
        .err.show { display: block; }
        .global-err { text-align: center; margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Nouveau mot de passe</h1>
        <p class="hint">Au moins 8 caractères, une lettre, un chiffre et un caractère parmi @$!%*#?&</p>
        <div id="msg" class="err global-err" role="alert"></div>
        <form id="f">
            <label for="p1">Mot de passe</label>
            <input id="p1" type="password" autocomplete="new-password" required minlength="8" />
            <label for="p2">Confirmer</label>
            <input id="p2" type="password" autocomplete="new-password" required minlength="8" />
            <button type="submit" id="btn">Enregistrer</button>
        </form>
    </div>
    <script>
    (function() {
        var TOKEN = {$tokenJs};
        var msg = document.getElementById('msg');
        var btn = document.getElementById('btn');
        document.getElementById('f').addEventListener('submit', async function(e) {
            e.preventDefault();
            msg.classList.remove('show'); msg.textContent = '';
            var p1 = document.getElementById('p1').value;
            var p2 = document.getElementById('p2').value;
            if (p1 !== p2) { msg.textContent = 'Les deux mots de passe ne correspondent pas.'; msg.classList.add('show'); return; }
            if (p1.length < 8) { msg.textContent = 'Le mot de passe doit contenir au moins 8 caractères.'; msg.classList.add('show'); return; }
            btn.disabled = true;
            try {
                var res = await fetch('/password-reset/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ token: TOKEN, password: p1 })
                });
                var data = {};
                try { data = await res.json(); } catch (x) {}
                if (!res.ok) throw new Error(data.message || ('Erreur ' + res.status));
                btn.textContent = 'OK !';
                document.querySelector('.card').innerHTML = '<h1 style="color:#34C759">Mot de passe mis à jour</h1>'
                    + '<p class="hint">Vous pouvez fermer cette page et vous connecter dans Street Fishing.</p>';
            } catch (err) {
                msg.textContent = err.message || 'Une erreur est survenue';
                msg.classList.add('show');
                btn.disabled = false;
            }
        });
    })();
    </script>
</body>
</html>
HTML;

        return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    /**
     * Redirige vers le reset de mot de passe (mobile : page qui ouvre l'app, sinon web)
     */
    #[Route('/redirect/reset-password/{token}', name: 'redirect_reset_password', methods: ['GET'])]
    public function redirectResetPassword(string $token, Request $request): Response
    {
        $tokenEncoded = rawurlencode($token);

        return $this->openAppPage(
            'Réinitialisation du mot de passe',
            'Ouvrez Street Fishing pour choisir un nouveau mot de passe.',
            'stf://reset-password/' . $tokenEncoded
        );
    }

    #[Route('/redirect/teams/{id}', name: 'redirect_team', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function redirectTeam(int $id, Request $request): Response
    {
        return $this->openAppPage(
            'Ouvrir l’équipe',
            'Ouvrez Street Fishing pour voir l’équipe.',
            'stf://teams/' . $id
        );
    }

    #[Route('/redirect/competitions/{id}', name: 'redirect_competition', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function redirectCompetition(int $id, Request $request): Response
    {
        $code = $request->query->get('code') ?? $request->query->get('accessCode');
        $deepLink = 'stf://competitions/' . $id;
        if (\is_string($code) && $code !== '') {
            $deepLink .= '?code=' . rawurlencode($code);
        }

        return $this->openAppPage(
            'Ouvrir la compétition',
            'Ouvrez Street Fishing pour voir la compétition.',
            $deepLink
        );
    }

    #[Route('/redirect/staff-invitations/{token}/accept', name: 'redirect_staff_invitation_accept', methods: ['GET'])]
    public function redirectStaffInvitationAccept(string $token, Request $request): Response
    {
        return $this->redirectStaffInvitation($token, 'accept', $request);
    }

    #[Route('/redirect/staff-invitations/{token}/reject', name: 'redirect_staff_invitation_reject', methods: ['GET'])]
    public function redirectStaffInvitationReject(string $token, Request $request): Response
    {
        return $this->redirectStaffInvitation($token, 'reject', $request);
    }

    private function redirectStaffInvitation(string $token, string $action, Request $request): Response
    {
        $result = $action === 'reject'
            ? $this->staffInvitations->rejectByToken($token)
            : $this->staffInvitations->acceptByToken($token);

        $tokenEncoded = rawurlencode($token);
        $deepLink = 'stf://staff-invitations/' . $action . '/' . $tokenEncoded;
        $title = $result['ok']
            ? ($action === 'reject' ? 'Invitation refusée' : 'Vous êtes commissaire')
            : 'Invitation commissaire';

        return $this->openAppPage(
            $title,
            $result['message'] . ($result['ok'] ? ' Ouvrez Street Fishing pour continuer.' : ''),
            $deepLink
        );
    }

    #[Route('/redirect/create-competition', name: 'redirect_create_competition', methods: ['GET'])]
    public function redirectCreateCompetition(): Response
    {
        return $this->openAppPage(
            'Créer une compétition',
            'Ouvrez Street Fishing pour utiliser votre bon de création de compétition.',
            'stf://create-competition'
        );
    }

    private function openAppPage(string $title, string $message, string $deepLink): Response
    {
        return $this->mobileRedirectPage(
            $title,
            $message,
            $deepLink,
            '',
            'Ouvrir l’application',
            ''
        );
    }

    /**
     * Page HTML : ouvre l’app (stf://).
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
        $buttonAppEsc = htmlspecialchars($buttonApp, \ENT_QUOTES, 'UTF-8');
        $webUrlEsc = htmlspecialchars($webUrl, \ENT_QUOTES, 'UTF-8');
        $titleEsc = htmlspecialchars($title, \ENT_QUOTES, 'UTF-8');
        $messageEsc = htmlspecialchars($message, \ENT_QUOTES, 'UTF-8');
        $linkWebEsc = htmlspecialchars($linkWeb, \ENT_QUOTES, 'UTF-8');
        $webHiddenClass = $webUrl === '' ? ' hidden' : '';
        $autoOpenScript = '<script>setTimeout(function () { window.location.href = ' . json_encode($deepLink, \JSON_UNESCAPED_SLASHES | \JSON_HEX_TAG | \JSON_HEX_AMP | \JSON_HEX_APOS | \JSON_HEX_QUOT | \JSON_THROW_ON_ERROR) . '; }, 300);</script>';

        $html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$titleEsc} - Street Fishing</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
        .card { background: #fff; border-radius: 12px; padding: 24px; max-width: 360px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        h1 { font-size: 20px; color: #333; margin: 0 0 12px 0; text-align: center; }
        p { font-size: 15px; color: #666; margin: 0 0 20px 0; line-height: 1.5; text-align: center; }
        a { display: block; text-align: center; padding: 14px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-bottom: 12px; }
        .btn-app { background: #000; color: #fff; }
        .btn-web { background: transparent; color: #007AFF; border: 2px solid #007AFF; }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div class="card">
        <h1>{$titleEsc}</h1>
        <p>{$messageEsc}</p>
        <a href="{$deepLinkEsc}" class="btn-app" id="open-app">{$buttonAppEsc}</a>
        <a href="{$webUrlEsc}" class="btn-web{$webHiddenClass}">{$linkWebEsc}</a>
    </div>
    {$autoOpenScript}
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
}
