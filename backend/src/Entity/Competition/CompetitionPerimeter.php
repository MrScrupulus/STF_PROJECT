<?php

namespace App\Entity\Competition;

use App\Repository\Competition\CompetitionPerimeterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CompetitionPerimeterRepository::class)]
#[ORM\Table(name: 'competition_perimeters')]
class CompetitionPerimeter
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['perimeter:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Competition::class, inversedBy: 'perimeters')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Competition $competition = null;

    /**
     * Stocke les coordonnées du périmètre sous forme de polygone
     * Format: [[lat1, lng1], [lat2, lng2], ...]
     * Stocké en JSON
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['perimeter:read'])]
    private array $coordinates = [];

    /**
     * Nom du périmètre (optionnel, pour identifier différentes zones)
     */
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['perimeter:read'])]
    private ?string $name = null;

    /**
     * Indique si le périmètre est actif
     */
    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    #[Groups(['perimeter:read'])]
    private bool $isActive = true;

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

    public function getCoordinates(): array
    {
        return $this->coordinates;
    }

    public function setCoordinates(array $coordinates): static
    {
        $this->coordinates = $coordinates;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
        return $this;
    }
}
