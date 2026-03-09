<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Suppression des colonnes birth_date, country, subscriber_number devenues inutiles.
 */
final class Version20260324120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Supprime les colonnes birth_date, country, subscriber_number de la table users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP COLUMN birth_date');
        $this->addSql('ALTER TABLE users DROP COLUMN country');
        $this->addSql('ALTER TABLE users DROP COLUMN subscriber_number');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD birth_date DATE DEFAULT NULL');
        $this->addSql('ALTER TABLE users ADD country VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE users ADD subscriber_number VARCHAR(50) DEFAULT NULL');
    }
}
