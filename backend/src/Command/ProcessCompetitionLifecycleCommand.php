<?php

namespace App\Command;

use App\Entity\Competition\Competition;
use App\Repository\Competition\CompetitionRepository;
use App\Repository\NotificationRepository;
use App\Service\NotificationService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:process-competition-lifecycle',
    description: 'Notifie le début et la fin des compétitions (à lancer chaque minute avec les pauses)',
)]
class ProcessCompetitionLifecycleCommand extends Command
{
    public function __construct(
        private readonly CompetitionRepository $competitionRepository,
        private readonly NotificationRepository $notificationRepository,
        private readonly NotificationService $notificationService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $now = new \DateTime('now', new \DateTimeZone('UTC'));
        $windowStart = (clone $now)->modify('-15 minutes');
        $sent = 0;

        $competitions = $this->competitionRepository->createQueryBuilder('c')
            ->getQuery()
            ->getResult();

        /** @var Competition $competition */
        foreach ($competitions as $competition) {
            $start = $competition->getStartDate();
            $end = $competition->getEndDate();
            if (!$start || !$end) {
                continue;
            }

            if ($start <= $now && $start >= $windowStart && $end >= $now
                && !$this->alreadyNotified($competition->getId(), 'competition_started')) {
                $sent += $this->notifyMembers($competition, 'started');
            }

            if ($end < $now && $end >= $windowStart
                && !$this->alreadyNotified($competition->getId(), 'competition_ended')) {
                $sent += $this->notifyMembers($competition, 'ended');
            }
        }

        $io->success(sprintf('%d notification(s) de cycle de vie envoyée(s)', $sent));

        return Command::SUCCESS;
    }

    private function alreadyNotified(?int $competitionId, string $type): bool
    {
        if (!$competitionId) {
            return true;
        }
        $like = '%"competitionId":'.$competitionId.'%';
        $count = (int) $this->notificationRepository->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.type = :type')
            ->andWhere('n.data LIKE :like')
            ->setParameter('type', $type)
            ->setParameter('like', $like)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    private function notifyMembers(Competition $competition, string $event): int
    {
        $sent = 0;
        foreach ($competition->getTeams() as $team) {
            foreach ($team->getMembers() as $member) {
                try {
                    if ($event === 'started') {
                        $this->notificationService->notifyCompetitionStarted(
                            $member,
                            $competition->getName(),
                            (int) $competition->getId()
                        );
                    } else {
                        $this->notificationService->notifyCompetitionEnded(
                            $member,
                            $competition->getName(),
                            (int) $competition->getId()
                        );
                    }
                    $sent++;
                } catch (\Throwable $e) {
                    // Ne pas bloquer les autres membres
                }
            }
        }

        return $sent;
    }
}
