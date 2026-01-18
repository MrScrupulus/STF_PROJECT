<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118183502 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE competition_team_snapshots (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, team_id INT NOT NULL, team_name VARCHAR(255) NOT NULL, registration_number INT DEFAULT NULL, total_score INT NOT NULL, members JSON NOT NULL COMMENT \'(DC2Type:json)\', snapshot_date DATETIME NOT NULL, INDEX IDX_2CB52EF07B39D312 (competition_id), INDEX IDX_2CB52EF0296CD8AE (team_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE competition_team_snapshots ADD CONSTRAINT FK_2CB52EF07B39D312 FOREIGN KEY (competition_id) REFERENCES competitions (id)');
        $this->addSql('ALTER TABLE competition_team_snapshots ADD CONSTRAINT FK_2CB52EF0296CD8AE FOREIGN KEY (team_id) REFERENCES teams (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE competition_team_snapshots DROP FOREIGN KEY FK_2CB52EF07B39D312');
        $this->addSql('ALTER TABLE competition_team_snapshots DROP FOREIGN KEY FK_2CB52EF0296CD8AE');
        $this->addSql('DROP TABLE competition_team_snapshots');
    }
}
