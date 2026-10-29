<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use App\Entity\Security\User;
use App\Entity\Competition\Team;
use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionStaffInvitation;
use App\Entity\Competition\CompetitionParticipantInvitation;
use App\Entity\Competition\CreationCredit;
use App\Repository\NotificationPreferencesRepository;
use Psr\Log\LoggerInterface;

final class EmailService
{
    private string $fromEmail;
    private string $frontendUrl;
    private string $backendUrl;

    public function __construct(
        private readonly MailerInterface $mailer,
        private string $mailerFromEmail,
        ParameterBagInterface $params,
        private readonly NotificationPreferencesRepository $preferencesRepository,
        private readonly LoggerInterface $logger,
    ) {
        $this->fromEmail = $mailerFromEmail;
        $this->frontendUrl = $params->get('app.frontend_url');
        $this->backendUrl = $params->get('app.backend_url', 'http://localhost:8001');
    }

    private function brandedFrom(): Address
    {
        return new Address($this->fromEmail, 'Street Fishing');
    }

    private function appRedirect(string $path): string
    {
        return rtrim($this->backendUrl, '/') . '/redirect/' . ltrim($path, '/');
    }

    private function hello(User $user): string
    {
        $first = htmlspecialchars(trim((string) $user->getFirstname()));

        return $first !== '' ? "Bonjour {$first}," : 'Bonjour,';
    }

    private function cta(string $url, string $label): string
    {
        $href = htmlspecialchars($url, \ENT_QUOTES, 'UTF-8');
        $text = htmlspecialchars($label, \ENT_QUOTES, 'UTF-8');

        return "<p style=\"margin:22px 0;text-align:center\"><a href=\"{$href}\" style=\"display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600\">{$text}</a></p>";
    }

    private function wrapEmailHtml(string $innerHtml): string
    {
        $logoUrl = htmlspecialchars(rtrim($this->frontendUrl, '/') . '/logo-email.png?v=2', \ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:16px 8px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="max-width:480px;width:100%;background:#fff;border-radius:10px;">
        <tr>
          <td style="background:#000;text-align:center;padding:14px;">
            <img src="{$logoUrl}" width="56" height="56" alt="Street Fishing" style="display:block;margin:0 auto;border:0;border-radius:12px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:18px 20px 8px;color:#333;font-size:15px;line-height:1.45;">
            {$innerHtml}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
    }

    /**
     * Vérifie si l'utilisateur souhaite recevoir des notifications par email.
     * Utilisé uniquement pour les emails de notification (pas pour la vérification de compte ou le reset de mot de passe).
     */
    private function shouldSendNotificationEmail(User $user): bool
    {
        $preferences = $this->preferencesRepository->findOrCreateForUser($user);
        return $preferences->isReceiveEmailNotifications();
    }

    public function sendVerificationEmail(User $user): void
    {
        $link = $this->appRedirect('verify-email/' . rawurlencode((string) $user->getVerificationToken()));

        try {
            $email = (new Email())
                ->from($this->brandedFrom())
                ->to($user->getEmail())
                ->subject('Vérifiez votre compte Street Fishing')
                ->html($this->wrapEmailHtml(
                    "<h1>Confirmez votre email</h1>
                    <p>{$this->hello($user)}</p>
                    <p>Ouvrez l’application pour activer votre compte. Lien valable 24 h.</p>
                    {$this->cta($link, 'Ouvrir l’application')}"
                ));

            try {
                $this->mailer->send($email);
                error_log("Email envoyé avec succès à: " . $user->getEmail());
            } catch (\Exception $sendException) {
                error_log("ERREUR lors de l'appel à mailer->send(): " . $sendException->getMessage());
                error_log("Type d'erreur: " . get_class($sendException));
                // Ne pas faire planter l'application si l'email échoue
                // L'utilisateur est créé même si l'email n'est pas envoyé
            }
        } catch (TransportExceptionInterface $e) {
            error_log("ERREUR lors de l'envoi de l'email: " . $e->getMessage());
            error_log("Trace: " . $e->getTraceAsString());
            throw new \RuntimeException(
                'Erreur lors de l\'envoi de l\'email de vérification : ' . $e->getMessage(),
                0,
                $e
            );
        } catch (\Exception $e) {
            error_log("ERREUR GENERALE lors de l'envoi de l'email: " . $e->getMessage());
            error_log("Trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

    public function sendPasswordResetEmail(User $user, string $token): void
    {
        $link = $this->appRedirect('reset-password/' . rawurlencode($token));

        try {
            $email = (new Email())
                ->from($this->brandedFrom())
                ->to($user->getEmail())
                ->subject('Nouveau mot de passe Street Fishing')
                ->html($this->wrapEmailHtml(
                    "<h1>Réinitialisation</h1>
                    <p>{$this->hello($user)}</p>
                    <p>Ouvrez l’application pour choisir un nouveau mot de passe. Lien valable 1 h.</p>
                    {$this->cta($link, 'Ouvrir l’application')}"
                ));

            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            throw new \RuntimeException(
                'Erreur lors de l\'envoi de l\'email de réinitialisation : ' . $e->getMessage(),
                0,
                $e
            );
        }
    }

    public function sendTeamCreationEmail(Team $team): void
    {
        $teamName = htmlspecialchars($team->getName());
        $teamUrl = $this->appRedirect('teams/' . $team->getId());

        try {
            foreach ($team->getMembers() as $member) {
                if (!$this->shouldSendNotificationEmail($member)) {
                    continue;
                }

                $email = (new Email())
                    ->from($this->brandedFrom())
                    ->to($member->getEmail())
                    ->subject("Équipe « {$teamName} » créée")
                    ->html($this->wrapEmailHtml(
                        "<h1>Équipe créée</h1>
                        <p>{$this->hello($member)}</p>
                        <p>L’équipe <strong>{$teamName}</strong> est prête.</p>
                        {$this->cta($teamUrl, 'Ouvrir l’application')}"
                    ));

                try {
                    $this->mailer->send($email);
                    error_log("Email de création d'équipe envoyé avec succès à: " . $member->getEmail());
                } catch (\Exception $sendException) {
                    error_log("ERREUR lors de l'envoi de l'email de création d'équipe à {$member->getEmail()}: " . $sendException->getMessage());
                    // Ne pas faire planter l'application si l'email échoue
                }
            }
        } catch (TransportExceptionInterface $e) {
            error_log("ERREUR lors de l'envoi des emails de création d'équipe: " . $e->getMessage());
            // Ne pas faire planter l'application si l'email échoue
        } catch (\Exception $e) {
            error_log("ERREUR GENERALE lors de l'envoi des emails de création d'équipe: " . $e->getMessage());
            // Ne pas faire planter l'application si l'email échoue
        }
    }

    public function sendCompetitionRegistrationEmail(Team $team, Competition $competition): void
    {
        $teamName = htmlspecialchars($team->getName());
        $competitionName = htmlspecialchars($competition->getName());
        $registrationNumber = $team->getRegistrationNumber();
        $start = $competition->getStartDate();
        $startDate = '';
        if ($start) {
            $startParis = \DateTime::createFromInterface($start)->setTimezone(new \DateTimeZone('Europe/Paris'));
            $startDate = $startParis->format('d/m/Y à H\\hi');
        }
        $competitionUrl = $this->appRedirect('competitions/' . $competition->getId());

        try {
            foreach ($team->getMembers() as $member) {
                if (!$this->shouldSendNotificationEmail($member)) {
                    continue;
                }

                $email = (new Email())
                    ->from($this->brandedFrom())
                    ->to($member->getEmail())
                    ->subject("Inscrit à « {$competitionName} »")
                    ->html($this->wrapEmailHtml(
                        "<h1>Inscription confirmée</h1>
                        <p>{$this->hello($member)}</p>
                        <p><strong>{$teamName}</strong> est inscrite à <strong>{$competitionName}</strong>"
                        . ($registrationNumber ? " (n° {$registrationNumber})" : '')
                        . ($startDate ? ", le {$startDate}." : '.')
                        . '</p>'
                        . $this->cta($competitionUrl, 'Ouvrir l’application')
                    ));

                try {
                    $this->mailer->send($email);
                    error_log("Email d'inscription à la compétition envoyé avec succès à: " . $member->getEmail());
                } catch (\Exception $sendException) {
                    error_log("ERREUR lors de l'envoi de l'email d'inscription à la compétition à {$member->getEmail()}: " . $sendException->getMessage());
                    // Ne pas faire planter l'application si l'email échoue
                }
            }
        } catch (TransportExceptionInterface $e) {
            error_log("ERREUR lors de l'envoi des emails d'inscription à la compétition: " . $e->getMessage());
            // Ne pas faire planter l'application si l'email échoue
        } catch (\Exception $e) {
            error_log("ERREUR GENERALE lors de l'envoi des emails d'inscription à la compétition: " . $e->getMessage());
            // Ne pas faire planter l'application si l'email échoue
        }
    }

    public function sendTeamInvitationEmail(Team $team, User $invitedUser): void
    {
        $teamName = htmlspecialchars($team->getName());
        $teamUrl = $this->appRedirect('teams/' . $team->getId());

        try {
            if (!$this->shouldSendNotificationEmail($invitedUser)) {
                return;
            }

            $email = (new Email())
                ->from($this->brandedFrom())
                ->to($invitedUser->getEmail())
                ->subject("Invitation — équipe « {$teamName} »")
                ->html($this->wrapEmailHtml(
                    "<h1>Invitation d’équipe</h1>
                    <p>{$this->hello($invitedUser)}</p>
                    <p>Vous êtes invité à rejoindre <strong>{$teamName}</strong>.</p>
                    {$this->cta($teamUrl, 'Ouvrir l’application')}"
                ));

            try {
                $this->mailer->send($email);
                error_log("Email d'invitation d'équipe envoyé avec succès à: " . $invitedUser->getEmail());
            } catch (\Exception $sendException) {
                error_log("ERREUR lors de l'envoi de l'email d'invitation d'équipe à {$invitedUser->getEmail()}: " . $sendException->getMessage());
                // Ne pas faire planter l'application si l'email échoue
            }
        } catch (TransportExceptionInterface $e) {
            error_log("ERREUR lors de l'envoi de l'email d'invitation d'équipe: " . $e->getMessage());
            // Ne pas faire planter l'application si l'email échoue
        } catch (\Exception $e) {
            error_log("ERREUR GENERALE lors de l'envoi de l'email d'invitation d'équipe: " . $e->getMessage());
            // Ne pas faire planter l'application si l'email échoue
        }
    }

    public function sendStaffInvitationEmail(CompetitionStaffInvitation $invitation): void
    {
        $to = $invitation->getEmail();
        $competitionName = htmlspecialchars($invitation->getCompetition()?->getName() ?? 'une compétition');
        $inviter = $invitation->getInvitedBy();
        $inviterName = htmlspecialchars(trim(($inviter?->getFirstname() ?? '') . ' ' . ($inviter?->getLastname() ?? '')) ?: 'Un organisateur');
        $token = rawurlencode($invitation->getToken());
        $acceptUrl = $this->appRedirect('staff-invitations/' . $token . '/accept');
        $rejectUrl = $this->appRedirect('staff-invitations/' . $token . '/reject');
        $invitee = $invitation->getInvitedUser();
        $hello = $invitee ? $this->hello($invitee) : 'Bonjour,';

        try {
            $email = (new Email())
                ->from($this->brandedFrom())
                ->to($to)
                ->subject("Commissaire — {$competitionName}")
                ->html($this->wrapEmailHtml(
                    "<h1>Invitation commissaire</h1>
                    <p>{$hello}</p>
                    <p><strong>{$inviterName}</strong> vous invite comme commissaire sur <strong>{$competitionName}</strong>.</p>
                    {$this->cta($acceptUrl, 'Accepter dans l’application')}
                    <p style=\"text-align:center;font-size:14px\"><a href=\"" . htmlspecialchars($rejectUrl, \ENT_QUOTES, 'UTF-8') . "\" style=\"color:#666\">Refuser</a></p>"
                ));
            $this->mailer->send($email);
            $this->logger->info('Email invitation commissaire envoyé', ['to' => $to]);
        } catch (\Throwable $e) {
            $this->logger->error('ERREUR invitation commissaire', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function sendParticipantInvitationEmail(CompetitionParticipantInvitation $invitation): void
    {
        $to = $invitation->getEmail();
        $competition = $invitation->getCompetition();
        $competitionName = htmlspecialchars($competition?->getName() ?? 'une compétition privée');
        $code = htmlspecialchars($invitation->getCode());
        $id = (int) $competition?->getId();
        $query = $invitation->getCode() !== '' ? '?code=' . rawurlencode($invitation->getCode()) : '';
        $url = $this->appRedirect('competitions/' . $id . $query);
        $invitee = $invitation->getInvitedUser();
        $hello = $invitee ? $this->hello($invitee) : 'Bonjour,';
        $inviter = $invitation->getInvitedBy();
        $inviterName = htmlspecialchars(trim(($inviter?->getFirstname() ?? '') . ' ' . ($inviter?->getLastname() ?? '')) ?: 'Un organisateur');

        try {
            $email = (new Email())
                ->from($this->brandedFrom())
                ->to($to)
                ->subject("Invitation — {$competition?->getName()}")
                ->html($this->wrapEmailHtml(
                    "<h1>Compétition privée</h1>
                    <p>{$hello}</p>
                    <p><strong>{$inviterName}</strong> vous invite à vous inscrire à <strong>{$competitionName}</strong>.</p>
                    <p>Ce code est personnel et lié à cette adresse e-mail. Le partager ne permet pas à quelqu’un d’autre de s’inscrire.</p>
                    " . ($code !== '' ? "<p>Votre code : <strong>{$code}</strong></p>" : '') . "
                    {$this->cta($url, 'Ouvrir l’application')}"
                ));
            $this->mailer->send($email);
        } catch (\Throwable $e) {
            $this->logger->error('ERREUR invitation pêcheur', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function sendCreationCreditGrantedEmail(CreationCredit $credit): void
    {
        $user = $credit->getUser();
        if (!$user || !$user->getEmail()) {
            return;
        }

        $expires = \DateTime::createFromInterface($credit->getExpiresAt())->setTimezone(new \DateTimeZone('Europe/Paris'));
        $expiresLabel = htmlspecialchars($expires->format('d/m/Y à H\\hi'));
        $createUrl = $this->appRedirect('create-competition');
        $support = 'streetfishing.scrupy@gmail.com';

        $email = (new Email())
            ->from($this->brandedFrom())
            ->to($user->getEmail())
            ->subject('Votre bon de création de compétition')
            ->html($this->wrapEmailHtml(
                "<h1 style=\"font-size:20px;margin:0 0 12px\">Votre bon de création</h1>
                <p>{$this->hello($user)}</p>
                <p>Vous avez un <strong>bon de création de compétition</strong> : il vous permet d’ouvrir <strong>une compétition</strong> sur Street Fishing. C’est le même bon que celui que l’on pourra acheter plus tard.</p>
                <p>Il est valable jusqu’au <strong>{$expiresLabel}</strong> (heure de Paris). Créer une compétition le consomme.</p>
                <p style=\"margin:16px 0 8px\"><strong>Comment lancer une compétition</strong></p>
                <ol style=\"padding-left:18px;margin:0 0 16px\">
                  <li>Ouvrez l’application (ou le site) avec ce compte.</li>
                  <li>Créez une compétition : titre, dates, lieu, espèces.</li>
                  <li>Choisissez le mode d’accès, puis invitez les pêcheurs si besoin.</li>
                </ol>
                <p style=\"margin:0 0 8px\"><strong>Modes d’accès</strong></p>
                <ul style=\"padding-left:18px;margin:0 0 16px\">
                  <li><strong>Gratuit</strong> — jusqu’à 16 pêcheurs.</li>
                  <li><strong>Payant</strong> — inscriptions payantes (encaissement à venir) ; plafond au choix.</li>
                  <li><strong>Privé</strong> — sur invitation e-mail nominative (le code ne se partage pas).</li>
                  <li><strong>Privé et payant</strong> — invitation + inscription payante.</li>
                </ul>
                {$this->cta($createUrl, 'Créer une compétition')}
                <p style=\"font-size:13px;color:#555;margin:20px 0 0\">En cas de difficulté, écrivez-nous à <a href=\"mailto:{$support}\">{$support}</a>.</p>"
            ));
        $this->mailer->send($email);
        $this->logger->info('Email bon de création envoyé', ['to' => $user->getEmail()]);
    }

    public function sendCatchValidationEmail(\App\Entity\Competition\FishCatch $catch, bool $validated, ?string $rejectionReason = null): void
    {
        $user = $catch->getCaughtBy();
        if (!$user) {
            return; // Pas d'email si pas de pêcheur identifié
        }

        $teamName = htmlspecialchars($catch->getTeam()->getName());
        $speciesName = htmlspecialchars($catch->getSpecies()->getName());
        $size = $catch->getSize();
        $points = $catch->calculatePoints();
        $competitionName = $catch->getTeam()->getCompetition() 
            ? htmlspecialchars($catch->getTeam()->getCompetition()->getName())
            : 'Compétition';
        
        $teamUrl = $this->appRedirect('teams/' . $catch->getTeam()->getId());

        try {
            if ($validated) {
                if (!$this->shouldSendNotificationEmail($user)) {
                    return;
                }

                // Email de validation
                $email = (new Email())
                    ->from($this->brandedFrom())
                    ->to($user->getEmail())
                    ->subject('Prise validée')
                    ->html($this->wrapEmailHtml(
                        "<h1>Prise validée</h1>
                        <p>{$this->hello($user)}</p>
                        <p><strong>{$speciesName}</strong> — {$size} cm ({$points} pts), équipe {$teamName}"
                        . ($competitionName ? ", {$competitionName}" : '')
                        . ".</p>"
                        . $this->cta($teamUrl, 'Ouvrir l’application')
                    ));
            } else {
                // Email de rejet
                if (!$this->shouldSendNotificationEmail($user)) {
                    return;
                }

                $rejectionReasonHtml = $rejectionReason ? nl2br(htmlspecialchars($rejectionReason)) : 'Aucun motif spécifié.';
                
                $email = (new Email())
                    ->from($this->brandedFrom())
                    ->to($user->getEmail())
                    ->subject('Prise refusée')
                    ->html($this->wrapEmailHtml(
                        "<h1>Prise refusée</h1>
                        <p>{$this->hello($user)}</p>
                        <p><strong>{$speciesName}</strong> — {$size} cm, équipe {$teamName}.</p>
                        <p><strong>Motif :</strong> {$rejectionReasonHtml}</p>
                        {$this->cta($teamUrl, 'Ouvrir l’application')}"
                    ));
            }

            try {
                $this->mailer->send($email);
                error_log("Email de validation/rejet envoyé avec succès à: " . $user->getEmail());
            } catch (\Exception $sendException) {
                error_log("ERREUR lors de l'envoi de l'email de validation/rejet à {$user->getEmail()}: " . $sendException->getMessage());
            }
        } catch (TransportExceptionInterface $e) {
            error_log("ERREUR lors de l'envoi de l'email de validation/rejet: " . $e->getMessage());
        } catch (\Exception $e) {
            error_log("ERREUR GENERALE lors de l'envoi de l'email de validation/rejet: " . $e->getMessage());
        }
    }
}
