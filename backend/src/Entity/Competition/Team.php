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
    #[Groups(['team:read'])]
    private Collection $catches;

    #[ORM\Column]
    #[Groups(['team:read'])]
    private ?int $totalScore = 0;

    #[ORM\Column]
    #[Groups(['team:read'])]
    private ?bool $hasBonus = false;

    #[ORM\ManyToOne(inversedBy: 'teams')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Competition $competition = null;

    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'competition_team_members')]
    #[Groups(['team:read'])]
    private Collection $members;

    #[ORM\Column(nullable: true)]
    #[Groups(['team:read'])]
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
        // Récupérer toutes les prises validées
        $validatedCatches = [];
        $uniqueSpecies = [];
        $hasGobi = false;

        foreach ($this->catches as $catch) {
            if ($catch->isValidated()) {
                $validatedCatches[] = $catch;
                
                $speciesId = $catch->getSpecies()->getId();
                $uniqueSpecies[$speciesId] = true;
                
                // Vérifier si c'est un gobi (coefficient 0)
                if ($catch->getSpecies()->getCoefficient() == 0) {
                    $hasGobi = true;
                }
            }
        }

        // Si aucune prise validée, score = 0
        if (empty($validatedCatches)) {
            $this->totalScore = 0;
            $this->hasBonus = false;
            return;
        }

        // Calculer le score de chaque prise
        $catchScores = [];
        foreach ($validatedCatches as $catch) {
            $catchScores[] = [
                'catch' => $catch,
                'points' => $catch->calculatePoints()
            ];
        }

        // Trier par points décroissants
        usort($catchScores, function($a, $b) {
            return $b['points'] <=> $a['points'];
        });

        // Prendre les 5 meilleures prises
        $top5 = array_slice($catchScores, 0, 5);
        
        // Score de base = somme des 5 meilleures prises
        $baseScore = 0;
        foreach ($top5 as $item) {
            $baseScore += $item['points'];
        }

        // Calculer le bonus selon le nombre d'espèces différentes
        $uniqueSpeciesCount = count($uniqueSpecies);
        
        // Cas spécial : si gobi est la seule espèce, pas de bonus
        if ($uniqueSpeciesCount === 1 && $hasGobi) {
            $bonus = 0;
        } else {
            // Bonus : 0 pour 1 espèce, 50 pour 2, 100 pour 3, 150 pour 4, 200 pour 5
            $bonus = 0;
            if ($uniqueSpeciesCount >= 2) {
                $bonus = ($uniqueSpeciesCount - 1) * 50;
                // Maximum 200 points de bonus
                if ($bonus > 200) {
                    $bonus = 200;
                }
            }
        }

        // Score total = score de base + bonus
        $this->totalScore = $baseScore + $bonus;
        $this->hasBonus = ($bonus > 0);
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

    public function removeMember(User $member): self
    {
        $this->members->removeElement($member);
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
