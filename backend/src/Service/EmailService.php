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

        $verificationUrl = "https://localhost:3000/verify-email/" . $user->getVerificationToken();
        error_log("URL complète: " . $verificationUrl);

        try {
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

            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            throw new \RuntimeException(
                'Erreur lors de l\'envoi de l\'email de vérification : ' . $e->getMessage(),
                0,
                $e
            );
        }
    }
}
