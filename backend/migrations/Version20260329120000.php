<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260329120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Équipe « journal personnel » : flag is_personal_journal sur teams';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams ADD is_personal_journal TINYINT(1) DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE teams DROP is_personal_journal');
    }
}
