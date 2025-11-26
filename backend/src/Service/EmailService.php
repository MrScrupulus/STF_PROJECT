<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use App\Entity\Security\User;

final class EmailService
{
    private string $fromEmail;
    private string $frontendUrl;

    public function __construct(
        private readonly MailerInterface $mailer,
        private string $mailerFromEmail,
        ParameterBagInterface $params,
    ) {
        $this->fromEmail = $mailerFromEmail;
        $this->frontendUrl = $params->get('app.frontend_url');
    }

    public function sendVerificationEmail(User $user): void
    {
        error_log("Construction du lien de vérification pour: " . $user->getEmail());
        error_log("Avec le token: " . $user->getVerificationToken());

        $verificationUrl = rtrim($this->frontendUrl, '/') . "/verify-email/" . $user->getVerificationToken();
        error_log("URL complète: " . $verificationUrl);

        try {
            error_log("Tentative d'envoi d'email à: " . $user->getEmail());
            error_log("Email expéditeur: " . $this->fromEmail);
            
            $email = (new Email())
                ->from($this->fromEmail)
                ->to($user->getEmail())
                ->subject('Vérification de votre compte Street Fishing')
                ->html(
                    "<h1>Vérification de votre adresse email</h1>
                    <p>Pour confirmer votre inscription, veuillez cliquer sur ce lien : 
                        <a href='{$verificationUrl}'>Vérifier mon email</a>
                    </p>
                    <p>Si le lien ne fonctionne pas, copiez cette URL dans votre navigateur :</p>
                    <p>{$verificationUrl}</p>
                    <p>Ce lien est valable pendant 24 heures.</p>
                    <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>"
                );

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
        $resetUrl = "{$this->frontendUrl}/reset-password/{$token}";

        try {
            $email = (new Email())
                ->from($this->fromEmail)
                ->to($user->getEmail())
                ->subject('Réinitialisation de votre mot de passe Street Fishing')
                ->html(
                    "<h1>Réinitialisation de votre mot de passe</h1>
                    <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.</p>
                    <p>Pour définir un nouveau mot de passe, cliquez sur ce lien : 
                        <a href='{$resetUrl}'>Réinitialiser mon mot de passe</a>
                    </p>
                    <p>Ce lien est valable pendant 1 heure.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>"
                );

            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            throw new \RuntimeException(
                'Erreur lors de l\'envoi de l\'email de réinitialisation : ' . $e->getMessage(),
                0,
                $e
            );
        }
    }
}
