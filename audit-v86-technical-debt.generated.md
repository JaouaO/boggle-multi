# Audit v86 — dette technique CSS/JS

## Résumé

- Blocs CSS analysés : 879
- Propriétés CSS répétées : 378
- Propriétés CSS contradictoires : 325
- Propriétés CSS de layout contradictoires : 176
- Fichiers JS analysés : 18
- Fonctions JS détectées : 217
- Fonctions JS longues, 80 lignes et plus : 10
- Noms de fonctions répétés : 2

## CSS — contradictions de layout prioritaires

### 20× — `#boggle-layout` / `grid-template-columns`
- L204 : `280px minmax(500px, 1fr) 330px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L461 : `300px minmax(560px, 1fr) 350px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L468 : `minmax(0, 1fr) minmax(0, 1fr)`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2312 : `minmax(16rem, 23rem) minmax(30rem, 46rem) minmax(16rem, 23rem) !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2646 : `1fr !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2699 : `minmax(17rem, 21rem) minmax(32rem, 43rem) minmax(17rem, 21rem) !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L2967 : `1fr !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3079 : `minmax(17rem, 22rem) minmax(34rem, 43rem) minmax(18rem, 22rem) !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3389 : `minmax(18.5rem, 24.5rem) minmax(37rem, 49rem) minmax(19rem, 24.5rem) !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L3660 : `minmax(16rem, 21rem) minmax(32rem, 42rem) minmax(16rem, 21rem) !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3670 : `1fr !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3715 : `minmax(18rem, 0.92fr)
        minmax(38rem, 1.62fr)
        minmax(18rem, 0.92fr) !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- … 8 autre(s) occurrence(s)

### 10× — `#boggle-layout` / `gap`
- L204 : `14px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L461 : `16px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L508 : `10px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2312 : `0.95rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2699 : `0.9rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3079 : `0.9rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3389 : `1.05rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L3715 : `clamp(0.9rem, 1.4vw, 1.35rem) !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3974 : `clamp(0.85rem, 1.2vw, 1.15rem) !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L5667 : `clamp(0.65rem, 1.7vw, 1rem) !important`
  - Contexte : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 9× — `#boggle-shell` / `width`
- L1714 : `min(100%, 108rem) !important`
  - Contexte : Ancienne couche : injectFruityThemeOverrides.
- L2104 : `min(100%, 96rem) !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2997 : `min(100%, 100rem) !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3276 : `min(100%, 104rem) !important`
  - Contexte : V4 : rapprochement plus fort de la maquette. Police plus ronde, top bar posée sur le fond, panneaux plus larges et tableau des mots plus propre.
- L3689 : `calc(100vw - 2rem) !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3907 : `calc(100vw - 1rem) !important`
  - Contexte : Quand la largeur le permet, on se rapproche encore plus de la capture générée : plus d’espace pour gauche/droite et un centre dominant.
- L3954 : `100vw !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L4058 : `100% !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L5662 : `100% !important`
  - Contexte : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 8× — `#start` / `min-height`
- L245 : `48px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L587 : `54px !important`
  - Contexte : ========================================================================== V5 — corrections UX desktop ==========================================================================
- L2255 : `3.6rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2730 : `3.25rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3437 : `3.75rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L3781 : `3.55rem !important`
  - Contexte : Le bloc lancement reste en haut, mais avec moins d'effet carte.
- L4176 : `clamp(3.05rem, 4.4vh, 3.55rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4291 : `2.95rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.

### 7× — `#boggle-shell` / `padding`
- L167 : `0 !important`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L1714 : `1rem !important`
  - Contexte : Ancienne couche : injectFruityThemeOverrides.
- L2104 : `0.8rem 1rem 1.2rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2997 : `0.85rem 1.1rem 1.3rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3276 : `0.7rem 1.2rem 1.4rem !important`
  - Contexte : V4 : rapprochement plus fort de la maquette. Police plus ronde, top bar posée sur le fond, panneaux plus larges et tableau des mots plus propre.
- L3689 : `0.8rem 0 1.4rem !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3954 : `0.75rem clamp(0.75rem, 1.2vw, 1.35rem) 1.35rem !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.

### 7× — `#found-words-panel` / `height`
- L2941 : `24rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3582 : `29rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3860 : `clamp(27rem, 48vh, 36rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- L4019 : `clamp(29rem, 52vh, 39rem) !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L5412 : `clamp(14rem, 34vh, 23rem) !important`
  - Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- L5420 : `clamp(13rem, 36vh, 22rem) !important`
  - Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- L5771 : `clamp(12rem, 34vh, 20rem) !important`
  - Contexte : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 7× — `#rules-summary` / `max-height`
- L5610 : `clamp(8rem, 26vh, 14rem) !important`
  - Contexte : -------------------------------------------------------------------------- Règles canonique --------------------------------------------------------------------------
- L5743 : `clamp(7rem, 30vh, 13rem) !important`
  - Contexte : -------------------------------------------------------------------------- Petit écran --------------------------------------------------------------------------
- L5895 : `clamp(7rem, 24vh, 13rem) !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L5916 : `clamp(7rem, 30vh, 12rem) !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L5928 : `clamp(6rem, 22vh, 10rem) !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L6050 : `clamp(4.8rem, 22vh, 12rem) !important`
  - Contexte : Règles : le conteneur scrolle toujours, même en très petite hauteur.
- L6079 : `clamp(4rem, 20vh, 8rem) !important`
  - Contexte : En hauteur extrême, on compacte les règles mais elles restent scrollables.

### 7× — `#boggle-layout` / `align-items`
- L204 : `start`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L594 : `stretch !important`
  - Contexte : ========================================================================== V5 — corrections UX desktop ==========================================================================
- L2312 : `start !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2699 : `start !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3715 : `start !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3974 : `start !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L4094 : `stretch !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 6× — `#boggle-top` / `padding`
- L174 : `12px !important`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L1719 : `1rem 1.2rem !important`
  - Contexte : Ancienne couche : injectFruityThemeOverrides.
- L2111 : `0.5rem 0.9rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2663 : `0.55rem 0.85rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3002 : `0.25rem 0.35rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3697 : `0.15rem 0.65rem !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.

### 6× — `#word-form` / `grid-template-columns`
- L2448 : `minmax(0, 1fr) auto !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2778 : `minmax(0, 1fr) minmax(9.5rem, auto) !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3531 : `minmax(0, 1fr) minmax(10.5rem, auto) !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3837 : `minmax(0, 1fr) minmax(10.8rem, auto) !important`
  - Contexte : Plateau agrandi pour occuper la largeur centrale.
- L4190 : `minmax(0, 1fr) minmax(9.5rem, auto) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L5759 : `minmax(0, 1fr) !important`
  - Contexte : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 6× — `#word-submit` / `min-width`
- L2470 : `11rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2791 : `10rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3547 : `11.5rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3848 : `11rem !important`
  - Contexte : Plateau agrandi pour occuper la largeur centrale.
- L4203 : `clamp(9.4rem, 10vw, 11rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L5762 : `0 !important`
  - Contexte : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 6× — `#boggle-top` / `width`
- L2663 : `min(100%, 64rem) !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3002 : `min(100%, 72rem) !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3227 : `100% !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3663 : `min(100%, 74rem) !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3697 : `100% !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3964 : `100% !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.

### 6× — `#boggle-layout` / `display`
- L204 : `grid`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L508 : `flex`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2312 : `grid !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3715 : `grid !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3974 : `grid !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L5667 : `grid !important`
  - Contexte : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 5× — `#launch-panel` / `padding`
- L235 : `14px !important`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L582 : `16px !important`
  - Contexte : ========================================================================== V5 — corrections UX desktop ==========================================================================
- L2343 : `0.85rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2705 : `0.8rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3432 : `0.95rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 5× — `#connection-controls` / `gap`
- L1299 : `0.55rem`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L2163 : `0.75rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2680 : `0.55rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3033 : `0.7rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3324 : `0.85rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 5× — `#found-words-panel` / `min-height`
- L1460 : `14rem`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L2494 : `24rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L5412 : `14rem !important`
  - Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- L5420 : `13rem !important`
  - Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- L5771 : `12rem !important`
  - Contexte : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 5× — `#boggle-brand` / `min-width`
- L2126 : `12.5rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2649 : `0 !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2671 : `10rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3014 : `10.8rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3294 : `13rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 5× — `#rules-summary .rule-pill` / `line-height`
- L5630 : `1.28 !important`
  - Contexte : -------------------------------------------------------------------------- Règles canonique --------------------------------------------------------------------------
- L6063 : `1.25 !important`
  - Contexte : Règles : le conteneur scrolle toujours, même en très petite hauteur.
- L6082 : `1.2 !important`
  - Contexte : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L6199 : `1.18 !important`
  - Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- L6210 : `1.15 !important`
  - Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.

### 5× — `#mode-options-toggle` / `min-height`
- L2268 : `2.75rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2737 : `2.75rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3448 : `3.1rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L4181 : `clamp(2.65rem, 3.9vh, 3.05rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4296 : `2.5rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.

### 5× — `#start` / `font-size`
- L245 : `1.05rem`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L587 : `1.08rem !important`
  - Contexte : ========================================================================== V5 — corrections UX desktop ==========================================================================
- L2255 : `1.08rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2730 : `1.08rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3437 : `1.22rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 5× — `#connection-controls` / `align-items`
- L1299 : `center`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L2163 : `center !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2680 : `center !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3033 : `center !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3324 : `center !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 4× — `#boggle-top` / `margin-bottom`
- L174 : `14px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4087 : `clamp(0.95rem, 1.6vh, 1.35rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4278 : `0.65rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.
- L4311 : `1.25rem !important`
  - Contexte : Grandes hauteurs : on aère un peu le haut et les panneaux.

### 4× — `#word-form` / `gap`
- L340 : `8px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2448 : `0.8rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2778 : `0.7rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3531 : `0.85rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.

### 4× — `.boggle-brand-mark` / `font-size`
- L2136 : `clamp(2rem, 3vw, 3.1rem) !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2676 : `clamp(2.05rem, 3vw, 2.8rem) !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3020 : `clamp(2.35rem, 3.25vw, 3.35rem) !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3300 : `clamp(2.8rem, 4.6vw, 4.4rem) !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 4× — `#word-input` / `min-height`
- L2459 : `3.45rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2785 : `3.4rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3215 : `3.55rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3538 : `3.75rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.

### 4× — `#word-submit` / `min-height`
- L2470 : `3.45rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2791 : `3.4rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3220 : `3.55rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3547 : `3.75rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.

### 4× — `#connection-controls` / `grid-template-columns`
- L2680 : `minmax(8rem, 12rem) minmax(8rem, 12rem) auto auto minmax(6rem, 1fr) auto !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3033 : `minmax(9rem, 13rem) minmax(9rem, 13rem) auto auto 1fr auto !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3324 : `minmax(10rem, 14rem) minmax(10rem, 14rem) auto auto 1fr auto !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L3705 : `minmax(10rem, 14rem)
        minmax(10rem, 14rem)
        auto
        auto
        minmax(1rem, 1fr)
        auto !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.

### 4× — `#mockup-right-cards` / `gap`
- L2805 : `0.85rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3622 : `1rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3864 : `clamp(0.9rem, 1.2vw, 1.25rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- L4140 : `clamp(0.75rem, 1vh, 1rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 4× — `.mockup-info-card h2` / `font-size`
- L2826 : `1.25rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3572 : `1.42rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3882 : `clamp(1.25rem, 1.35vw, 1.55rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- L4213 : `clamp(1.08rem, 1.2vw, 1.36rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 4× — `#start` / `height`
- L3437 : `3.75rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L3781 : `3.55rem !important`
  - Contexte : Le bloc lancement reste en haut, mais avec moins d'effet carte.
- L4176 : `clamp(3.05rem, 4.4vh, 3.55rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4291 : `2.95rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.

### 4× — `#boggle-center` / `padding`
- L3917 : `0.8rem !important`
  - Contexte : Quand la largeur le permet, on se rapproche encore plus de la capture générée : plus d’espace pour gauche/droite et un centre dominant.
- L4162 : `clamp(0.75rem, 1.2vh, 1rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4282 : `0.7rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.
- L4319 : `1.1rem !important`
  - Contexte : Grandes hauteurs : on aère un peu le haut et les panneaux.

### 4× — `#play-status-panel` / `min-height`
- L5823 : `clamp(3.05rem, 5vh, 3.75rem) !important`
  - Contexte : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une tail
- L5912 : `auto !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L5923 : `clamp(2.8rem, 4.6vh, 3.25rem) !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L6088 : `2.9rem !important`
  - Contexte : En hauteur extrême, on compacte les règles mais elles restent scrollables.

### 4× — `#boggle-layout` / `height`
- L4094 : `min(var(--layout-available-height), 52rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4315 : `min(calc(100vh - 7.2rem), 55rem) !important`
  - Contexte : Grandes hauteurs : on aère un peu le haut et les panneaux.
- L4326 : `auto !important`
  - Contexte : Grandes hauteurs : on aère un peu le haut et les panneaux.
- L5667 : `auto !important`
  - Contexte : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 4× — `#rules-summary` / `padding-right`
- L5895 : `0.35rem !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L6050 : `0.45rem !important`
  - Contexte : Règles : le conteneur scrolle toujours, même en très petite hauteur.
- L6151 : `0.45rem !important`
  - Contexte : On borne le panneau lui-même. Si la fenêtre est très basse, le contenu interne scrolle au lieu de déborder sur les cartes suivantes.
- L6195 : `0.4rem !important`
  - Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.

### 4× — `#boggle-layout` / `justify-content`
- L2312 : `center !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3389 : `center !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L3715 : `stretch !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3974 : `stretch !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.

### 3× — `#boggle-top` / `display`
- L174 : `flex`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L499 : `grid`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4669 : `grid !important`
  - Contexte : V39 : couche finale haut de page / accueil / popup de fin. - positionnement de la barre de connexion ; - état accueil / lancement avant partie ; - popup de fin indépendante de l'an

### 3× — `#boggle-top` / `gap`
- L174 : `10px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L499 : `8px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4669 : `0.75rem !important`
  - Contexte : V39 : couche finale haut de page / accueil / popup de fin. - positionnement de la barre de connexion ; - état accueil / lancement avant partie ; - popup de fin indépendante de l'an

### 3× — `#connect` / `min-height`
- L190 : `36px`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2249 : `2.7rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3356 : `3rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 3× — `#start` / `width`
- L245 : `100%`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2255 : `100% !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3781 : `min(100%, 42rem) !important`
  - Contexte : Le bloc lancement reste en haut, mais avec moins d'effet carte.

### 3× — `#word-form` / `width`
- L340 : `min(100%, 720px)`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4859 : `min(100%, 49rem) !important`
  - Contexte : V38 : couche finale du panneau règles / aide / options. Les styles de boutons sont centralisés dans V34. Les règles plateau/saisie finales sont centralisées dans V36.
- L5178 : `min(100%, 43rem) !important`
  - Contexte : V36 : couche finale plateau + champ "Votre mot". Le plateau reçoit une taille calculée par JS dans --board-fit-size-v31. Le formulaire reste dans le flux, sous la grille, sans supe

### 3× — `#word-form` / `display`
- L340 : `flex`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L534 : `grid`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L2448 : `grid !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.

### 3× — `#word-form` / `margin`
- L340 : `0`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4859 : `clamp(1.15rem, 1.8vh, 1.65rem) auto 0 !important`
  - Contexte : V38 : couche finale du panneau règles / aide / options. Les styles de boutons sont centralisés dans V34. Les règles plateau/saisie finales sont centralisées dans V36.
- L5178 : `0 auto !important`
  - Contexte : V36 : couche finale plateau + champ "Votre mot". Le plateau reçoit une taille calculée par JS dans --board-fit-size-v31. Le formulaire reste dans le flux, sous la grille, sans supe

### 3× — `#word-feedback` / `width`
- L369 : `min(100%, 720px)`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4885 : `min(100%, 49rem) !important`
  - Contexte : V38 : couche finale du panneau règles / aide / options. Les styles de boutons sont centralisés dans V34. Les règles plateau/saisie finales sont centralisées dans V36.
- L5189 : `min(100%, 43rem) !important`
  - Contexte : V36 : couche finale plateau + champ "Votre mot". Le plateau reçoit une taille calculée par JS dans --board-fit-size-v31. Le formulaire reste dans le flux, sous la grille, sans supe

### 3× — `#word-feedback` / `margin`
- L369 : `0`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L4885 : `0.35rem auto 0 !important`
  - Contexte : V38 : couche finale du panneau règles / aide / options. Les styles de boutons sont centralisés dans V34. Les règles plateau/saisie finales sont centralisées dans V36.
- L5189 : `0 auto !important`
  - Contexte : V36 : couche finale plateau + champ "Votre mot". Le plateau reçoit une taille calculée par JS dans --board-fit-size-v31. Le formulaire reste dans le flux, sous la grille, sans supe

### 3× — `#launch-panel` / `margin-bottom`
- L582 : `2px !important`
  - Contexte : ========================================================================== V5 — corrections UX desktop ==========================================================================
- L4171 : `clamp(0.55rem, 0.9vh, 0.8rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4286 : `0.45rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.

### 3× — `.connection-control` / `gap`
- L1310 : `0.35rem`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L2170 : `0.12rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3331 : `0.18rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 3× — `#mode-options-toggle` / `justify-content`
- L1341 : `space-between`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L2268 : `space-between !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2737 : `center !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.

### 3× — `#found-words` / `padding-right`
- L1468 : `0.35rem`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L2563 : `0.5rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3126 : `0.45rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.

### 3× — `.player-row` / `padding`
- L1508 : `0.12rem 0.24rem`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L1913 : `0.18rem 0.35rem !important`
  - Contexte : Ancienne couche : injectFruityThemeOverrides.
- L2522 : `0.35rem 0.55rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.

### 3× — `.player-rank` / `min-width`
- L1529 : `1.75rem`
  - Contexte : Ancienne couche : injectDesignPassStyles.
- L1930 : `1.7rem`
  - Contexte : Ancienne couche : injectFruityThemeOverrides.
- L2542 : `1.65rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.

### 3× — `#boggle-top` / `margin`
- L2111 : `0 0 0.95rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3002 : `0 auto 0.95rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3697 : `0 auto 1rem !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.

### 3× — `.connection-field-label` / `font-size`
- L2178 : `0.82rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3041 : `0.92rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3335 : `1.02rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 3× — `.connection-field-label` / `padding-left`
- L2178 : `0.18rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3041 : `0.25rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3335 : `0.75rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 3× — `#room, #name` / `padding`
- L2185 : `0 0.9rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L3049 : `0 1rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3343 : `0 1.05rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 3× — `#launch-panel` / `gap`
- L2343 : `0.65rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2705 : `0.7rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3432 : `0.72rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.

### 3× — `#word-input` / `font-size`
- L2459 : `1.18rem !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.
- L2785 : `1.08rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3538 : `1.17rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.

### 3× — `.mockup-info-card` / `padding`
- L2816 : `1rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3626 : `1.08rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3868 : `clamp(1rem, 1.1vw, 1.25rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.

### 3× — `.mockup-info-card h2` / `padding-bottom`
- L2826 : `0.65rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3631 : `0.75rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4213 : `clamp(0.45rem, 0.7vh, 0.7rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `.mockup-info-icon` / `width`
- L2847 : `2.15rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3643 : `2.35rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4230 : `clamp(1.9rem, 2.4vw, 2.3rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `.mockup-info-icon` / `height`
- L2847 : `2.15rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3643 : `2.35rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4230 : `clamp(1.9rem, 2.4vw, 2.3rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `.mockup-info-icon` / `font-size`
- L2847 : `1.25rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3643 : `1.32rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4230 : `clamp(1rem, 1.25vw, 1.25rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `.mockup-help-list` / `gap`
- L2871 : `0.7rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3649 : `0.78rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4225 : `clamp(0.45rem, 0.75vh, 0.72rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `#players-panel` / `height`
- L2937 : `13.4rem !important`
  - Contexte : Passe v2 : on force une structure plus proche de la maquette.
- L3578 : `15.4rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4015 : `clamp(14rem, 22vh, 18rem) !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.

### 3× — `.found-words-table` / `font-size`
- L3132 : `0.98rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3586 : `1.02rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4247 : `clamp(0.86rem, 0.95vw, 1rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `.found-words-word, .found-words-player` / `min-height`
- L3165 : `2rem !important`
  - Contexte : V3 : top sans conteneur, police plus cute, statut sans bulle, mots en tableau.
- L3599 : `2.35rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L4259 : `clamp(1.85rem, 3vh, 2.35rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `#mode-options-toggle` / `height`
- L3448 : `3.1rem !important`
  - Contexte : Top sans carte : on pose les éléments sur le fond.
- L4181 : `clamp(2.65rem, 3.9vh, 3.05rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4296 : `2.5rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.

### 3× — `.mockup-info-card p, .mockup-help-list li` / `font-size`
- L3636 : `1.02rem !important`
  - Contexte : Barre Partie plus proche de la capture : titre + sous-texte intégré, aucun badge visible autour de “Partie en cours”.
- L3886 : `clamp(0.95rem, 1vw, 1.08rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- L4219 : `clamp(0.83rem, 0.95vw, 1rem) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `#boggle-shell` / `max-width`
- L3689 : `108rem !important`
  - Contexte : V5 : pleine largeur + centre plus unifié. But : moins de cartes empilées, plus proche de la maquette générée.
- L3954 : `none !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L5662 : `100% !important`
  - Contexte : -------------------------------------------------------------------------- Largeur intermédiaire --------------------------------------------------------------------------

### 3× — `#mockup-help-card` / `min-height`
- L3873 : `clamp(18rem, 29vh, 24rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- L4023 : `clamp(19rem, 31vh, 25rem) !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L4153 : `0 !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `#mockup-unique-card, #mockup-penalty-card` / `min-height`
- L3877 : `clamp(8.5rem, 14vh, 12rem) !important`
  - Contexte : Colonnes latérales plus hautes, pour mieux remplir l’écran.
- L4027 : `clamp(9rem, 15vh, 12.5rem) !important`
  - Contexte : V6 : corrige le décalage pleine largeur. On neutralise les contraintes du parent et on force un layout viewport centré.
- L4157 : `0 !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.

### 3× — `#boggle-shell` / `padding-top`
- L4081 : `var(--top-space) !important`
  - Contexte : V7 : responsive vertical. Objectif : voir haut + grille + côtés + saisie sans scroll quand la hauteur le permet.
- L4273 : `0.55rem !important`
  - Contexte : Hauteurs modestes : on priorise tout visible.
- L4308 : `1.15rem !important`
  - Contexte : Grandes hauteurs : on aère un peu le haut et les panneaux.

### 3× — `#connection-core` / `width`
- L4377 : `clamp(43rem, 46vw, 50rem) !important`
  - Contexte : V39 : couche finale haut de page / accueil / popup de fin. - positionnement de la barre de connexion ; - état accueil / lancement avant partie ; - popup de fin indépendante de l'an
- L4653 : `clamp(46rem, 44vw, 52rem) !important`
  - Contexte : V39 : couche finale haut de page / accueil / popup de fin. - positionnement de la barre de connexion ; - état accueil / lancement avant partie ; - popup de fin indépendante de l'an
- L4679 : `100% !important`
  - Contexte : V39 : couche finale haut de page / accueil / popup de fin. - positionnement de la barre de connexion ; - état accueil / lancement avant partie ; - popup de fin indépendante de l'an

### 3× — `#found-words-panel` / `max-height`
- L5412 : `23rem !important`
  - Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- L5420 : `22rem !important`
  - Contexte : Sur très petit écran, on évite de réserver trop de hauteur au panneau.
- L5771 : `20rem !important`
  - Contexte : -------------------------------------------------------------------------- Très petit écran --------------------------------------------------------------------------

### 3× — `#board.boggle-board-size-4 .board-letter` / `font-size`
- L5541 : `clamp(1.08rem, calc(var(--board-effective-size-v85) / 9), 3.05rem) !important`
  - Contexte : Polices légèrement réduites vs v84 pour éviter les lettres coupées.
- L5883 : `clamp(1.02rem, calc(var(--board-effective-size-v85, 36rem) / 9.5), 2.85rem) !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L6004 : `clamp(0.98rem, calc(var(--board-effective-size-v85, 34rem) / 9.8), 2.65rem) !important`
  - Contexte : Sécurité supplémentaire : quand la hauteur est très basse, on garde une grille jouable plutôt que de tout compresser.

### 3× — `#board.boggle-board-size-5 .board-letter` / `font-size`
- L5545 : `clamp(0.84rem, calc(var(--board-effective-size-v85) / 11.2), 2.35rem) !important`
  - Contexte : Polices légèrement réduites vs v84 pour éviter les lettres coupées.
- L5887 : `clamp(0.8rem, calc(var(--board-effective-size-v85, 36rem) / 11.9), 2.2rem) !important`
  - Contexte : Petite réduction supplémentaire pour éviter les rognages à droite.
- L6008 : `clamp(0.76rem, calc(var(--board-effective-size-v85, 34rem) / 12.3), 2.05rem) !important`
  - Contexte : Sécurité supplémentaire : quand la hauteur est très basse, on garde une grille jouable plutôt que de tout compresser.

### 3× — `#board` / `padding`
- L5721 : `clamp(0.38rem, 1.8vw, 0.68rem) !important`
  - Contexte : -------------------------------------------------------------------------- Petit écran --------------------------------------------------------------------------
- L5787 : `clamp(0.36rem, 0.8vh, 0.64rem) !important`
  - Contexte : -------------------------------------------------------------------------- Petite hauteur desktop --------------------------------------------------------------------------
- L5854 : `clamp(0.36rem, calc(var(--board-effective-size-v85, 36rem) / 58), 0.78rem) !important`
  - Contexte : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une tail

### 3× — `#board` / `gap`
- L5721 : `clamp(0.2rem, 1.45vw, 0.45rem) !important`
  - Contexte : -------------------------------------------------------------------------- Petit écran --------------------------------------------------------------------------
- L5787 : `clamp(0.2rem, 0.65vh, 0.45rem) !important`
  - Contexte : -------------------------------------------------------------------------- Petite hauteur desktop --------------------------------------------------------------------------
- L5854 : `clamp(0.18rem, calc(var(--board-effective-size-v85, 36rem) / 96), 0.48rem) !important`
  - Contexte : Complément à V85 : - la barre de partie reprend une vraie place ; - les règles deviennent scrollables ; - les lettres ne sont plus rognées à droite ; - le plateau conserve une tail

### 3× — `#rules-summary .rule-pill` / `font-size`
- L5748 : `0.92rem !important`
  - Contexte : -------------------------------------------------------------------------- Petit écran --------------------------------------------------------------------------
- L6082 : `0.88rem !important`
  - Contexte : En hauteur extrême, on compacte les règles mais elles restent scrollables.
- L6210 : `0.86rem !important`
  - Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.

### 3× — `#help-panel` / `max-height`
- L6192 : `clamp(10rem, 37vh, 19rem) !important`
  - Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- L6207 : `clamp(8.5rem, 35vh, 15rem) !important`
  - Contexte : Hauteur basse : on réduit la carte Règles, mais sans jamais laisser le texte sortir de son panneau.
- L6222 : `clamp(10rem, 42vh, 22rem) !important`
  - Contexte : Si la largeur est aussi très faible, on garde une seule colonne et on évite les longues pastilles horizontales.

### 3× — `html, body` / `min-height`
- L41 : `100%`
  - Contexte : ========================================================================== Boggle Multi — Look 02 — Salon automne UX V4 : plateau central, commandes utiles, pas de journal visible.
- L1698 : `100%`
  - Contexte : Ancienne couche : injectFruityThemeOverrides.
- L2087 : `100% !important`
  - Contexte : Ancienne couche : injectMockupCloserTheme.

## CSS — autres contradictions fréquentes

### 6× — `#board .board-cell` / `border-radius`
- L1880 : `1rem !important`
- L2415 : `1rem !important`
- L2774 : `0.95rem !important`
- L3519 : `1.18rem !important`
- L3833 : `1.15rem !important`
- L4186 : `clamp(0.8rem, 1.3vw, 1.1rem) !important`

### 6× — `#game-status` / `background`
- L1859 : `rgba(255,252,240,0.98) !important`
- L2382 : `#fffaf0 !important`
- L2758 : `#fff8ed !important`
- L3093 : `transparent !important`
- L3484 : `transparent !important`
- L3811 : `transparent !important`

### 5× — `#timer` / `background`
- L287 : `var(--warning-bg)`
- L1863 : `linear-gradient(180deg, #f8e7aa, #f4d66d) !important`
- L2390 : `var(--mk-yellow) !important`
- L2763 : `#f5d872 !important`
- L3497 : `var(--yellow) !important`

### 5× — `#game-status` / `color`
- L2382 : `var(--mk-ink) !important`
- L3093 : `#7c6048 !important`
- L3484 : `var(--brown-muted) !important`
- L3811 : `#8a6447 !important`
- L4004 : `#8a6447 !important`

### 4× — `#boggle-top` / `background`
- L174 : `var(--paper) !important`
- L1719 : `linear-gradient(180deg, rgba(255,252,245,0.98), rgba(251,240,214,0.93)) !important`
- L2111 : `var(--mk-panel) !important`
- L3002 : `transparent !important`

### 4× — `#timer` / `color`
- L287 : `var(--warning)`
- L1863 : `#6b481c !important`
- L2390 : `#5d351e !important`
- L3497 : `var(--brown-dark) !important`

### 4× — `#board` / `border`
- L293 : `2px solid var(--board-line)`
- L1869 : `1px solid rgba(147, 103, 50, 0.16) !important`
- L2408 : `1px solid rgba(143, 99, 49, 0.2) !important`
- L3513 : `2px solid rgba(139, 92, 38, 0.11) !important`

### 4× — `#board` / `background`
- L293 : `var(--board)`
- L1869 : `linear-gradient(180deg, rgba(233, 204, 131, 0.82), rgba(217, 178, 99, 0.72)) !important`
- L2408 : `#e7c47a !important`
- L3513 : `#e8c36f !important`

### 4× — `.connection-field-label` / `font-weight`
- L1433 : `850`
- L2178 : `900 !important`
- L3041 : `950 !important`
- L3335 : `700 !important`

### 4× — `.connection-field-label` / `color`
- L1433 : `#4b3322`
- L2178 : `var(--mk-ink) !important`
- L3041 : `#6b3b1f !important`
- L3335 : `var(--brown) !important`

### 4× — `#players` / `--player-row-height`
- L1485 : `2rem`
- L2511 : `2.75rem !important`
- L2952 : `2.45rem !important`
- L4242 : `clamp(2rem, 3.4vh, 2.45rem) !important`

### 4× — `#players` / `--player-row-gap`
- L1485 : `0.1rem`
- L2511 : `0.38rem !important`
- L2952 : `0.32rem !important`
- L4242 : `clamp(0.18rem, 0.45vh, 0.32rem) !important`

### 4× — `.player-row` / `border-radius`
- L1508 : `0.35rem`
- L1913 : `0.9rem !important`
- L2522 : `0.95rem !important`
- L2957 : `0.85rem !important`

### 4× — `#player-preferences > button` / `background`
- L1803 : `linear-gradient(180deg, #f6efe1, #f3e7cd) !important`
- L2284 : `#fff5e1 !important`
- L3074 : `rgba(255, 246, 225, 0.76) !important`
- L3378 : `rgba(255, 247, 227, 0.72) !important`

### 4× — `#boggle-top` / `border-radius`
- L174 : `var(--radius-lg) !important`
- L2111 : `1.4rem !important`
- L2663 : `1.4rem !important`
- L3002 : `0 !important`

### 4× — `#board` / `border-radius`
- L293 : `var(--radius-lg)`
- L1869 : `1.55rem !important`
- L2408 : `1.55rem !important`
- L3513 : `1.75rem !important`

### 4× — `#game-status` / `font-weight`
- L2382 : `950 !important`
- L3093 : `850 !important`
- L3484 : `600 !important`
- L3811 : `600 !important`

### 4× — `#timer` / `border-radius`
- L2390 : `var(--mk-pill) !important`
- L2763 : `9999px !important`
- L3108 : `9999px !important`
- L3497 : `var(--button-radius) !important`

### 4× — `#game-status::before` / `content`
- L3102 : `"•"`
- L3493 : `"" !important`
- L3821 : `"" !important`
- L4009 : `"•" !important`

### 4× — `#play-status-panel > h2::before` / `content`
- L1765 : `"🎮 "`
- L2378 : `"🎮 "`
- L3473 : `"🎮" !important`
- L3802 : `"🎮" !important`

### 4× — `#game-status` / `border`
- L2382 : `1px solid var(--mk-line) !important`
- L3093 : `0 !important`
- L3484 : `0 !important`
- L3811 : `0 !important`

### 4× — `#game-status` / `transform`
- L3484 : `translate(2.65rem, 1.25rem) !important`
- L3674 : `none !important`
- L3811 : `none !important`
- L4004 : `none !important`

### 4× — `#rules-summary .rule-pill` / `word-break`
- L5630 : `normal !important`
- L5904 : `normal !important`
- L6063 : `break-word !important`
- L6176 : `break-word !important`

### 3× — `#boggle-top` / `border`
- L174 : `1px solid var(--line) !important`
- L2111 : `1px solid var(--mk-line) !important`
- L3002 : `0 !important`

### 3× — `#start` / `background`
- L245 : `var(--primary)`
- L2730 : `#f07f32 !important`
- L3437 : `var(--orange) !important`

### 3× — `#word-feedback` / `color`
- L369 : `var(--primary-hover)`
- L2013 : `var(--fruit-brown) !important`
- L2484 : `var(--mk-ink) !important`

### 3× — `.player-row` / `background`
- L1508 : `transparent`
- L1913 : `rgba(255, 250, 236, 0.72) !important`
- L2522 : `#fff4d5 !important`

### 3× — `.rule-pill-danger` / `background`
- L1666 : `rgba(169, 67, 63, 0.12)`
- L1979 : `rgba(221, 241, 201, 0.95) !important`
- L2610 : `var(--mk-green-soft) !important`

### 3× — `.rule-pill-danger` / `color`
- L1666 : `#7f2e2b`
- L1979 : `#507233 !important`
- L2610 : `#3f6c2a !important`

### 3× — `.rule-pill-warning` / `background`
- L1672 : `rgba(246, 213, 140, 0.5)`
- L1985 : `rgba(255, 226, 217, 0.95) !important`
- L2620 : `var(--mk-red-soft) !important`

### 3× — `.rule-pill-warning` / `color`
- L1672 : `#6a4317`
- L1985 : `#a44938 !important`
- L2620 : `#a94338 !important`

### 3× — `#player-preferences > button` / `color`
- L1803 : `var(--fruit-brown) !important`
- L2284 : `var(--mk-ink) !important`
- L3378 : `var(--brown) !important`

### 3× — `#player-preferences > button` / `border`
- L1803 : `1px solid rgba(122,87,52,0.16) !important`
- L3074 : `1px solid rgba(123, 83, 47, 0.22) !important`
- L3378 : `2px solid rgba(111, 73, 40, 0.18) !important`

### 3× — `#board .board-cell` / `border`
- L1880 : `1px solid rgba(131, 98, 63, 0.13) !important`
- L2415 : `1px solid rgba(111, 73, 40, 0.12) !important`
- L3519 : `2px solid rgba(111, 73, 40, 0.08) !important`

### 3× — `#board .board-cell` / `background`
- L1880 : `radial-gradient(circle at 18% 18%, rgba(255,255,255,0.72) 0 0.2rem, transparent 0.22rem),
        radial-gradient(circle at 84% 84%, rgba(223, 198, 154, 0.32) 0 0.18rem, transparent 0.2rem),
        linear-gradient(180deg, #fffaf0, #fdf2da) !important`
- L2415 : `#fff7df !important`
- L3519 : `#fff6df !important`

### 3× — `#board .board-letter` / `color`
- L1893 : `#6a3e1f !important`
- L2423 : `#5a321b !important`
- L3525 : `#5c2f17 !important`

### 3× — `.player-rank` / `border-radius`
- L1930 : `999px`
- L2542 : `999px !important`
- L2961 : `9999px !important`

### 3× — `.boggle-brand-mark` / `letter-spacing`
- L2136 : `-0.05em !important`
- L3020 : `-0.06em !important`
- L3300 : `-0.075em !important`

### 3× — `.boggle-brand-mark` / `color`
- L2136 : `#7a3f18 !important`
- L3020 : `#7b3f16 !important`
- L3300 : `#7c3f15 !important`

### 3× — `#room, #name` / `border-radius`
- L2185 : `var(--mk-pill) !important`
- L3049 : `9999px !important`
- L3343 : `var(--button-radius) !important`

### 3× — `#room, #name` / `border`
- L2185 : `1px solid var(--mk-line) !important`
- L3049 : `1px solid rgba(123, 83, 47, 0.2) !important`
- L3343 : `2px solid rgba(111, 73, 40, 0.14) !important`

### 3× — `#room, #name` / `background`
- L2185 : `#fffaf0 !important`
- L3049 : `rgba(255, 249, 235, 0.9) !important`
- L3343 : `rgba(255, 248, 232, 0.92) !important`

### 3× — `#mode-options-toggle` / `background`
- L2268 : `#fff6df !important`
- L2737 : `#fff5dc !important`
- L3448 : `rgba(255, 247, 226, 0.92) !important`

### 3× — `#mode-options-toggle` / `color`
- L2268 : `var(--mk-ink) !important`
- L2737 : `#5d351e !important`
- L3448 : `var(--brown) !important`

### 3× — `#play-status-panel > h2` / `color`
- L2374 : `var(--mk-ink) !important`
- L3089 : `#5d351e !important`
- L3467 : `var(--brown-dark) !important`

### 3× — `#game-status` / `border-radius`
- L2382 : `var(--mk-pill) !important`
- L2758 : `9999px !important`
- L3093 : `0 !important`

### 3× — `#end-game` / `background`
- L2402 : `var(--mk-red) !important`
- L2768 : `#ef6255 !important`
- L3505 : `var(--red) !important`

### 3× — `.mockup-info-card` / `border-radius`
- L2816 : `1.3rem !important`
- L3626 : `1.55rem !important`
- L3868 : `1.6rem !important`

### 3× — `#board` / `--board-effective-size-v85`
- L5721 : `min(
      var(--board-fit-size-v31, 100vw),
      calc(100vw - 1.25rem)
    )`
- L5787 : `min(
      var(--board-fit-size-v31, 36rem),
      calc(100vh - 12rem),
      calc(100vw - 1.5rem)
    )`
- L5994 : `min(
      var(--board-fit-size-v31, 34rem),
      calc(100vw - 1.5rem)
    ) !important`

### 3× — `#board .board-letter` / `font-weight`
- L1893 : `950 !important`
- L2423 : `950 !important`
- L3525 : `700 !important`

### 3× — `.boggle-brand-mark` / `font-weight`
- L2136 : `950 !important`
- L3020 : `950 !important`
- L3300 : `700 !important`

### 3× — `#room, #name` / `box-shadow`
- L2185 : `none !important`
- L3049 : `none !important`
- L3343 : `inset 0 0.08rem 0 rgba(255, 255, 255, 0.9) !important`

### 3× — `#play-status-panel` / `background`
- L2370 : `#fff8e8 !important`
- L3084 : `#fff8e8 !important`
- L5823 : `rgba(255, 248, 232, 0.96) !important`

### 3× — `#play-status-panel` / `border-radius`
- L2750 : `1.35rem !important`
- L3084 : `1.35rem !important`
- L5823 : `1.15rem !important`

### 3× — `#end-game` / `justify-self`
- L5594 : `end !important`
- L5737 : `stretch !important`
- L6112 : `stretch !important`

### 2× — `html, body` / `background`
- L41 : `var(--page)`
- L2087 : `var(--mk-bg) !important`

### 2× — `body` / `color`
- L47 : `var(--ink)`
- L3270 : `var(--brown-dark) !important`

### 2× — `main, #app, body > div:first-child` / `padding-block`
- L63 : `16px 26px`
- L492 : `10px 22px`

### 2× — `#status` / `border`
- L194 : `1px solid var(--line)`
- L3367 : `2px solid rgba(103, 157, 70, 0.15) !important`

### 2× — `#status` / `background`
- L194 : `var(--paper-2)`
- L3367 : `var(--green-soft) !important`

## JS — fonctions longues

- `ensureModeControls` — 283 lignes — public\js\ui\mode-ui.js:L384
- `renderBoard` — 198 lignes — public\js\ui\board-ui.js:L3
- `renderModeControls` — 123 lignes — public\js\ui\mode-ui.js:L2
- `renderFoundWords` — 102 lignes — public\js\main.js:L930
- `handleGameStarted` — 100 lignes — public\js\main.js:L1528
- `updateBoardFitV31` — 96 lignes — public\js\main.js:L2024
- `findBoardPathForWord` — 87 lignes — public\js\main.js:L440
- `renderPlayerPreferencesPanel` — 87 lignes — public\js\ui\mode-ui.js:L243
- `connectToRoom` — 85 lignes — public\js\main.js:L547
- `handleServerMessage` — 80 lignes — public\js\main.js:L823

## JS — noms de fonctions répétés

### `clampVolume` — 2 occurrence(s)
- public\js\ui\feedback-ui.js:L174 — function, 9 lignes
- public\js\ui\mode-ui.js:L867 — function, 7 lignes

### `renderFoundWords` — 2 occurrence(s)
- public\js\main.js:L930 — function, 102 lignes
- public\js\ui\words-ui.js:L1 — function, 9 lignes
