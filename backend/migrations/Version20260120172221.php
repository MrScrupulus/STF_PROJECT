<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260120172221 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE competition_species (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, species_id INT NOT NULL, coefficient DOUBLE PRECISION NOT NULL, is_bonus_enabled TINYINT(1) DEFAULT 0 NOT NULL, base_points INT DEFAULT NULL, INDEX IDX_BABA37BC7B39D312 (competition_id), INDEX IDX_BABA37BCB2A1D860 (species_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE competition_species ADD CONSTRAINT FK_BABA37BC7B39D312 FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE competition_species ADD CONSTRAINT FK_BABA37BCB2A1D860 FOREIGN KEY (species_id) REFERENCES species (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE competition_species DROP FOREIGN KEY FK_BABA37BC7B39D312');
        $this->addSql('ALTER TABLE competition_species DROP FOREIGN KEY FK_BABA37BCB2A1D860');
        $this->addSql('DROP TABLE competition_species');
    }
}
