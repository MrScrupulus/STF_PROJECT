<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028153000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Disqualification d’équipe (manche) + snapshot';
    }

    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams ADD is_disqualified TINYINT(1) DEFAULT 0 NOT NULL, ADD disqualified_at DATETIME DEFAULT NULL, ADD disqualification_reason LONGTEXT DEFAULT NULL, ADD disqualified_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE teams ADD CONSTRAINT FK_TEAM_DISQUALIFIED_BY FOREIGN KEY (disqualified_by_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_TEAM_DISQUALIFIED_BY ON teams (disqualified_by_id)');
        $this->addSql('ALTER TABLE competition_team_snapshots ADD is_disqualified TINYINT(1) DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams DROP FOREIGN KEY FK_TEAM_DISQUALIFIED_BY');
        $this->addSql('DROP INDEX IDX_TEAM_DISQUALIFIED_BY ON teams');
        $this->addSql('ALTER TABLE teams DROP is_disqualified, DROP disqualified_at, DROP disqualification_reason, DROP disqualified_by_id');
        $this->addSql('ALTER TABLE competition_team_snapshots DROP is_disqualified');
    }
}
