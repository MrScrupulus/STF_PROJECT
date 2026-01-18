<?php

namespace App\Tests\Entity\Competition;

use App\Entity\Competition\Team;
use App\Entity\Competition\FishCatch;
use App\Entity\Species\Species;
use PHPUnit\Framework\TestCase;

class TeamScoreCalculationTest extends TestCase
{
    private static $speciesIdCounter = 1;

    private function createSpecies(string $name, float $coefficient): Species
    {
        $species = new Species();
        // Utiliser la réflexion pour définir l'ID (car c'est une entité Doctrine)
        $reflection = new \ReflectionClass($species);
        $idProperty = $reflection->getProperty('id');
        $idProperty->setAccessible(true);
        $idProperty->setValue($species, self::$speciesIdCounter++);
        
        $species->setName($name);
        $species->setCoefficient($coefficient);
        return $species;
    }

    private function createCatch(Team $team, Species $species, float $size, bool $validated = true): FishCatch
    {
        $catch = new FishCatch();
        $catch->setTeam($team);
        $catch->setSpecies($species);
        $catch->setSize($size);
        $catch->setIsValidated($validated);
        return $catch;
    }

    public function testScoreWithOneSpeciesNoBonus(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $brochet = $this->createSpecies('Brochet', 1.0);
        $catch1 = $this->createCatch($team, $brochet, 30.0);
        $catch2 = $this->createCatch($team, $brochet, 40.0);

        $team->addCatch($catch1);
        $team->addCatch($catch2);

        // Top 5 : 40 + 30 = 70 pts (les 2 meilleures prises)
        // 1 espèce : 0 bonus
        // Total attendu : 70 + 0 = 70
        $this->assertEquals(70, $team->getTotalScore());
        $this->assertFalse($team->getHasBonus());
    }

    public function testScoreWithTwoSpeciesBonus50(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $brochet = $this->createSpecies('Brochet', 1.0);
        $perche = $this->createSpecies('Perche', 2.0);

        $catch1 = $this->createCatch($team, $brochet, 30.0); // 30 pts
        $catch2 = $this->createCatch($team, $perche, 25.0);  // 50 pts

        $team->addCatch($catch1);
        $team->addCatch($catch2);

        // Top 5 : 50 + 30 = 80 pts
        // 2 espèces : 50 bonus
        // Total attendu : 80 + 50 = 130
        $this->assertEquals(130, $team->getTotalScore());
        $this->assertTrue($team->getHasBonus());
    }

    public function testScoreWithThreeSpeciesBonus100(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $brochet = $this->createSpecies('Brochet', 1.0);
        $perche = $this->createSpecies('Perche', 2.0);
        $silure = $this->createSpecies('Silure', 0.8);

        $catch1 = $this->createCatch($team, $brochet, 40.0);  // 40 pts
        $catch2 = $this->createCatch($team, $perche, 30.0);  // 60 pts
        $catch3 = $this->createCatch($team, $silure, 50.0);  // 40 pts

        $team->addCatch($catch1);
        $team->addCatch($catch2);
        $team->addCatch($catch3);

        // Top 5 : 60 + 40 + 40 = 140 pts
        // 3 espèces : 100 bonus
        // Total attendu : 140 + 100 = 240
        $this->assertEquals(240, $team->getTotalScore());
        $this->assertTrue($team->getHasBonus());
    }

    public function testScoreWithFiveSpeciesBonus200(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $brochet = $this->createSpecies('Brochet', 1.0);
        $perche = $this->createSpecies('Perche', 2.0);
        $silure = $this->createSpecies('Silure', 0.8);
        $sandre = $this->createSpecies('Sandre', 1.5);
        $gobi = $this->createSpecies('Gobi', 0.0);

        $catch1 = $this->createCatch($team, $brochet, 30.0);  // 30 pts
        $catch2 = $this->createCatch($team, $perche, 25.0);   // 50 pts
        $catch3 = $this->createCatch($team, $silure, 40.0);  // 32 pts
        $catch4 = $this->createCatch($team, $sandre, 20.0);   // 30 pts
        $catch5 = $this->createCatch($team, $gobi, 15.0);     // 0 pts

        $team->addCatch($catch1);
        $team->addCatch($catch2);
        $team->addCatch($catch3);
        $team->addCatch($catch4);
        $team->addCatch($catch5);

        // Top 5 : 50 + 32 + 30 + 30 + 0 = 142 pts
        // 5 espèces : 200 bonus
        // Total attendu : 142 + 200 = 342
        $this->assertEquals(342, $team->getTotalScore());
        $this->assertTrue($team->getHasBonus());
    }

    public function testScoreTop5Selection(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $perche = $this->createSpecies('Perche', 2.0);

        // 10 perches de tailles différentes
        $catches = [];
        for ($i = 1; $i <= 10; $i++) {
            $catches[] = $this->createCatch($team, $perche, $i * 5.0); // 10, 20, 30, ..., 100 pts
        }

        foreach ($catches as $catch) {
            $team->addCatch($catch);
        }

        // Top 5 : 100 + 90 + 80 + 70 + 60 = 400 pts
        // 1 espèce : 0 bonus
        // Total attendu : 400 + 0 = 400
        $this->assertEquals(400, $team->getTotalScore());
    }

    public function testScoreWithGobiAloneNoBonus(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $gobi = $this->createSpecies('Gobi', 0.0);

        $catch1 = $this->createCatch($team, $gobi, 20.0);
        $catch2 = $this->createCatch($team, $gobi, 25.0);

        $team->addCatch($catch1);
        $team->addCatch($catch2);

        // Top 5 : 0 + 0 = 0 pts (gobi ne génère pas de points)
        // 1 espèce (gobi seul) : 0 bonus (cas spécial)
        // Total attendu : 0 + 0 = 0
        $this->assertEquals(0, $team->getTotalScore());
        $this->assertFalse($team->getHasBonus());
    }

    public function testScoreWithGobiAndOtherSpecies(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $gobi = $this->createSpecies('Gobi', 0.0);
        $brochet = $this->createSpecies('Brochet', 1.0);

        $catch1 = $this->createCatch($team, $gobi, 20.0);     // 0 pts
        $catch2 = $this->createCatch($team, $brochet, 30.0); // 30 pts

        $team->addCatch($catch1);
        $team->addCatch($catch2);

        // Top 5 : 30 + 0 = 30 pts
        // 2 espèces (gobi + brochet) : 50 bonus
        // Total attendu : 30 + 50 = 80
        $this->assertEquals(80, $team->getTotalScore());
        $this->assertTrue($team->getHasBonus());
    }

    public function testScoreWithUnvalidatedCatches(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $brochet = $this->createSpecies('Brochet', 1.0);
        $perche = $this->createSpecies('Perche', 2.0);

        $catch1 = $this->createCatch($team, $brochet, 30.0, true);  // validé : 30 pts
        $catch2 = $this->createCatch($team, $perche, 25.0, true);   // validé : 50 pts
        $catch3 = $this->createCatch($team, $perche, 40.0, false);  // non validé : ignoré

        $team->addCatch($catch1);
        $team->addCatch($catch2);
        $team->addCatch($catch3);

        // Top 5 : 50 + 30 = 80 pts (seulement les validés)
        // 2 espèces : 50 bonus
        // Total attendu : 80 + 50 = 130
        $this->assertEquals(130, $team->getTotalScore());
    }

    public function testScoreExampleFromRequirements(): void
    {
        $team = new Team();
        $team->setName('Test Team');

        $perche = $this->createSpecies('Perche', 2.0);
        $brochet = $this->createSpecies('Brochet', 1.0);
        $silure = $this->createSpecies('Silure', 0.8);
        $sandre = $this->createSpecies('Sandre', 1.5);
        $gobi = $this->createSpecies('Gobi', 0.0);

        // 10 poissons pêchés avec 5 espèces différentes
        // 5 perches de 50 cm = 100 pts chacune
        for ($i = 0; $i < 5; $i++) {
            $team->addCatch($this->createCatch($team, $perche, 50.0));
        }

        // Autres espèces pour avoir 5 espèces différentes
        $team->addCatch($this->createCatch($team, $brochet, 30.0));
        $team->addCatch($this->createCatch($team, $silure, 25.0));
        $team->addCatch($this->createCatch($team, $sandre, 20.0));
        $team->addCatch($this->createCatch($team, $gobi, 15.0));

        // Top 5 : 5 perches de 50 cm = 5 × 100 = 500 pts
        // 5 espèces : 200 bonus
        // Total attendu : 500 + 200 = 700
        $this->assertEquals(700, $team->getTotalScore());
        $this->assertTrue($team->getHasBonus());
    }
}
