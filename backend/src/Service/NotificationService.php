<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\Security\User;
use App\Repository\Security\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserRepository $userRepository
    ) {
    }

    /**
     * Crée une notification pour un utilisateur
     */
    public function createNotification(
        User $user,
        string $type,
        string $message,
        ?array $data = null
    ): Notification {
        $notification = new Notification();
        $notification->setUser($user);
        $notification->setType($type);
        $notification->setMessage($message);
        $notification->setData($data);
        $notification->setIsRead(false);

        $this->entityManager->persist($notification);
        $this->entityManager->flush();

        return $notification;
    }

    /**
     * Notifie qu'une prise a été validée
     */
    public function notifyCatchValidated(User $user, int $catchId, string $speciesName, float $size): void
    {
        $this->createNotification(
            $user,
            'catch_validated',
            "Votre prise de {$speciesName} ({$size} cm) a été validée !",
            [
                'catchId' => $catchId,
                'speciesName' => $speciesName,
                'size' => $size,
            ]
        );
    }

    /**
     * Notifie qu'une prise a été rejetée
     */
    public function notifyCatchRejected(User $user, int $catchId, string $speciesName, float $size, string $reason): void
    {
        $this->createNotification(
            $user,
            'catch_rejected',
            "Votre prise de {$speciesName} ({$size} cm) a été rejetée : {$reason}",
            [
                'catchId' => $catchId,
                'speciesName' => $speciesName,
                'size' => $size,
                'reason' => $reason,
            ]
        );
    }

    /**
     * Notifie une invitation d'équipe
     */
    public function notifyTeamInvitation(User $user, string $teamName, int $teamId): void
    {
        $this->createNotification(
            $user,
            'team_invitation',
            "Vous avez été invité à rejoindre l'équipe {$teamName}",
            [
                'teamId' => $teamId,
                'teamName' => $teamName,
            ]
        );
    }

    /**
     * Notifie l'inscription à une compétition
     */
    public function notifyCompetitionRegistration(User $user, string $competitionName, int $competitionId): void
    {
        $this->createNotification(
            $user,
            'competition_registered',
            "Votre équipe a été inscrite à la compétition {$competitionName}",
            [
                'competitionId' => $competitionId,
                'competitionName' => $competitionName,
            ]
        );
    }

    /**
     * Notifie le début d'une compétition
     */
    public function notifyCompetitionStarted(User $user, string $competitionName, int $competitionId): void
    {
        $this->createNotification(
            $user,
            'competition_started',
            "La compétition {$competitionName} a commencé !",
            [
                'competitionId' => $competitionId,
                'competitionName' => $competitionName,
            ]
        );
    }

    /**
     * Notifie la fin d'une compétition
     */
    public function notifyCompetitionEnded(User $user, string $competitionName, int $competitionId): void
    {
        $this->createNotification(
            $user,
            'competition_ended',
            "La compétition {$competitionName} est terminée. Consultez le classement final !",
            [
                'competitionId' => $competitionId,
                'competitionName' => $competitionName,
            ]
        );
    }

    /**
     * Notifie qu'une compétition a été mise en pause
     */
    public function notifyCompetitionPaused(User $user, string $competitionName, int $competitionId): void
    {
        $this->createNotification(
            $user,
            'competition_paused',
            "La compétition {$competitionName} a été mise en pause",
            [
                'competitionId' => $competitionId,
                'competitionName' => $competitionName,
            ]
        );
    }

    /**
     * Notifie qu'une compétition a été reprise
     */
    public function notifyCompetitionResumed(User $user, string $competitionName, int $competitionId): void
    {
        $this->createNotification(
            $user,
            'competition_resumed',
            "La compétition {$competitionName} a été reprise",
            [
                'competitionId' => $competitionId,
                'competitionName' => $competitionName,
            ]
        );
    }

    /**
     * Notifie tous les admins qu'une nouvelle prise est en attente de validation
     */
    public function notifyAdminsPendingCatch(int $catchId, string $teamName, string $speciesName, float $size, string $caughtByName): void
    {
        $admins = $this->userRepository->findByRole('ROLE_ADMIN');
        
        foreach ($admins as $admin) {
            $this->createNotification(
                $admin,
                'catch_pending',
                "Nouvelle prise en attente de validation : {$speciesName} ({$size} cm) par {$caughtByName} de l'équipe {$teamName}",
                [
                    'catchId' => $catchId,
                    'teamName' => $teamName,
                    'speciesName' => $speciesName,
                    'size' => $size,
                    'caughtByName' => $caughtByName,
                ]
            );
        }
    }
}
