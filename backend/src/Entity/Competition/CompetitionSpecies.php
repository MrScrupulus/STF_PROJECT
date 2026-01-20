<?php

namespace App\Entity\Competition;

use App\Entity\Species\Species;
use App\Repository\Competition\CompetitionSpeciesRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CompetitionSpeciesRepository::class)]
#[ORM\Table(name: 'competition_species')]
class CompetitionSpecies
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['competition:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Competition::class, inversedBy: 'competitionSpecies')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Competition $competition = null;

    #[ORM\ManyToOne(targetEntity: Species::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['competition:read'])]
    private ?Species $species = null;

    #[ORM\Column(type: 'float')]
    #[Groups(['competition:read'])]
    private ?float $coefficient = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['competition:read'])]
    private bool $isBonusEnabled = false;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Groups(['competition:read'])]
    private ?int $basePoints = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCompetition(): ?Competition
    {
        return $this->competition;
    }

    public function setCompetition(?Competition $competition): static
    {
        $this->competition = $competition;
        return $this;
    }

    public function getSpecies(): ?Species
    {
        return $this->species;
    }

    public function setSpecies(?Species $species): static
    {
        $this->species = $species;
        return $this;
    }

    public function getCoefficient(): ?float
    {
        return $this->coefficient;
    }

    public function setCoefficient(float $coefficient): static
    {
        $this->coefficient = $coefficient;
        return $this;
    }

    public function isBonusEnabled(): bool
    {
        return $this->isBonusEnabled;
    }

    public function setIsBonusEnabled(bool $isBonusEnabled): static
    {
        $this->isBonusEnabled = $isBonusEnabled;
        return $this;
    }

    public function getBasePoints(): ?int
    {
        return $this->basePoints;
    }

    public function setBasePoints(?int $basePoints): static
    {
        $this->basePoints = $basePoints;
        return $this;
    }
}
