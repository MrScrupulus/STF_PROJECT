<?php

namespace App\Service;

/**
 * Génère des images de graphiques (camembert, scatter) pour l'intégration dans les PDF.
 * Utilise GD pour un rendu fiable dans Dompdf.
 */
class PdfChartImageService
{
    private const SPECIES_COLORS = [
        [0, 136, 254],   // #0088FE
        [0, 196, 159],   // #00C49F
        [255, 187, 40],  // #FFBB28
        [255, 128, 66],  // #FF8042
        [136, 132, 216], // #8884d8
        [130, 202, 157], // #82ca9d
        [255, 198, 88],  // #ffc658
        [255, 115, 0],   // #ff7300
        [167, 139, 250], // #a78bfa
        [52, 211, 153], // #34d399
    ];

    /**
     * Génère un camembert au format PNG (base64).
     *
     * @param array $data [['name' => string, 'count' => int], ...]
     * @param int   $size Taille du côté (pixels)
     */
    public function generatePieChartBase64(array $data, int $size = 220): string
    {
        $total = array_sum(array_column($data, 'count'));
        if ($total <= 0) {
            return '';
        }

        $img = imagecreatetruecolor($size, $size);
        if (!$img) {
            return '';
        }

        $white = imagecolorallocate($img, 255, 255, 255);
        $bg = imagecolorallocate($img, 250, 250, 250);
        imagefill($img, 0, 0, $bg);

        $cx = (int) ($size / 2);
        $cy = (int) ($size / 2);
        $r = (int) (min($cx, $cy) * 0.85);

        $startAngle = 270; // 12h (haut), sens horaire
        $cumul = 0;

        foreach ($data as $i => $item) {
            $pct = $item['count'] / $total;
            $angle = 360 * $pct;
            $endAngle = $startAngle + $angle;

            $rgb = self::SPECIES_COLORS[$i % count(self::SPECIES_COLORS)];
            $color = imagecolorallocate($img, $rgb[0], $rgb[1], $rgb[2]);

            imagefilledarc($img, $cx, $cy, $r * 2, $r * 2, $startAngle, $endAngle, $color, IMG_ARC_PIE);

            $startAngle = $endAngle;
        }

        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        return base64_encode($png ?: '');
    }

    /**
     * Génère un graphique scatter (chronologie) au format PNG (base64).
     * Même logique que la version PC : axe X de l'heure de début à l'heure de fin de la compétition.
     *
     * @param array         $points [['x' => float, 'y' => int, 'color' => string hex], ...]
     * @param float         $totalHours
     * @param int           $uniqueSpeciesCount
     * @param \DateTime|null $startDate Heure de début compétition (pour les labels "8h", "9h"...)
     * @param int           $width
     * @param int           $height
     */
    public function generateScatterChartBase64(
        array $points,
        float $totalHours,
        int $uniqueSpeciesCount,
        ?\DateTimeInterface $startDate = null,
        int $width = 600,
        int $height = 200
    ): string {
        if (empty($points) || $totalHours <= 0 || $uniqueSpeciesCount <= 0) {
            return '';
        }

        $img = imagecreatetruecolor($width, $height);
        if (!$img) {
            return '';
        }

        $white = imagecolorallocate($img, 255, 255, 255);
        $gray = imagecolorallocate($img, 220, 220, 220);
        $bg = imagecolorallocate($img, 250, 250, 250);
        imagefill($img, 0, 0, $bg);

        $padL = 40;
        $padR = 20;
        $padT = 25;
        $padB = 35;
        $chartW = $width - $padL - $padR;
        $chartH = $height - $padT - $padB;

        $black = imagecolorallocate($img, 50, 50, 50);
        $font = 2;

        $startHour = 0.0;
        if ($startDate) {
            $startHour = (int) $startDate->format('G') + (int) $startDate->format('i') / 60;
        }

        $tickStep = $totalHours > 18 ? 2.0 : 1.0;
        $nbTicks = (int) ceil($totalHours / $tickStep) + 1;

        for ($i = 0; $i < $nbTicks; $i++) {
            $hoursFromStart = $i * $tickStep;
            if ($hoursFromStart > $totalHours) break;
            $x = $padL + (int) (($hoursFromStart / $totalHours) * $chartW);
            if ($x > $padL + $chartW) continue;

            imageline($img, $x, $padT, $x, $height - $padB, $gray);

            if ($totalHours <= 24 && $startDate) {
                $displayHour = (int) (($startHour + $hoursFromStart) % 24);
                $label = "{$displayHour}h";
            } else {
                $label = 'H+' . (int) $hoursFromStart;
            }
            $tx = $x - (int) (strlen($label) * imagefontwidth($font) / 2);
            imagestring($img, $font, max($padL, min($tx, $width - $padR - 20)), $height - $padB + 8, $label, $black);
        }
        imageline($img, $padL + $chartW, $padT, $padL + $chartW, $height - $padB, $gray);
        imageline($img, $padL, $height - $padB, $width - $padR, $height - $padB, $gray);
        imageline($img, $padL, $padT, $padL, $height - $padB, $gray);

        $pointRadius = 5;

        $maxY = max(0.5, $uniqueSpeciesCount - 0.5);
        foreach ($points as $pt) {
            $px = $padL + (int) (($pt['x'] / $totalHours) * $chartW);
            $py = $padT + (int) ($chartH - ($pt['y'] / $maxY) * $chartH);

            $hex = ltrim($pt['color'] ?? '#0088FE', '#');
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));
            $color = imagecolorallocate($img, $r, $g, $b);

            imagefilledellipse($img, $px, $py, $pointRadius * 2, $pointRadius * 2, $color);
            imageellipse($img, $px, $py, $pointRadius * 2, $pointRadius * 2, $white);
        }

        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        return base64_encode($png ?: '');
    }
}
