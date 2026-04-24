<?php

namespace App\Controller\Admin\Species;

use App\Entity\Species\Species;
use App\Repository\Species\SpeciesRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/species')]
class AdminSpeciesController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SpeciesRepository $speciesRepository,
    ) {
    }

    #[Route('', name: 'admin_species_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['name']) || '' === trim((string) $data['name'])) {
                return $this->json([
                    'message' => 'Le nom de l\'espèce est requis'
                ], 400);
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

            // Déterminer si c'est une espèce bonus (par le nom ou par un champ isBonus)
            $isBonus = isset($data['isBonus']) ? $data['isBonus'] : (strtolower($data['name']) === 'espèce bonus');

            if ($isBonus) {
                // Espèce bonus : utiliser basePoints
                $basePoints = isset($data['basePoints']) ? (int) $data['basePoints'] : 50;
                $species->setBasePoints($basePoints);
                $species->setCoefficient(1.0);
            } else {
                // Espèce normale : utiliser coefficient
                if (!isset($data['coefficient']) || $data['coefficient'] <= 0) {
                    return $this->json([
                        'message' => 'Un coefficient valide est requis pour les espèces non bonus'
                    ], 400);
                }
                $species->setCoefficient((float) $data['coefficient']);
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
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la création de l\'espèce',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'admin_species_update', methods: ['PUT'])]
    public function update(Request $request, Species $species): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            // Mettre à jour le nom si fourni
            if (isset($data['name'])) {
                $species->setName($data['name']);
            }

            // Déterminer si c'est une espèce bonus (par le nom ou par un champ isBonus)
            $isBonus = isset($data['isBonus']) ? $data['isBonus'] : $species->isBonus();

            if ($isBonus) {
                // Espèce bonus : utiliser basePoints
                if (isset($data['basePoints'])) {
                    $species->setBasePoints((int) $data['basePoints']);
                }
                $species->setCoefficient(1.0);
            } else {
                // Espèce normale : utiliser coefficient
                if (isset($data['coefficient'])) {
                    $species->setCoefficient((float) $data['coefficient']);
                }
                // Mettre à jour basePoints si fourni
                if (isset($data['basePoints'])) {
                    $species->setBasePoints((int) $data['basePoints']);
                }
            }

            $this->entityManager->flush();

            return $this->json([
                'message' => 'Espèce mise à jour avec succès',
                'species' => [
                    'id' => $species->getId(),
                    'name' => $species->getName(),
                    'coefficient' => $species->getCoefficient(),
                    'basePoints' => $species->getBasePoints(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la mise à jour de l\'espèce',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'admin_species_delete', methods: ['DELETE'])]
    public function delete(Species $species): JsonResponse
    {
        try {
            $this->entityManager->remove($species);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Espèce supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la suppression de l\'espèce',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
