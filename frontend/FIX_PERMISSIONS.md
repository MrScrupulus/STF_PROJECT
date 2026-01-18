# Correction du problème de permissions Next.js

## Problème
Le dossier `.next` appartient à `root`, ce qui empêche Next.js de générer correctement les fichiers statiques (CSS, JS).

## Solution

1. **Arrêter le serveur Next.js** (si il est en cours d'exécution)
   - Appuyez sur `Ctrl+C` dans le terminal où le serveur tourne

2. **Supprimer le dossier .next avec les bonnes permissions**
   ```bash
   cd /home/mr_scrupulus/works/STF_Project/frontend
   sudo rm -rf .next
   ```

3. **Relancer le serveur de développement** (sans sudo)
   ```bash
   npm run dev
   ```

4. **Vérifier que le serveur fonctionne**
   - Le serveur devrait démarrer sur `http://localhost:3000`
   - Les fichiers CSS et JS devraient être générés correctement

## Note importante
Ne jamais lancer `npm run dev` avec `sudo`. Si vous devez utiliser un port privilégié (< 1024), configurez Next.js pour utiliser un port différent (par exemple 3000).
