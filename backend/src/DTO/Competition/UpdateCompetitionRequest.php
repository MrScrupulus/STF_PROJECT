<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateCompetitionRequest
{
    #[Assert\NotBlank(message: "Le nom est obligatoire")]
    private ?string $name = null;

    #[Assert\DateTime(format: 'Y-m-d H:i:s', message: "Le format de date doit être YYYY-MM-DD HH:MM:SS")]
    private ?string $date = null;

    #[Assert\NotBlank(message: "Le lieu est obligatoire")]
    private ?string $location = null;

    private ?string $description = null;

    private ?bool $isActive = null;

    #[Assert\DateTime(format: 'Y-m-d H:i:s', message: "Le format de date doit être YYYY-MM-DD HH:MM:SS")]
    private ?string $registrationDeadline = null;

    // Getters et Setters
    // ... (à suivre)
}
