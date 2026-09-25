<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260925022000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Plusieurs tokens Expo push par utilisateur (iPhone store + Expo Go + Android)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification_preferences ADD expo_push_tokens JSON DEFAULT NULL COMMENT \'(DC2Type:json)\'');
        $this->addSql("UPDATE notification_preferences SET expo_push_tokens = JSON_ARRAY(expo_push_token) WHERE expo_push_token IS NOT NULL AND expo_push_token != ''");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification_preferences DROP expo_push_tokens');
    }
}
