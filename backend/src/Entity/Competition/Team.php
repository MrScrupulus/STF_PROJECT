<?php

namespace App\Entity\Competition;

use App\Repository\Competition\TeamRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\Security\User;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: TeamRepository::class)]
#[ORM\Table(name: 'teams')]
class Team
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['team:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['team:read'])]
    private ?string $name = null;

    #[ORM\OneToMany(mappedBy: 'team', targetEntity: FishCatch::class)]
    private Collection $catches;

    #[ORM\Column]
    private ?int $totalScore = 0;

    #[ORM\Column]
    private ?bool $hasBonus = false;

    #[ORM\ManyToOne(inversedBy: 'teams')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Competition $competition = null;

    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'competition_team_members')]
    #[Groups(['team:read'])]
    private Collection $members;

    #[ORM\Column(nullable: true)]
    private ?int $registrationNumber = null;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->catches = new ArrayCollection();
        $this->totalScore = 0;
        $this->hasBonus = false;
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

    /**
     * @return Collection<int, FishCatch>
     */
    public function getCatches(): Collection
    {
        return $this->catches;
    }

    public function addCatch(FishCatch $catch): static
    {
        if (!$this->catches->contains($catch)) {
            $this->catches->add($catch);
            $catch->setTeam($this);
            $this->updateTotalScore();
        }

        return $this;
    }

    public function removeCatch(FishCatch $catch): static
    {
        if ($this->catches->removeElement($catch)) {
            $this->updateTotalScore();
        }

        return $this;
    }

    public function getTotalScore(): ?int
    {
        return $this->totalScore;
    }

    public function updateTotalScore(): void
    {
        $score = 0;
        $uniqueSpecies = [];

        foreach ($this->catches as $catch) {
            if ($catch->isValidated()) {
                $score += $catch->getPoints();
                $uniqueSpecies[$catch->getSpecies()->getId()] = true;
            }
        }

        // Bonus de 200 points si l'équipe a attrapé les 5 espèces
        if (count($uniqueSpecies) === 5 && !$this->hasBonus) {
            $score += 200;
            $this->hasBonus = true;
        }

        $this->totalScore = $score;
    }

    public function getHasBonus(): ?bool
    {
        return $this->hasBonus;
    }

    public function setHasBonus(bool $hasBonus): static
    {
        $this->hasBonus = $hasBonus;
        return $this;
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

    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(User $member): self
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
        }
        return $this;
    }

    public function getRegistrationNumber(): ?int
    {
        return $this->registrationNumber;
    }

    public function setRegistrationNumber(?int $number): self
    {
        $this->registrationNumber = $number;
        return $this;
    }
}
