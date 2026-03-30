<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Bonus paramétrables + quota par espèce
 * - new_species_bonus_enabled, new_species_bonus_points (Competition)
 * - quota_bonus_enabled, quota_bonus_points (Competition)
 * - quota (CompetitionSpecies)
 */
final class Version20260124200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Bonus nouvelle espèce et quota paramétrables, quota par espèce';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD new_species_bonus_enabled TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE competitions ADD new_species_bonus_points INT DEFAULT NULL');
        $this->addSql('ALTER TABLE competitions ADD quota_bonus_enabled TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE competitions ADD quota_bonus_points INT DEFAULT NULL');
        $this->addSql('ALTER TABLE competition_species ADD quota INT DEFAULT NULL');

        // Migration : si is_bonus_enabled = 1, activer new_species_bonus avec 50 pts par défaut
        $this->addSql("UPDATE competitions SET new_species_bonus_enabled = is_bonus_enabled, new_species_bonus_points = 50 WHERE is_bonus_enabled = 1");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions DROP new_species_bonus_enabled');
        $this->addSql('ALTER TABLE competitions DROP new_species_bonus_points');
        $this->addSql('ALTER TABLE competitions DROP quota_bonus_enabled');
        $this->addSql('ALTER TABLE competitions DROP quota_bonus_points');
        $this->addSql('ALTER TABLE competition_species DROP quota');
    }
}
