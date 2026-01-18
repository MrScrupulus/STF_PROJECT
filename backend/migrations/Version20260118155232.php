<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118155232 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE competitions ADD is_ranking_public TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE fish_catch RENAME INDEX idx_fish_catch_caught_by TO IDX_ABA489141715B1D3');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE competitions DROP is_ranking_public');
        $this->addSql('ALTER TABLE fish_catch RENAME INDEX idx_aba489141715b1d3 TO IDX_FISH_CATCH_CAUGHT_BY');
    }
}
