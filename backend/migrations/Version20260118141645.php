<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118141645 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add caught_by column to fish_catch table to track which team member caught the fish.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fish_catch ADD caught_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE fish_catch ADD CONSTRAINT FK_FISH_CATCH_CAUGHT_BY FOREIGN KEY (caught_by_id) REFERENCES users (id)');
        $this->addSql('CREATE INDEX IDX_FISH_CATCH_CAUGHT_BY ON fish_catch (caught_by_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fish_catch DROP FOREIGN KEY FK_FISH_CATCH_CAUGHT_BY');
        $this->addSql('DROP INDEX IDX_FISH_CATCH_CAUGHT_BY ON fish_catch');
        $this->addSql('ALTER TABLE fish_catch DROP caught_by_id');
    }
}
