<?php

namespace App\Entity\Competition;

use App\Entity\Security\User;
use App\Repository\Competition\CompetitionStaffRepository;
use App\Security\AppRoles;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CompetitionStaffRepository::class)]
#[ORM\Table(name: 'competition_staff')]
#[ORM\UniqueConstraint(name: 'competition_staff_unique', columns: ['competition_id', 'user_id'])]
class CompetitionStaff
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'staff')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Competition $competition = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    /** manager = co-gestionnaire, judge = commissaire sur cette compétition */
    #[ORM\Column(length: 20)]
    private string $role = AppRoles::STAFF_JUDGE;

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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function isManager(): bool
    {
        return $this->role === AppRoles::STAFF_MANAGER;
    }

    public function isJudge(): bool
    {
        return $this->role === AppRoles::STAFF_JUDGE;
    }
}
