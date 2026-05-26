<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Bonus quota uniquement par espèce : transfert de competitions.quota_bonus_points vers competition_species puis suppression de la colonne globale.
 */
final class Version20260526210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Migrate global quota_bonus_points into competition_species then drop competitions.quota_bonus_points';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            <<<SQL
            UPDATE competition_species cs
            INNER JOIN competitions c ON cs.competition_id = c.id
            SET cs.quota_bonus_points = c.quota_bonus_points
            WHERE c.quota_bonus_enabled = 1
              AND cs.quota IS NOT NULL
              AND (cs.quota_bonus_points IS NULL OR cs.quota_bonus_points < 1)
              AND c.quota_bonus_points IS NOT NULL
              AND c.quota_bonus_points > 0
            SQL
        );
        $this->addSql('ALTER TABLE competitions DROP quota_bonus_points');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD quota_bonus_points INT DEFAULT NULL');
        // Les valeurs globales ne sont pas reconstructibles de façon fiable ; colonne vide au rollback.
    }
}
