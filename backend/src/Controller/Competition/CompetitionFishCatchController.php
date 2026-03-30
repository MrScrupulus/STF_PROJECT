<?php

namespace App\Controller\Competition;

use App\Entity\Competition\FishCatch;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\FishCatchRepository;
use App\Repository\Competition\TeamRepository;
use App\Repository\Security\UserRepository;
use App\Service\CatchPhotoStorageService;
use App\Service\CompetitionSnapshotService;
use App\Service\NotificationService;
use App\Service\GeolocationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class CompetitionFishCatchController extends AbstractController
{
    #[Route('/api/competitions/{competitionId}/catches', name: 'competition_catch_list', methods: ['GET'])]
    public function list(int $competitionId, FishCatchRepository $repository, CompetitionRepository $competitionRepository): JsonResponse
    {
        $competition = $competitionRepository->find($competitionId);
        if (!$competition) {
            return $this->json([
                'success' => false,
                'message' => 'Compétition non trouvée',
            ], 404);
        }

        $competitionSpeciesMap = [];
        foreach ($competition->getCompetitionSpecies() as $compSpecies) {
            $speciesEntity = $compSpecies->getSpecies();
            if ($speciesEntity) {
                $competitionSpeciesMap[$speciesEntity->getId()] = $compSpecies;
            }
        }

        $catches = $repository->createQueryBuilder('c')
            ->join('c.team', 't')
            ->addSelect('t')
            ->join('c.species', 's')
            ->addSelect('s')
            ->leftJoin('c.caughtBy', 'u')
            ->addSelect('u')
            ->where('c.competition = :competitionId')
            ->setParameter('competitionId', $competitionId)
            ->getQuery()
            ->getResult();

        $data = array_map(function (FishCatch $catch) use ($competitionSpeciesMap) {
            $speciesId = $catch->getSpecies()->getId();
            $coefficient = $catch->getSpecies()->getCoefficient();
            if (isset($competitionSpeciesMap[$speciesId])) {
                $coefficient = $competitionSpeciesMap[$speciesId]->getCoefficient();
            }

            return [
                'id' => $catch->getId(),
                'species' => [
                    'id' => $speciesId,
                    'name' => $catch->getSpecies()->getName(),
                    'coefficient' => $coefficient,
                ],
                'size' => $catch->getSize(),
                'points' => $catch->calculatePoints(),
                'photoUrl' => $catch->getPhotoUrl(),
                'comment' => $catch->getComment(),
                'isValidated' => $catch->isValidated(),
                'rejectionReason' => $catch->getRejectionReason(),
                'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                'latitude' => $catch->getLatitude(),
                'longitude' => $catch->getLongitude(),
                'team' => [
                    'id' => $catch->getTeam()->getId(),
                    'name' => $catch->getTeam()->getName(),
                ],
                'caughtBy' => $catch->getCaughtBy() ? [
                    'id' => $catch->getCaughtBy()->getId(),
                    'firstname' => $catch->getCaughtBy()->getFirstname(),
                    'lastname' => $catch->getCaughtBy()->getLastname(),
                ] : null,
                'competition' => $catch->getCompetition() ? [
                    'id' => $catch->getCompetition()->getId(),
                    'name' => $catch->getCompetition()->getName(),
                ] : null,
            ];
        }, $catches);

        return $this->json($data);
    }

    #[Route('/api/competitions/{competitionId}/catches/{id}', name: 'competition_catch_show', methods: ['GET'])]
    public function show(FishCatch $catch): JsonResponse
    {
        return $this->json($catch);
    }

    #[Route('/api/competitions/{competitionId}/catches', name: 'competition_catch_create', methods: ['POST'])]
    public function create(
        int $competitionId,
        Request $request,
        EntityManagerInterface $em,
        \App\Repository\Competition\TeamRepository $teamRepository,
        \App\Repository\Species\SpeciesRepository $speciesRepository,
        \App\Repository\Competition\CompetitionRepository $competitionRepository,
        \App\Repository\Competition\CompetitionSpeciesRepository $competitionSpeciesRepository,
        UserRepository $userRepository,
        NotificationService $notificationService,
        GeolocationService $geolocationService,
        CatchPhotoStorageService $photoStorage
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            $data = json_decode($request->getContent(), true);

            // Récupérer toutes les équipes de l'utilisateur
            $teams = $teamRepository->findTeamsByMember($user);

            // Trouver l'équipe inscrite à cette compétition
            $team = null;
            foreach ($teams as $t) {
                if ($t->getCompetition() && $t->getCompetition()->getId() === $competitionId) {
                    $team = $t;
                    break;
                }
            }

            if (!$team) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous n\'êtes pas inscrit à cette compétition'
                ], 403);
            }

            // Validation des données
            if (!isset($data['speciesId']) || !isset($data['size'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'espèce et la taille sont requis'
                ], 400);
            }

            $species = $speciesRepository->find($data['speciesId']);
            if (!$species) {
                return $this->json([
                    'success' => false,
                    'message' => 'Espèce non trouvée'
                ], 404);
            }

            // Valider la position GPS si fournie
            $latitude = isset($data['latitude']) ? (float) $data['latitude'] : null;
            $longitude = isset($data['longitude']) ? (float) $data['longitude'] : null;
            
            $locationError = $geolocationService->validateLocation($latitude, $longitude, $competitionId);
            if ($locationError !== null) {
                return $this->json([
                    'success' => false,
                    'message' => $locationError
                ], 400);
            }

            // Récupérer la compétition pour l'associer directement à la prise
            // Charger aussi les competitionSpecies pour que calculatePoints() puisse les utiliser
            $competition = $competitionRepository->createQueryBuilder('c')
                ->leftJoin('c.competitionSpecies', 'cs')
                ->addSelect('cs')
                ->where('c.id = :id')
                ->setParameter('id', $competitionId)
                ->getQuery()
                ->getOneOrNullResult();
            
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            $catch = new FishCatch();
            $catch->setTeam($team);
            $catch->setCompetition($competition); // Associer directement la compétition pour préserver l'historique
            $catch->setSpecies($species);
            $catch->setSize((float) $data['size']);
            $photoUrl = $data['photoUrl'] ?? null;
            if ($photoUrl) {
                try {
                    $storedPath = $photoStorage->save($photoUrl, $competitionId);
                    $catch->setPhotoUrl($storedPath);
                } catch (\Throwable $e) {
                    error_log(sprintf('[CatchPhoto] Erreur stockage fichier (path=%s): %s', $photoStorage->getUploadsPath(), $e->getMessage()));
                    // Fallback : stocker en base64 comme avant (rétrocompatibilité)
                    $catch->setPhotoUrl($photoUrl);
                }
            }
            // Utiliser caughtAt (heure de la photo) si fourni par le client, sinon createdAt = maintenant
            if (!empty($data['caughtAt'])) {
                try {
                    $caughtAt = new \DateTimeImmutable($data['caughtAt']);
                    $catch->setCreatedAt($caughtAt);
                } catch (\Exception $e) {
                    // Format invalide, garder la valeur par défaut du constructeur
                }
            }
            $catch->setComment($data['comment'] ?? null);
            $catch->setLatitude($latitude !== null ? (string) $latitude : null);
            $catch->setLongitude($longitude !== null ? (string) $longitude : null);
            // Les prises ne sont plus validées automatiquement, elles doivent être validées par un admin
            $catch->setIsValidated(false);
            
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
            } else {
                // Par défaut, attribuer la prise à l'utilisateur connecté
                $catch->setCaughtBy($user);
            }

            $em->persist($catch);
            $em->flush();

            // Recalculer le score de l'équipe
            $team->updateTotalScore();
            $em->flush();

            // Notifier tous les admins qu'une nouvelle prise est en attente de validation
            try {
                $caughtBy = $catch->getCaughtBy();
                $caughtByName = $caughtBy ? ($caughtBy->getFirstname() . ' ' . $caughtBy->getLastname()) : 'Inconnu';
                $notificationService->notifyAdminsPendingCatch(
                    $catch->getId(),
                    $team->getName(),
                    $species->getName(),
                    $catch->getSize(),
                    $caughtByName
                );
            } catch (\Exception $e) {
                // Ne pas faire échouer la création de la prise si la notification échoue
                error_log('Erreur lors de l\'envoi de la notification: ' . $e->getMessage());
            }

            return $this->json([
                'success' => true,
                'message' => 'Prise créée avec succès',
                'catch' => [
                    'id' => $catch->getId(),
                    'species' => [
                        'id' => $species->getId(),
                        'name' => $species->getName(),
                    ],
                    'size' => $catch->getSize(),
                    'points' => $catch->calculatePoints(),
                    'photoUrl' => $photoStorage->resolvePhotoUrl($catch->getPhotoUrl()),
                    'comment' => $catch->getComment(),
                    'isValidated' => $catch->isValidated(),
                    'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
                ]
            ], 201);
        } catch (\Exception $e) {
            error_log(sprintf('[CompetitionFishCatch] Erreur création prise: %s', $e->getMessage()));
            return $this->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la création de la prise. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    #[Route('/api/competitions/{competitionId}/catches/{id}', name: 'competition_catch_update', methods: ['PUT'])]
    public function update(
        int $competitionId,
        FishCatch $catch,
        Request $request,
        EntityManagerInterface $em,
        CompetitionSnapshotService $snapshotService,
        CatchPhotoStorageService $photoStorage
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (isset($data['size'])) {
            $catch->setSize((float) $data['size']);
        }
        if (isset($data['photoUrl'])) {
            try {
                $photoCompetitionId = $catch->getCompetition()?->getId() ?? $competitionId;
                $storedPath = $photoStorage->save($data['photoUrl'], $photoCompetitionId);
                $catch->setPhotoUrl($storedPath);
            } catch (\Throwable $e) {
                error_log(sprintf('[CatchPhoto] Erreur stockage fichier (update): %s', $e->getMessage()));
                $catch->setPhotoUrl($data['photoUrl']);
            }
        }
        if (isset($data['comment'])) {
            $catch->setComment($data['comment']);
        }

        // Recalculer le score (la taille affecte les points)
        $catch->getTeam()->updateTotalScore();
        $em->flush();

        // Recréer les snapshots si compétition terminée
        $competition = $catch->getCompetition();
        if ($competition && $competition->getEndDate() < new \DateTime()) {
            $snapshotService->createSnapshotsForCompetition($competition, true);
        }

        return $this->json($catch);
    }

    #[Route('/api/competitions/{competitionId}/catches/{id}/validate', name: 'competition_catch_validate', methods: ['PATCH'])]
    public function validate(
        int $competitionId,
        FishCatch $catch,
        EntityManagerInterface $em,
        CompetitionSnapshotService $snapshotService
    ): JsonResponse {
        $catch->setIsValidated(true);
        $catch->getTeam()->updateTotalScore();
        $em->flush();

        // Recréer les snapshots si compétition terminée
        $competition = $catch->getCompetition();
        if ($competition && $competition->getEndDate() < new \DateTime()) {
            $snapshotService->createSnapshotsForCompetition($competition, true);
        }

        return $this->json($catch);
    }

    #[Route('/api/competitions/{competitionId}/catches/{id}', name: 'competition_catch_delete', methods: ['DELETE'])]
    public function delete(
        int $competitionId,
        FishCatch $catch,
        EntityManagerInterface $em,
        CompetitionSnapshotService $snapshotService
    ): JsonResponse {
        $team = $catch->getTeam();
        $competition = $catch->getCompetition();

        // Retirer la prise de l'équipe (met à jour le score) puis supprimer
        $team->removeCatch($catch);
        $em->remove($catch);
        $em->flush();

        // Si la compétition est terminée, recréer les snapshots pour que le classement affiche le bon score
        if ($competition && $competition->getEndDate() < new \DateTime()) {
            $snapshotService->createSnapshotsForCompetition($competition, true);
        }

        return $this->json(null, 204);
    }
}
