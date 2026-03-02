<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260124130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add is_deleted to users for account anonymization';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD is_deleted TINYINT(1) DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP is_deleted');
    }
}
