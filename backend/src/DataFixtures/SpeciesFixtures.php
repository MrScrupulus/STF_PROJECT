<?php

namespace App\DataFixtures;

use App\Entity\Species\Species;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class SpeciesFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $speciesData = [
            ['name' => 'Brochet', 'coefficient' => 1.0],
            ['name' => 'Sandre', 'coefficient' => 1.5],
            ['name' => 'Silure', 'coefficient' => 0.8],
            ['name' => 'Perche', 'coefficient' => 2.0],
            ['name' => 'Espèce bonus', 'coefficient' => 1.0], // 50 points bonus
        ];

        foreach ($speciesData as $data) {
            $species = new Species();
            $species->setName($data['name']);
            $species->setCoefficient($data['coefficient']);
            $species->setBasePoints(50);

            $manager->persist($species);
        }

        $manager->flush();
    }
}
