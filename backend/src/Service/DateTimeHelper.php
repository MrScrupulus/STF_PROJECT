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
}
