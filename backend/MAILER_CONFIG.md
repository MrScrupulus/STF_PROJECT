# Envoi d’emails — OVH MX Plan (webmail souvent appelé Zimbra)

Le DNS MX de scrupy.com pointe déjà vers `mx1/2/3.mail.ovh.net`.
SMTP officiel : `smtp.mail.ovh.net`, port **465** (SSL) ou **587** (STARTTLS).
Identifiant = l’adresse complète, mot de passe = celui de la boîte.

Dans le `.env` à la **racine** du projet (lu par Docker) :

```env
MAILER_FROM_EMAIL=noreply@scrupy.com
MAILER_DSN=smtps://noreply%40scrupy.com:MOT_DE_PASSE@smtp.mail.ovh.net:465
```

- Remplacer `MOT_DE_PASSE` par le mot de passe de `noreply@scrupy.com`.
- Le `@` de l’adresse mail dans le DSN s’écrit **`%40`**.
- Si le mot de passe contient `@`, `#`, `%`, etc., les encoder aussi (ex. `@` → `%40`).

Variante port 587 :

```env
MAILER_DSN=smtp://noreply%40scrupy.com:MOT_DE_PASSE@smtp.mail.ovh.net:587?encryption=tls
```

Puis :

```bash
cd ~/works/STF_Project
docker compose up -d backend
```

Tester : inscription d’un compte, ou reset mot de passe, et vérifier la boîte (et les spams).
