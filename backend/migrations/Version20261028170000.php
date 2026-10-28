<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Manches gratuites/payantes et publiques/privées';
    }

    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD is_paid TINYINT(1) DEFAULT 0 NOT NULL, ADD is_private TINYINT(1) DEFAULT 0 NOT NULL, ADD access_code VARCHAR(16) DEFAULT NULL');
        $this->addSql('UPDATE competitions SET is_paid = 1 WHERE has_no_limit = 1 OR (max_participants IS NOT NULL AND max_participants > 20)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions DROP is_paid, DROP is_private, DROP access_code');
    }
}
