<?php

namespace App\Controller\Me;

use App\Entity\Competition\FishCatch;
use App\Entity\Security\User;
use App\Repository\Species\SpeciesRepository;
use App\Service\CatchPhotoStorageService;
use App\Service\PersonalJournalTeamService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Prises hors compétition : enregistrées comme validées, sans file d’attente admin.
 */
#[Route('/api/me/journal')]
class PersonalJournalCatchController extends AbstractController
{
    #[Route('/catches', name: 'me_journal_catch_create', methods: ['POST'])]
    public function createCatch(
        Request $request,
        EntityManagerInterface $em,
        SpeciesRepository $speciesRepository,
        PersonalJournalTeamService $personalJournalTeamService,
        CatchPhotoStorageService $photoStorage,
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }

        $data = json_decode($request->getContent(), true);
        if (!\is_array($data) || !isset($data['speciesId'], $data['size'])) {
            return $this->json(['success' => false, 'message' => 'L\'espèce et la taille sont requis'], 400);
        }

        $species = $speciesRepository->find((int) $data['speciesId']);
        if (!$species) {
            return $this->json(['success' => false, 'message' => 'Espèce non trouvée'], 404);
        }

        $size = (float) $data['size'];
        if ($size <= 0) {
            return $this->json(['success' => false, 'message' => 'Taille invalide'], 400);
        }

        $team = $personalJournalTeamService->getOrCreateForUser($user);

        $catch = new FishCatch();
        $catch->setTeam($team);
        $catch->setCompetition(null);
        $catch->setSpecies($species);
        $catch->setSize($size);
        $catch->setIsValidated(true);
        $catch->setCaughtBy($user);
        $catch->setComment(isset($data['comment']) ? trim((string) $data['comment']) ?: null : null);

        $latitude = isset($data['latitude']) ? (float) $data['latitude'] : null;
        $longitude = isset($data['longitude']) ? (float) $data['longitude'] : null;
        if (null !== $latitude && null !== $longitude) {
            $catch->setLatitude((string) $latitude);
            $catch->setLongitude((string) $longitude);
        }

        if (!empty($data['caughtAt'])) {
            try {
                $catch->setCreatedAt(new \DateTimeImmutable($data['caughtAt']));
            } catch (\Exception $e) {
                // garder la date par défaut
            }
        }

        $photoUrl = $data['photoUrl'] ?? null;
        if ($photoUrl) {
            try {
                $storedPath = $photoStorage->saveJournalCatchPhoto($photoUrl);
                $catch->setPhotoUrl($storedPath);
            } catch (\Throwable $e) {
                error_log(sprintf('[CatchPhoto] Journal: %s', $e->getMessage()));
                $catch->setPhotoUrl($photoUrl);
            }
        }

        $em->persist($catch);
        $em->flush();

        $team->updateTotalScore();
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Prise enregistrée dans votre journal (hors compétition).',
            'catch' => [
                'id' => $catch->getId(),
                'species' => [
                    'id' => $species->getId(),
                    'name' => $species->getName(),
                ],
                'size' => $catch->getSize(),
                'photoUrl' => $photoStorage->resolvePhotoUrl($catch->getPhotoUrl()),
                'comment' => $catch->getComment(),
                'isValidated' => $catch->isValidated(),
                'createdAt' => $catch->getCreatedAt()->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }
}
