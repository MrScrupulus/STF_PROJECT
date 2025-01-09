<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Team;
use App\Repository\Competition\TeamRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/competitions/{competitionId}/teams')]
class TeamController extends AbstractController
{
    #[Route('', name: 'competition_team_list', methods: ['GET'])]
    public function index(int $competitionId, TeamRepository $repository): JsonResponse
    {
        return $this->json($repository->findByCompetition($competitionId));
    }

    #[Route('/{id}', name: 'competition_team_show', methods: ['GET'])]
    public function show(int $competitionId, Team $team): JsonResponse
    {
        return $this->json($team);
    }

    #[Route('', name: 'competition_team_create', methods: ['POST'])]
    public function create(int $competitionId, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $team = new Team();
        $team->setName($data['name']);
        // TODO: Add other team properties as needed

        $em->persist($team);
        $em->flush();

        return $this->json($team, 201);
    }

    #[Route('/{id}', name: 'competition_team_update', methods: ['PUT'])]
    public function update(int $competitionId, Team $team, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $team->setName($data['name']);
        }
        // TODO: Update other team properties as needed

        $em->flush();

        return $this->json($team);
    }

    #[Route('/{id}', name: 'competition_team_delete', methods: ['DELETE'])]
    public function delete(int $competitionId, Team $team, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($team);
        $em->flush();

        return $this->json(null, 204);
    }
}
