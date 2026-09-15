<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260913183000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Jaquette image des compétitions (cover_image_path)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD cover_image_path VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions DROP cover_image_path');
    }
}
