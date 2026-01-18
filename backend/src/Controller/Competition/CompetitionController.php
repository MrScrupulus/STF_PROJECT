<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\Team;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\Competition\TeamRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;

#[Route('/api')]
class CompetitionController extends AbstractController
{
    #[Route('/admin/competitions', name: 'app_admin_competitions_list', methods: ['GET'])]
    public function adminList(CompetitionRepository $repository): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $competitions = $repository->createQueryBuilder('c')
                ->select('c')
                ->getQuery()
                ->getResult();

            // Transformer les données pour éviter les références circulaires
            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'maxParticipants' => $competition->getMaxParticipants(),
                ];
            }, $competitions);

            return $this->json([
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/competitions', name: 'competition_list', methods: ['GET'])]
    public function list(CompetitionRepository $repository): JsonResponse
    {
        try {
            $competitions = $repository->findAll();

            // Transformer les données comme dans la route admin
            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'maxParticipants' => $competition->getMaxParticipants(),
                    'teamSize' => $competition->getTeamSize(),
                    'hasNoLimit' => $competition->getHasNoLimit(),
                ];
            }, $competitions);

            return $this->json([
                'success' => true,
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des compétitions: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/competitions/ongoing', name: 'competition_ongoing', methods: ['GET'])]
    public function getOngoingCompetitions(CompetitionRepository $repository): JsonResponse
    {
        try {
            $now = new \DateTime();
            
            $competitions = $repository->createQueryBuilder('c')
                ->where('c.startDate <= :now')
                ->andWhere('c.endDate >= :now')
                ->setParameter('now', $now)
                ->getQuery()
                ->getResult();

            $data = array_map(function ($competition) {
                return [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'teamSize' => $competition->getTeamSize(),
                ];
            }, $competitions);

            return $this->json([
                'success' => true,
                'competitions' => $data
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des compétitions en cours: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/competitions/{id}', name: 'get_competition', methods: ['GET'])]
    public function getCompetition(int $id, CompetitionRepository $repository): JsonResponse
    {
        $competition = $repository->find($id);
        
        if (!$competition) {
            return $this->json([
                'success' => false,
                'message' => 'Compétition non trouvée'
            ], 404);
        }
        
        return $this->json([
            'id' => $competition->getId(),
            'name' => $competition->getName(),
            'type' => $competition->getType(),
            'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
            'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
            'description' => $competition->getDescription(),
            'teamSize' => $competition->getTeamSize(),
            'maxParticipants' => $competition->getMaxParticipants(),
            'hasNoLimit' => $competition->getHasNoLimit(),
            'teams' => array_map(function ($team) {
                return [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'totalScore' => $team->getTotalScore(),
                    'registrationNumber' => $team->getRegistrationNumber(),
                ];
            }, $competition->getTeams()->toArray()),
        ]);
    }

    #[Route('/admin/competitions/{id}', name: 'app_admin_competition_delete', methods: ['DELETE'])]
    public function delete(Competition $competition, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            // Vérifier s'il y a des équipes liées
            if (!$competition->getTeams()->isEmpty()) {
                return $this->json([
                    'error' => 'Impossible de supprimer cette compétition car elle contient des équipes'
                ], 400);
            }

            $entityManager->remove($competition);
            $entityManager->flush();

            return $this->json([
                'message' => 'Compétition supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue lors de la suppression',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/competitions', name: 'app_admin_competition_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        try {
            $this->denyAccessUnlessGranted('ROLE_ADMIN');

            $data = json_decode($request->getContent(), true);

            $competition = new Competition();
            $competition->setName($data['name']);
            $competition->setType($data['type']);
            $competition->setStartDate(new \DateTime($data['startDate']));
            $competition->setEndDate(new \DateTime($data['endDate']));
            $competition->setDescription($data['description'] ?? null);
            $competition->setTeamSize((int) $data['teamSize']);
            $competition->setHasNoLimit($data['hasNoLimit'] ?? false);

            if (!$data['hasNoLimit'] && isset($data['maxParticipants'])) {
                $competition->setMaxParticipants((int) $data['maxParticipants']);
            }

            $entityManager->persist($competition);
            $entityManager->flush();

            return $this->json([
                'message' => 'Compétition créée avec succès',
                'competition' => [
                    'id' => $competition->getId(),
                    'name' => $competition->getName(),
                    'type' => $competition->getType(),
                    'startDate' => $competition->getStartDate()->format('Y-m-d H:i:s'),
                    'endDate' => $competition->getEndDate()->format('Y-m-d H:i:s'),
                    'description' => $competition->getDescription(),
                    'teamSize' => $competition->getTeamSize(),
                    'hasNoLimit' => $competition->getHasNoLimit(),
                    'maxParticipants' => $competition->getMaxParticipants(),
                ]
            ], 201);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Une erreur est survenue lors de la création',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    #[Route('/competitions/{id}/teams/register', name: 'register_team_to_competition', methods: ['POST'])]
    public function registerTeamToCompetition(
        int $id,
        Request $request,
        CompetitionRepository $competitionRepo,
        TeamRepository $teamRepo,
        EntityManagerInterface $em
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
            if (!isset($data['teamId'])) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'ID de l\'équipe est requis'
                ], 400);
            }

            $competition = $competitionRepo->find($id);
            if (!$competition) {
                return $this->json([
                    'success' => false,
                    'message' => 'Compétition non trouvée'
                ], 404);
            }

            $team = $teamRepo->find($data['teamId']);
            if (!$team) {
                return $this->json([
                    'success' => false,
                    'message' => 'Équipe non trouvée'
                ], 404);
            }

            // Vérifier que l'utilisateur est membre de l'équipe
            if (!$team->getMembers()->contains($user)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous devez être membre de l\'équipe pour l\'inscrire à une compétition'
                ], 403);
            }

            // Vérifier que l'équipe n'est pas déjà inscrite à une compétition EN COURS
            // Si l'équipe est inscrite à une compétition terminée, on peut la désinscrire et s'inscrire à la nouvelle
            if ($team->getCompetition()) {
                $now = new \DateTime();
                $oldCompetition = $team->getCompetition();
                
                // Si la compétition précédente est terminée, on peut s'inscrire à la nouvelle
                if ($oldCompetition->getEndDate() < $now) {
                    // Désinscrire de l'ancienne compétition
                    $team->setCompetition(null);
                    $team->setRegistrationNumber(null);
                } else {
                    // La compétition précédente est encore en cours ou à venir
                    return $this->json([
                        'success' => false,
                        'message' => 'Cette équipe est déjà inscrite à une compétition en cours ou à venir'
                    ], 400);
                }
            }

            // Vérifier la taille de l'équipe
            $teamMemberCount = $team->getMembers()->count();
            if ($teamMemberCount !== $competition->getTeamSize()) {
                return $this->json([
                    'success' => false,
                    'message' => "Cette compétition nécessite {$competition->getTeamSize()} membre(s) par équipe, mais votre équipe en a {$teamMemberCount}"
                ], 400);
            }

            // Vérifier les limites de participants si la compétition a une limite
            if (!$competition->getHasNoLimit()) {
                $currentTeamCount = $competition->getTeams()->count();
                $maxTeams = $competition->getMaxParticipants() / $competition->getTeamSize();
                
                if ($currentTeamCount >= $maxTeams) {
                    return $this->json([
                        'success' => false,
                        'message' => 'La compétition a atteint le nombre maximum d\'équipes autorisées'
                    ], 400);
                }
            }

            // Attribuer le numéro d'inscription
            $lastTeam = $teamRepo->findLastTeamNumberByCompetition($competition);
            $team->setRegistrationNumber($lastTeam ? $lastTeam + 1 : 1);
            $team->setCompetition($competition);

            $em->flush();

            return $this->json([
                'success' => true,
                'message' => 'Équipe inscrite à la compétition avec succès',
                'team' => [
                    'id' => $team->getId(),
                    'name' => $team->getName(),
                    'registrationNumber' => $team->getRegistrationNumber(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription à la compétition: ' . $e->getMessage()
            ], 500);
        }
    }
}
