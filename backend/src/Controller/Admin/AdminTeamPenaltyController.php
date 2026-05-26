<?php

namespace App\Controller\Admin;

use App\Entity\Competition\FishCatch;
use App\Entity\Competition\Team;
use App\Entity\Competition\TeamPenalty;
use App\Service\CompetitionSnapshotService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin/teams')]
class AdminTeamPenaltyController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CompetitionSnapshotService $snapshotService,
    ) {
    }

    /**
     * Prises valides (sans rejet) pour choisir une référence de pénalité. Hors journal personnel.
     */
    #[Route('/{id}/penalty-eligible-catches', name: 'admin_team_penalty_eligible_catches', methods: ['GET'])]
    public function penaltyEligibleCatches(Team $team): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        if ($team->isPersonalJournal()) {
            return $this->json([
                'success' => false,
                'message' => 'Les pénalités ne concernent pas le journal personnel.',
            ], 400);
        }

        $competitionCatches = [];
        if ($team->getCompetition()) {
            $competitionId = $team->getCompetition()->getId();
            foreach ($team->getCatches() as $catch) {
                $catchComp = $catch->getCompetition();
                if ($catchComp === null || $catchComp->getId() === $competitionId) {
                    $competitionCatches[] = $catch;
                }
            }
        } else {
            $competitionCatches = $team->getCatches()->toArray();
        }

        $competitionSpeciesMap = [];
        if ($team->getCompetition()) {
            foreach ($team->getCompetition()->getCompetitionSpecies() as $compSpecies) {
                $competitionSpeciesMap[$compSpecies->getSpecies()->getId()] = $compSpecies;
            }
        }

        $rows = [];
        foreach ($competitionCatches as $catch) {
            if (!$catch->isValidated()) {
                continue;
            }
            $rr = $catch->getRejectionReason();
            if (null !== $rr && '' !== trim((string) $rr)) {
                continue;
            }

            $speciesId = $catch->getSpecies()->getId();
            $coefficient = $catch->getSpecies()->getCoefficient();
            if (isset($competitionSpeciesMap[$speciesId])) {
                $coefficient = $competitionSpeciesMap[$speciesId]->getCoefficient();
            }

            $rows[] = [
                'id' => $catch->getId(),
                'species' => [
                    'id' => $speciesId,
                    'name' => $catch->getSpecies()->getName(),
                    'coefficient' => $coefficient,
                ],
                'size' => $catch->getSize(),
                'points' => $catch->calculatePoints(),
                'photoUrl' => $catch->getPhotoUrl(),
                'isValidated' => true,
                'rejectionReason' => null,
                'createdAt' => $catch->getCreatedAt()?->format('Y-m-d H:i:s'),
            ];
        }

        usort($rows, static function (array $a, array $b): int {
            return strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? '');
        });

        return $this->json([
            'success' => true,
            'catches' => $rows,
        ]);
    }

    #[Route('/{id}/penalties', name: 'admin_team_penalties_list', methods: ['GET'])]
    public function list(Team $team): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $items = [];
        foreach ($team->getPenalties() as $p) {
            $c = $p->getFishCatch();
            $items[] = [
                'id' => $p->getId(),
                'points' => $p->getPoints(),
                'reason' => $p->getReason(),
                'createdAt' => $p->getCreatedAt()?->format('Y-m-d H:i:s'),
                'fishCatchId' => $c?->getId(),
                'speciesName' => $c?->getSpecies()?->getName(),
            ];
        }

        return $this->json([
            'success' => true,
            'penalties' => $items,
            'totalPenaltyPoints' => $team->getTotalPenaltyPoints(),
        ]);
    }

    #[Route('/{id}/penalties', name: 'admin_team_penalties_create', methods: ['POST'])]
    public function create(Team $team, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $data = json_decode($request->getContent(), true) ?: [];
        $points = isset($data['points']) ? (int) $data['points'] : 0;

        if ($points <= 0) {
            return $this->json(['success' => false, 'message' => 'Le nombre de points à retirer doit être un entier positif.'], 400);
        }

        $reason = isset($data['reason']) && \is_string($data['reason']) ? trim($data['reason']) : null;
        $fishCatch = null;

        if (!empty($data['fishCatchId'])) {
            $fid = (int) $data['fishCatchId'];
            $fishCatch = $this->em->getRepository(FishCatch::class)->find($fid);
            if (!$fishCatch || $fishCatch->getTeam()?->getId() !== $team->getId()) {
                return $this->json(['success' => false, 'message' => 'La prise sélectionnée n’appartient pas à cette équipe.'], 400);
            }
        }

        $penalty = new TeamPenalty();
        $penalty->setPoints($points);
        $penalty->setReason('' !== ($reason ?? '') ? $reason : null);
        $penalty->setFishCatch($fishCatch);
        $user = $this->getUser();
        if ($user instanceof \App\Entity\Security\User) {
            $penalty->setCreatedBy($user);
        }

        $team->addPenalty($penalty);
        $this->em->persist($penalty);
        $team->updateTotalScore();
        $this->em->flush();

        $competition = $team->getCompetition();
        if ($competition && $competition->getEndDate() && $competition->getEndDate() < new \DateTime()) {
            $this->snapshotService->createSnapshotsForCompetition($competition, true);
        }

        return $this->json([
            'success' => true,
            'message' => 'Pénalité enregistrée',
            'penalty' => [
                'id' => $penalty->getId(),
                'points' => $penalty->getPoints(),
                'reason' => $penalty->getReason(),
                'fishCatchId' => $fishCatch?->getId(),
                'totalPenaltyPoints' => $team->getTotalPenaltyPoints(),
                'totalScore' => $team->getTotalScore(),
            ],
        ]);
    }

    #[Route('/{id}/penalties/{penaltyId}', name: 'admin_team_penalties_delete', methods: ['DELETE'])]
    public function delete(Team $team, int $penaltyId): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');
        $penalty = $this->em->getRepository(TeamPenalty::class)->find($penaltyId);
        if (!$penalty || $penalty->getTeam()?->getId() !== $team->getId()) {
            return $this->json(['success' => false, 'message' => 'Pénalité introuvable pour cette équipe.'], 404);
        }

        $team->removePenalty($penalty);
        $this->em->remove($penalty);
        $team->updateTotalScore();
        $this->em->flush();

        $competition = $team->getCompetition();
        if ($competition && $competition->getEndDate() && $competition->getEndDate() < new \DateTime()) {
            $this->snapshotService->createSnapshotsForCompetition($competition, true);
        }

        return $this->json([
            'success' => true,
            'message' => 'Pénalité supprimée',
            'totalPenaltyPoints' => $team->getTotalPenaltyPoints(),
            'totalScore' => $team->getTotalScore(),
        ]);
    }
}
