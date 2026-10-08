# Audit nettoyage JS/CSS — v33

Base : `cleanup/v32-technique`.

## Objectif

Cette étape prépare le compactage sans toucher au comportement fonctionnel ni au rendu voulu.

La v33 fait un nettoyage prudent et ajoute une cartographie réexécutable des surcouches.

## Nettoyage fait

### Imports inutilisés supprimés

- `renderPlayers` depuis `./ui/players-ui.js`
- `getNextHelpLevel` depuis `./ui/help-ui.js`

### Fonctions mortes supprimées

- `formatDurationRule`
- `formatHelpRule`
- `ensureEndScreenCloseButton`

Ces fonctions n’étaient plus appelées dans le code courant.

## État actuel de `main.js`

- lignes : 7751
- caractères : 214278
- fonctions détectées : 136
- couches CSS injectées : 15

## Ordre réel des couches CSS

1. `injectDesignPassStyles` — ligne 134
2. `injectFruityThemeOverrides` — ligne 135
3. `injectMockupCloserTheme` — ligne 136
4. `injectMockupCloserThemeV2` — ligne 137
5. `injectMockupCloserThemeV3` — ligne 138
6. `injectMockupCloserThemeV4` — ligne 139
7. `injectMockupFullWidthThemeV5` — ligne 140
8. `injectMockupFullWidthThemeV6` — ligne 141
9. `injectMockupResponsiveThemeV7` — ligne 142
10. `injectMockupStableTopCleanVictoryThemeV16` — ligne 143
11. `injectMockupRightRulesInputThemeV22` — ligne 144
12. `injectVisibleControlsButtonsV28` — ligne 145
13. `injectWordsPlayersLayoutV29` — ligne 146
14. `injectFinalRecapHoverV30` — ligne 147
15. `injectBoardFitAndTabsV31` — ligne 148

## Les plus grosses couches CSS

| Couche | Ligne | Taille CSS approx. |
| --- | ---: | ---: |
| `injectMockupCloserTheme` | 1099 | 19385 caractères |
| `injectFruityThemeOverrides` | 674 | 19279 caractères |
| `injectMockupCloserThemeV4` | 2473 | 13837 caractères |
| `injectDesignPassStyles` | 151 | 11343 caractères |
| `injectMockupStableTopCleanVictoryThemeV16` | 3891 | 10616 caractères |
| `injectMockupCloserThemeV2` | 1782 | 9784 caractères |
| `injectMockupFullWidthThemeV5` | 2967 | 9226 caractères |
| `injectMockupResponsiveThemeV7` | 3547 | 8558 caractères |
| `injectMockupCloserThemeV3` | 2181 | 7641 caractères |
| `injectMockupRightRulesInputThemeV22` | 4272 | 7355 caractères |

## Fichiers JS publics non importés directement par `main.js`

- `public/js/ui/players-ui.js`

Ces fichiers ne sont pas supprimés dans cette v33, car l’objectif est de rester prudent. Ils pourront être supprimés plus tard après validation qu’ils ne sont plus référencés par aucun HTML ou futur import.

## Outil ajouté

Commande :

```bash
npm run audit:css-js
```

Elle génère :

```text
audit-css-js.generated.json
```

Le rapport contient :

- les couches `inject*` ;
- leur ordre d’appel ;
- leur taille ;
- les sélecteurs les plus répétés ;
- les imports ;
- les fonctions avec peu de références ;
- les fichiers JS publics non importés directement.

## Diagnostic

Le problème principal n’est pas un bug isolé : `main.js` contient encore beaucoup de couches CSS historiques, empilées dans cet ordre :

1. premières règles générales ;
2. thèmes fruités/mockup ;
3. corrections pleine largeur ;
4. corrections responsive ;
5. popup fin ;
6. panneau règles/aide ;
7. boutons ;
8. mots/joueurs ;
9. plateau/saisie.

C’est pour cela qu’une correction visuelle peut parfois être contredite par une autre règle plus ancienne ou plus récente.

## Recommandation pour la suite

Ne pas supprimer les 15 couches d’un coup.

Ordre conseillé :

1. **v34** : fusionner les styles de boutons ;
2. **v35** : fusionner plateau + champ `Votre mot` ;
3. **v36** : fusionner panneau `Mots trouvés` + onglets joueurs ;
4. **v37** : fusionner panneaux gauche/droite ;
5. **v38** : extraire le CSS stabilisé vers `public/css/`.

## Commandes de validation

```bash
npm run check
npm run audit:css-js
```

Si `node_modules` n’est pas installé :

```bash
npm ci
npm run check
npm run audit:css-js
```
