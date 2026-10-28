<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028190000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Code personnel nominatif sur les invitations pêcheurs';
    }

    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition_participant_invitations ADD code VARCHAR(16) DEFAULT NULL');
    }

    public function postUp(Schema $schema): void
    {
        $rows = $this->connection->fetchAllAssociative(
            'SELECT id FROM competition_participant_invitations WHERE code IS NULL OR code = \'\''
        );
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        foreach ($rows as $row) {
            do {
                $code = '';
                for ($i = 0; $i < 6; ++$i) {
                    $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
                }
                $exists = $this->connection->fetchOne(
                    'SELECT id FROM competition_participant_invitations WHERE code = ?',
                    [$code]
                );
            } while ($exists);
            $this->connection->update(
                'competition_participant_invitations',
                ['code' => $code],
                ['id' => $row['id']]
            );
        }
        $this->connection->executeStatement('ALTER TABLE competition_participant_invitations MODIFY code VARCHAR(16) NOT NULL');
        $this->connection->executeStatement('CREATE UNIQUE INDEX UNIQ_CPINV_CODE ON competition_participant_invitations (code)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_CPINV_CODE ON competition_participant_invitations');
        $this->addSql('ALTER TABLE competition_participant_invitations DROP code');
    }
}
