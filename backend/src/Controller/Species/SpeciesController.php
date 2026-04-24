<?php

namespace App\Controller\Species;

use App\Entity\Species\Species;
use App\Repository\Species\SpeciesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/species')]
class SpeciesController extends AbstractController
{
    public function __construct(
        private readonly SpeciesRepository $speciesRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
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

    /**
     * Création par un utilisateur connecté (référentiel global, dédup par nom normalisé — même logique que l’admin).
     */
    #[Route('', name: 'species_create_user', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        if (!$this->getUser()) {
            return $this->json(['message' => 'Authentification requise'], 401);
        }

        try {
            $data = json_decode($request->getContent(), true);
            if (!isset($data['name']) || '' === trim((string) $data['name'])) {
                return $this->json(['message' => 'Le nom de l\'espèce est requis'], 400);
            }

            $nameTrimmed = trim((string) $data['name']);
            $existing = $this->speciesRepository->findOneByNormalizedName($nameTrimmed);
            if (null !== $existing) {
                return $this->json([
                    'message' => 'Une espèce avec ce nom existe déjà ; l\'exemplaire du référentiel est renvoyé.',
                    'reused' => true,
                    'species' => [
                        'id' => $existing->getId(),
                        'name' => $existing->getName(),
                        'coefficient' => $existing->getCoefficient(),
                        'basePoints' => $existing->getBasePoints(),
                    ],
                ]);
            }

            $species = new Species();
            $species->setName($nameTrimmed);

            $isBonus = isset($data['isBonus']) ? (bool) $data['isBonus'] : (strtolower($nameTrimmed) === 'espèce bonus');

            if ($isBonus) {
                $basePoints = isset($data['basePoints']) ? (int) $data['basePoints'] : 50;
                $species->setBasePoints($basePoints);
                $species->setCoefficient(1.0);
            } else {
                if (!isset($data['coefficient']) || (float) $data['coefficient'] <= 0) {
                    return $this->json(['message' => 'Un coefficient valide est requis pour les espèces non bonus'], 400);
                }
                $species->setCoefficient((float) $data['coefficient']);
                // Hors « espèce bonus », basePoints du référentiel n’est pas utilisé pour taille × coefficient ; 0 si non fourni.
                $species->setBasePoints(isset($data['basePoints']) ? (int) $data['basePoints'] : 0);
            }

            $this->entityManager->persist($species);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Espèce créée avec succès',
                'reused' => false,
                'species' => [
                    'id' => $species->getId(),
                    'name' => $species->getName(),
                    'coefficient' => $species->getCoefficient(),
                    'basePoints' => $species->getBasePoints(),
                ],
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la création de l\'espèce',
                'error' => $e->getMessage(),
            ], 500);
        }
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

