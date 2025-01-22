<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240122000003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create competition_team_members table for team members relationship';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE competition_team_members (
            team_id INT NOT NULL,
            user_id INT NOT NULL,
            INDEX IDX_team_members_team (team_id),
            INDEX IDX_team_members_user (user_id),
            PRIMARY KEY(team_id, user_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE competition_team_members 
            ADD CONSTRAINT FK_team_members_team 
            FOREIGN KEY (team_id) 
            REFERENCES teams (id) ON DELETE CASCADE');

        $this->addSql('ALTER TABLE competition_team_members 
            ADD CONSTRAINT FK_team_members_user 
            FOREIGN KEY (user_id) 
            REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE competition_team_members');
    }
}
