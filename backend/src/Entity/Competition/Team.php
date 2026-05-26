<?php

namespace App\Entity\Competition;

use App\Repository\Competition\TeamRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\Security\User;
use Doctrine\DBAL\Exception as DbalException;
use Doctrine\DBAL\Exception\TableNotFoundException;
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

    /** Équipe technique une par utilisateur pour les prises hors compétition (journal). */
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Groups(['team:read'])]
    private bool $isPersonalJournal = false;

    #[ORM\OneToMany(mappedBy: 'team', targetEntity: TeamInvitation::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $invitations;

    #[ORM\OneToMany(mappedBy: 'team', targetEntity: TeamPenalty::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $penalties;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->catches = new ArrayCollection();
        $this->invitations = new ArrayCollection();
        $this->penalties = new ArrayCollection();
        $this->totalScore = 0;
        $this->hasBonus = false;
        $this->isActive = true;
        $this->isPersonalJournal = false;
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
     * Retourne le détail du score (baseScore, newSpeciesBonus, quotaBonus, pénalités) pour l'affichage.
     * @return array{baseScore: int, newSpeciesBonus: int, quotaBonus: int, bonus: int, penaltyPoints: int}
     */
    public function getScoreBreakdownForCompetition(?Competition $competition): array
    {
        $result = ['baseScore' => 0, 'newSpeciesBonus' => 0, 'quotaBonus' => 0, 'bonus' => 0, 'penaltyPoints' => $this->getTotalPenaltyPoints()];
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
     * Prises sélectionnées pour le score de base (ordre décroissant des points puis quotas + plafond global maxFishCounted).
     *
     * @param list<FishCatch> $validatedCatches uniquement les prises validées de la compétition
     * @return list<array{catch: FishCatch, points: float|int, speciesId: int}>
     */
    private function selectSortedCatchItemsForBaseScore(array $validatedCatches, Competition $competition): array
    {
        $catchScores = [];
        foreach ($validatedCatches as $catch) {
            if (!$catch->getSpecies()) {
                continue;
            }
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
            if (null !== $quota && $current >= $quota) {
                continue;
            }
            $selected[] = $item;
            $countBySpecies[$sid] = $current + 1;
        }

        return $selected;
    }

    /**
     * Infos pour l’affichage client (liste des prises qui comptent + groupement par espèce).
     * Aligné sur {@see selectSortedCatchItemsForBaseScore} et computeScoreBreakdown.
     *
     * @return array{
     *   hasPerSpeciesQuota: bool,
     *   maxFishCounted: ?int,
     *   sumQuotaSlots: int,
     *   countedCatchIds: list<int>,
     *   bySpecies: list<array{speciesId: int, speciesName: string, quota: ?int, countedCatchIds: list<int>}>
     * }
     */
    public function getScoringPresentationForCompetition(Competition $competition): array
    {
        $validated = [];
        foreach ($this->catches as $catch) {
            if (
                $catch->getCompetition()
                && $catch->getCompetition()->getId() === $competition->getId()
                && $catch->isValidated()
                && $catch->getSpecies()
            ) {
                $validated[] = $catch;
            }
        }

        $speciesMeta = [];
        $quotaCaps = [];
        $sumQuotaSlots = 0;
        foreach ($competition->getCompetitionSpecies() as $cs) {
            $species = $cs->getSpecies();
            if (!$species) {
                continue;
            }
            $sid = $species->getId();
            $speciesMeta[$sid] = [
                'name' => $species->getName(),
                'quota' => $cs->getQuota(),
            ];
            $q = $cs->getQuota();
            if (null !== $q && $q > 0) {
                $quotaCaps[$sid] = $q;
                $sumQuotaSlots += $q;
            }
        }
        $hasPerSpeciesQuota = !empty($quotaCaps);

        if (empty($validated)) {
            return [
                'hasPerSpeciesQuota' => $hasPerSpeciesQuota,
                'maxFishCounted' => $competition->getMaxFishCounted(),
                'sumQuotaSlots' => $sumQuotaSlots,
                'countedCatchIds' => [],
                'bySpecies' => [],
            ];
        }

        $selected = $this->selectSortedCatchItemsForBaseScore($validated, $competition);
        $countedCatchIds = array_map(static fn(array $row) => $row['catch']->getId(), $selected);

        $bySpeciesOrder = [];
        $bySpeciesMap = [];
        foreach ($selected as $row) {
            $sid = $row['speciesId'];
            if (!isset($bySpeciesMap[$sid])) {
                $bySpeciesOrder[] = $sid;
                $meta = $speciesMeta[$sid] ?? ['name' => $row['catch']->getSpecies()->getName(), 'quota' => null];
                $bySpeciesMap[$sid] = [
                    'speciesId' => $sid,
                    'speciesName' => $meta['name'],
                    'quota' => $meta['quota'],
                    'countedCatchIds' => [],
                ];
            }
            $bySpeciesMap[$sid]['countedCatchIds'][] = $row['catch']->getId();
        }

        $bySpeciesList = [];
        foreach ($bySpeciesOrder as $sid) {
            $bySpeciesList[] = $bySpeciesMap[$sid];
        }

        return [
            'hasPerSpeciesQuota' => $hasPerSpeciesQuota,
            'maxFishCounted' => $competition->getMaxFishCounted(),
            'sumQuotaSlots' => $sumQuotaSlots,
            'countedCatchIds' => $countedCatchIds,
            'bySpecies' => $bySpeciesList,
        ];
    }

    /**
     * @return array{baseScore: int, newSpeciesBonus: int, quotaBonus: int}
     */
    private function computeScoreBreakdown(array $validatedCatches, Competition $competition): array
    {
        $baseScore = 0;
        $newSpeciesBonus = 0;
        $quotaBonus = 0;

        $quotaBySpeciesCheck = [];
        foreach ($competition->getCompetitionSpecies() as $cs) {
            if ($cs->getQuota() !== null && $cs->getSpecies()) {
                $quotaBySpeciesCheck[$cs->getSpecies()->getId()] = $cs->getQuota();
            }
        }
        $hasQuotas = !empty($quotaBySpeciesCheck);

        $selected = $this->selectSortedCatchItemsForBaseScore($validatedCatches, $competition);

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

        if ($competition->getQuotaBonusEnabled() && $hasQuotas) {
            $validatedCountBySpecies = [];
            foreach ($validatedCatches as $c) {
                if (!$c->getSpecies()) {
                    continue;
                }
                $sid = $c->getSpecies()->getId();
                $validatedCountBySpecies[$sid] = ($validatedCountBySpecies[$sid] ?? 0) + 1;
            }
            foreach ($competition->getCompetitionSpecies() as $cs) {
                $quota = $cs->getQuota();
                if ($quota === null || !$cs->getSpecies()) {
                    continue;
                }
                $sid = $cs->getSpecies()->getId();
                if (!isset($quotaBySpeciesCheck[$sid])) {
                    continue;
                }
                $pts = $cs->getQuotaBonusPoints();
                if ($pts === null || $pts <= 0) {
                    continue;
                }
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

            return max(0, 0 - $this->getTotalPenaltyPoints());
        }

        $penalties = $this->getTotalPenaltyPoints();
        $applyPenalty = static fn (int $raw): int => max(0, $raw - $penalties);

        if ($competition) {
            $breakdown = $this->computeScoreBreakdown($validatedCatches, $competition);
            $bonus = $breakdown['newSpeciesBonus'] + $breakdown['quotaBonus'];
            $this->hasBonus = ($bonus > 0);

            return $applyPenalty($breakdown['baseScore'] + $bonus);
        }

        // Mode legacy (sans compétition) : bonus basé sur toutes les espèces validées
        $catchScores = [];
        foreach ($validatedCatches as $catch) {
            if (!$catch->getSpecies()) {
                continue;
            }
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

        return $applyPenalty($baseScore + $bonus);
    }

    /** Somme des points retirés (pénalités). */
    public function getTotalPenaltyPoints(): int
    {
        try {
            $sum = 0;
            foreach ($this->penalties as $penalty) {
                $sum += $penalty->getPoints();
            }

            return $sum;
        } catch (TableNotFoundException) {
            // Migration non appliquée (table team_penalty) — éviter un 500 sur la fiche équipe publique.
            return 0;
        } catch (DbalException $e) {
            // Erreur SQL hors TableNotFoundException enveloppée (certains drivers / couches).
            if (str_contains($e->getMessage(), 'team_penalty')) {
                return 0;
            }

            throw $e;
        }
    }

    /**
     * @return Collection<int, TeamPenalty>
     */
    public function getPenalties(): Collection
    {
        return $this->penalties;
    }

    public function addPenalty(TeamPenalty $penalty): static
    {
        if (!$this->penalties->contains($penalty)) {
            $this->penalties->add($penalty);
            $penalty->setTeam($this);
        }

        return $this;
    }

    public function removePenalty(TeamPenalty $penalty): static
    {
        if ($this->penalties->removeElement($penalty)) {
            if ($penalty->getTeam() === $this) {
                $penalty->setTeam(null);
            }
        }

        return $this;
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

    public function isPersonalJournal(): bool
    {
        return $this->isPersonalJournal;
    }

    public function setPersonalJournal(bool $isPersonalJournal): self
    {
        $this->isPersonalJournal = $isPersonalJournal;

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
