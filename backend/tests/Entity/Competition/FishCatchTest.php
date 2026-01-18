<?php

namespace App\Tests\Entity\Competition;

use App\Entity\Competition\FishCatch;
use App\Entity\Species\Species;
use PHPUnit\Framework\TestCase;

class FishCatchTest extends TestCase
{
    public function testCalculatePointsWithBrochet(): void
    {
        $species = new Species();
        $species->setName('Brochet');
        $species->setCoefficient(1.0);

        $catch = new FishCatch();
        $catch->setSpecies($species);
        $catch->setSize(40.0);

        $this->assertEquals(40, $catch->calculatePoints());
    }

    public function testCalculatePointsWithPerche(): void
    {
        $species = new Species();
        $species->setName('Perche');
        $species->setCoefficient(2.0);

        $catch = new FishCatch();
        $catch->setSpecies($species);
        $catch->setSize(25.0);

        // 2.0 × 25 = 50 points
        $this->assertEquals(50, $catch->calculatePoints());
    }

    public function testCalculatePointsWithSilure(): void
    {
        $species = new Species();
        $species->setName('Silure');
        $species->setCoefficient(0.8);

        $catch = new FishCatch();
        $catch->setSpecies($species);
        $catch->setSize(50.0);

        // 0.8 × 50 = 40 points
        $this->assertEquals(40, $catch->calculatePoints());
    }

    public function testCalculatePointsWithSandre(): void
    {
        $species = new Species();
        $species->setName('Sandre');
        $species->setCoefficient(1.5);

        $catch = new FishCatch();
        $catch->setSpecies($species);
        $catch->setSize(30.0);

        // 1.5 × 30 = 45 points
        $this->assertEquals(45, $catch->calculatePoints());
    }

    public function testCalculatePointsWithGobi(): void
    {
        $species = new Species();
        $species->setName('Gobi');
        $species->setCoefficient(0.0);

        $catch = new FishCatch();
        $catch->setSpecies($species);
        $catch->setSize(20.0);

        // 0.0 × 20 = 0 points (gobi ne génère pas de points via longueur)
        $this->assertEquals(0, $catch->calculatePoints());
    }

    public function testCalculatePointsReturnsZeroWhenNoSpecies(): void
    {
        $catch = new FishCatch();
        $catch->setSize(30.0);

        $this->assertEquals(0, $catch->calculatePoints());
    }

    public function testCalculatePointsReturnsZeroWhenNoSize(): void
    {
        $species = new Species();
        $species->setName('Brochet');
        $species->setCoefficient(1.0);

        $catch = new FishCatch();
        $catch->setSpecies($species);

        $this->assertEquals(0, $catch->calculatePoints());
    }
}
