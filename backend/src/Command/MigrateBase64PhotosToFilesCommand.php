<?php

namespace App\Command;

use App\Repository\Competition\FishCatchRepository;
use App\Service\CatchPhotoStorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:migrate-base64-photos-to-files',
    description: 'Migre les photos stockées en base64 (data:image/...) vers des fichiers catches/AAAA/MM/competitionId/ pour alléger la BDD',
)]
class MigrateBase64PhotosToFilesCommand extends Command
{
    public function __construct(
        private FishCatchRepository $fishCatchRepository,
        private CatchPhotoStorageService $photoStorage,
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Affiche ce qui serait fait sans modifier la BDD');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = $input->getOption('dry-run');

        $io->title('Migration des photos base64 vers fichiers');

        // Récupérer uniquement les IDs (requête légère, évite de charger les blobs base64 en mémoire)
        $ids = $this->fishCatchRepository->findIdsWithBase64Photos();
        $count = \count($ids);

        if (0 === $count) {
            $io->success('Aucune photo base64 à migrer.');
            return Command::SUCCESS;
        }

        if ($dryRun) {
            $io->note(sprintf('Mode dry-run : %d prise(s) seraient migrée(s) sans modification.', $count));
        } else {
            $io->note(sprintf('%d prise(s) à migrer.', $count));
        }

        $migrated = 0;
        $errors = 0;

        foreach ($ids as $id) {
            $catch = $this->fishCatchRepository->find($id);
            if (!$catch) {
                continue;
            }

            $photoUrl = $catch->getPhotoUrl();
            if (!$photoUrl || !str_starts_with($photoUrl, 'data:')) {
                $this->entityManager->clear();
                continue;
            }

            $competition = $catch->getCompetition();
            if (!$competition) {
                $io->warning(sprintf('Prise #%d : aucune compétition associée, migration ignorée.', $catch->getId()));
                $this->entityManager->clear();
                continue;
            }

            try {
                $storedPath = $this->photoStorage->save($photoUrl, $competition->getId());
                if (!$dryRun) {
                    $catch->setPhotoUrl($storedPath);
                    $this->entityManager->flush();
                }
                $io->writeln(sprintf('  [<info>OK</info>] Prise #%d → %s', $catch->getId(), $storedPath));
                ++$migrated;
            } catch (\Throwable $e) {
                $io->error(sprintf('  [ERREUR] Prise #%d : %s', $catch->getId(), $e->getMessage()));
                ++$errors;
            }

            // Libérer la mémoire (les blobs base64 sont volumineux)
            $this->entityManager->clear();
        }

        $io->newLine();
        if ($dryRun) {
            $io->success(sprintf('Dry-run : %d migration(s) simulée(s), %d erreur(s).', $migrated, $errors));
        } else {
            $io->success(sprintf('%d photo(s) migrée(s) vers catches/, %d erreur(s).', $migrated, $errors));
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
