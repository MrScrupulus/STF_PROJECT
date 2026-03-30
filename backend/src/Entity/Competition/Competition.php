<?php

namespace App\Entity\Competition;

use App\Repository\Competition\CompetitionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CompetitionRepository::class)]
#[ORM\Table(name: 'competitions')]
class Competition
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: 'integer')]
    private ?int $teamSize = null;

    #[ORM\Column(length: 50)]
    private ?string $type = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $maxParticipants = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $hasNoLimit = false;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $reglement = null;

    /**
     * Chemins relatifs des images du règlement (ex: ["reglements/xxx.jpg", ...]).
     * Tableau JSON stocké en BDD.
     */
    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $reglementImagePaths = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isRankingPublic = false;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isPaused = false;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isBonusEnabled = false;

    /**
     * Bonus par nouvelle espèce : activé (checkbox)
     */
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $newSpeciesBonusEnabled = false;

    /**
     * Bonus par nouvelle espèce : valeur en points (si activé)
     */
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $newSpeciesBonusPoints = null;

    /**
     * Bonus quota atteint : activé (checkbox)
     */
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $quotaBonusEnabled = false;

    /**
     * Bonus quota atteint : valeur en points (si activé)
     */
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $quotaBonusPoints = null;

    /**
     * Nombre de poissons comptabilisés pour le score (null = tous).
     * Ex : 5, 9, 10, 15, ou null pour tout compter.
     */
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $maxFishCounted = null;

    #[ORM\OneToMany(mappedBy: 'competition', targetEntity: Team::class)]
    private Collection $teams;

    #[ORM\OneToMany(mappedBy: 'competition', targetEntity: CompetitionPerimeter::class, cascade: ['persist', 'remove'])]
    private Collection $perimeters;

    #[ORM\OneToMany(mappedBy: 'competition', targetEntity: CompetitionSpecies::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $competitionSpecies;

    public function __construct()
    {
        $this->teams = new ArrayCollection();
        $this->perimeters = new ArrayCollection();
        $this->competitionSpecies = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;
        return $this;
    }

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;
        return $this;
    }

    /**
     * @return Collection<int, Team>
     */
    public function getTeams(): Collection
    {
        return $this->teams;
    }

    public function addTeam(Team $team): static
    {
        if (!$this->teams->contains($team)) {
            $this->teams->add($team);
            $team->setCompetition($this);
        }
        return $this;
    }

    public function removeTeam(Team $team): static
    {
        if ($this->teams->removeElement($team)) {
            if ($team->getCompetition() === $this) {
                $team->setCompetition(null);
            }
        }
        return $this;
    }

    public function getTeamSize(): ?int
    {
        return $this->teamSize;
    }

    public function setTeamSize(int $teamSize): self
    {
        $this->teamSize = $teamSize;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getMaxParticipants(): ?int
    {
        return $this->maxParticipants;
    }

    public function setMaxParticipants(?int $maxParticipants): self
    {
        $this->maxParticipants = $maxParticipants;
        return $this;
    }

    public function getHasNoLimit(): bool
    {
        return $this->hasNoLimit;
    }

    public function setHasNoLimit(bool $hasNoLimit): self
    {
        $this->hasNoLimit = $hasNoLimit;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getReglement(): ?string
    {
        return $this->reglement;
    }

    public function setReglement(?string $reglement): self
    {
        $this->reglement = $reglement;
        return $this;
    }

    /**
     * @return string[]|null Tableau de chemins relatifs
     */
    public function getReglementImagePaths(): ?array
    {
        return $this->reglementImagePaths;
    }

    /**
     * @param string[]|null $reglementImagePaths
     */
    public function setReglementImagePaths(?array $reglementImagePaths): self
    {
        $this->reglementImagePaths = $reglementImagePaths;
        return $this;
    }

    public function addReglementImagePath(string $path): self
    {
        $paths = $this->reglementImagePaths ?? [];
        $paths[] = $path;
        $this->reglementImagePaths = $paths;
        return $this;
    }

    public function removeReglementImagePath(string $path): self
    {
        $paths = $this->reglementImagePaths ?? [];
        $paths = array_values(array_filter($paths, fn($p) => $p !== $path));
        $this->reglementImagePaths = empty($paths) ? null : $paths;
        return $this;
    }

    public function removeReglementImagePathByIndex(int $index): self
    {
        $paths = $this->reglementImagePaths ?? [];
        if (isset($paths[$index])) {
            array_splice($paths, $index, 1);
            $this->reglementImagePaths = empty($paths) ? null : array_values($paths);
        }
        return $this;
    }

    public function getIsRankingPublic(): bool
    {
        return $this->isRankingPublic;
    }

    public function setIsRankingPublic(bool $isRankingPublic): self
    {
        $this->isRankingPublic = $isRankingPublic;
        return $this;
    }

    public function getIsPaused(): bool
    {
        return $this->isPaused;
    }

    public function setIsPaused(bool $isPaused): self
    {
        $this->isPaused = $isPaused;
        return $this;
    }

    public function getIsBonusEnabled(): bool
    {
        return $this->isBonusEnabled;
    }

    public function setIsBonusEnabled(bool $isBonusEnabled): self
    {
        $this->isBonusEnabled = $isBonusEnabled;
        return $this;
    }

    public function getNewSpeciesBonusEnabled(): bool
    {
        return $this->newSpeciesBonusEnabled;
    }

    public function setNewSpeciesBonusEnabled(bool $newSpeciesBonusEnabled): self
    {
        $this->newSpeciesBonusEnabled = $newSpeciesBonusEnabled;
        return $this;
    }

    public function getNewSpeciesBonusPoints(): ?int
    {
        return $this->newSpeciesBonusPoints;
    }

    public function setNewSpeciesBonusPoints(?int $newSpeciesBonusPoints): self
    {
        $this->newSpeciesBonusPoints = $newSpeciesBonusPoints;
        return $this;
    }

    public function getQuotaBonusEnabled(): bool
    {
        return $this->quotaBonusEnabled;
    }

    public function setQuotaBonusEnabled(bool $quotaBonusEnabled): self
    {
        $this->quotaBonusEnabled = $quotaBonusEnabled;
        return $this;
    }

    public function getQuotaBonusPoints(): ?int
    {
        return $this->quotaBonusPoints;
    }

    public function setQuotaBonusPoints(?int $quotaBonusPoints): self
    {
        $this->quotaBonusPoints = $quotaBonusPoints;
        return $this;
    }

    /**
     * Nombre de poissons comptabilisés pour le score (null = tous).
     */
    public function getMaxFishCounted(): ?int
    {
        return $this->maxFishCounted;
    }

    public function setMaxFishCounted(?int $maxFishCounted): self
    {
        $this->maxFishCounted = $maxFishCounted;
        return $this;
    }

    /**
     * @return Collection<int, CompetitionPerimeter>
     */
    public function getPerimeters(): Collection
    {
        return $this->perimeters;
    }

    public function addPerimeter(CompetitionPerimeter $perimeter): static
    {
        if (!$this->perimeters->contains($perimeter)) {
            $this->perimeters->add($perimeter);
            $perimeter->setCompetition($this);
        }
        return $this;
    }

    public function removePerimeter(CompetitionPerimeter $perimeter): static
    {
        if ($this->perimeters->removeElement($perimeter)) {
            if ($perimeter->getCompetition() === $this) {
                $perimeter->setCompetition(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, CompetitionSpecies>
     */
    public function getCompetitionSpecies(): Collection
    {
        return $this->competitionSpecies;
    }

    public function addCompetitionSpecies(CompetitionSpecies $competitionSpecies): static
    {
        if (!$this->competitionSpecies->contains($competitionSpecies)) {
            $this->competitionSpecies->add($competitionSpecies);
            $competitionSpecies->setCompetition($this);
        }
        return $this;
    }

    public function removeCompetitionSpecies(CompetitionSpecies $competitionSpecies): static
    {
        if ($this->competitionSpecies->removeElement($competitionSpecies)) {
            if ($competitionSpecies->getCompetition() === $this) {
                $competitionSpecies->setCompetition(null);
            }
        }
        return $this;
    }
}
