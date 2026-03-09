<?php

namespace App\DTO\Security;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfileRequest
{
    private ?string $email = null;
    private ?string $firstname = null;
    private ?string $lastname = null;
    private ?string $phone_number = null;

    // Getters et Setters
    public function getEmail(): ?string
    {
        return $this->email;
    }
    // ... (reste des getters/setters)
}
