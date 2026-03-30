<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260124220000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remplacer reglement_image_path par reglement_image_paths (JSON array)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD reglement_image_paths JSON DEFAULT NULL');

        // Migrer les données : reglement_image_path -> [path] dans reglement_image_paths
        $this->addSql("UPDATE competitions SET reglement_image_paths = JSON_ARRAY(reglement_image_path) WHERE reglement_image_path IS NOT NULL AND reglement_image_path != ''");

        $this->addSql('ALTER TABLE competitions DROP reglement_image_path');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD reglement_image_path VARCHAR(255) DEFAULT NULL');
        $this->addSql("UPDATE competitions SET reglement_image_path = JSON_UNQUOTE(JSON_EXTRACT(reglement_image_paths, '$[0]')) WHERE reglement_image_paths IS NOT NULL AND JSON_LENGTH(reglement_image_paths) > 0");
        $this->addSql('ALTER TABLE competitions DROP reglement_image_paths');
    }
}
