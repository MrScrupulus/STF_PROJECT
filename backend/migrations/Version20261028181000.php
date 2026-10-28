<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028181000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Invitations pêcheurs (manches privées) et plafond gratuit à 16';
    }

    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE competition_participant_invitations (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, invited_user_id INT DEFAULT NULL, invited_by_id INT NOT NULL, email VARCHAR(180) NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX uniq_comp_participant_invite_email (competition_id, email), INDEX IDX_CPINV_COMP (competition_id), INDEX IDX_CPINV_USER (invited_user_id), INDEX IDX_CPINV_BY (invited_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE competition_participant_invitations ADD CONSTRAINT FK_CPINV_COMP FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE competition_participant_invitations ADD CONSTRAINT FK_CPINV_USER FOREIGN KEY (invited_user_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE competition_participant_invitations ADD CONSTRAINT FK_CPINV_BY FOREIGN KEY (invited_by_id) REFERENCES users (id) ON DELETE CASCADE');
        $this->addSql('UPDATE competitions SET max_participants = 16 WHERE is_paid = 0 AND max_participants IS NOT NULL AND max_participants > 16');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition_participant_invitations DROP FOREIGN KEY FK_CPINV_COMP');
        $this->addSql('ALTER TABLE competition_participant_invitations DROP FOREIGN KEY FK_CPINV_USER');
        $this->addSql('ALTER TABLE competition_participant_invitations DROP FOREIGN KEY FK_CPINV_BY');
        $this->addSql('DROP TABLE competition_participant_invitations');
    }
}
