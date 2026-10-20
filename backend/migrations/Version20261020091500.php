<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261020091500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Préférence de notification « nouvelle compétition ouverte »';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification_preferences ADD competition_created TINYINT(1) DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification_preferences DROP competition_created');
    }
}
