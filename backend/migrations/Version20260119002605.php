<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260119002605 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE competition_perimeters (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, coordinates JSON NOT NULL COMMENT \'(DC2Type:json)\', name VARCHAR(255) DEFAULT NULL, is_active TINYINT(1) DEFAULT 1 NOT NULL, INDEX IDX_CB87B7AD7B39D312 (competition_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE competition_perimeters ADD CONSTRAINT FK_CB87B7AD7B39D312 FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE fish_catch ADD latitude NUMERIC(10, 8) DEFAULT NULL, ADD longitude NUMERIC(11, 8) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE competition_perimeters DROP FOREIGN KEY FK_CB87B7AD7B39D312');
        $this->addSql('DROP TABLE competition_perimeters');
        $this->addSql('ALTER TABLE fish_catch DROP latitude, DROP longitude');
    }
}
