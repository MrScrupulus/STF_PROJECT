<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240122000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add registration_number to teams table';
    }

    public function up(Schema $schema): void
    {
        // Vérifier si la colonne existe déjà
        $columns = $this->connection->createSchemaManager()->listTableColumns('teams');
        if (!isset($columns['registration_number'])) {
            $this->addSql('ALTER TABLE teams ADD registration_number INT DEFAULT NULL');
        }
    }

    public function down(Schema $schema): void
    {
        // Vérifier si la colonne existe avant de la supprimer
        $columns = $this->connection->createSchemaManager()->listTableColumns('teams');
        if (isset($columns['registration_number'])) {
            $this->addSql('ALTER TABLE teams DROP COLUMN registration_number');
        }
    }
}
