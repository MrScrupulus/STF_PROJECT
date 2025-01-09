<?php

namespace App\Entity\Competition;

use App\Entity\Species\Species;
use App\Repository\Competition\FishCatchRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FishCatchRepository::class)]
class FishCatch
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Species $species = null;

    #[ORM\Column]
    private ?float $length = null;

    #[ORM\Column]
    private ?int $points = null;

    #[ORM\ManyToOne(inversedBy: 'catches')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Team $team = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $catchTime = null;

    #[ORM\Column]
    private ?bool $isValidated = false;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photoUrl = null;

    public function calculatePoints(): int
    {
        if (!$this->species || !$this->length) {
            return 0;
        }

        return (int) ($this->length * $this->species->getCoefficient() * $this->species->getBasePoints());
    }

    // Getters et Setters...
    public function getId(): ?int
    {
        return $this->id;
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

    public function getLength(): ?float
    {
        return $this->length;
    }

    public function setLength(float $length): self
    {
        $this->length = $length;
        $this->points = $this->calculatePoints();
        return $this;
    }

    public function getPoints(): ?int
    {
        return $this->points;
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

    public function getCatchTime(): ?\DateTimeImmutable
    {
        return $this->catchTime;
    }

    public function setCatchTime(\DateTimeImmutable $catchTime): self
    {
        $this->catchTime = $catchTime;
        return $this;
    }

    public function isValidated(): ?bool
    {
        return $this->isValidated;
    }

    public function setIsValidated(bool $isValidated): self
    {
        $this->isValidated = $isValidated;
        return $this;
    }

    public function getPhotoUrl(): ?string
    {
        return $this->photoUrl;
    }

    public function setPhotoUrl(?string $photoUrl): static
    {
        $this->photoUrl = $photoUrl;
        return $this;
    }
}
