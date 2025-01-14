<?php

namespace App\Controller\Admin\Species;

use App\Entity\Species\Species;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin/species')]
class AdminSpeciesController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    #[Route('', name: 'admin_species_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['name']) || empty($data['name'])) {
                return $this->json([
                    'message' => 'Le nom de l\'espèce est requis'
                ], 400);
            }

            $species = new Species();
            $species->setName($data['name']);

            // Si ce n'est pas une espèce bonus, on vérifie le coefficient
            if (strtolower($data['name']) !== 'espèce bonus') {
                if (!isset($data['coefficient']) || $data['coefficient'] <= 0) {
                    return $this->json([
                        'message' => 'Un coefficient valide est requis pour les espèces non bonus'
                    ], 400);
                }
                $species->setCoefficient((float) $data['coefficient']);
            }

            $this->entityManager->persist($species);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Espèce créée avec succès',
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

            if (isset($data['name'])) {
                $species->setName($data['name']);
            }

            if (!$species->isBonus() && isset($data['coefficient'])) {
                $species->setCoefficient((float) $data['coefficient']);
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
