# Guide de Style - Messages Utilisateur

## 📝 Messages de Succès

### Format Web (toast.success)
```javascript
toast.success("Action réalisée avec succès.");
```

### Format Mobile (Alert.alert)
```typescript
Alert.alert('Succès', 'Action réalisée avec succès.');
```

### Messages standardisés

#### Compétitions
- Création : "Compétition créée avec succès."
- Inscription : "Équipe inscrite à la compétition avec succès."
- Désinscription : "Vous avez quitté la compétition avec succès."
- Pause : "Compétition mise en pause."
- Reprise : "Compétition reprise."

#### Équipes
- Création : "Équipe créée avec succès."
- Modification : "Équipe modifiée avec succès."
- Réactivation : "Équipe réactivée avec succès."
- Invitation envoyée : "Invitation envoyée avec succès."
- Invitation acceptée : "Invitation acceptée. Vous êtes maintenant membre de l'équipe."
- Invitation rejetée : "Invitation rejetée."
- Quitter équipe : "Vous avez quitté l'équipe avec succès."

#### Prises
- Création : "Prise enregistrée avec succès."
- Validation : "Prise validée avec succès."
- Rejet : "Prise rejetée avec succès."

#### Profil
- Mise à jour : "Profil mis à jour avec succès."
- Mot de passe : "Mot de passe modifié avec succès."

#### Préférences
- Notifications : "Préférences mises à jour avec succès."

#### Autres
- PDF téléchargé : "PDF téléchargé avec succès."
- Périmètre créé : "Périmètre créé avec succès."
- Périmètre mis à jour : "Périmètre mis à jour avec succès."
- Périmètre supprimé : "Périmètre supprimé avec succès."

## ⏳ Indicateurs de Chargement

### Format Web
```javascript
disabled={mutation.isPending}
{/* Bouton */}
{mutation.isPending ? "Chargement..." : "Action"}
```

### Format Mobile
```typescript
disabled={mutation.isPending}
{/* Bouton avec ActivityIndicator si nécessaire */}
{mutation.isPending ? <ActivityIndicator /> : <Text>Action</Text>}
```

### Messages contextuels de chargement
- "Création en cours..."
- "Modification en cours..."
- "Validation en cours..."
- "Suppression en cours..."
- "Chargement..."

## 🎯 Règles générales

1. **Toujours terminer par un point** pour les messages de succès
2. **Utiliser le présent de l'indicatif** ("créée", "modifiée", "validée")
3. **Messages courts et clairs** (max 50 caractères)
4. **Cohérence web/mobile** : même message, format adapté
5. **Désactiver les boutons** pendant les opérations asynchrones
6. **Afficher un indicateur** pendant le chargement
