<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260120005822 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout de la relation directe entre FishCatch et Competition pour préserver l\'historique';
    }

    public function up(Schema $schema): void
    {
        // Ajouter la colonne competition_id
        $this->addSql('ALTER TABLE fish_catch ADD competition_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE fish_catch ADD CONSTRAINT FK_ABA489147B39D312 FOREIGN KEY (competition_id) REFERENCES competitions (id)');
        $this->addSql('CREATE INDEX IDX_ABA489147B39D312 ON fish_catch (competition_id)');
        
        // Remplir la colonne avec les données existantes (via team.competition)
        // Mettre à jour toutes les prises existantes avec la compétition de leur équipe
        $this->addSql('
            UPDATE fish_catch fc
            INNER JOIN teams t ON fc.team_id = t.id
            SET fc.competition_id = t.competition_id
            WHERE t.competition_id IS NOT NULL
        ');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE fish_catch DROP FOREIGN KEY FK_ABA489147B39D312');
        $this->addSql('DROP INDEX IDX_ABA489147B39D312 ON fish_catch');
        $this->addSql('ALTER TABLE fish_catch DROP competition_id');
    }
}
