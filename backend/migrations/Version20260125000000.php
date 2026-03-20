<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajout de la colonne reglement à la table competitions.
 */
final class Version20260125000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la colonne reglement (LONGTEXT) à la table competitions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD reglement LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions DROP COLUMN reglement');
    }
}
