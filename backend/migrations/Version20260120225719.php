<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260120225719 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE notification_preferences (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, expo_push_token VARCHAR(255) DEFAULT NULL, catch_validated TINYINT(1) DEFAULT 1 NOT NULL, catch_rejected TINYINT(1) DEFAULT 1 NOT NULL, team_invitation TINYINT(1) DEFAULT 1 NOT NULL, competition_registered TINYINT(1) DEFAULT 1 NOT NULL, competition_started TINYINT(1) DEFAULT 1 NOT NULL, competition_ended TINYINT(1) DEFAULT 1 NOT NULL, competition_paused TINYINT(1) DEFAULT 1 NOT NULL, competition_resumed TINYINT(1) DEFAULT 1 NOT NULL, catch_pending TINYINT(1) DEFAULT 1 NOT NULL, updated_at DATETIME DEFAULT NULL, UNIQUE INDEX user_unique (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE notification_preferences ADD CONSTRAINT FK_3CAA95B4A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE notification_preferences DROP FOREIGN KEY FK_3CAA95B4A76ED395');
        $this->addSql('DROP TABLE notification_preferences');
    }
}
