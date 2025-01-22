<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240122000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add missing columns to teams table';
    }

    public function up(Schema $schema): void
    {
        // Ajouter les colonnes manquantes si elles n'existent pas
        $this->addSql('ALTER TABLE teams 
            ADD COLUMN IF NOT EXISTS registration_number INT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS total_score INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS has_bonus TINYINT(1) DEFAULT 0
        ');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams 
            DROP COLUMN registration_number,
            DROP COLUMN total_score,
            DROP COLUMN has_bonus
        ');
    }
}
