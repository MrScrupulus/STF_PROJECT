<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260118140638 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE fish_catch DROP FOREIGN KEY FK_fish_catch_team');
        $this->addSql('ALTER TABLE fish_catch DROP FOREIGN KEY FK_ABA48914B2A1D860');
        $this->addSql('ALTER TABLE fish_catch CHANGE photo_url photo_url LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE password_reset_tokens DROP FOREIGN KEY FK_password_reset_user');
        $this->addSql('ALTER TABLE teams DROP FOREIGN KEY FK_96C222587B39D312');
        $this->addSql('ALTER TABLE competition_team_members DROP FOREIGN KEY FK_D4C5E5CA76ED395');
        $this->addSql('ALTER TABLE competition_team_members DROP FOREIGN KEY FK_team_members_team');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE fish_catch CHANGE photo_url photo_url VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE password_reset_tokens ADD CONSTRAINT FK_password_reset_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }
}
