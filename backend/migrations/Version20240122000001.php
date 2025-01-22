<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240122000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add captain_id to teams table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams ADD captain_id INT NOT NULL');
        $this->addSql('ALTER TABLE teams ADD CONSTRAINT FK_teams_captain FOREIGN KEY (captain_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams DROP FOREIGN KEY FK_teams_captain');
        $this->addSql('ALTER TABLE teams DROP captain_id');
    }
} 