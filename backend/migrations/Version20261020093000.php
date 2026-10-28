<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261020093000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Créateur de compétition et affectation commissaire / gestionnaire';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competitions ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE competitions ADD CONSTRAINT FK_COMPETITION_CREATED_BY FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_COMPETITION_CREATED_BY ON competitions (created_by_id)');
        $this->addSql('CREATE TABLE competition_staff (id INT AUTO_INCREMENT NOT NULL, competition_id INT NOT NULL, user_id INT NOT NULL, role VARCHAR(20) NOT NULL, UNIQUE INDEX competition_staff_unique (competition_id, user_id), INDEX IDX_COMP_STAFF_COMP (competition_id), INDEX IDX_COMP_STAFF_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE competition_staff ADD CONSTRAINT FK_COMP_STAFF_COMP FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE competition_staff ADD CONSTRAINT FK_COMP_STAFF_USER FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition_staff DROP FOREIGN KEY FK_COMP_STAFF_COMP');
        $this->addSql('ALTER TABLE competition_staff DROP FOREIGN KEY FK_COMP_STAFF_USER');
        $this->addSql('DROP TABLE competition_staff');
        $this->addSql('ALTER TABLE competitions DROP FOREIGN KEY FK_COMPETITION_CREATED_BY');
        $this->addSql('DROP INDEX IDX_COMPETITION_CREATED_BY ON competitions');
        $this->addSql('ALTER TABLE competitions DROP created_by_id');
    }
}
