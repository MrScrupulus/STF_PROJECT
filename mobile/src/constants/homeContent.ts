import type { AppIconName } from '../icons';

/** Textes de l’écran Accueil (app mobile). Modifier ici, puis recharger l’app. */

export const homeContent = {
  title: 'Street Fishing',
  subtitle: "L'application de compétition de pêche",

  aboutTitle: 'À propos de l’application',
  about:
    'Street Fishing est une application dédiée aux compétitions de pêche. Participez à des compétitions, enregistrez vos prises, formez des équipes et suivez vos statistiques en temps réel. Vous pouvez également vous créer votre propore journal de prises.',

  featuresTitle: 'Fonctionnalités principales',
  features: [
    {
      icon: 'trophy' as AppIconName,
      title: 'Compétitions',
      description:
        'Consultez les compétitions en cours, à venir ou terminées. Inscrivez-vous avec votre équipe et suivez le classement en direct.',
    },
    {
      icon: 'camera' as AppIconName,
      title: 'Enregistrement de prises',
      description:
        'Photographiez et enregistrez vos prises directement depuis l’application. Géolocalisation automatique et validation par les commissaires.',
    },
    {
      icon: 'users' as AppIconName,
      title: 'Gestion d’équipe',
      description:
        'Créez ou rejoignez une équipe, invitez vos amis et participez ensemble aux compétitions. Suivez les performances de votre équipe.',
    },
    {
      icon: 'chart' as AppIconName,
      title: 'Statistiques',
      description:
        'Consultez votre historique de prises, le nombre de compétitions auxquelles vous avez participé et vos statistiques par espèce de poisson.',
    },
  ],

  tutorialTitle: 'Guide rapide',
  catchTutorialTitle: 'Comment enregistrer une prise ?',
  catchTutorialSteps: [
    'Cliquez sur le bouton central bleu en bas de l’écran',
    'Prenez une photo de votre prise ou sélectionnez une photo existante',
    'Sélectionnez l’espèce de poisson capturé',
    'Indiquez la taille (en cm) et ajoutez un commentaire si vous le souhaitez',
    'Si vous participez à une compétition, sélectionnez-la ainsi que votre équipe',
    'Autorisez la géolocalisation pour valider votre position',
    'Validez ! Votre prise sera soumise à validation par un administrateur',
  ],
  catchTutorialButton: 'Ajouter une prise maintenant',

  competitionTutorialTitle: 'Comment créer une compétition ?',
  adminBadge: 'Admin uniquement',
  competitionTutorialSteps: [
    'Accédez au Dashboard Admin depuis le menu burger',
    'Cliquez sur « Créer une compétition »',
    'Remplissez les informations : nom, dates de début et fin, taille d’équipe',
    'Ajoutez les espèces autorisées avec leurs coefficients de points',
    'Configurez les options : nombre max de participants, classement public, bonus',
    'Ajoutez une description pour expliquer les règles de la compétition',
    'Validez la création. La compétition apparaîtra dans la liste des compétitions',
  ],

  footer:
    'Utilisez la barre de navigation en bas pour accéder rapidement aux compétitions et à votre équipe. Le bouton central permet d’ajouter une prise rapidement.',
};
