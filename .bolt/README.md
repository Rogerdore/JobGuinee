# Configuration Bolt pour JobGuinee

Ce dossier contient la configuration de synchronisation entre Bolt et GitHub.

## Fichiers

- `config.json` : Configuration de la synchronisation automatique
- `prompt` : Informations sur le dépôt GitHub

## Configuration actuelle

- **Snapshots locaux** : DÉSACTIVÉS
- **Source de vérité** : GitHub
- **Auto-sync** : ACTIVÉ
- **Pull avant travail** : ACTIVÉ

## Important

Ne modifiez PAS ces fichiers manuellement sauf si vous savez ce que vous faites.

La synchronisation est automatique une fois que vous avez :
1. Poussé le premier commit vers GitHub
2. Activé la connexion dans les paramètres Bolt

## Vérification

Pour vérifier que tout fonctionne :

```bash
git remote -v
git status
```

Vous devriez voir le remote GitHub configuré et aucun snapshot local.
