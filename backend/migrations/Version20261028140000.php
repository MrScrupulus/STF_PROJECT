<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Crédits de création de compétition';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE creation_credits (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            granted_by_id INT DEFAULT NULL,
            competition_id INT DEFAULT NULL,
            granted_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            expires_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            consumed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            cancelled_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            is_complimentary TINYINT(1) DEFAULT 1 NOT NULL,
            INDEX IDX_CREATION_CREDIT_USER (user_id),
            INDEX IDX_CREATION_CREDIT_GRANTED_BY (granted_by_id),
            INDEX IDX_CREATION_CREDIT_COMPETITION (competition_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE creation_credits ADD CONSTRAINT FK_CREATION_CREDIT_USER FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE creation_credits ADD CONSTRAINT FK_CREATION_CREDIT_GRANTED_BY FOREIGN KEY (granted_by_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE creation_credits ADD CONSTRAINT FK_CREATION_CREDIT_COMPETITION FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE SET NULL');
        $this->addSql("INSERT INTO creation_credits (user_id, granted_at, expires_at, is_complimentary)
            SELECT u.id, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 90 DAY), 1
            FROM users u
            WHERE u.roles LIKE '%ROLE_ORGANIZER%'
              AND u.roles NOT LIKE '%ROLE_ADMIN%'
              AND (u.is_deleted = 0 OR u.is_deleted IS NULL)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE creation_credits DROP FOREIGN KEY FK_CREATION_CREDIT_USER');
        $this->addSql('ALTER TABLE creation_credits DROP FOREIGN KEY FK_CREATION_CREDIT_GRANTED_BY');
        $this->addSql('ALTER TABLE creation_credits DROP FOREIGN KEY FK_CREATION_CREDIT_COMPETITION');
        $this->addSql('DROP TABLE creation_credits');
    }
}
