<?php

namespace App\Command;

use App\Repository\Competition\ScheduledPauseRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:process-scheduled-pauses',
    description: 'Vérifie et active/désactive automatiquement les pauses programmées des compétitions',
)]
class ProcessScheduledPausesCommand extends Command
{
    public function __construct(
        private ScheduledPauseRepository $scheduledPauseRepository,
        private EntityManagerInterface $entityManager,
        private NotificationService $notificationService
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Traitement des pauses programmées');

        // Les dates en base sont en UTC, on doit comparer avec l'heure UTC
        $now = new \DateTime('now', new \DateTimeZone('UTC'));
        $processed = 0;

        // Debug: afficher l'heure actuelle (UTC et Europe/Paris)
        $nowParis = clone $now;
        $nowParis->setTimezone(new \DateTimeZone('Europe/Paris'));
        $io->note('Heure actuelle (UTC): ' . $now->format('Y-m-d H:i:s') . ' / (Europe/Paris): ' . $nowParis->format('Y-m-d H:i:s'));

        // Vérifier les pauses qui doivent être activées
        $pausesToActivate = $this->scheduledPauseRepository->findPausesToActivate();
        
        // Debug: afficher le nombre de pauses trouvées
        $io->note('Pauses à activer trouvées: ' . count($pausesToActivate));
        
        foreach ($pausesToActivate as $pause) {
            $competition = $pause->getCompetition();
            
            // Si la compétition n'est pas déjà en pause manuelle, activer la pause programmée
            if (!$competition->getIsPaused()) {
                $competition->setIsPaused(true);
                $this->entityManager->flush();
                
                // Notifier tous les membres des équipes inscrites
                foreach ($competition->getTeams() as $team) {
                    foreach ($team->getMembers() as $member) {
                        try {
                            $this->notificationService->notifyCompetitionPaused(
                                $member,
                                $competition->getName(),
                                $competition->getId()
                            );
                        } catch (\Exception $e) {
                            error_log('Erreur lors de la notification de pause programmée: ' . $e->getMessage());
                        }
                    }
                }
                
                $io->success(sprintf(
                    'Pause programmée activée pour la compétition "%s" (du %s au %s)',
                    $competition->getName(),
                    $pause->getStartDate()->format('Y-m-d H:i'),
                    $pause->getEndDate()->format('Y-m-d H:i')
                ));
                $processed++;
            }
        }

        // Vérifier les pauses qui doivent être désactivées
        $pausesToDeactivate = $this->scheduledPauseRepository->findPausesToDeactivate();
        
        foreach ($pausesToDeactivate as $pause) {
            $competition = $pause->getCompetition();
            
            // Vérifier s'il n'y a pas d'autres pauses programmées actives
            $activePauses = $this->scheduledPauseRepository->findActiveByCompetition($competition->getId());
            $hasOtherActivePause = false;
            
            foreach ($activePauses as $activePause) {
                if ($activePause->getId() !== $pause->getId() && $activePause->isCurrentlyActive()) {
                    $hasOtherActivePause = true;
                    break;
                }
            }
            
            // Si aucune autre pause n'est active, désactiver la pause de la compétition
            if (!$hasOtherActivePause && $competition->getIsPaused()) {
                $competition->setIsPaused(false);
                $this->entityManager->flush();
                
                // Notifier tous les membres des équipes inscrites
                foreach ($competition->getTeams() as $team) {
                    foreach ($team->getMembers() as $member) {
                        try {
                            $this->notificationService->notifyCompetitionResumed(
                                $member,
                                $competition->getName(),
                                $competition->getId()
                            );
                        } catch (\Exception $e) {
                            error_log('Erreur lors de la notification de reprise programmée: ' . $e->getMessage());
                        }
                    }
                }
                
                $io->success(sprintf(
                    'Pause programmée terminée pour la compétition "%s" - Reprise automatique',
                    $competition->getName()
                ));
                $processed++;
            }
        }

        if ($processed === 0) {
            $io->info('Aucune pause programmée à traiter');
        } else {
            $io->success(sprintf('%d pause(s) programmée(s) traitée(s)', $processed));
        }

        return Command::SUCCESS;
    }
}
