<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260527153000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création de la table team_penalty (points retirés au score)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE team_penalty (
                id INT AUTO_INCREMENT NOT NULL,
                team_id INT NOT NULL,
                fish_catch_id INT DEFAULT NULL,
                points INT NOT NULL,
                reason LONGTEXT DEFAULT NULL,
                created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                created_by_id INT DEFAULT NULL,
                INDEX IDX_PEN_TEAM (team_id),
                INDEX IDX_PEN_CATCH (fish_catch_id),
                INDEX IDX_PEN_CREATED_BY (created_by_id),
                PRIMARY KEY(id),
                CONSTRAINT FK_PEN_TEAM FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
                CONSTRAINT FK_PEN_CATCH FOREIGN KEY (fish_catch_id) REFERENCES fish_catch (id) ON DELETE SET NULL,
                CONSTRAINT FK_PEN_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
            SQL
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE team_penalty');
    }
}
