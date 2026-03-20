# Configuration de sécurité pour dépôt public

Ce document décrit comment sécuriser le projet avant de le rendre public.

## 1. Fichier des secrets (.env)

**À la racine du projet :**

```bash
cp .env.example .env
```

Éditez `.env` et renseignez les valeurs (ne jamais commiter ce fichier).

Voir **`CONFIG_ENV.md`** pour la liste complète des variables.

> ⚠️ **Si des secrets ont déjà été exposés** (dépôt précédemment public ou partagé) :  
> **Régénérez tous les identifiants** (mots de passe DB, mot de passe d’application Gmail, clés JWT, certificats).

## 2. Arrêter le suivi des fichiers sensibles

Si `mysql-data/` ou `frontend/certificates/*.pem` ont déjà été commités :

```bash
# Ne plus suivre mysql-data (données de la BDD)
git rm -r --cached mysql-data 2>/dev/null || true

# Ne plus suivre les certificats (clé privée)
git rm --cached frontend/certificates/localhost-key.pem 2>/dev/null || true
git rm --cached frontend/certificates/localhost.pem 2>/dev/null || true

git commit -m "chore: stop tracking sensitive files"
```

Ces fichiers restent sur le disque mais ne sont plus versionnés. Ils sont dans `.gitignore`.

## 3. Purger l’historique Git (optionnel mais recommandé)

Les secrets déjà commités restent dans l’historique. Pour les supprimer complètement :

### Avec git-filter-repo (recommandé)
```bash
pip install git-filter-repo
git filter-repo --path mysql-data --invert-paths --force
git filter-repo --path frontend/certificates/localhost-key.pem --invert-paths --force
```

### Avec BFG Repo-Cleaner
```bash
# Télécharger depuis https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-folders mysql-data
java -jar bfg.jar --delete-files localhost-key.pem
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

## 4. Régénérer les certificats SSL (frontend)

```bash
cd frontend/certificates
# Générer de nouveaux certificats pour localhost
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/CN=localhost"
```

## 5. Vérifier avant publication

- [ ] `.env` n’est pas commité (présent dans `.gitignore`)
- [ ] `mysql-data/` n’est pas suivi
- [ ] `frontend/certificates/*.pem` ne sont pas suivis
- [ ] Aucun secret en dur dans le code ou `docker-compose.yml`
- [ ] Tous les identifiants exposés ont été régénérés
