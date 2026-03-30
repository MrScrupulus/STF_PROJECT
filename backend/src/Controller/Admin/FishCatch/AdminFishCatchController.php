<?php

namespace App\Controller\Admin\FishCatch;

use App\Entity\Competition\FishCatch;
use App\Repository\Competition\FishCatchRepository;
use App\Service\CatchPhotoStorageService;
use App\Service\CompetitionSnapshotService;
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
        private CompetitionSnapshotService $snapshotService,
        private CatchPhotoStorageService $photoStorage,
        private EmailService $emailService,
        private NotificationService $notificationService
    ) {
    }

    /**
     * Liste toutes les prises en attente de validation
     */
    #[Route('/pending', name: 'admin_catches_pending', methods: ['GET'])]
    public function listPending(FishCatchRepository $repository, Request $request): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            // Pagination: page et limit en query string, avec valeurs par défaut
            $page = max(1, (int) $request->query->get('page', 1));
            // Limiter le nombre de prises par page pour alléger le dashboard (par défaut 10)
            $limit = (int) $request->query->get('limit', 10);
            if ($limit < 1) {
                $limit = 10;
            }
            if ($limit > 50) {
                $limit = 50;
            }

            $qb = $repository->createQueryBuilder('c')
                ->leftJoin('c.team', 't')
                ->leftJoin('c.species', 's')
                ->leftJoin('c.caughtBy', 'u')
                ->leftJoin('t.competition', 'comp')
                ->where('c.isValidated = :validated')
                ->andWhere('c.rejectionReason IS NULL')
                ->setParameter('validated', false);

            // Cloner le QueryBuilder pour le total
            $qbCount = clone $qb;
            $total = (int) $qbCount
                ->select('COUNT(c.id)')
                ->getQuery()
                ->getSingleScalarResult();

            // Appliquer l'ordre et la pagination
            $catches = $qb
                ->select('c', 't', 's', 'u', 'comp')
                ->orderBy('c.createdAt', 'DESC')
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
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

            $pages = $limit > 0 ? (int) ceil($total / $limit) : 1;

            return $this->json([
                'success' => true,
                'catches' => $catchesData,
                'count' => count($catchesData),
                'total' => $total,
                'page' => $page,
                'pages' => $pages,
                'limit' => $limit,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Erreur lors de la récupération des prises (admin)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des prises. Veuillez réessayer plus tard.'
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

            // Recréer les snapshots si la compétition est terminée
            $competition = $catch->getCompetition();
            if ($competition && $competition->getEndDate() < new \DateTime()) {
                $this->snapshotService->createSnapshotsForCompetition($competition, true);
            }

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
                        $catch->getSize(),
                        $catch->getTeam()->getId()
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
            $this->logger->error('Erreur lors de la validation de la prise', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la validation de la prise. Veuillez réessayer plus tard.'
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

            $data = json_decode($request->getContent(), true);
            $rejectionReason = $data['reason'] ?? null;

            if (empty($rejectionReason)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Un motif de rejet est requis'
                ], 400);
            }

            // Mémoriser les informations nécessaires avant le clear()
            $wasValidated = $catch->isValidated();
            $team = $catch->getTeam();
            $teamId = $team->getId();
            $competitionId = $catch->getCompetition()?->getId();
            $catchId = $catch->getId();
            $caughtBy = $catch->getCaughtBy();
            $caughtById = $caughtBy ? $caughtBy->getId() : null;
            $speciesName = $catch->getSpecies()->getName();
            $catchSize = $catch->getSize();

            // Marquer la prise comme rejetée
            $catch->setIsValidated(false);
            $catch->setRejectionReason($rejectionReason);
            
            // Sauvegarder la prise rejetée
            $em->flush();
            
            // Nettoyer le cache Doctrine pour forcer le rechargement des données
            $em->clear();
            
            // Recharger l'équipe depuis la base de données pour avoir les données à jour
            $team = $em->getRepository(\App\Entity\Competition\Team::class)->find($teamId);
            
            if ($team) {
                // Recalculer le score de l'équipe (la prise rejetée ne compte plus)
                // Important : recalculer même si la prise n'était pas validée, au cas où
                // le score aurait été calculé incorrectement
                $team->updateTotalScore();
                $em->flush();
            }

            // Recréer les snapshots si la compétition est terminée
            if ($competitionId) {
                $competition = $em->getRepository(\App\Entity\Competition\Competition::class)->find($competitionId);
                if ($competition && $competition->getEndDate() < new \DateTime()) {
                    $this->snapshotService->createSnapshotsForCompetition($competition, true);
                }
            }

            // Envoyer un email de notification au pêcheur
            if ($caughtById) {
                try {
                    // Recharger la prise et l'utilisateur pour l'email
                    $catchForEmail = $em->getRepository(\App\Entity\Competition\FishCatch::class)->find($catchId);
                    if ($catchForEmail) {
                        $this->emailService->sendCatchValidationEmail($catchForEmail, false, $rejectionReason);
                    }
                } catch (\Exception $e) {
                    // Log l'erreur mais ne pas faire échouer le rejet
                    error_log('Erreur lors de l\'envoi de l\'email de rejet: ' . $e->getMessage());
                }

                // Créer une notification
                try {
                    $user = $em->getRepository(\App\Entity\Security\User::class)->find($caughtById);
                    $catch = $em->getRepository(\App\Entity\Competition\FishCatch::class)->find($catchId);
                    if ($user && $catch && $catch->getTeam()) {
                        $this->notificationService->notifyCatchRejected(
                            $user,
                            $catchId,
                            $speciesName,
                            $catchSize,
                            $rejectionReason,
                            $catch->getTeam()->getId()
                        );
                    }
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
            $this->logger->error('Erreur lors du rejet de la prise', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du rejet de la prise. Veuillez réessayer plus tard.'
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
            $catch->setCompetition($competition); // Associer directement la compétition pour préserver l'historique
            $catch->setSpecies($species);
            $catch->setSize((float) $data['size']);
            $catch->setComment($data['comment'] ?? null);
            $catch->setIsValidated(true); // Les prises créées par admin sont automatiquement validées
            if (!empty($data['photoUrl'])) {
                $catch->setPhotoUrl($this->photoStorage->save($data['photoUrl'], $competition->getId()));
            }

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

            // Recréer les snapshots si la compétition est terminée
            if ($competition->getEndDate() < new \DateTime()) {
                $this->snapshotService->createSnapshotsForCompetition($competition, true);
            }

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
            $this->logger->error('Erreur lors de la création de la prise (admin)', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création de la prise. Veuillez réessayer plus tard.'
            ], 500);
        }
    }
}
