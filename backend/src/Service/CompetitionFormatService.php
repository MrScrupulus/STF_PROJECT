<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Competition\Competition;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class CompetitionFormatService
{
    public function applyAccessAndCapacity(Competition $competition, array $data, bool $isCreate): void
    {
        if ($isCreate || array_key_exists('isPaid', $data)) {
            $competition->setIsPaid(!empty($data['isPaid']));
        }
        if ($isCreate || array_key_exists('isPrivate', $data)) {
            $competition->setIsPrivate(!empty($data['isPrivate']));
        }

        if (!$competition->isPrivate()) {
            $competition->setAccessCode(null);
        }

        if (!$competition->isPaid()) {
            $competition->setHasNoLimit(false);
            $requested = $this->readPositiveInt($data['maxParticipants'] ?? null);
            $competition->setMaxParticipants($requested ?? Competition::FREE_PARTICIPANT_CAP);
            if ($competition->getMaxParticipants() > Competition::FREE_PARTICIPANT_CAP) {
                throw new BadRequestHttpException(
                    'Une manche gratuite (ou gratuite/privée) est limitée à 16 participants (pêcheurs, pas équipes).'
                );
            }
            $this->assertCapacityNotBelowEnrolled($competition);

            return;
        }

        $noLimit = array_key_exists('hasNoLimit', $data)
            ? (bool) $data['hasNoLimit']
            : ($isCreate ? true : $competition->getHasNoLimit());
        $competition->setHasNoLimit($noLimit);
        if ($noLimit) {
            $competition->setMaxParticipants(null);

            return;
        }

        $requested = $this->readPositiveInt($data['maxParticipants'] ?? null);
        if ($requested === null) {
            throw new BadRequestHttpException(
                'Indiquez un plafond de participants, ou laissez sans limite.'
            );
        }
        $competition->setMaxParticipants($requested);
        $this->assertCapacityNotBelowEnrolled($competition);
    }

    public function generateAccessCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = '';
        for ($i = 0; $i < 6; ++$i) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return $code;
    }

    public function accessCodeMatches(Competition $competition, ?string $provided): bool
    {
        $expected = $competition->getAccessCode();
        if ($expected === null || $expected === '' || $provided === null || trim($provided) === '') {
            return false;
        }

        return hash_equals(strtoupper($expected), strtoupper(trim($provided)));
    }

    private function readPositiveInt(mixed $value): ?int
    {
        if ($value === null || $value === '' || $value === false) {
            return null;
        }
        $n = (int) $value;

        return $n >= 1 ? $n : null;
    }

    private function assertCapacityNotBelowEnrolled(Competition $competition): void
    {
        $max = $competition->getEffectiveMaxParticipants();
        if ($max === null) {
            return;
        }
        $enrolled = $competition->getId() ? $competition->countEnrolledParticipants() : 0;
        if ($enrolled > $max) {
            throw new BadRequestHttpException(
                sprintf('Impossible : %d pêcheurs sont déjà inscrits, le plafond ne peut pas descendre en dessous.', $enrolled)
            );
        }
    }
}
