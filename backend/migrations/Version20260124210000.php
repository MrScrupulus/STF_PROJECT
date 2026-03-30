<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260124210000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute reglement_image_path pour image du règlement (stock/reglements/)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD reglement_image_path VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions DROP reglement_image_path');
    }
}
