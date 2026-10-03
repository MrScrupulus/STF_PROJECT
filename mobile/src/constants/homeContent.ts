import type { AppIconName } from '../icons';

/** Textes de l’écran Accueil (app mobile). */

export const homeContent = {
  title: 'Street Fishing',
  subtitle: 'Carnet de prises et compétitions',

  intro:
    'Le bouton bleu photographie une prise. Les onglets du bas mènent aux compétitions et à votre équipe.',

  catchTutorialTitle: 'Enregistrer une prise',
  catchTutorialSteps: [
    'Appuyez sur le bouton bleu au centre de la barre du bas',
    'Prenez une photo (ou choisissez-en une dans la galerie)',
    'Indiquez l’espèce et la taille en cm',
    'En compétition : sélectionnez la manche et votre équipe',
    'La géolocalisation doit être autorisée pour valider la position',
  ],
  catchTutorialButton: 'Ajouter une prise',

  competitionTutorialTitle: 'Participer à une manche',
  competitionTutorialSteps: [
    'Créez une équipe ou acceptez une invitation',
    'Ouvrez Compétitions et inscrivez votre équipe',
    'Pendant la manche, enregistrez chaque prise avec le bouton bleu',
    'Un commissaire valide ou refuse la prise',
  ],

  adminTutorialTitle: 'Créer une compétition',
  adminBadge: 'Admin',
  competitionAdminSteps: [
    'Menu burger → Dashboard Admin → Créer une compétition',
    'Renseignez nom, dates, taille d’équipe et espèces',
    'Ajoutez zones, pauses et options de classement si besoin',
  ],
};

export const homeActions: {
  icon: AppIconName;
  title: string;
  hint: string;
  screen: string;
}[] = [
  {
    icon: 'camera',
    title: 'Enregistrer une prise',
    hint: 'Photo, espèce, taille — carnet ou compétition',
    screen: 'AddCatch',
  },
  {
    icon: 'trophy',
    title: 'Compétitions',
    hint: 'Inscription, classement et manches',
    screen: 'Competitions',
  },
  {
    icon: 'users',
    title: 'Mon équipe',
    hint: 'Créer, rejoindre ou gérer les membres',
    screen: 'Teams',
  },
  {
    icon: 'gear',
    title: 'Réglages',
    hint: 'Thème, notifications et compte',
    screen: 'Settings',
  },
];
