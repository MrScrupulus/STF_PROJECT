<?php

namespace App\Controller\Competition;

use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\TeamRepository;
use App\Repository\Competition\FishCatchRepository;
use App\Service\CompetitionSnapshotService;
use App\Service\PdfChartImageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[Route('/api/admin/competitions')]
class CompetitionPdfController extends AbstractController
{
    public function __construct(
        private Environment $twig,
        private PdfChartImageService $chartImageService,
    ) {
    }
    #[Route('/{id}/pdf', name: 'app_admin_competition_pdf', methods: ['GET'])]
    public function generatePdf(
        int $id,
        CompetitionRepository $competitionRepo,
        TeamRepository $teamRepo,
        FishCatchRepository $catchRepo,
        CompetitionSnapshotService $snapshotService
    ): Response {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competition = $competitionRepo->find($id);
            if (!$competition) {
                throw $this->createNotFoundException('Compétition non trouvée');
            }

        // Récupérer toutes les équipes triées par score
        // Pour les compétitions terminées, utiliser les snapshots (état figé)
        $now = new \DateTime();
        $isEnded = $competition->getEndDate() < $now;
        
        if ($isEnded) {
            // Créer les snapshots s'ils n'existent pas encore
            if (!$snapshotService->hasSnapshots($competition)) {
                $snapshotService->createSnapshotsForCompetition($competition);
            }
            
            // Utiliser les snapshots pour le classement
            $snapshots = $snapshotService->getSnapshotsForCompetition($competition);
            // Créer des objets anonymes pour compatibilité avec le template Twig
            $teams = array_map(function($snapshot) {
                $teamData = new \stdClass();
                $teamData->id = $snapshot->getTeam()->getId();
                $teamData->name = $snapshot->getTeamName();
                $teamData->totalScore = $snapshot->getTotalScore();
                $teamData->registrationNumber = $snapshot->getRegistrationNumber();
                
                // Convertir le tableau JSON en objets pour le template
                $members = [];
                foreach ($snapshot->getMembers() as $memberData) {
                    $member = new \stdClass();
                    $member->id = $memberData['id'];
                    $member->firstname = $memberData['firstname'];
                    $member->lastname = $memberData['lastname'];
                    $members[] = $member;
                }
                $teamData->members = $members;
                
                return $teamData;
            }, $snapshots);
        } else {
            // Pour les compétitions en cours, seulement les équipes actives
            $teams = $competition->getTeams()->filter(function($team) {
                return $team->getIsActive();
            })->toArray();
            
            usort($teams, function($a, $b) {
                return ($b->getTotalScore() ?? 0) - ($a->getTotalScore() ?? 0);
            });
        }

        // Récupérer toutes les prises validées
        // Utiliser la relation directe avec competition pour préserver l'historique
        $catches = $catchRepo->createQueryBuilder('c')
            ->join('c.team', 't')
            ->join('c.species', 's')
            ->leftJoin('c.caughtBy', 'u')
            ->where('c.competition = :competitionId')
            ->andWhere('c.isValidated = :validated')
            ->setParameter('competitionId', $competition->getId())
            ->setParameter('validated', true)
            ->getQuery()
            ->getResult();

        // Statistiques par espèce
        $speciesStats = [];
        $top3BySpecies = [];
        foreach ($catches as $catch) {
            $species = $catch->getSpecies();
            $speciesId = $species->getId();
            $speciesName = $species->getName();

            if (!isset($speciesStats[$speciesId])) {
                $speciesStats[$speciesId] = [
                    'id' => $speciesId,
                    'name' => $speciesName,
                    'count' => 0,
                ];
            }
            $speciesStats[$speciesId]['count']++;

            if (!isset($top3BySpecies[$speciesId])) {
                $top3BySpecies[$speciesId] = [];
            }

            $top3BySpecies[$speciesId][] = [
                'size' => $catch->getSize(),
                'points' => $catch->calculatePoints(),
                'team' => $catch->getTeam()->getName(),
                'registrationNumber' => $catch->getTeam()->getRegistrationNumber(),
                'caughtBy' => $catch->getCaughtBy() ? 
                    $catch->getCaughtBy()->getFirstname() . ' ' . $catch->getCaughtBy()->getLastname() : 
                    'Non renseigné',
                'createdAt' => $catch->getCreatedAt()->format('d/m/Y H:i'),
            ];
        }

        // Trier et prendre le top 3 pour chaque espèce
        foreach ($top3BySpecies as $speciesId => &$catchesForSpecies) {
            usort($catchesForSpecies, function($a, $b) {
                return $b['size'] <=> $a['size'];
            });
            $catchesForSpecies = array_slice($catchesForSpecies, 0, 3);
        }
        unset($catchesForSpecies); // Important pour éviter les références

        // Données pour le camembert et la chronologie
        $speciesStatsList = array_values($speciesStats);
        $speciesColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a78bfa', '#34d399'];

        // Préparer les données du graphique chronologique (prises par heure depuis le début)
        $startDate = $competition->getStartDate();
        $endDate = $competition->getEndDate();
        $speciesIdToIndex = array_flip(array_column($speciesStatsList, 'id'));
        $timelinePoints = [];
        $totalHours = 24.0;

        if ($startDate && $endDate) {
            $totalHours = max(1, ($endDate->getTimestamp() - $startDate->getTimestamp()) / 3600);
        }

        // Intervalle de référence : dates compétition ou min/max des prises
        $minTs = null;
        $maxTs = null;
        foreach ($catches as $catch) {
            $createdAt = $catch->getCreatedAt();
            if (!$createdAt) continue;
            $ts = $createdAt->getTimestamp();
            if ($minTs === null || $ts < $minTs) $minTs = $ts;
            if ($maxTs === null || $ts > $maxTs) $maxTs = $ts;
        }
        if ($minTs !== null && $maxTs !== null && $maxTs > $minTs && (!$startDate || !$endDate)) {
            $totalHours = max(1, ($maxTs - $minTs) / 3600);
        }
        $refTs = $startDate ? $startDate->getTimestamp() : $minTs;

        foreach ($catches as $catch) {
            $createdAt = $catch->getCreatedAt();
            if (!$createdAt || $refTs === null) continue;
            $ts = $createdAt->getTimestamp();
            $hoursFromStart = ($ts - $refTs) / 3600;
            if ($hoursFromStart < 0) $hoursFromStart = 0;
            if ($hoursFromStart > $totalHours) $hoursFromStart = $totalHours;

            $speciesId = $catch->getSpecies()->getId();
            $speciesIdx = $speciesIdToIndex[$speciesId] ?? 0;
            $colorIdx = isset($speciesIdToIndex[$speciesId]) ? $speciesIdToIndex[$speciesId] : 0;
            $timelinePoints[] = [
                'x' => $hoursFromStart,
                'y' => $speciesIdx,
                'speciesName' => $catch->getSpecies()->getName(),
                'size' => $catch->getSize(),
                'color' => $speciesColors[$colorIdx % count($speciesColors)],
            ];
        }

        $pieChartBase64 = $this->chartImageService->generatePieChartBase64($speciesStatsList);
        $scatterChartBase64 = $this->chartImageService->generateScatterChartBase64(
            $timelinePoints,
            $totalHours,
            max(1, count($speciesStatsList)),
            $startDate
        );

        $html = $this->twig->render('pdf/competition_ranking.html.twig', [
            'competition' => $competition,
            'teams' => $teams,
            'speciesStats' => $speciesStats,
            'speciesStatsList' => $speciesStatsList,
            'speciesColors' => $speciesColors,
            'top3BySpecies' => $top3BySpecies,
            'totalCatches' => count($catches),
            'timelinePoints' => $timelinePoints,
            'totalHours' => $totalHours,
            'uniqueSpeciesCount' => max(1, count($speciesStatsList)),
            'totalPie' => array_sum(array_column($speciesStatsList, 'count')),
            'pieChartBase64' => $pieChartBase64,
            'scatterChartBase64' => $scatterChartBase64,
        ]);

        // Configuration DomPDF - Utilisation directe sans Options pour éviter les problèmes d'autoloader
        // On charge explicitement les classes nécessaires
        if (!class_exists('Dompdf\Dompdf')) {
            throw new \RuntimeException('La classe Dompdf\Dompdf n\'est pas disponible');
        }
        
        // Créer les options en utilisant un tableau associatif si possible, sinon utiliser la classe
        try {
            $optionsClass = 'Dompdf\Options';
            if (class_exists($optionsClass)) {
                $options = new $optionsClass();
                $options->setIsHtml5ParserEnabled(true);
                $options->setIsRemoteEnabled(true);
                $options->setDefaultFont('DejaVu Sans');
            } else {
                // Fallback : créer Dompdf sans options et configurer après
                $options = null;
            }
        } catch (\Exception $e) {
            error_log('Erreur création Options: ' . $e->getMessage());
            $options = null;
        }

        $dompdfClass = 'Dompdf\Dompdf';
        $dompdf = new $dompdfClass($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'classement_' . $competition->getName() . '_' . date('Y-m-d') . '.pdf';
        $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);

            return new Response(
                $dompdf->output(),
                Response::HTTP_OK,
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]
            );
        } catch (\Exception $e) {
            // Log l'erreur pour le débogage (utiliser le logger Symfony si disponible)
            if ($this->container->has('logger')) {
                $this->container->get('logger')->error('Erreur génération PDF de compétition', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            } else {
                error_log('Erreur génération PDF: ' . $e->getMessage());
                error_log('Stack trace: ' . $e->getTraceAsString());
            }
            
            return new Response(
                json_encode([
                    'success' => false,
                    'error' => 'Erreur lors de la génération du PDF',
                    'message' => 'Une erreur est survenue lors de la génération du PDF. Veuillez réessayer plus tard.'
                ]),
                Response::HTTP_INTERNAL_SERVER_ERROR,
                ['Content-Type' => 'application/json']
            );
        }
    }

}
