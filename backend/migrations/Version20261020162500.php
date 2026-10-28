<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261020162500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Prise saisie par un officiel (créateur / commissaire)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fish_catch ADD recorded_by_id INT DEFAULT NULL, ADD recorded_by_role VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE fish_catch ADD CONSTRAINT FK_CATCH_RECORDED_BY FOREIGN KEY (recorded_by_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_CATCH_RECORDED_BY ON fish_catch (recorded_by_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE fish_catch DROP FOREIGN KEY FK_CATCH_RECORDED_BY');
        $this->addSql('DROP INDEX IDX_CATCH_RECORDED_BY ON fish_catch');
        $this->addSql('ALTER TABLE fish_catch DROP recorded_by_id, DROP recorded_by_role');
    }
}
