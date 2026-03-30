<?php

namespace App\Entity\Competition;

use App\Repository\Competition\TeamRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\Security\User;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Entity\Competition\TeamInvitation;

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

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    #[Groups(['team:read'])]
    private bool $isActive = true;

    #[ORM\OneToMany(mappedBy: 'team', targetEntity: TeamInvitation::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $invitations;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->catches = new ArrayCollection();
        $this->invitations = new ArrayCollection();
        $this->totalScore = 0;
        $this->hasBonus = false;
        $this->isActive = true;
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
        // Calculer le score pour la compétition actuelle de l'équipe
        if ($this->competition) {
            $this->updateTotalScoreForCompetition($this->competition);
        } else {
            // Si l'équipe n'a pas de compétition, calculer avec toutes les prises
            $this->updateTotalScoreWithCatches($this->catches->toArray());
        }
    }

    /**
     * Calcule le score de l'équipe pour une compétition spécifique
     */
    public function getScoreForCompetition(?Competition $competition): int
    {
        if (!$competition) {
            return $this->totalScore ?? 0;
        }

        // Filtrer les prises par compétition
        $competitionCatches = [];
        foreach ($this->catches as $catch) {
            if ($catch->getCompetition() && $catch->getCompetition()->getId() === $competition->getId()) {
                $competitionCatches[] = $catch;
            }
        }

        return $this->calculateScoreFromCatches($competitionCatches, $competition);
    }

    /**
     * Met à jour le score total pour une compétition spécifique
     */
    private function updateTotalScoreForCompetition(Competition $competition): void
    {
        // Filtrer les prises par compétition
        $competitionCatches = [];
        foreach ($this->catches as $catch) {
            if ($catch->getCompetition() && $catch->getCompetition()->getId() === $competition->getId()) {
                $competitionCatches[] = $catch;
            }
        }

        $score = $this->calculateScoreFromCatches($competitionCatches, $competition);
        $this->totalScore = $score;
    }

    /**
     * Met à jour le score total avec une liste de prises donnée
     */
    private function updateTotalScoreWithCatches(array $catches): void
    {
        $score = $this->calculateScoreFromCatches($catches, null);
        $this->totalScore = $score;
    }

    /**
     * Retourne le détail du score (baseScore, newSpeciesBonus, quotaBonus) pour l'affichage.
     * @return array{baseScore: int, newSpeciesBonus: int, quotaBonus: int, bonus: int}
     */
    public function getScoreBreakdownForCompetition(?Competition $competition): array
    {
        $result = ['baseScore' => 0, 'newSpeciesBonus' => 0, 'quotaBonus' => 0, 'bonus' => 0];
        if (!$competition) {
            return $result;
        }
        $competitionCatches = [];
        foreach ($this->catches as $catch) {
            if ($catch->getCompetition() && $catch->getCompetition()->getId() === $competition->getId() && $catch->isValidated()) {
                $competitionCatches[] = $catch;
            }
        }
        if (empty($competitionCatches)) {
            return $result;
        }
        $breakdown = $this->computeScoreBreakdown($competitionCatches, $competition);
        $result['baseScore'] = $breakdown['baseScore'];
        $result['newSpeciesBonus'] = $breakdown['newSpeciesBonus'];
        $result['quotaBonus'] = $breakdown['quotaBonus'];
        $result['bonus'] = $breakdown['newSpeciesBonus'] + $breakdown['quotaBonus'];
        return $result;
    }

    /**
     * @return array{baseScore: int, newSpeciesBonus: int, quotaBonus: int}
     */
    private function computeScoreBreakdown(array $validatedCatches, Competition $competition): array
    {
        $baseScore = 0;
        $newSpeciesBonus = 0;
        $quotaBonus = 0;

        $catchScores = [];
        foreach ($validatedCatches as $catch) {
            $catchScores[] = [
                'catch' => $catch,
                'points' => $catch->calculatePoints(),
                'speciesId' => $catch->getSpecies()->getId(),
            ];
        }
        usort($catchScores, fn($a, $b) => $b['points'] <=> $a['points']);

        $quotaBySpecies = [];
        foreach ($competition->getCompetitionSpecies() as $cs) {
            if ($cs->getQuota() !== null && $cs->getSpecies()) {
                $quotaBySpecies[$cs->getSpecies()->getId()] = $cs->getQuota();
            }
        }
        $hasQuotas = !empty($quotaBySpecies);
        $limit = $competition->getMaxFishCounted() ?? count($catchScores);
        if ($limit <= 0) {
            $limit = count($catchScores);
        }

        $selected = [];
        $countBySpecies = [];
        foreach ($catchScores as $item) {
            if (count($selected) >= $limit) {
                break;
            }
            $sid = $item['speciesId'];
            $current = $countBySpecies[$sid] ?? 0;
            $quota = $quotaBySpecies[$sid] ?? null;
            if ($quota !== null && $current >= $quota) {
                continue;
            }
            $selected[] = $item;
            $countBySpecies[$sid] = $current + 1;
        }

        foreach ($selected as $item) {
            $baseScore += $item['points'];
        }

        if ($competition->getNewSpeciesBonusEnabled() && ($pts = $competition->getNewSpeciesBonusPoints()) !== null && $pts > 0) {
            $uniqueInSelected = array_unique(array_column($selected, 'speciesId'));
            $nSpecies = count($uniqueInSelected);
            $hasGobiOnly = $nSpecies === 1 && count($selected) > 0
                && $selected[0]['catch']->getSpecies()->getCoefficient() == 0;
            if (!$hasGobiOnly && $nSpecies >= 2) {
                $newSpeciesBonus = $pts * ($nSpecies - 1);
            }
        }

        if ($competition->getQuotaBonusEnabled() && ($pts = $competition->getQuotaBonusPoints()) !== null && $pts > 0 && $hasQuotas) {
            $validatedCountBySpecies = [];
            foreach ($validatedCatches as $c) {
                $sid = $c->getSpecies()->getId();
                $validatedCountBySpecies[$sid] = ($validatedCountBySpecies[$sid] ?? 0) + 1;
            }
            foreach ($quotaBySpecies as $sid => $quota) {
                if (($validatedCountBySpecies[$sid] ?? 0) >= $quota) {
                    $quotaBonus += $pts;
                }
            }
        }

        return ['baseScore' => $baseScore, 'newSpeciesBonus' => $newSpeciesBonus, 'quotaBonus' => $quotaBonus];
    }

    /**
     * Calcule le score à partir d'une liste de prises
     * @param ?Competition $competition null = mode legacy (maxFishCounted=5, ancienne formule bonus)
     */
    private function calculateScoreFromCatches(array $catches, ?Competition $competition = null): int
    {
        $validatedCatches = [];
        foreach ($catches as $catch) {
            if ($catch->isValidated()) {
                $validatedCatches[] = $catch;
            }
        }

        if (empty($validatedCatches)) {
            $this->hasBonus = false;
            return 0;
        }

        if ($competition) {
            $breakdown = $this->computeScoreBreakdown($validatedCatches, $competition);
            $bonus = $breakdown['newSpeciesBonus'] + $breakdown['quotaBonus'];
            $this->hasBonus = ($bonus > 0);
            return $breakdown['baseScore'] + $bonus;
        }

        // Mode legacy (sans compétition) : bonus basé sur toutes les espèces validées
        $catchScores = [];
        foreach ($validatedCatches as $catch) {
            $catchScores[] = [
                'catch' => $catch,
                'points' => $catch->calculatePoints(),
                'speciesId' => $catch->getSpecies()->getId(),
            ];
        }
        usort($catchScores, fn($a, $b) => $b['points'] <=> $a['points']);
        $limit = 5;
        $selected = array_slice($catchScores, 0, $limit);
        $baseScore = array_sum(array_column($selected, 'points'));
        $bonus = 0;
        $uniqueSpeciesAll = array_unique(array_column($catchScores, 'speciesId'));
        $singleSpeciesCoeff = count($catchScores) > 0 ? $catchScores[0]['catch']->getSpecies()->getCoefficient() : null;
        $hasGobiOnly = count($uniqueSpeciesAll) === 1 && $singleSpeciesCoeff == 0;
        if (!$hasGobiOnly && count($uniqueSpeciesAll) >= 2) {
            $bonus = (count($uniqueSpeciesAll) - 1) * 50;
            if ($bonus > 200) {
                $bonus = 200;
            }
        }
        $this->hasBonus = ($bonus > 0);
        return $baseScore + $bonus;
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

    public function getIsActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    /**
     * @return Collection<int, TeamInvitation>
     */
    public function getInvitations(): Collection
    {
        return $this->invitations;
    }

    public function addInvitation(TeamInvitation $invitation): static
    {
        if (!$this->invitations->contains($invitation)) {
            $this->invitations->add($invitation);
            $invitation->setTeam($this);
        }
        return $this;
    }

    public function removeInvitation(TeamInvitation $invitation): static
    {
        if ($this->invitations->removeElement($invitation)) {
            if ($invitation->getTeam() === $this) {
                $invitation->setTeam(null);
            }
        }
        return $this;
    }
}
