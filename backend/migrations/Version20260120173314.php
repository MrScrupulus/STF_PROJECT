<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260120173314 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Ajouter uniquement la colonne is_bonus_enabled à la table competitions
        // La table competition_species existe déjà (créée par la migration précédente)
        $this->addSql('ALTER TABLE competitions ADD is_bonus_enabled TINYINT(1) DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // Retirer uniquement la colonne is_bonus_enabled de la table competitions
        // Ne pas supprimer la table competition_species (gérée par la migration précédente)
        $this->addSql('ALTER TABLE competitions DROP is_bonus_enabled');
    }
}
