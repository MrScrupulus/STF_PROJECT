<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajout de la colonne max_fish_counted à la table competitions.
 * Nombre de poissons comptabilisés pour le score (NULL = tous, valeur = top N).
 */
final class Version20260125140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la colonne max_fish_counted (INT NULL) à la table competitions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD max_fish_counted INT DEFAULT NULL');
        $this->addSql('UPDATE competitions SET max_fish_counted = 5 WHERE max_fish_counted IS NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions DROP COLUMN max_fish_counted');
    }
}
