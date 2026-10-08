# Boggle Multi — v32 technique

Cette version ne modifie pas le rendu visuel.

## Corrections

- Suppression du type `Env` personnalisé dans `src/shared/types.ts`.
- Utilisation du type global `Env` généré par Wrangler dans `worker-configuration.d.ts`.
- Correction des imports dans :
  - `src/index.ts`
  - `src/rooms/BoggleRoom.ts`

## Scripts ajoutés

```bash
npm run typecheck
npm run check:js
npm run check
npm run build
npm run dry-run
```

## Vérifications

- `npm run typecheck` : vérifie TypeScript.
- `npm run check:js` : lance `node --check` sur les fichiers JS/MJS.
- `npm run check` : lance les deux contrôles.

## Remarque

Ne pas zipper `node_modules`.
Recréer les dépendances localement avec :

```bash
npm ci
```

## Commandes à lancer localement

Après extraction du zip :

```bash
npm ci
npm run check
npm run dry-run
```

`npm ci` est nécessaire avant `npm run typecheck`, car le zip ne contient volontairement pas `node_modules`.
