<?php

namespace App\Controller\Competition;

use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\TeamRepository;
use App\Repository\Competition\FishCatchRepository;
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
    ) {
    }
    #[Route('/{id}/pdf', name: 'app_admin_competition_pdf', methods: ['GET'])]
    public function generatePdf(
        int $id,
        CompetitionRepository $competitionRepo,
        TeamRepository $teamRepo,
        FishCatchRepository $catchRepo
    ): Response {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competition = $competitionRepo->find($id);
            if (!$competition) {
                throw $this->createNotFoundException('Compétition non trouvée');
            }

        // Récupérer toutes les équipes triées par score
        $teams = $competition->getTeams()->toArray();
        usort($teams, function($a, $b) {
            return ($b->getTotalScore() ?? 0) - ($a->getTotalScore() ?? 0);
        });

        // Récupérer toutes les prises validées
        $catches = $catchRepo->createQueryBuilder('c')
            ->join('c.team', 't')
            ->join('c.species', 's')
            ->leftJoin('c.caughtBy', 'u')
            ->where('t.competition = :competitionId')
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

        // Générer le HTML avec Twig
        $html = $this->twig->render('pdf/competition_ranking.html.twig', [
            'competition' => $competition,
            'teams' => $teams,
            'speciesStats' => $speciesStats, // Garder le tableau associatif pour l'accès par ID
            'speciesStatsList' => array_values($speciesStats), // Pour l'affichage de la liste
            'top3BySpecies' => $top3BySpecies,
            'totalCatches' => count($catches),
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
            // Log l'erreur pour le débogage
            error_log('Erreur génération PDF: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new Response(
                json_encode([
                    'success' => false,
                    'error' => 'Erreur lors de la génération du PDF',
                    'message' => $e->getMessage()
                ]),
                Response::HTTP_INTERNAL_SERVER_ERROR,
                ['Content-Type' => 'application/json']
            );
        }
    }

}
