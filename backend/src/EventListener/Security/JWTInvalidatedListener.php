<?php

namespace App\EventListener\Security;

use App\Repository\Security\InvalidatedTokenRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTInvalidEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;

class JWTInvalidatedListener
{
    public function __construct(
        private InvalidatedTokenRepository $invalidatedTokenRepository
    ) {}

    public function onJWTDecoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();
        if (!isset($payload['jti'])) {
            return;
        }

        if ($this->invalidatedTokenRepository->isTokenInvalidated($payload['jti'])) {
            $event->markAsInvalid('Token invalidé');
        }
    }

    public function onJWTInvalid(JWTInvalidEvent $event): void
    {
        return;
    }
}
