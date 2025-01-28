<?php

namespace App\Entity\Species;

use App\Repository\Species\SpeciesRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SpeciesRepository::class)]
class Species
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['species:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['species:read', 'catch:read'])]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['species:read'])]
    private ?float $coefficient = null;

    #[ORM\Column]
    private int $basePoints = 50;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        if (strtolower($name) === 'espèce bonus') {
            $this->coefficient = 1.0;
        }
        return $this;
    }

    public function getCoefficient(): float
    {
        return $this->coefficient;
    }

    public function setCoefficient(float $coefficient): self
    {
        if (strtolower($this->name) !== 'espèce bonus') {
            $this->coefficient = $coefficient;
        }
        return $this;
    }

    public function getBasePoints(): int
    {
        return $this->basePoints;
    }

    public function setBasePoints(int $basePoints): self
    {
        $this->basePoints = $basePoints;
        return $this;
    }

    public function isBonus(): bool
    {
        return strtolower($this->name) === 'espèce bonus';
    }
}
