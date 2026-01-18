<?php

namespace App\Service;

use App\Entity\Competition\Competition;
use App\Entity\Competition\Team;
use App\Entity\CompetitionTeamSnapshot;
use App\Repository\CompetitionTeamSnapshotRepository;
use Doctrine\ORM\EntityManagerInterface;

final class CompetitionSnapshotService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private CompetitionTeamSnapshotRepository $snapshotRepository
    ) {
    }

    /**
     * Crée les snapshots pour toutes les équipes d'une compétition terminée
     */
    public function createSnapshotsForCompetition(Competition $competition, bool $force = false): void
    {
        // Vérifier si les snapshots existent déjà
        if (!$force) {
            $existingSnapshots = $this->snapshotRepository->findBy(['competition' => $competition]);
            if (!empty($existingSnapshots)) {
                // Les snapshots existent déjà, ne pas les recréer
                return;
            }
        } else {
            // Supprimer les snapshots existants si on force la recréation
            $existingSnapshots = $this->snapshotRepository->findBy(['competition' => $competition]);
            foreach ($existingSnapshots as $snapshot) {
                $this->entityManager->remove($snapshot);
            }
            $this->entityManager->flush();
        }

        // Récupérer toutes les équipes de la compétition (actives et inactives)
        // Utiliser une requête DQL pour s'assurer de récupérer toutes les équipes avec leurs membres
        // IMPORTANT : Ne pas filtrer par isActive pour inclure toutes les équipes qui ont participé
        $qb = $this->entityManager->createQueryBuilder();
        $teams = $qb->select('t', 'm')
            ->from(\App\Entity\Competition\Team::class, 't')
            ->leftJoin('t.members', 'm')
            ->where('t.competition = :competitionId')
            ->setParameter('competitionId', $competition->getId())
            ->getQuery()
            ->getResult();

        foreach ($teams as $team) {
            // Créer un snapshot pour cette équipe
            $snapshot = new CompetitionTeamSnapshot();
            $snapshot->setCompetition($competition);
            $snapshot->setTeam($team);
            $snapshot->setTeamName($team->getName());
            $snapshot->setRegistrationNumber($team->getRegistrationNumber());
            $snapshot->setTotalScore($team->getTotalScore() ?? 0);
            
            // Stocker les membres dans un tableau JSON
            // Important : récupérer les membres depuis la collection qui a été chargée
            // Si l'équipe a été supprimée et que tous les membres ont quitté, 
            // on doit quand même créer le snapshot avec les membres vides
            // MAIS on devrait récupérer les membres depuis les prises (caughtBy) si possible
            $membersData = [];
            
            // D'abord, essayer de récupérer les membres depuis la collection
            foreach ($team->getMembers() as $member) {
                $membersData[] = [
                    'id' => $member->getId(),
                    'firstname' => $member->getFirstname(),
                    'lastname' => $member->getLastname(),
                ];
            }
            
            // Si aucun membre trouvé, essayer de les récupérer depuis les prises
            if (empty($membersData)) {
                $catches = $team->getCatches();
                $foundMembers = [];
                foreach ($catches as $catch) {
                    $caughtBy = $catch->getCaughtBy();
                    if ($caughtBy && !isset($foundMembers[$caughtBy->getId()])) {
                        $foundMembers[$caughtBy->getId()] = true;
                        $membersData[] = [
                            'id' => $caughtBy->getId(),
                            'firstname' => $caughtBy->getFirstname(),
                            'lastname' => $caughtBy->getLastname(),
                        ];
                    }
                }
            }
            
            $snapshot->setMembers($membersData);
            $snapshot->setSnapshotDate(new \DateTime());

            $this->entityManager->persist($snapshot);
        }

        $this->entityManager->flush();
    }

    /**
     * Récupère les snapshots d'une compétition
     */
    public function getSnapshotsForCompetition(Competition $competition): array
    {
        return $this->snapshotRepository->findBy(
            ['competition' => $competition],
            ['totalScore' => 'DESC']
        );
    }

    /**
     * Vérifie si des snapshots existent pour une compétition
     */
    public function hasSnapshots(Competition $competition): bool
    {
        return $this->snapshotRepository->count(['competition' => $competition]) > 0;
    }
}
