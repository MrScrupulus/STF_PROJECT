<?php

namespace App\Entity;

use App\Repository\CompetitionTeamSnapshotRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CompetitionTeamSnapshotRepository::class)]
#[ORM\Table(name: 'competition_team_snapshots')]
class CompetitionTeamSnapshot
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?\App\Entity\Competition\Competition $competition = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?\App\Entity\Competition\Team $team = null;

    #[ORM\Column(length: 255)]
    private ?string $teamName = null;

    #[ORM\Column(nullable: true)]
    private ?int $registrationNumber = null;

    #[ORM\Column]
    private ?int $totalScore = 0;

    #[ORM\Column(type: 'json')]
    private array $members = [];

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $snapshotDate = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCompetition(): ?\App\Entity\Competition\Competition
    {
        return $this->competition;
    }

    public function setCompetition(?\App\Entity\Competition\Competition $competition): static
    {
        $this->competition = $competition;
        return $this;
    }

    public function getTeam(): ?\App\Entity\Competition\Team
    {
        return $this->team;
    }

    public function setTeam(?\App\Entity\Competition\Team $team): static
    {
        $this->team = $team;
        return $this;
    }

    public function getTeamName(): ?string
    {
        return $this->teamName;
    }

    public function setTeamName(string $teamName): static
    {
        $this->teamName = $teamName;
        return $this;
    }

    public function getRegistrationNumber(): ?int
    {
        return $this->registrationNumber;
    }

    public function setRegistrationNumber(?int $registrationNumber): static
    {
        $this->registrationNumber = $registrationNumber;
        return $this;
    }

    public function getTotalScore(): ?int
    {
        return $this->totalScore;
    }

    public function setTotalScore(int $totalScore): static
    {
        $this->totalScore = $totalScore;
        return $this;
    }

    public function getMembers(): array
    {
        return $this->members;
    }

    public function setMembers(array $members): static
    {
        $this->members = $members;
        return $this;
    }

    public function getSnapshotDate(): ?\DateTimeInterface
    {
        return $this->snapshotDate;
    }

    public function setSnapshotDate(\DateTimeInterface $snapshotDate): static
    {
        $this->snapshotDate = $snapshotDate;
        return $this;
    }
}
