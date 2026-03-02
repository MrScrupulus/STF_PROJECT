<?php

namespace App\Entity;

use App\Entity\Security\User;
use App\Repository\NotificationPreferencesRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: NotificationPreferencesRepository::class)]
#[ORM\Table(name: 'notification_preferences')]
#[ORM\UniqueConstraint(name: 'user_unique', columns: ['user_id'])]
class NotificationPreferences
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, unique: true, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $expoPushToken = null;

    // Notifications générales
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $catchValidated = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $catchRejected = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $teamInvitation = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $competitionRegistered = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $competitionStarted = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $competitionEnded = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $competitionPaused = true;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $competitionResumed = true;

    // Notifications admin uniquement
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $catchPending = true;

    /** Recevoir les notifications par email (en plus ou à la place du push) */
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $receiveEmailNotifications = true;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getExpoPushToken(): ?string
    {
        return $this->expoPushToken;
    }

    public function setExpoPushToken(?string $expoPushToken): static
    {
        $this->expoPushToken = $expoPushToken;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCatchValidated(): bool
    {
        return $this->catchValidated;
    }

    public function setCatchValidated(bool $catchValidated): static
    {
        $this->catchValidated = $catchValidated;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCatchRejected(): bool
    {
        return $this->catchRejected;
    }

    public function setCatchRejected(bool $catchRejected): static
    {
        $this->catchRejected = $catchRejected;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isTeamInvitation(): bool
    {
        return $this->teamInvitation;
    }

    public function setTeamInvitation(bool $teamInvitation): static
    {
        $this->teamInvitation = $teamInvitation;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCompetitionRegistered(): bool
    {
        return $this->competitionRegistered;
    }

    public function setCompetitionRegistered(bool $competitionRegistered): static
    {
        $this->competitionRegistered = $competitionRegistered;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCompetitionStarted(): bool
    {
        return $this->competitionStarted;
    }

    public function setCompetitionStarted(bool $competitionStarted): static
    {
        $this->competitionStarted = $competitionStarted;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCompetitionEnded(): bool
    {
        return $this->competitionEnded;
    }

    public function setCompetitionEnded(bool $competitionEnded): static
    {
        $this->competitionEnded = $competitionEnded;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCompetitionPaused(): bool
    {
        return $this->competitionPaused;
    }

    public function setCompetitionPaused(bool $competitionPaused): static
    {
        $this->competitionPaused = $competitionPaused;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCompetitionResumed(): bool
    {
        return $this->competitionResumed;
    }

    public function setCompetitionResumed(bool $competitionResumed): static
    {
        $this->competitionResumed = $competitionResumed;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isCatchPending(): bool
    {
        return $this->catchPending;
    }

    public function setCatchPending(bool $catchPending): static
    {
        $this->catchPending = $catchPending;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function isReceiveEmailNotifications(): bool
    {
        return $this->receiveEmailNotifications;
    }

    public function setReceiveEmailNotifications(bool $receiveEmailNotifications): static
    {
        $this->receiveEmailNotifications = $receiveEmailNotifications;
        $this->updatedAt = new \DateTime();
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * Vérifie si une notification de type donné est activée
     */
    public function isNotificationEnabled(string $type): bool
    {
        return match ($type) {
            'catch_validated' => $this->catchValidated,
            'catch_rejected' => $this->catchRejected,
            'team_invitation' => $this->teamInvitation,
            'competition_registered' => $this->competitionRegistered,
            'competition_started' => $this->competitionStarted,
            'competition_ended' => $this->competitionEnded,
            'competition_paused' => $this->competitionPaused,
            'competition_resumed' => $this->competitionResumed,
            'catch_pending' => $this->catchPending,
            default => true, // Par défaut, activé
        };
    }
}
