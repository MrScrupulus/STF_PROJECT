<?php

namespace App\Controller\Admin\Competition;

use App\Entity\Competition\Competition;
use App\Service\DateTimeHelper;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin/competitions')]
class AdminCompetitionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    #[Route('', name: 'admin_competition_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $timezoneParis = new \DateTimeZone('Europe/Paris');
        $timezoneUtc = new \DateTimeZone('UTC');
        $competition = new Competition();
        $competition->setName($data['title']);
        $startDt = new \DateTime($data['startAt'], $timezoneParis);
        $startDt->setTimezone($timezoneUtc);
        $competition->setStartDate($startDt);
        $endDt = new \DateTime($data['endAt'], $timezoneParis);
        $endDt->setTimezone($timezoneUtc);
        $competition->setEndDate($endDt);
        $competition->setTeamSize((int)$data['teamSize']);
        $competition->setType($data['type']);
        if (!$data['hasNoLimit']) {
            $competition->setMaxParticipants((int)$data['maxParticipants']);
        }

        $this->entityManager->persist($competition);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Compétition créée avec succès',
            'competition' => [
                'id' => $competition->getId(),
                'name' => $competition->getName(),
            ]
        ]);
    }

    #[Route('', name: 'admin_competitions_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $competitions = $this->entityManager->getRepository(Competition::class)->findAll();

        $competitionsData = array_map(function ($competition) {
            return [
                'id' => $competition->getId(),
                'name' => $competition->getName(),
                'startDate' => DateTimeHelper::formatParis($competition->getStartDate()),
                'endDate' => DateTimeHelper::formatParis($competition->getEndDate()),
                'teamSize' => $competition->getTeamSize(),
                'type' => $competition->getType(),
                'maxParticipants' => $competition->getMaxParticipants(),
            ];
        }, $competitions);

        return $this->json(['competitions' => $competitionsData]);
    }

    #[Route('/{id}', name: 'admin_competition_delete', methods: ['DELETE'])]
    public function delete(Competition $competition): JsonResponse
    {
        try {
            $this->entityManager->remove($competition);
            $this->entityManager->flush();

            return $this->json([
                'message' => 'Compétition supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Erreur lors de la suppression de la compétition',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
