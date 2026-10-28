<?php

namespace App\Entity\Competition;

use App\Entity\Security\User;
use App\Repository\Competition\CreationCreditRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CreationCreditRepository::class)]
#[ORM\Table(name: 'creation_credits')]
class CreationCredit
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $grantedBy = null;

    #[ORM\Column]
    private \DateTimeImmutable $grantedAt;

    #[ORM\Column]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $consumedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $cancelledAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Competition $competition = null;

    #[ORM\Column(options: ['default' => true])]
    private bool $isComplimentary = true;

    public function __construct()
    {
        $this->grantedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getGrantedBy(): ?User
    {
        return $this->grantedBy;
    }

    public function setGrantedBy(?User $grantedBy): static
    {
        $this->grantedBy = $grantedBy;
        return $this;
    }

    public function getGrantedAt(): \DateTimeImmutable
    {
        return $this->grantedAt;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }

    public function getConsumedAt(): ?\DateTimeImmutable
    {
        return $this->consumedAt;
    }

    public function getCancelledAt(): ?\DateTimeImmutable
    {
        return $this->cancelledAt;
    }

    public function getCompetition(): ?Competition
    {
        return $this->competition;
    }

    public function isComplimentary(): bool
    {
        return $this->isComplimentary;
    }

    public function setIsComplimentary(bool $isComplimentary): static
    {
        $this->isComplimentary = $isComplimentary;
        return $this;
    }

    public function isAvailable(\DateTimeImmutable $now = new \DateTimeImmutable()): bool
    {
        return $this->consumedAt === null
            && $this->cancelledAt === null
            && $this->expiresAt > $now;
    }

    public function consume(Competition $competition, \DateTimeImmutable $now = new \DateTimeImmutable()): void
    {
        $this->consumedAt = $now;
        $this->competition = $competition;
    }

    public function cancel(\DateTimeImmutable $now = new \DateTimeImmutable()): void
    {
        $this->cancelledAt = $now;
    }
}
