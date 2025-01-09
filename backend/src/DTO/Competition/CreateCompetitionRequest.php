<?php

namespace App\DTO\Competition;

use Symfony\Component\Validator\Constraints as Assert;

class CreateCompetitionRequest
{
    #[Assert\NotBlank(message: "Le nom est obligatoire")]
    #[Assert\Length(min: 3, max: 255, minMessage: "Le nom doit faire au moins {{ limit }} caractères", maxMessage: "Le nom ne peut pas dépasser {{ limit }} caractères")]
    private string $name;

    #[Assert\NotBlank(message: "La date est obligatoire")]
    #[Assert\DateTime(format: 'Y-m-d H:i:s', message: "Le format de date doit être YYYY-MM-DD HH:MM:SS")]
    private string $date;

    #[Assert\NotBlank(message: "Le lieu est obligatoire")]
    #[Assert\Length(min: 2, max: 255, minMessage: "Le lieu doit faire au moins {{ limit }} caractères", maxMessage: "Le lieu ne peut pas dépasser {{ limit }} caractères")]
    private string $location;

    private ?string $description = null;

    #[Assert\NotBlank(message: "La date limite d'inscription est obligatoire")]
    #[Assert\DateTime(format: 'Y-m-d H:i:s', message: "Le format de date doit être YYYY-MM-DD HH:MM:SS")]
    private string $registrationDeadline;

    // Getters et Setters
    public function getName(): string
    {
        return $this->name;
    }

    public function getDate(): string
    {
        return $this->date;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getRegistrationDeadline(): string
    {
        return $this->registrationDeadline;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function setDate(string $date): self
    {
        $this->date = $date;
        return $this;
    }

    public function setLocation(string $location): self
    {
        $this->location = $location;
        return $this;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function setRegistrationDeadline(string $registrationDeadline): self
    {
        $this->registrationDeadline = $registrationDeadline;
        return $this;
    }
}
