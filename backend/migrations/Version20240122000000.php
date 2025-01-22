<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240122000000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        // Users table
        $this->addSql('CREATE TABLE users (
            id INT AUTO_INCREMENT NOT NULL,
            email VARCHAR(180) NOT NULL,
            roles JSON NOT NULL,
            password VARCHAR(255) NOT NULL,
            subscriber_number VARCHAR(50) DEFAULT NULL,
            firstname VARCHAR(255) NOT NULL,
            lastname VARCHAR(255) NOT NULL,
            country VARCHAR(255) DEFAULT NULL,
            phone_number VARCHAR(50) DEFAULT NULL,
            birth_date DATE DEFAULT NULL,
            verification_token VARCHAR(100) DEFAULT NULL,
            is_verified TINYINT(1) NOT NULL,
            UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Teams table
        $this->addSql('CREATE TABLE teams (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(255) NOT NULL,
            competition_id INT DEFAULT NULL,
            registration_number INT DEFAULT NULL,
            total_score INT DEFAULT 0,
            has_bonus TINYINT(1) DEFAULT 0,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Competition table
        $this->addSql('CREATE TABLE competitions (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(255) NOT NULL,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            team_size INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            max_participants INT DEFAULT NULL,
            has_no_limit TINYINT(1) DEFAULT 0 NOT NULL,
            description LONGTEXT DEFAULT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Species table
        $this->addSql('CREATE TABLE species (
            id INT AUTO_INCREMENT NOT NULL,
            name VARCHAR(255) NOT NULL,
            coefficient DOUBLE PRECISION NOT NULL,
            base_points INT NOT NULL,
            is_bonus TINYINT(1) DEFAULT 0 NOT NULL,
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Team members table
        $this->addSql('CREATE TABLE competition_team_members (
            team_id INT NOT NULL,
            user_id INT NOT NULL,
            INDEX IDX_team_members_team (team_id),
            INDEX IDX_team_members_user (user_id),
            PRIMARY KEY(team_id, user_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Fish catch table
        $this->addSql('CREATE TABLE fish_catch (
            id INT AUTO_INCREMENT NOT NULL,
            team_id INT NOT NULL,
            species_id INT NOT NULL,
            size DOUBLE PRECISION NOT NULL,
            photo VARCHAR(255) DEFAULT NULL,
            points INT NOT NULL,
            is_validated TINYINT(1) DEFAULT 0 NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX IDX_fish_catch_team (team_id),
            INDEX IDX_fish_catch_species (species_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Password Reset Tokens table
        $this->addSql('CREATE TABLE password_reset_tokens (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            INDEX IDX_password_reset_user (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Invalidated Tokens table
        $this->addSql('CREATE TABLE invalidated_tokens (
            id INT AUTO_INCREMENT NOT NULL,
            jti VARCHAR(255) NOT NULL,
            expiration_date DATETIME NOT NULL,
            PRIMARY KEY(id),
            UNIQUE INDEX UNIQ_invalidated_tokens_jti (jti)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Refresh Tokens table
        $this->addSql('CREATE TABLE refresh_tokens (
            id INT AUTO_INCREMENT NOT NULL,
            refresh_token VARCHAR(128) NOT NULL,
            username VARCHAR(255) NOT NULL,
            valid DATETIME NOT NULL,
            UNIQUE INDEX UNIQ_refresh_tokens_refresh_token (refresh_token),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Foreign keys
        $this->addSql('ALTER TABLE teams ADD CONSTRAINT FK_teams_competition FOREIGN KEY (competition_id) REFERENCES competitions (id)');
        $this->addSql('ALTER TABLE competition_team_members ADD CONSTRAINT FK_team_members_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE competition_team_members ADD CONSTRAINT FK_team_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE fish_catch ADD CONSTRAINT FK_fish_catch_team FOREIGN KEY (team_id) REFERENCES teams (id)');
        $this->addSql('ALTER TABLE fish_catch ADD CONSTRAINT FK_fish_catch_species FOREIGN KEY (species_id) REFERENCES species (id)');
        $this->addSql('ALTER TABLE password_reset_tokens ADD CONSTRAINT FK_password_reset_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE fish_catch');
        $this->addSql('DROP TABLE competition_team_members');
        $this->addSql('DROP TABLE teams');
        $this->addSql('DROP TABLE competitions');
        $this->addSql('DROP TABLE species');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE password_reset_tokens');
        $this->addSql('DROP TABLE invalidated_tokens');
        $this->addSql('DROP TABLE refresh_tokens');
    }
}
