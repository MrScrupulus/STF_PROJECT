<?php

namespace App\Entity\Security;

use App\Repository\Security\InvalidatedTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InvalidatedTokenRepository::class)]
#[ORM\Table(name: 'invalidated_tokens')]
class InvalidatedToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private ?string $jti = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $invalidatedAt = null;

    public function __construct(string $tokenId)
    {
        $this->jti = $tokenId;
        $this->invalidatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    // Getters
    public function getJti(): ?string
    {
        return $this->jti;
    }

    public function getInvalidatedAt(): ?\DateTimeImmutable
    {
        return $this->invalidatedAt;
    }
}
