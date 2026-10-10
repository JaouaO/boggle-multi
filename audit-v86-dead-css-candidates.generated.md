# Audit v86 — candidats CSS morts ou surchargés

Cet audit ne supprime rien.

Il liste les anciennes déclarations de layout qui sont redéfinies plus bas par une règle gagnante sur le même sélecteur et la même propriété.

## Résumé

- Règles importantes analysées : 227
- Déclarations potentiellement surchargées : 190
- Contextes anciens concernés : 31

## Contextes les plus surchargés

### 15 déclaration(s) surchargée(s)
Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible. Aucun dégradé. Aucune ombre. ==========
- Sélecteurs concernés : 5
- Propriétés concernées : 8

- L167 — `#boggle-shell` / `padding`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L3954 — `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L204 — `#boggle-layout` / `display`
  - Ancienne valeur : `grid`
  - Gagnant plus bas : L5667 — `grid !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L508 — `#boggle-layout` / `display`
  - Ancienne valeur : `flex`
  - Gagnant plus bas : L5667 — `grid !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L204 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `280px minmax(500px, 1fr) 330px`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L461 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `300px minmax(560px, 1fr) 350px`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L468 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(0, 1fr) minmax(0, 1fr)`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L204 — `#boggle-layout` / `gap`
  - Ancienne valeur : `14px`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L461 — `#boggle-layout` / `gap`
  - Ancienne valeur : `16px`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L508 — `#boggle-layout` / `gap`
  - Ancienne valeur : `10px`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L204 — `#boggle-layout` / `align-items`
  - Ancienne valeur : `start`
  - Gagnant plus bas : L4094 — `stretch !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L235 — `#launch-panel` / `padding`
  - Ancienne valeur : `14px !important`
  - Gagnant plus bas : L3432 — `0.95rem !important`
  - Contexte gagnant : Top sans carte : on pose les éléments sur le fond.
- L409 — `#players li, #players div, #found-words li, #found-words div` / `padding`
  - Ancienne valeur : `8px 9px`
  - Gagnant plus bas : L632 — `9px 10px !important`
  - Contexte gagnant : ========================================================================== V5 — corrections UX desktop ==========================================================================
- … 3 autre(s) déclaration(s)

### 14 déclaration(s) surchargée(s)
Contexte : Ancienne couche : injectMockupCloserTheme.
- Sélecteurs concernés : 6
- Propriétés concernées : 10

- L2104 — `#boggle-shell` / `padding`
  - Ancienne valeur : `0.8rem 1rem 1.2rem !important`
  - Gagnant plus bas : L3954 — `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L2312 — `#boggle-layout` / `display`
  - Ancienne valeur : `grid !important`
  - Gagnant plus bas : L5667 — `grid !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2312 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(16rem, 23rem) minmax(30rem, 46rem) minmax(16rem, 23rem) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2646 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `1fr !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2312 — `#boggle-layout` / `gap`
  - Ancienne valeur : `0.95rem !important`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2312 — `#boggle-layout` / `align-items`
  - Ancienne valeur : `start !important`
  - Gagnant plus bas : L4094 — `stretch !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L2343 — `#launch-panel` / `padding`
  - Ancienne valeur : `0.85rem !important`
  - Gagnant plus bas : L3432 — `0.95rem !important`
  - Contexte gagnant : Top sans carte : on pose les éléments sur le fond.
- L2494 — `#found-words-panel` / `min-height`
  - Ancienne valeur : `24rem !important`
  - Gagnant plus bas : L5771 — `12rem !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L2104 — `#boggle-shell` / `width`
  - Ancienne valeur : `min(100%, 96rem) !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2104 — `#boggle-shell` / `margin`
  - Ancienne valeur : `0 auto !important`
  - Gagnant plus bas : L3689 — `0 auto !important`
  - Contexte gagnant : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L2312 — `#boggle-layout` / `justify-content`
  - Ancienne valeur : `center !important`
  - Gagnant plus bas : L3974 — `stretch !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L2320 — `#boggle-left, #boggle-center, #boggle-right` / `min-width`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L3990 — `0 !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- … 2 autre(s) déclaration(s)

### 13 déclaration(s) surchargée(s)
Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- Sélecteurs concernés : 6
- Propriétés concernées : 9

- L5883 — `#board.boggle-board-size-4 .board-letter` / `font-size`
  - Ancienne valeur : `clamp(1.02rem, calc(var(--board-effective-size-v85, 36rem) / 9.5), 2.85rem) !important`
  - Gagnant plus bas : L6004 — `clamp(0.98rem, calc(var(--board-effective-size-v85, 34rem) / 9.8), 2.65rem) !important`
  - Contexte gagnant : Sécurité supplémentaire : quand la hauteur est très basse, on garde une grille jouable plutôt que de tout compresser.
- L5887 — `#board.boggle-board-size-5 .board-letter` / `font-size`
  - Ancienne valeur : `clamp(0.8rem, calc(var(--board-effective-size-v85, 36rem) / 11.9), 2.2rem) !important`
  - Gagnant plus bas : L6008 — `clamp(0.76rem, calc(var(--board-effective-size-v85, 34rem) / 12.3), 2.05rem) !important`
  - Contexte gagnant : Sécurité supplémentaire : quand la hauteur est très basse, on garde une grille jouable plutôt que de tout compresser.
- L5895 — `#rules-summary` / `max-height`
  - Ancienne valeur : `clamp(7rem, 24vh, 13rem) !important`
  - Gagnant plus bas : L6079 — `clamp(4rem, 20vh, 8rem) !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5916 — `#rules-summary` / `max-height`
  - Ancienne valeur : `clamp(7rem, 30vh, 12rem) !important`
  - Gagnant plus bas : L6079 — `clamp(4rem, 20vh, 8rem) !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5928 — `#rules-summary` / `max-height`
  - Ancienne valeur : `clamp(6rem, 22vh, 10rem) !important`
  - Gagnant plus bas : L6079 — `clamp(4rem, 20vh, 8rem) !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5895 — `#rules-summary` / `overflow-x`
  - Ancienne valeur : `hidden !important`
  - Gagnant plus bas : L6151 — `hidden !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L5895 — `#rules-summary` / `overflow-y`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L6151 — `auto !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L5904 — `#rules-summary .rule-pill` / `white-space`
  - Ancienne valeur : `normal !important`
  - Gagnant plus bas : L6176 — `normal !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5904 — `#rules-summary .rule-pill` / `overflow-wrap`
  - Ancienne valeur : `anywhere !important`
  - Gagnant plus bas : L6176 — `anywhere !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5904 — `#rules-summary .rule-pill` / `word-break`
  - Ancienne valeur : `normal !important`
  - Gagnant plus bas : L6176 — `break-word !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5912 — `#play-status-panel` / `min-height`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L6088 — `2.9rem !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5923 — `#play-status-panel` / `min-height`
  - Ancienne valeur : `clamp(2.8rem, 4.6vh, 3.25rem) !important`
  - Gagnant plus bas : L6088 — `2.9rem !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- … 1 autre(s) déclaration(s)

### 12 déclaration(s) surchargée(s)
Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- Sélecteurs concernés : 3
- Propriétés concernées : 9

- L3689 — `#boggle-shell` / `padding`
  - Ancienne valeur : `0.8rem 0 1.4rem !important`
  - Gagnant plus bas : L3954 — `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3715 — `#boggle-layout` / `display`
  - Ancienne valeur : `grid !important`
  - Gagnant plus bas : L5667 — `grid !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3715 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(18rem, 0.92fr)
        minmax(38rem, 1.62fr)
        minmax(18rem, 0.92fr) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3715 — `#boggle-layout` / `gap`
  - Ancienne valeur : `clamp(0.9rem, 1.4vw, 1.35rem) !important`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3715 — `#boggle-layout` / `align-items`
  - Ancienne valeur : `start !important`
  - Gagnant plus bas : L4094 — `stretch !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L3689 — `#boggle-shell` / `width`
  - Ancienne valeur : `calc(100vw - 2rem) !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3715 — `#boggle-layout` / `justify-content`
  - Ancienne valeur : `stretch !important`
  - Gagnant plus bas : L3974 — `stretch !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3728 — `#boggle-left, #boggle-center, #boggle-right` / `min-width`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L3990 — `0 !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3689 — `#boggle-shell` / `max-width`
  - Ancienne valeur : `108rem !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3715 — `#boggle-layout` / `width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L5667 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3715 — `#boggle-layout` / `max-width`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L3974 — `104rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3728 — `#boggle-left, #boggle-center, #boggle-right` / `width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L3990 — `100% !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.

### 12 déclaration(s) surchargée(s)
Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- Sélecteurs concernés : 3
- Propriétés concernées : 7

- L3974 — `#boggle-layout` / `display`
  - Ancienne valeur : `grid !important`
  - Gagnant plus bas : L5667 — `grid !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3974 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(18rem, 1fr)
        minmax(38rem, 1.7fr)
        minmax(18rem, 1fr) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4038 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(21rem, 1fr)
          minmax(44rem, 1.72fr)
          minmax(21rem, 1fr) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4049 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(16rem, 0.95fr)
          minmax(34rem, 1.62fr)
          minmax(16rem, 0.95fr) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4063 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `1fr !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3974 — `#boggle-layout` / `gap`
  - Ancienne valeur : `clamp(0.85rem, 1.2vw, 1.15rem) !important`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3974 — `#boggle-layout` / `align-items`
  - Ancienne valeur : `start !important`
  - Gagnant plus bas : L4094 — `stretch !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L3954 — `#boggle-shell` / `width`
  - Ancienne valeur : `100vw !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4058 — `#boggle-shell` / `width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4019 — `#found-words-panel` / `height`
  - Ancienne valeur : `clamp(29rem, 52vh, 39rem) !important`
  - Gagnant plus bas : L5771 — `clamp(12rem, 34vh, 20rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L3954 — `#boggle-shell` / `max-width`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3974 — `#boggle-layout` / `width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L5667 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 12 déclaration(s) surchargée(s)
Contexte : -------------------------------------------------------------------------- Règles canonique --------------------------------------------------------------------------
- Sélecteurs concernés : 2
- Propriétés concernées : 12

- L5610 — `#rules-summary` / `grid-template-columns`
  - Ancienne valeur : `repeat(auto-fit, minmax(min(100%, 13rem), 1fr)) !important`
  - Gagnant plus bas : L6225 — `minmax(0, 1fr) !important`
  - Contexte gagnant : Si la largeur est aussi très faible, on garde une seule colonne et on évite les longues pastilles horizontales.
- L5610 — `#rules-summary` / `max-height`
  - Ancienne valeur : `clamp(8rem, 26vh, 14rem) !important`
  - Gagnant plus bas : L6079 — `clamp(4rem, 20vh, 8rem) !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5610 — `#rules-summary` / `overflow-x`
  - Ancienne valeur : `hidden !important`
  - Gagnant plus bas : L6151 — `hidden !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L5610 — `#rules-summary` / `overflow-y`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L6151 — `auto !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L5630 — `#rules-summary .rule-pill` / `min-width`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L6176 — `0 !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5630 — `#rules-summary .rule-pill` / `max-width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L6176 — `100% !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5630 — `#rules-summary .rule-pill` / `width`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L6176 — `100% !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5630 — `#rules-summary .rule-pill` / `white-space`
  - Ancienne valeur : `normal !important`
  - Gagnant plus bas : L6176 — `normal !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5630 — `#rules-summary .rule-pill` / `overflow`
  - Ancienne valeur : `visible !important`
  - Gagnant plus bas : L6063 — `visible !important`
  - Contexte gagnant : Règles : le conteneur scrolle toujours, même en très petite hauteur.
- L5630 — `#rules-summary .rule-pill` / `overflow-wrap`
  - Ancienne valeur : `anywhere !important`
  - Gagnant plus bas : L6176 — `anywhere !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5630 — `#rules-summary .rule-pill` / `word-break`
  - Ancienne valeur : `normal !important`
  - Gagnant plus bas : L6176 — `break-word !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L5630 — `#rules-summary .rule-pill` / `line-height`
  - Ancienne valeur : `1.28 !important`
  - Gagnant plus bas : L6210 — `1.15 !important`
  - Contexte gagnant : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.

### 12 déclaration(s) surchargée(s)
Contexte : Règles : le conteneur scrolle toujours, même en très petite hauteur.
- Sélecteurs concernés : 2
- Propriétés concernées : 12

- L6050 — `#rules-summary` / `max-height`
  - Ancienne valeur : `clamp(4.8rem, 22vh, 12rem) !important`
  - Gagnant plus bas : L6079 — `clamp(4rem, 20vh, 8rem) !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L6050 — `#rules-summary` / `overflow-x`
  - Ancienne valeur : `hidden !important`
  - Gagnant plus bas : L6151 — `hidden !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L6050 — `#rules-summary` / `overflow-y`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L6151 — `auto !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L6063 — `#rules-summary .rule-pill` / `min-width`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L6176 — `0 !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L6063 — `#rules-summary .rule-pill` / `max-width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L6176 — `100% !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L6063 — `#rules-summary .rule-pill` / `width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L6176 — `100% !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L6063 — `#rules-summary .rule-pill` / `white-space`
  - Ancienne valeur : `normal !important`
  - Gagnant plus bas : L6176 — `normal !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L6063 — `#rules-summary .rule-pill` / `overflow-wrap`
  - Ancienne valeur : `anywhere !important`
  - Gagnant plus bas : L6176 — `anywhere !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L6063 — `#rules-summary .rule-pill` / `word-break`
  - Ancienne valeur : `break-word !important`
  - Gagnant plus bas : L6176 — `break-word !important`
  - Contexte gagnant : Important : plus de hauteur minimale implicite. Le scroll doit s'adapter à la hauteur réellement restante dans la carte.
- L6063 — `#rules-summary .rule-pill` / `line-height`
  - Ancienne valeur : `1.25 !important`
  - Gagnant plus bas : L6210 — `1.15 !important`
  - Contexte gagnant : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- L6050 — `#rules-summary` / `flex`
  - Ancienne valeur : `0 1 auto !important`
  - Gagnant plus bas : L6151 — `1 1 auto !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L6050 — `#rules-summary` / `min-height`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L6151 — `0 !important`
  - Contexte gagnant : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.

### 10 déclaration(s) surchargée(s)
Contexte : Passe v2 : on force une structure plus proche de la maquette.
- Sélecteurs concernés : 6
- Propriétés concernées : 7

- L2699 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(17rem, 21rem) minmax(32rem, 43rem) minmax(17rem, 21rem) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2967 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `1fr !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2699 — `#boggle-layout` / `gap`
  - Ancienne valeur : `0.9rem !important`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2699 — `#boggle-layout` / `align-items`
  - Ancienne valeur : `start !important`
  - Gagnant plus bas : L4094 — `stretch !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L2705 — `#launch-panel` / `padding`
  - Ancienne valeur : `0.8rem !important`
  - Gagnant plus bas : L3432 — `0.95rem !important`
  - Contexte gagnant : Top sans carte : on pose les éléments sur le fond.
- L2705 — `#launch-panel` / `gap`
  - Ancienne valeur : `0.7rem !important`
  - Gagnant plus bas : L3432 — `0.72rem !important`
  - Contexte gagnant : Top sans carte : on pose les éléments sur le fond.
- L2932 — `#players-panel, #found-words-panel` / `min-height`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L4118 — `0 !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L2937 — `#players-panel` / `height`
  - Ancienne valeur : `13.4rem !important`
  - Gagnant plus bas : L4015 — `clamp(14rem, 22vh, 18rem) !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L2941 — `#found-words-panel` / `height`
  - Ancienne valeur : `24rem !important`
  - Gagnant plus bas : L5771 — `clamp(12rem, 34vh, 20rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L2945 — `#players-panel > h2, #found-words-panel > h2` / `padding-bottom`
  - Ancienne valeur : `0.65rem !important`
  - Gagnant plus bas : L4236 — `clamp(0.4rem, 0.75vh, 0.65rem) !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 9 déclaration(s) surchargée(s)
Contexte : ========================================================================== V5 — corrections UX desktop ==========================================================================
- Sélecteurs concernés : 5
- Propriétés concernées : 7

- L594 — `#boggle-layout` / `align-items`
  - Ancienne valeur : `stretch !important`
  - Gagnant plus bas : L4094 — `stretch !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L582 — `#launch-panel` / `padding`
  - Ancienne valeur : `16px !important`
  - Gagnant plus bas : L3432 — `0.95rem !important`
  - Contexte gagnant : Top sans carte : on pose les éléments sur le fond.
- L612 — `#found-words` / `max-height`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L1468 — `none !important`
  - Contexte gagnant : Ancienne couche : injectDesignPassStyles.
- L582 — `#launch-panel` / `margin-bottom`
  - Ancienne valeur : `2px !important`
  - Gagnant plus bas : L4286 — `0.45rem !important`
  - Contexte gagnant : Hauteurs modestes : on priorise tout visible.
- L594 — `#boggle-layout` / `min-height`
  - Ancienne valeur : `min(760px, calc(100vh - 170px))`
  - Gagnant plus bas : L5667 — `0 !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L598 — `#boggle-left, #boggle-right` / `padding-top`
  - Ancienne valeur : `72px`
  - Gagnant plus bas : L641 — `0`
  - Contexte gagnant : ========================================================================== V5 — corrections UX desktop ==========================================================================
- L604 — `#boggle-center` / `min-height`
  - Ancienne valeur : `100%`
  - Gagnant plus bas : L4162 — `0 !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L612 — `#found-words` / `flex`
  - Ancienne valeur : `1 1 auto`
  - Gagnant plus bas : L1468 — `1 1 auto`
  - Contexte gagnant : Ancienne couche : injectDesignPassStyles.
- L612 — `#found-words` / `min-height`
  - Ancienne valeur : `0`
  - Gagnant plus bas : L1468 — `0 !important`
  - Contexte gagnant : Ancienne couche : injectDesignPassStyles.

### 8 déclaration(s) surchargée(s)
Contexte : Ancienne couche : injectDesignPassStyles.
- Sélecteurs concernés : 4
- Propriétés concernées : 5

- L1337 — `#launch-panel > h2` / `display`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L2351 — `none !important`
  - Contexte gagnant : Ancienne couche : injectMockupCloserTheme.
- L1454 — `#boggle-left` / `display`
  - Ancienne valeur : `flex`
  - Gagnant plus bas : L4112 — `grid !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L1454 — `#boggle-left` / `min-height`
  - Ancienne valeur : `calc(100vh - 10rem)`
  - Gagnant plus bas : L2339 — `0 !important`
  - Contexte gagnant : Ancienne couche : injectMockupCloserTheme.
- L1460 — `#found-words-panel` / `display`
  - Ancienne valeur : `flex`
  - Gagnant plus bas : L4129 — `flex !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L1460 — `#found-words-panel` / `flex`
  - Ancienne valeur : `1 1 auto`
  - Gagnant plus bas : L2494 — `1 1 auto !important`
  - Contexte gagnant : Ancienne couche : injectMockupCloserTheme.
- L1460 — `#found-words-panel` / `min-height`
  - Ancienne valeur : `14rem`
  - Gagnant plus bas : L5771 — `12rem !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L1460 — `#found-words-panel` / `flex-direction`
  - Ancienne valeur : `column`
  - Gagnant plus bas : L4129 — `column !important`
  - Contexte gagnant : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L1468 — `#found-words` / `overflow-y`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L3126 — `auto !important`
  - Contexte gagnant : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.

### 8 déclaration(s) surchargée(s)
Contexte : -------------------------------------------------------------------------- Petit écran --------------------------------------------------------------------------
- Sélecteurs concernés : 5
- Propriétés concernées : 7

- L5743 — `#rules-summary` / `grid-template-columns`
  - Ancienne valeur : `minmax(0, 1fr) !important`
  - Gagnant plus bas : L6225 — `minmax(0, 1fr) !important`
  - Contexte gagnant : Si la largeur est aussi très faible, on garde une seule colonne et on évite les longues pastilles horizontales.
- L5743 — `#rules-summary` / `max-height`
  - Ancienne valeur : `clamp(7rem, 30vh, 13rem) !important`
  - Gagnant plus bas : L6079 — `clamp(4rem, 20vh, 8rem) !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5721 — `#board` / `padding`
  - Ancienne valeur : `clamp(0.38rem, 1.8vw, 0.68rem) !important`
  - Gagnant plus bas : L5854 — `clamp(0.36rem, calc(var(--board-effective-size-v85, 36rem) / 58), 0.78rem) !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.
- L5721 — `#board` / `gap`
  - Ancienne valeur : `clamp(0.2rem, 1.45vw, 0.45rem) !important`
  - Gagnant plus bas : L5854 — `clamp(0.18rem, calc(var(--board-effective-size-v85, 36rem) / 96), 0.48rem) !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.
- L5730 — `#play-status-panel` / `grid-template-columns`
  - Ancienne valeur : `minmax(0, 1fr) auto !important`
  - Gagnant plus bas : L6102 — `minmax(0, 1fr) auto !important`
  - Contexte gagnant : En largeur très faible, on évite que le chrono et le bouton s'écrasent.
- L5730 — `#play-status-panel` / `grid-template-areas`
  - Ancienne valeur : `"status timer"
      "end end" !important`
  - Gagnant plus bas : L6102 — `"status timer"
      "end end" !important`
  - Contexte gagnant : En largeur très faible, on évite que le chrono et le bouton s'écrasent.
- L5737 — `#end-game` / `width`
  - Ancienne valeur : `100% !important`
  - Gagnant plus bas : L6112 — `100% !important`
  - Contexte gagnant : En largeur très faible, on évite que le chrono et le bouton s'écrasent.
- L5748 — `#rules-summary .rule-pill` / `font-size`
  - Ancienne valeur : `0.92rem !important`
  - Gagnant plus bas : L6210 — `0.86rem !important`
  - Contexte gagnant : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.

### 7 déclaration(s) surchargée(s)
Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- Sélecteurs concernés : 4
- Propriétés concernées : 6

- L4171 — `#launch-panel` / `margin-bottom`
  - Ancienne valeur : `clamp(0.55rem, 0.9vh, 0.8rem) !important`
  - Gagnant plus bas : L4286 — `0.45rem !important`
  - Contexte gagnant : Hauteurs modestes : on priorise tout visible.
- L4094 — `#boggle-layout` / `min-height`
  - Ancienne valeur : `0 !important`
  - Gagnant plus bas : L5667 — `0 !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4162 — `#boggle-center` / `padding`
  - Ancienne valeur : `clamp(0.75rem, 1.2vh, 1rem) !important`
  - Gagnant plus bas : L4319 — `1.1rem !important`
  - Contexte gagnant : Grandes hauteurs : on aère un peu le haut et les panneaux.
- L4081 — `#boggle-shell` / `padding-top`
  - Ancienne valeur : `var(--top-space) !important`
  - Gagnant plus bas : L4308 — `1.15rem !important`
  - Contexte gagnant : Grandes hauteurs : on aère un peu le haut et les panneaux.
- L4081 — `#boggle-shell` / `padding-bottom`
  - Ancienne valeur : `clamp(0.6rem, 1vh, 1rem) !important`
  - Gagnant plus bas : L4273 — `0.55rem !important`
  - Contexte gagnant : Hauteurs modestes : on priorise tout visible.
- L4094 — `#boggle-layout` / `height`
  - Ancienne valeur : `min(var(--layout-available-height), 52rem) !important`
  - Gagnant plus bas : L5667 — `auto !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4171 — `#launch-panel` / `padding-bottom`
  - Ancienne valeur : `clamp(0.5rem, 0.8vh, 0.7rem) !important`
  - Gagnant plus bas : L4286 — `0.45rem !important`
  - Contexte gagnant : Hauteurs modestes : on priorise tout visible.

### 6 déclaration(s) surchargée(s)
Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- Sélecteurs concernés : 1
- Propriétés concernées : 3

- L5412 — `#found-words-panel` / `min-height`
  - Ancienne valeur : `14rem !important`
  - Gagnant plus bas : L5771 — `12rem !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L5420 — `#found-words-panel` / `min-height`
  - Ancienne valeur : `13rem !important`
  - Gagnant plus bas : L5771 — `12rem !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L5412 — `#found-words-panel` / `height`
  - Ancienne valeur : `clamp(14rem, 34vh, 23rem) !important`
  - Gagnant plus bas : L5771 — `clamp(12rem, 34vh, 20rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L5420 — `#found-words-panel` / `height`
  - Ancienne valeur : `clamp(13rem, 36vh, 22rem) !important`
  - Gagnant plus bas : L5771 — `clamp(12rem, 34vh, 20rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L5412 — `#found-words-panel` / `max-height`
  - Ancienne valeur : `23rem !important`
  - Gagnant plus bas : L5771 — `20rem !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L5420 — `#found-words-panel` / `max-height`
  - Ancienne valeur : `22rem !important`
  - Gagnant plus bas : L5771 — `20rem !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 6 déclaration(s) surchargée(s)
Contexte : -------------------------------------------------------------------------- Plateau canonique --------------------------------------------------------------------------
- Sélecteurs concernés : 2
- Propriétés concernées : 5

- L5504 — `#board .board-cell` / `overflow`
  - Ancienne valeur : `visible !important`
  - Gagnant plus bas : L5865 — `visible !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.
- L5504 — `#board .board-cell` / `padding-inline`
  - Ancienne valeur : `0.04em !important`
  - Gagnant plus bas : L5865 — `0.08em !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.
- L5521 — `#board .board-letter` / `max-width`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L5982 — `none !important`
  - Contexte gagnant : Les cases ne doivent jamais se chevaucher visuellement.
- L5521 — `#board .board-letter` / `max-height`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L5982 — `none !important`
  - Contexte gagnant : Les cases ne doivent jamais se chevaucher visuellement.
- L5521 — `#board .board-letter` / `overflow`
  - Ancienne valeur : `visible !important`
  - Gagnant plus bas : L5982 — `visible !important`
  - Contexte gagnant : Les cases ne doivent jamais se chevaucher visuellement.
- L5521 — `#board .board-letter` / `line-height`
  - Ancienne valeur : `1.05 !important`
  - Gagnant plus bas : L5870 — `1.08 !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.

### 5 déclaration(s) surchargée(s)
Contexte : Quand la largeur le permet, on se rapproche encore plus de la capture générée : plus d’espace pour gauche/droite et un centre dominant.
- Sélecteurs concernés : 3
- Propriétés concernées : 3

- L3897 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(22rem, 0.95fr)
          minmax(44rem, 1.55fr)
          minmax(22rem, 0.95fr) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3910 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(16rem, 21rem)
          minmax(32rem, 43rem)
          minmax(16rem, 21rem) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3924 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `1fr !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3907 — `#boggle-shell` / `width`
  - Ancienne valeur : `calc(100vw - 1rem) !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3917 — `#boggle-center` / `padding`
  - Ancienne valeur : `0.8rem !important`
  - Gagnant plus bas : L4319 — `1.1rem !important`
  - Contexte gagnant : Grandes hauteurs : on aère un peu le haut et les panneaux.

### 5 déclaration(s) surchargée(s)
Contexte : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.
- Sélecteurs concernés : 2
- Propriétés concernées : 5

- L5870 — `#board .board-letter` / `max-width`
  - Ancienne valeur : `none !important`
  - Gagnant plus bas : L5982 — `none !important`
  - Contexte gagnant : Les cases ne doivent jamais se chevaucher visuellement.
- L5870 — `#board .board-letter` / `overflow`
  - Ancienne valeur : `visible !important`
  - Gagnant plus bas : L5982 — `visible !important`
  - Contexte gagnant : Les cases ne doivent jamais se chevaucher visuellement.
- L5823 — `#play-status-panel` / `min-height`
  - Ancienne valeur : `clamp(3.05rem, 5vh, 3.75rem) !important`
  - Gagnant plus bas : L6088 — `2.9rem !important`
  - Contexte gagnant : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L5823 — `#play-status-panel` / `padding`
  - Ancienne valeur : `0.55rem 0.75rem !important`
  - Gagnant plus bas : L5912 — `0.55rem 0.65rem !important`
  - Contexte gagnant : Petite réduction supplémentaire pour éviter les rognages à droite.
- L5823 — `#play-status-panel` / `margin-bottom`
  - Ancienne valeur : `clamp(0.4rem, 0.9vh, 0.7rem) !important`
  - Gagnant plus bas : L5923 — `0.45rem !important`
  - Contexte gagnant : Petite réduction supplémentaire pour éviter les rognages à droite.

### 4 déclaration(s) surchargée(s)
Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- Sélecteurs concernés : 2
- Propriétés concernées : 4

- L2997 — `#boggle-shell` / `padding`
  - Ancienne valeur : `0.85rem 1.1rem 1.3rem !important`
  - Gagnant plus bas : L3954 — `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3079 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(17rem, 22rem) minmax(34rem, 43rem) minmax(18rem, 22rem) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3079 — `#boggle-layout` / `gap`
  - Ancienne valeur : `0.9rem !important`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L2997 — `#boggle-shell` / `width`
  - Ancienne valeur : `min(100%, 100rem) !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 4 déclaration(s) surchargée(s)
Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- Sélecteurs concernés : 3
- Propriétés concernées : 2

- L3660 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(16rem, 21rem) minmax(32rem, 42rem) minmax(16rem, 21rem) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3670 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `1fr !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3578 — `#players-panel` / `height`
  - Ancienne valeur : `15.4rem !important`
  - Gagnant plus bas : L4015 — `clamp(14rem, 22vh, 18rem) !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3582 — `#found-words-panel` / `height`
  - Ancienne valeur : `29rem !important`
  - Gagnant plus bas : L5771 — `clamp(12rem, 34vh, 20rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 3 déclaration(s) surchargée(s)
Contexte : Ancienne couche : injectFruityThemeOverrides.
- Sélecteurs concernés : 2
- Propriétés concernées : 3

- L1714 — `#boggle-shell` / `padding`
  - Ancienne valeur : `1rem !important`
  - Gagnant plus bas : L3954 — `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L1714 — `#boggle-shell` / `width`
  - Ancienne valeur : `min(100%, 108rem) !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L1869 — `#board` / `position`
  - Ancienne valeur : `relative`
  - Gagnant plus bas : L5854 — `relative !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.

### 3 déclaration(s) surchargée(s)
Contexte : Top sans carte : on pose les éléments sur le fond.
- Sélecteurs concernés : 1
- Propriétés concernées : 3

- L3389 — `#boggle-layout` / `grid-template-columns`
  - Ancienne valeur : `minmax(18.5rem, 24.5rem) minmax(37rem, 49rem) minmax(19rem, 24.5rem) !important`
  - Gagnant plus bas : L5667 — `minmax(0, 1fr) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3389 — `#boggle-layout` / `gap`
  - Ancienne valeur : `1.05rem !important`
  - Gagnant plus bas : L5667 — `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L3389 — `#boggle-layout` / `justify-content`
  - Ancienne valeur : `center !important`
  - Gagnant plus bas : L3974 — `stretch !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.

### 3 déclaration(s) surchargée(s)
Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- Sélecteurs concernés : 2
- Propriétés concernées : 2

- L6199 — `#rules-summary .rule-pill` / `line-height`
  - Ancienne valeur : `1.18 !important`
  - Gagnant plus bas : L6210 — `1.15 !important`
  - Contexte gagnant : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- L6192 — `#help-panel` / `max-height`
  - Ancienne valeur : `clamp(10rem, 37vh, 19rem) !important`
  - Gagnant plus bas : L6222 — `clamp(10rem, 42vh, 22rem) !important`
  - Contexte gagnant : Si la largeur est aussi très faible, on garde une seule colonne et on évite les longues pastilles horizontales.
- L6207 — `#help-panel` / `max-height`
  - Ancienne valeur : `clamp(8.5rem, 35vh, 15rem) !important`
  - Gagnant plus bas : L6222 — `clamp(10rem, 42vh, 22rem) !important`
  - Contexte gagnant : Si la largeur est aussi très faible, on garde une seule colonne et on évite les longues pastilles horizontales.

### 3 déclaration(s) surchargée(s)
Contexte : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- Sélecteurs concernés : 1
- Propriétés concernées : 3

- L5706 — `#mode-controls, #help-panel` / `max-height`
  - Ancienne valeur : `62vh !important`
  - Gagnant plus bas : L5798 — `min(58vh, 26rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Petite hauteur desktop --------------------------------------------------------------------------
- L5706 — `#mode-controls, #help-panel` / `overflow-x`
  - Ancienne valeur : `hidden !important`
  - Gagnant plus bas : L5798 — `hidden !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Petite hauteur desktop --------------------------------------------------------------------------
- L5706 — `#mode-controls, #help-panel` / `overflow-y`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L5798 — `auto !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Petite hauteur desktop --------------------------------------------------------------------------

### 2 déclaration(s) surchargée(s)
Contexte : V4 : rapprochement plus fort de la maquette. Police plus ronde, top bar posée sur le fond, panneaux plus larges et tableau des mots plus propre.
- Sélecteurs concernés : 1
- Propriétés concernées : 2

- L3276 — `#boggle-shell` / `padding`
  - Ancienne valeur : `0.7rem 1.2rem 1.4rem !important`
  - Gagnant plus bas : L3954 — `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte gagnant : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L3276 — `#boggle-shell` / `width`
  - Ancienne valeur : `min(100%, 104rem) !important`
  - Gagnant plus bas : L5662 — `100% !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 2 déclaration(s) surchargée(s)
Contexte : Hauteurs modestes : on priorise tout visible.
- Sélecteurs concernés : 2
- Propriétés concernées : 2

- L4282 — `#boggle-center` / `padding`
  - Ancienne valeur : `0.7rem !important`
  - Gagnant plus bas : L4319 — `1.1rem !important`
  - Contexte gagnant : Grandes hauteurs : on aère un peu le haut et les panneaux.
- L4273 — `#boggle-shell` / `padding-top`
  - Ancienne valeur : `0.55rem !important`
  - Gagnant plus bas : L4308 — `1.15rem !important`
  - Contexte gagnant : Grandes hauteurs : on aère un peu le haut et les panneaux.

### 2 déclaration(s) surchargée(s)
Contexte : Grandes hauteurs : on aère un peu le haut et les panneaux.
- Sélecteurs concernés : 1
- Propriétés concernées : 1

- L4315 — `#boggle-layout` / `height`
  - Ancienne valeur : `min(calc(100vh - 7.2rem), 55rem) !important`
  - Gagnant plus bas : L5667 — `auto !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------
- L4326 — `#boggle-layout` / `height`
  - Ancienne valeur : `auto !important`
  - Gagnant plus bas : L5667 — `auto !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 2 déclaration(s) surchargée(s)
Contexte : Polices légèrement réduites vs v84 pour éviter les lettres coupées.
- Sélecteurs concernés : 2
- Propriétés concernées : 1

- L5541 — `#board.boggle-board-size-4 .board-letter` / `font-size`
  - Ancienne valeur : `clamp(1.08rem, calc(var(--board-effective-size-v85) / 9), 3.05rem) !important`
  - Gagnant plus bas : L6004 — `clamp(0.98rem, calc(var(--board-effective-size-v85, 34rem) / 9.8), 2.65rem) !important`
  - Contexte gagnant : Sécurité supplémentaire : quand la hauteur est très basse, on garde une grille jouable plutôt que de tout compresser.
- L5545 — `#board.boggle-board-size-5 .board-letter` / `font-size`
  - Ancienne valeur : `clamp(0.84rem, calc(var(--board-effective-size-v85) / 11.2), 2.35rem) !important`
  - Gagnant plus bas : L6008 — `clamp(0.76rem, calc(var(--board-effective-size-v85, 34rem) / 12.3), 2.05rem) !important`
  - Contexte gagnant : Sécurité supplémentaire : quand la hauteur est très basse, on garde une grille jouable plutôt que de tout compresser.

### 2 déclaration(s) surchargée(s)
Contexte : -------------------------------------------------------------------------- Barre Partie canonique --------------------------------------------------------------------------
- Sélecteurs concernés : 1
- Propriétés concernées : 2

- L5575 — `#game-status` / `white-space`
  - Ancienne valeur : `nowrap !important`
  - Gagnant plus bas : L5767 — `normal !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------
- L5575 — `#game-status` / `line-height`
  - Ancienne valeur : `1.1 !important`
  - Gagnant plus bas : L6022 — `1.15 !important`
  - Contexte gagnant : Barre de partie : moins haute, mais pas écrasée.

### 2 déclaration(s) surchargée(s)
Contexte : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- Sélecteurs concernés : 1
- Propriétés concernées : 2

- L6082 — `#rules-summary .rule-pill` / `line-height`
  - Ancienne valeur : `1.2 !important`
  - Gagnant plus bas : L6210 — `1.15 !important`
  - Contexte gagnant : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- L6082 — `#rules-summary .rule-pill` / `font-size`
  - Ancienne valeur : `0.88rem !important`
  - Gagnant plus bas : L6210 — `0.86rem !important`
  - Contexte gagnant : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.

### 2 déclaration(s) surchargée(s)
Contexte : -------------------------------------------------------------------------- Petite hauteur desktop --------------------------------------------------------------------------
- Sélecteurs concernés : 1
- Propriétés concernées : 2

- L5787 — `#board` / `padding`
  - Ancienne valeur : `clamp(0.36rem, 0.8vh, 0.64rem) !important`
  - Gagnant plus bas : L5854 — `clamp(0.36rem, calc(var(--board-effective-size-v85, 36rem) / 58), 0.78rem) !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.
- L5787 — `#board` / `gap`
  - Ancienne valeur : `clamp(0.2rem, 0.65vh, 0.45rem) !important`
  - Gagnant plus bas : L5854 — `clamp(0.18rem, calc(var(--board-effective-size-v85, 36rem) / 96), 0.48rem) !important`
  - Contexte gagnant : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une taille plus stable.

### 1 déclaration(s) surchargée(s)
Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- Sélecteurs concernés : 1
- Propriétés concernées : 1

- L3860 — `#found-words-panel` / `height`
  - Ancienne valeur : `clamp(27rem, 48vh, 36rem) !important`
  - Gagnant plus bas : L5771 — `clamp(12rem, 34vh, 20rem) !important`
  - Contexte gagnant : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

## Lecture recommandée

- Un contexte avec beaucoup de déclarations surchargées est un bon candidat au nettoyage.
- Ne pas supprimer automatiquement : certaines règles anciennes peuvent encore contenir des styles visuels utiles.
- Priorité : nettoyer d’abord layout général et accueil/options.
- Ne pas toucher au plateau tant que le rendu est bon.