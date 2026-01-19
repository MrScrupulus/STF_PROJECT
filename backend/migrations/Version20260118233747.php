<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118233747 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE scheduled_pauses (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, reason LONGTEXT DEFAULT NULL, is_active TINYINT(1) DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, INDEX IDX_699C4F457B39D312 (competition_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE scheduled_pauses ADD CONSTRAINT FK_699C4F457B39D312 FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE scheduled_pauses DROP FOREIGN KEY FK_699C4F457B39D312');
        $this->addSql('DROP TABLE scheduled_pauses');
    }
}
