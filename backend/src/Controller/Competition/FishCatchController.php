<?php

namespace App\Controller\Competition;

use App\Entity\Competition\FishCatch;
use App\Repository\Competition\FishCatchRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/competitions/{competitionId}/catches')]
class FishCatchController extends AbstractController
{
    #[Route('', name: 'competition_catch_list', methods: ['GET'])]
    public function list(FishCatchRepository $repository): JsonResponse
    {
        return $this->json($repository->findAll());
    }

    #[Route('/{id}', name: 'competition_catch_show', methods: ['GET'])]
    public function show(FishCatch $catch): JsonResponse
    {
        return $this->json($catch);
    }

    #[Route('', name: 'competition_catch_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $catch = new FishCatch();
        $catch->setLength($data['length']);
        $catch->setPhotoUrl($data['photoUrl']);
        // TODO: Set species and team from repositories

        $em->persist($catch);
        $em->flush();

        return $this->json($catch, 201);
    }

    #[Route('/{id}', name: 'competition_catch_update', methods: ['PUT'])]
    public function update(FishCatch $catch, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['length'])) {
            $catch->setLength($data['length']);
        }
        if (isset($data['photoUrl'])) {
            $catch->setPhotoUrl($data['photoUrl']);
        }

        $em->flush();

        return $this->json($catch);
    }

    #[Route('/{id}/validate', name: 'competition_catch_validate', methods: ['PATCH'])]
    public function validate(FishCatch $catch, EntityManagerInterface $em): JsonResponse
    {
        $catch->setIsValidated(true);
        $em->flush();

        return $this->json($catch);
    }

    #[Route('/{id}', name: 'competition_catch_delete', methods: ['DELETE'])]
    public function delete(FishCatch $catch, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($catch);
        $em->flush();

        return $this->json(null, 204);
    }
}
