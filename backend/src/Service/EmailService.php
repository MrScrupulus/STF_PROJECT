<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use App\Entity\Security\User;
use App\Entity\Competition\Team;
use App\Entity\Competition\Competition;

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

    public function sendTeamCreationEmail(Team $team): void
    {
        $teamName = htmlspecialchars($team->getName());
        $membersList = [];
        
        foreach ($team->getMembers() as $member) {
            $membersList[] = htmlspecialchars($member->getFirstname() . ' ' . $member->getLastname());
        }
        $membersHtml = '<ul><li>' . implode('</li><li>', $membersList) . '</li></ul>';
        
        $teamUrl = rtrim($this->frontendUrl, '/') . '/teams/' . $team->getId();

        try {
            // Envoyer l'email à tous les membres de l'équipe
            foreach ($team->getMembers() as $member) {
                $email = (new Email())
                    ->from($this->fromEmail)
                    ->to($member->getEmail())
                    ->subject("Votre équipe '{$teamName}' a été créée - Street Fishing")
                    ->html(
                        "<h1>Félicitations ! Votre équipe a été créée</h1>
                        <p>Bonjour " . htmlspecialchars($member->getFirstname()) . ",</p>
                        <p>Votre équipe <strong>{$teamName}</strong> a été créée avec succès.</p>
                        
                        <h2>Composition de l'équipe :</h2>
                        {$membersHtml}
                        
                        <p>Vous pouvez maintenant :</p>
                        <ul>
                            <li>Consulter les détails de votre équipe : <a href='{$teamUrl}'>Voir mon équipe</a></li>
                            <li>Vous inscrire à une compétition</li>
                            <li>Enregistrer vos prises de pêche</li>
                        </ul>
                        
                        <p>Bonne chance pour vos prochaines compétitions !</p>
                        <p>L'équipe Street Fishing</p>"
                    );

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
        $startDate = $competition->getStartDate()->format('d/m/Y à H:i');
        $endDate = $competition->getEndDate()->format('d/m/Y à H:i');
        $description = $competition->getDescription() ? nl2br(htmlspecialchars($competition->getDescription())) : 'Aucune description disponible.';
        
        $competitionUrl = rtrim($this->frontendUrl, '/') . '/competitions/' . $competition->getId();
        $teamUrl = rtrim($this->frontendUrl, '/') . '/teams/' . $team->getId();

        try {
            // Envoyer l'email à tous les membres de l'équipe
            foreach ($team->getMembers() as $member) {
                $email = (new Email())
                    ->from($this->fromEmail)
                    ->to($member->getEmail())
                    ->subject("Votre équipe '{$teamName}' est inscrite à la compétition '{$competitionName}' - Street Fishing")
                    ->html(
                        "<h1>Inscription confirmée !</h1>
                        <p>Bonjour " . htmlspecialchars($member->getFirstname()) . ",</p>
                        <p>Votre équipe <strong>{$teamName}</strong> a été inscrite avec succès à la compétition <strong>{$competitionName}</strong>.</p>
                        
                        <h2>Détails de la compétition :</h2>
                        <ul>
                            <li><strong>Nom :</strong> {$competitionName}</li>
                            <li><strong>Date de début :</strong> {$startDate}</li>
                            <li><strong>Date de fin :</strong> {$endDate}</li>
                            <li><strong>Numéro d'inscription :</strong> #{$registrationNumber}</li>
                        </ul>
                        
                        <h3>Description :</h3>
                        <p>{$description}</p>
                        
                        <h2>Prochaines étapes :</h2>
                        <ul>
                            <li>Consulter les détails de la compétition : <a href='{$competitionUrl}'>Voir la compétition</a></li>
                            <li>Consulter votre équipe : <a href='{$teamUrl}'>Voir mon équipe</a></li>
                            <li>Enregistrer vos prises de pêche pendant la compétition</li>
                        </ul>
                        
                        <p>Bonne chance pour la compétition !</p>
                        <p>L'équipe Street Fishing</p>"
                    );

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
        $inviterName = '';
        $membersList = [];
        
        foreach ($team->getMembers() as $member) {
            $membersList[] = htmlspecialchars($member->getFirstname() . ' ' . $member->getLastname());
            // Prendre le premier membre comme invitant (généralement celui qui invite)
            if (empty($inviterName)) {
                $inviterName = htmlspecialchars($member->getFirstname() . ' ' . $member->getLastname());
            }
        }
        $membersHtml = '<ul><li>' . implode('</li><li>', $membersList) . '</li></ul>';
        
        $teamUrl = rtrim($this->frontendUrl, '/') . '/teams/' . $team->getId();

        try {
            $email = (new Email())
                ->from($this->fromEmail)
                ->to($invitedUser->getEmail())
                ->subject("Invitation à rejoindre l'équipe '{$teamName}' - Street Fishing")
                ->html(
                    "<h1>Invitation à rejoindre une équipe</h1>
                    <p>Bonjour " . htmlspecialchars($invitedUser->getFirstname()) . ",</p>
                    <p><strong>{$inviterName}</strong> vous invite à rejoindre l'équipe <strong>{$teamName}</strong>.</p>
                    
                    <h2>Composition actuelle de l'équipe :</h2>
                    {$membersHtml}
                    
                    <p>Vous avez été ajouté à cette équipe. Vous pouvez maintenant :</p>
                    <ul>
                        <li>Consulter les détails de l'équipe : <a href='{$teamUrl}'>Voir l'équipe</a></li>
                        <li>Vous inscrire à une compétition avec cette équipe</li>
                        <li>Enregistrer vos prises de pêche</li>
                    </ul>
                    
                    <p>Bonne chance pour vos prochaines compétitions !</p>
                    <p>L'équipe Street Fishing</p>"
                );

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
}
