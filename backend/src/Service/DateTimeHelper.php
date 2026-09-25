<?php

namespace App\Service;

/**
 * Utilitaire pour formater les dates en Europe/Paris (ISO 8601 avec timezone).
 * Les dates de compétition sont toujours en heure française pour éviter les décalages PC/mobile.
 */
final class DateTimeHelper
{
    public static function formatParis(\DateTimeInterface $date): string
    {
        $dt = (new \DateTime())->setTimestamp($date->getTimestamp());
        $dt->setTimezone(new \DateTimeZone('Europe/Paris'));
        return $dt->format('Y-m-d\TH:i:sP');
    }

    /** Sérialisation API : dates de compétition parfois null en base. */
    public static function formatParisOrNull(?\DateTimeInterface $date): ?string
    {
        if ($date === null) {
            return null;
        }

        return self::formatParis($date);
    }

    /**
     * Parse une date saisie (mobile/web) comme heure de Paris, secondes à 0, puis UTC.
     */
    public static function parseParisToUtc(string $value): \DateTime
    {
        $value = trim($value);
        $tzParis = new \DateTimeZone('Europe/Paris');
        $tzUtc = new \DateTimeZone('UTC');
        $formats = [
            \DateTimeInterface::ATOM,
            'Y-m-d\TH:i:sP',
            'Y-m-d\TH:i:s',
            'Y-m-d\TH:i',
            'Y-m-d H:i:s',
            'Y-m-d H:i',
        ];
        $dt = null;
        foreach ($formats as $fmt) {
            $parsed = \DateTime::createFromFormat($fmt, $value, $tzParis);
            if ($parsed instanceof \DateTime) {
                $dt = $parsed;
                break;
            }
        }
        if (!$dt instanceof \DateTime) {
            $dt = new \DateTime($value, $tzParis);
        }
        $dt->setTime((int) $dt->format('H'), (int) $dt->format('i'), 0);
        $dt->setTimezone($tzUtc);

        return $dt;
    }
}
