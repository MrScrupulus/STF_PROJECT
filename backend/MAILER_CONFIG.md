# Configuration de l'envoi d'emails

## Problème actuel
Le `MAILER_DSN` est configuré sur `null://null`, ce qui signifie que les emails ne sont pas réellement envoyés.

## Solutions

### Option 1 : Gmail (recommandé pour le développement)
Si vous utilisez l'adresse `streetfishingroubaix@gmail.com`, configurez :

```env
MAILER_DSN=gmail://APP_PASSWORD:APP_PASSWORD@default
```

**Important** : Vous devez créer un "Mot de passe d'application" dans votre compte Google :
1. Allez sur https://myaccount.google.com/security
2. Activez la validation en 2 étapes si ce n'est pas déjà fait
3. Créez un "Mot de passe d'application"
4. Utilisez ce mot de passe dans le MAILER_DSN

Exemple :
```env
MAILER_DSN=gmail://streetfishingroubaix@gmail.com:VOTRE_MOT_DE_PASSE_APP@default
```

### Option 2 : SMTP générique
Pour un serveur SMTP classique :

```env
MAILER_DSN=smtp://USERNAME:PASSWORD@HOST:PORT
```

Exemple avec un serveur SMTP :
```env
MAILER_DSN=smtp://user:password@smtp.example.com:587
```

### Option 3 : Mailtrap (pour les tests)
Pour tester sans envoyer de vrais emails :

```env
MAILER_DSN=smtp://USERNAME:PASSWORD@smtp.mailtrap.io:2525
```

### Option 4 : File (pour le développement local)
Pour sauvegarder les emails dans des fichiers (utile pour le développement) :

```env
MAILER_DSN=file://%kernel.project_dir%/var/mail
```

## Après configuration

1. Redémarrez le conteneur backend :
```bash
docker-compose restart backend
```

2. Testez une nouvelle inscription

3. Vérifiez les logs :
```bash
docker-compose logs backend | grep -i "email\|mail"
```

