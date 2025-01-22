<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240122000004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove captain_id from teams table';
    }

    public function up(Schema $schema): void
    {
        // D'abord supprimer la contrainte de clé étrangère
        $this->addSql('ALTER TABLE teams DROP FOREIGN KEY FK_teams_captain');
        
        // Ensuite supprimer la colonne
        $this->addSql('ALTER TABLE teams DROP COLUMN captain_id');
    }

    public function down(Schema $schema): void
    {
        // Recréer la colonne
        $this->addSql('ALTER TABLE teams ADD COLUMN captain_id INT NULL');
        
        // Recréer la contrainte de clé étrangère
        $this->addSql('ALTER TABLE teams ADD CONSTRAINT FK_teams_captain 
            FOREIGN KEY (captain_id) REFERENCES users (id)');
    }
} 