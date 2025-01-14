<?php

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class VersionXXXXXXXXXXXXXX extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition ADD has_no_limit TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE competition ADD team_size INT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE competition DROP has_no_limit');
        $this->addSql('ALTER TABLE competition DROP team_size');
    }
} 