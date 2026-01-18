<?php

namespace App\Controller\Species;

use App\Entity\Species\Species;
use App\Repository\Species\SpeciesRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/species')]
class SpeciesController extends AbstractController
{
    private $speciesRepository;

    public function __construct(SpeciesRepository $speciesRepository)
    {
        $this->speciesRepository = $speciesRepository;
    }

    #[Route('', name: 'species_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $species = $this->speciesRepository->findAll();

        return $this->json([
            'success' => true,
            'data' => array_map(function (Species $species) {
                return [
                    'id' => $species->getId(),
                    'name' => $species->getName(),
                    'coefficient' => $species->getCoefficient(),
                    'basePoints' => $species->getBasePoints(),
                ];
            }, $species)
        ]);
    }

    #[Route('/{id}', name: 'species_show', methods: ['GET'])]
    public function show(Species $species): JsonResponse
    {
        return $this->json([
            'success' => true,
            'data' => [
                'id' => $species->getId(),
                'name' => $species->getName(),
                'coefficient' => $species->getCoefficient(),
                'basePoints' => $species->getBasePoints(),
            ]
        ]);
    }
}
