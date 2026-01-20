<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260120215313 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE team_invitations (id INT AUTO_INCREMENT NOT NULL, team_id INT NOT NULL, invited_user_id INT NOT NULL, invited_by_id INT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, responded_at DATETIME DEFAULT NULL, INDEX IDX_C817FFE3296CD8AE (team_id), INDEX IDX_C817FFE3C58DAD6E (invited_user_id), INDEX IDX_C817FFE3A7B4A7E3 (invited_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE team_invitations ADD CONSTRAINT FK_C817FFE3296CD8AE FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE team_invitations ADD CONSTRAINT FK_C817FFE3C58DAD6E FOREIGN KEY (invited_user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE team_invitations ADD CONSTRAINT FK_C817FFE3A7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE team_invitations DROP FOREIGN KEY FK_C817FFE3296CD8AE');
        $this->addSql('ALTER TABLE team_invitations DROP FOREIGN KEY FK_C817FFE3C58DAD6E');
        $this->addSql('ALTER TABLE team_invitations DROP FOREIGN KEY FK_C817FFE3A7B4A7E3');
        $this->addSql('DROP TABLE team_invitations');
    }
}
