<?php

namespace App\DTO\Competition;

use Symfony\Component\Validator\Constraints as Assert;

class CreateTeamRequest
{
    #[Assert\NotBlank(message: "Le nom de l'équipe est obligatoire")]
    #[Assert\Length(min: 3, max: 255, minMessage: "Le nom doit faire au moins {{ limit }} caractères", maxMessage: "Le nom ne peut pas dépasser {{ limit }} caractères")]
    private string $name;

    #[Assert\NotBlank(message: "L'ID du deuxième participant est obligatoire")]
    private int $participant2Id;

    // Getters et Setters
    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getParticipant2Id(): int
    {
        return $this->participant2Id;
    }

    public function setParticipant2Id(int $participant2Id): self
    {
        $this->participant2Id = $participant2Id;
        return $this;
    }
}
