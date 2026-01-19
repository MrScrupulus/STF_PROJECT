<?php

namespace App\Controller\Admin\FishCatch;

use App\Entity\Competition\FishCatch;
use App\Repository\Competition\FishCatchRepository;
use App\Service\EmailService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/catches')]
class AdminFishCatchController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private EmailService $emailService,
        private NotificationService $notificationService
    ) {
    }

    /**
     * Liste toutes les prises en attente de validation
     */
    #[Route('/pending', name: 'admin_catches_pending', methods: ['GET'])]
    public function listPending(FishCatchRepository $repository): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $catches = $repository->createQueryBuilder('c')
                ->select('c', 't', 's', 'u', 'comp')
                ->leftJoin('c.team', 't')
                ->leftJoin('c.species', 's')
                ->leftJoin('c.caughtBy', 'u')
                ->leftJoin('t.competition', 'comp')
                ->where('c.isValidated = :validated')
                ->setParameter('validated', false)
                ->orderBy('c.createdAt', 'DESC')
                ->getQuery()
                ->getResult();

            $catchesData = array_map(function ($catch) {
                return [
                    'id' => $catch->getId(),
                    'species' => [
                        'id' => $catch->getSpecies()->getId(),
                        'name' => $catch->getSpecies()->getName(),
                        'coefficient' => $catch->getSpecies()->getCoefficient(),
                    ],
                    'size' => $catch->getSize(),
                    'points' => $catch->calculatePoints(),
                    'photoUrl' => $catch->getPhotoUrl(),
                    'comment' => $catch->getComment(),
                    'rejectionReason' => $catch->getRejectionReason(),
                    'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                    'caughtBy' => $catch->getCaughtBy() ? [
                        'id' => $catch->getCaughtBy()->getId(),
                        'firstname' => $catch->getCaughtBy()->getFirstname(),
                        'lastname' => $catch->getCaughtBy()->getLastname(),
                        'email' => $catch->getCaughtBy()->getEmail(),
                    ] : null,
                    'team' => [
                        'id' => $catch->getTeam()->getId(),
                        'name' => $catch->getTeam()->getName(),
                    ],
                    'competition' => $catch->getTeam()->getCompetition() ? [
                        'id' => $catch->getTeam()->getCompetition()->getId(),
                        'name' => $catch->getTeam()->getCompetition()->getName(),
                    ] : null,
                ];
            }, $catches);

            return $this->json([
                'success' => true,
                'catches' => $catchesData,
                'count' => count($catchesData),
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des prises: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valide une prise
     */
    #[Route('/{id}/validate', name: 'admin_catch_validate', methods: ['POST'])]
    public function validate(FishCatch $catch, EntityManagerInterface $em): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            if ($catch->isValidated()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette prise est déjà validée'
                ], 400);
            }

            $catch->setIsValidated(true);
            $catch->setRejectionReason(null); // Effacer le motif de rejet si présent

            // Recalculer le score de l'équipe
            $team = $catch->getTeam();
            $team->updateTotalScore();
            
            $em->flush();

            // Envoyer un email de notification au pêcheur
            if ($catch->getCaughtBy()) {
                try {
                    $this->emailService->sendCatchValidationEmail($catch, true);
                } catch (\Exception $e) {
                    // Log l'erreur mais ne pas faire échouer la validation
                    error_log('Erreur lors de l\'envoi de l\'email de validation: ' . $e->getMessage());
                }

                // Créer une notification
                try {
                    $this->notificationService->notifyCatchValidated(
                        $catch->getCaughtBy(),
                        $catch->getId(),
                        $catch->getSpecies()->getName(),
                        $catch->getSize()
                    );
                } catch (\Exception $e) {
                    error_log('Erreur lors de la création de la notification: ' . $e->getMessage());
                }
            }

            return $this->json([
                'success' => true,
                'message' => 'Prise validée avec succès',
                'catch' => [
                    'id' => $catch->getId(),
                    'isValidated' => $catch->isValidated(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la validation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejette une prise avec un motif
     */
    #[Route('/{id}/reject', name: 'admin_catch_reject', methods: ['POST'])]
    public function reject(FishCatch $catch, Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            if ($catch->isValidated()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette prise est déjà validée et ne peut pas être rejetée'
                ], 400);
            }

            $data = json_decode($request->getContent(), true);
            $rejectionReason = $data['reason'] ?? null;

            if (empty($rejectionReason)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Un motif de rejet est requis'
                ], 400);
            }

            $catch->setIsValidated(false);
            $catch->setRejectionReason($rejectionReason);

            // Recalculer le score de l'équipe (la prise rejetée ne compte plus)
            $team = $catch->getTeam();
            $team->updateTotalScore();
            
            $em->flush();

            // Envoyer un email de notification au pêcheur
            if ($catch->getCaughtBy()) {
                try {
                    $this->emailService->sendCatchValidationEmail($catch, false, $rejectionReason);
                } catch (\Exception $e) {
                    // Log l'erreur mais ne pas faire échouer le rejet
                    error_log('Erreur lors de l\'envoi de l\'email de rejet: ' . $e->getMessage());
                }

                // Créer une notification
                try {
                    $this->notificationService->notifyCatchRejected(
                        $catch->getCaughtBy(),
                        $catch->getId(),
                        $catch->getSpecies()->getName(),
                        $catch->getSize(),
                        $rejectionReason
                    );
                } catch (\Exception $e) {
                    error_log('Erreur lors de la création de la notification: ' . $e->getMessage());
                }
            }

            return $this->json([
                'success' => true,
                'message' => 'Prise rejetée avec succès',
                'catch' => [
                    'id' => $catch->getId(),
                    'isValidated' => $catch->isValidated(),
                    'rejectionReason' => $catch->getRejectionReason(),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors du rejet: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une prise en tant qu'admin (avec sélection d'équipe et membre)
     */
    #[Route('/create', name: 'admin_catch_create', methods: ['POST'])]
    public function createCatch(Request $request, EntityManagerInterface $em, \App\Repository\Competition\CompetitionRepository $competitionRepository, \App\Repository\Competition\TeamRepository $teamRepository, \App\Repository\Species\SpeciesRepository $speciesRepository, \App\Repository\Security\UserRepository $userRepository): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $data = json_decode($request->getContent(), true);

            // Validation des données
            if (!isset($data['competitionId']) || !isset($data['teamId']) || !isset($data['speciesId']) || !isset($data['size'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'Les champs competitionId, teamId, speciesId et size sont requis'
                ], 400);
            }

            // Vérifier que la compétition existe
            $competition = $competitionRepository->find($data['competitionId']);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            // Vérifier que la compétition n'est pas en pause
            if ($competition->getIsPaused()) {
                return $this->json([
                    'success' => false,
                    'message' => 'La compétition est actuellement en pause. Il est impossible d\'ajouter des prises.'
                ], 400);
            }

            // Vérifier que l'équipe existe et appartient à la compétition
            $team = $teamRepository->find($data['teamId']);
            if (!$team) {
                return $this->json([
                    'success' => false,
                    'message' => 'Équipe non trouvée'
                ], 404);
            }

            if (!$team->getCompetition() || $team->getCompetition()->getId() !== $competition->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Cette équipe n\'est pas inscrite à cette compétition'
                ], 400);
            }

            // Vérifier que l'espèce existe
            $species = $speciesRepository->find($data['speciesId']);
            if (!$species) {
                return $this->json([
                    'success' => false,
                    'message' => 'Espèce non trouvée'
                ], 404);
            }

            // Créer la prise
            $catch = new \App\Entity\Competition\FishCatch();
            $catch->setTeam($team);
            $catch->setSpecies($species);
            $catch->setSize((float) $data['size']);
            $catch->setPhotoUrl($data['photoUrl'] ?? null);
            $catch->setComment($data['comment'] ?? null);
            $catch->setIsValidated(true); // Les prises créées par admin sont automatiquement validées

            // Gérer le membre qui a fait la prise
            if (isset($data['caughtById']) && !empty($data['caughtById'])) {
                $caughtBy = $userRepository->find($data['caughtById']);
                // Vérifier que le membre appartient bien à l'équipe
                if ($caughtBy && $team->getMembers()->contains($caughtBy)) {
                    $catch->setCaughtBy($caughtBy);
                } else {
                    return $this->json([
                        'success' => false,
                        'message' => 'Le membre sélectionné n\'appartient pas à cette équipe'
                    ], 400);
                }
            }

            $em->persist($catch);
            
            // Recalculer le score de l'équipe
            $team->updateTotalScore();
            
            $em->flush();

            return $this->json([
                'success' => true,
                'message' => 'Prise créée avec succès',
                'catch' => [
                    'id' => $catch->getId(),
                    'species' => [
                        'id' => $species->getId(),
                        'name' => $species->getName(),
                        'coefficient' => $species->getCoefficient(),
                    ],
                    'size' => $catch->getSize(),
                    'points' => $catch->calculatePoints(),
                    'photoUrl' => $catch->getPhotoUrl(),
                    'comment' => $catch->getComment(),
                    'isValidated' => $catch->isValidated(),
                    'caughtBy' => $catch->getCaughtBy() ? [
                        'id' => $catch->getCaughtBy()->getId(),
                        'firstname' => $catch->getCaughtBy()->getFirstname(),
                        'lastname' => $catch->getCaughtBy()->getLastname(),
                    ] : null,
                ]
            ], 201);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la prise: ' . $e->getMessage()
            ], 500);
        }
    }
}
