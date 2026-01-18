<?php

namespace App\Entity\Competition;

use App\Entity\Species\Species;
use App\Entity\Security\User;
use App\Repository\Competition\FishCatchRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: FishCatchRepository::class)]
#[ORM\Table(name: 'fish_catch')]
class FishCatch
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['catch:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Team::class, inversedBy: 'catches')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Team $team = null;

    #[ORM\ManyToOne(targetEntity: Species::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['catch:read'])]
    private ?Species $species = null;

    #[ORM\Column]
    #[Groups(['catch:read'])]
    private ?float $size = null;

    #[ORM\Column]
    #[Groups(['catch:read'])]
    private bool $isValidated = false;

    #[ORM\Column]
    #[Groups(['catch:read'])]
    private ?\DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['catch:read'])]
    private ?string $photoUrl = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['catch:read'])]
    private ?string $comment = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['catch:read'])]
    private ?string $rejectionReason = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['catch:read'])]
    private ?User $caughtBy = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function calculatePoints(): int
    {
        if (!$this->species || !$this->size) {
            return 0;
        }

        // Score de base = coefficient × longueur
        return (int) ($this->size * $this->species->getCoefficient());
    }

    // Getters et Setters...
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTeam(): ?Team
    {
        return $this->team;
    }

    public function setTeam(?Team $team): self
    {
        $this->team = $team;
        return $this;
    }

    public function getSpecies(): ?Species
    {
        return $this->species;
    }

    public function setSpecies(?Species $species): self
    {
        $this->species = $species;
        return $this;
    }

    public function getSize(): ?float
    {
        return $this->size;
    }

    public function setSize(float $size): self
    {
        $this->size = $size;
        return $this;
    }

    public function isValidated(): bool
    {
        return $this->isValidated;
    }

    public function setIsValidated(bool $isValidated): self
    {
        $this->isValidated = $isValidated;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getPhotoUrl(): ?string
    {
        return $this->photoUrl;
    }

    public function setPhotoUrl(?string $photoUrl): self
    {
        $this->photoUrl = $photoUrl;
        return $this;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function setComment(?string $comment): self
    {
        $this->comment = $comment;
        return $this;
    }

    public function getCaughtBy(): ?User
    {
        return $this->caughtBy;
    }

    public function setCaughtBy(?User $caughtBy): self
    {
        $this->caughtBy = $caughtBy;
        return $this;
    }

    public function getRejectionReason(): ?string
    {
        return $this->rejectionReason;
    }

    public function setRejectionReason(?string $rejectionReason): self
    {
        $this->rejectionReason = $rejectionReason;
        return $this;
    }
}
