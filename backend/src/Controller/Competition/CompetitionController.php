<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Repository\Competition\CompetitionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/competitions')]
class CompetitionController extends AbstractController
{
    #[Route('', name: 'get_competitions', methods: ['GET'])]
    public function getCompetitions(CompetitionRepository $competitionRepository): JsonResponse
    {
        $competitions = $competitionRepository->findAll();

        return $this->json([
            'competitions' => array_map(function (Competition $competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'teams' => array_map(function ($team) {
                        return [
                            'id' => $team->getId(),
                            'name' => $team->getName(),
                            'totalScore' => $team->getTotalScore(),
                        ];
                    }, $competition->getTeams()->toArray()),
                ];
            }, $competitions)
        ]);
    }

    #[Route('/{id}', name: 'get_competition', methods: ['GET'])]
    public function getCompetition(Competition $competition): JsonResponse
    {
        return $this->json([
            'id' => $competition->getId(),
            'name' => $competition->getName(),
            'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
            'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
            'teams' => array_map(function ($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'totalScore' => $team->getTotalScore(),
                ];
            }, $competition->getTeams()->toArray()),
        ]);
    }
}
