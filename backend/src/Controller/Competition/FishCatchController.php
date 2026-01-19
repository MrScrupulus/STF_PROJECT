<?php

namespace App\Controller\Competition;

use App\Entity\Competition\FishCatch;
use App\Repository\Competition\FishCatchRepository;
use App\Repository\Security\UserRepository;
use App\Service\NotificationService;
use App\Service\GeolocationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/competitions/{competitionId}/catches')]
class FishCatchController extends AbstractController
{
    #[Route('', name: 'competition_catch_list', methods: ['GET'])]
    public function list(int $competitionId, FishCatchRepository $repository): JsonResponse
    {
        // Récupérer les prises pour cette compétition
        $catches = $repository->createQueryBuilder('c')
            ->join('c.team', 't')
            ->where('t.competition = :competitionId')
            ->setParameter('competitionId', $competitionId)
            ->getQuery()
            ->getResult();

        return $this->json($catches);
    }

    #[Route('/{id}', name: 'competition_catch_show', methods: ['GET'])]
    public function show(FishCatch $catch): JsonResponse
    {
        return $this->json($catch);
    }

    #[Route('', name: 'competition_catch_create', methods: ['POST'])]
    public function create(
        int $competitionId,
        Request $request,
        EntityManagerInterface $em,
        \App\Repository\Competition\TeamRepository $teamRepository,
        \App\Repository\Species\SpeciesRepository $speciesRepository,
        \App\Repository\Competition\CompetitionRepository $competitionRepository,
        UserRepository $userRepository,
        NotificationService $notificationService,
        GeolocationService $geolocationService
    ): JsonResponse {
        try {
            $user = $this->getUser();
            if (!$user) {
                return $this->json([
                    'success' => false,
                    'message' => 'Utilisateur non connecté'
                ], 401);
            }

            // Vérifier que la compétition existe et est en cours
            $competition = $competitionRepository->find($competitionId);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            // Vérifier si l'utilisateur est admin
            $isAdmin = $user && in_array('ROLE_ADMIN', $user->getRoles());
            
            $now = new \DateTime();
            if ($now < $competition->getStartDate() || $now > $competition->getEndDate()) {
                if (!$isAdmin) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Cette compétition n\'est pas en cours'
                    ], 400);
                }
            }

            // Vérifier si la compétition est en pause (même les admins ne peuvent pas ajouter pendant la pause)
            if ($competition->getIsPaused()) {
                return $this->json([
                    'success' => false,
                    'message' => 'La compétition est actuellement en pause. Il est impossible d\'ajouter des prises.'
                ], 400);
            }

            $data = json_decode($request->getContent(), true);

            // Récupérer l'équipe de l'utilisateur pour cette compétition
            $teams = $teamRepository->findTeamsByMember($user);
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

            $catch = new FishCatch();
            $catch->setTeam($team);
            $catch->setSpecies($species);
            $catch->setSize((float) $data['size']);
            $catch->setPhotoUrl($data['photoUrl'] ?? null);
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
                // Log l'erreur mais ne pas faire échouer la création de la prise
                error_log('Erreur lors de la création de la notification pour les admins: ' . $e->getMessage());
            }

            return $this->json([
                'success' => true,
                'message' => 'Prise enregistrée avec succès',
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

    #[Route('/{id}', name: 'competition_catch_update', methods: ['PUT'])]
    public function update(FishCatch $catch, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['size'])) {
            $catch->setSize((float) $data['size']);
        }
        if (isset($data['photoUrl'])) {
            $catch->setPhotoUrl($data['photoUrl']);
        }
        if (isset($data['comment'])) {
            $catch->setComment($data['comment']);
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
