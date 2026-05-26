<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Bonus quota atteint : points configurables par espèce (competition_species.quota_bonus_points).
 */
final class Version20260526153000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add quota_bonus_points on competition_species (nullable fallback to competition)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition_species ADD quota_bonus_points INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition_species DROP quota_bonus_points');
    }
}
