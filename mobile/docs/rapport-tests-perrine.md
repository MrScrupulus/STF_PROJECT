# Rapport de tests

## 1. Contexte 
- date: 20/01/26

## 2. Tests
### Authentification 
- Inscription ne fonctionne pas (erreur 404)
    - Champs date de naissance pas pratique 
- Pas de 'mdp oublié' 

### Profil 
- Ajout possiblité de modifier le profil (mdp, tel, etc) ?

### Compétition 
- **bug** : Pas possibilité de s'inscrire à une compétiton en cours, je fais tjs partie de la précédente compétition qui est terminée. 
- Pas possibilité de quitter une compétition ? (voir mon point équipe sur un admin d'équipe -> A qui reviendrait cette décision ?)
- Ajout de filtres (en cours/terminées). Possibilité de voir les compétitions autour de moi ? 
- **UI/UX** : Voir les compétitions en cours en premier et les autres un peu noircies/moins d'opacité.
- **Admin** : pas possibilité encore de créer une compétition
- **Admin** : Quand on crée une pause manuelle, il n'y a l'historique nulle part de cette pause ? (seules les pauses automatisées sont inscrites sur la page)

### Equipes 
- Invitation à approuver ou non 
- Possibilité de quitter une équipe 
- Pas pu tester mais possibilité de voir l'historique complet des équipes passées ? 
- Est-ce que si on refait une compétion avec la même équipe qu'une compétition antérieure, on peut reprendre l'équipe ? Ou on doit en créer une autre similaire ? 
- Possibilité de modifier l'équipe ? Le nom ? Les membres ? Y a-t-il un admin de l'équipe ou tout le monde peut avoir ces droits ? 
- Ajout d'une page profil ? Comment les membres envoient une invitation aux autres membres ? 
- Est-ce qu'il y a un nombre de personnes par équipes limitées selon les compétitions ? Si oui, à quel moment et où mettre l'information / restrictions d'inscription etc.

***Priorité*** : pouvoir quitter une équipe pour que je puisse faire d'autres tests. 

### Historique
- Onglet "prises" et "historique" un peu redondants ? Ne garder que l'historique avec dans la vue d'ensemble les dernières prises puis l'onglet prises à l'intérieur (déjà là) ? 

### Espèces 
- Est-ce que les espèces et les coefficients changent selon les compétions ? 

### UI/UX 
- Un peu redondant au niveau de la présentation entre la liste de l'accueil et le menu déroulant. Quelques suggestions : 
    - En haut à droite, garder le menu burger pour les catégories : profil, déconnexion 
    - En haut à droite, ajouter un icone notifications pour l'avoir directement sur l'écran sans avoir à ouvrir un premier menu 
    - Ajouter une barre de nav en bas de l'écran avec icones pour les catégories les plus importantes ? Genre un appareil photo au milieu pour pouvoir ajouter une prise plus facilement. Un onglet pour revenir à l'accueil, un onglet équipe et un compétitons ? 
    - Peut-être rendre l'accueil d'avantage comme un dashboard avec des icônes ? 

