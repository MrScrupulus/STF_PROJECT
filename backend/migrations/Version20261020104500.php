<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261020104500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Invitations commissaire par e-mail, à accepter';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE competition_staff_invitations (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, invited_user_id INT DEFAULT NULL, invited_by_id INT NOT NULL, email VARCHAR(180) NOT NULL, role VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL, responded_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_STAFF_INV_TOKEN (token), INDEX IDX_STAFF_INV_COMP (competition_id), INDEX IDX_STAFF_INV_USER (invited_user_id), INDEX IDX_STAFF_INV_BY (invited_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE competition_staff_invitations ADD CONSTRAINT FK_STAFF_INV_COMP FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE competition_staff_invitations ADD CONSTRAINT FK_STAFF_INV_USER FOREIGN KEY (invited_user_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE competition_staff_invitations ADD CONSTRAINT FK_STAFF_INV_BY FOREIGN KEY (invited_by_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition_staff_invitations DROP FOREIGN KEY FK_STAFF_INV_COMP');
        $this->addSql('ALTER TABLE competition_staff_invitations DROP FOREIGN KEY FK_STAFF_INV_USER');
        $this->addSql('ALTER TABLE competition_staff_invitations DROP FOREIGN KEY FK_STAFF_INV_BY');
        $this->addSql('DROP TABLE competition_staff_invitations');
    }
}
