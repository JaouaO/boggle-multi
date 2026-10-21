# Boggle Multi — contrat d’intégration des illustrations (B1a)

Établi sur l’export local du 20 octobre 2026 (HEAD M4c `1b42c51`). **Ce document ne demande aucune modification des règles de jeu.**

## Décision d’architecture

* Conserver les **émojis comme identifiants métier** des fruits (stockage local, pseudo transmis au serveur, historiques du classement). Leur rendu graphique pourra devenir un SVG, mais pas leur valeur dans les messages.
* Conserver tous les **éléments interactifs HTML** (boutons, libellés, grille, statistiques). Les scènes sont uniquement décoratives : une image de fond, sans texte intégré, est préférable à un nouveau composant DOM.
* Utiliser les **composants de l’accueil** `home-v87-hero` et `home-v87-mode-*`, et les vues de fin `boggle-end-view-ranking-h9f2` / `boggle-end-view-stats-h9f2` déjà existantes. Ne pas créer de « panneau image » supplémentaire.
* Ne pas prévoir de grande refonte CSS/JS. N’insérer le code de rendu SVG qu’à l’arrivée du **premier véritable SVG finalisé**, pour éviter un helper mort et des emplacements vides.

## Arborescence de livraison finale (à créer au fur et à mesure)

| Chemin sous `public/images/` | Rôle | Format de production |
| --- | --- | --- |
| `avatars/` | Fruits du joueur (sans membres) | SVG véritable avec `viewBox` |
| `pictos/` | Coupe, calendrier, livre, règles, public, privé, solo | SVG véritable avec `viewBox` |
| `scenes/` | Images de modes et de fin (texte non inclus) | WebP opaque optimisé ; PNG de travail hors déploiement |
| `decor/` | Petits décors secondaires si justifiés | WebP ou PNG selon transparence |
| `fond-feuilles-creme-v1.webp` | Fond temporaire retenu | WebP existant : **ne pas remplacer** sans validation |

Noms indicatifs de scènes validées : `scenes/salon-public.webp`, `scenes/salon-prive.webp`, `scenes/jouer-seul.webp`. Les autres noms seront définis **quand leurs images seront validées**. Ne pas ajouter de fichiers placeholders.

## Insertion par étapes

1. **B1b : scène pilote de l’accueil.** Installer uniquement `salon-public.webp`, ajuster la déclaration CSS existante de `.home-v87-mode-public` (qui possède actuellement des fonds `!important`), sans ajouter de wrapper. Tester le contraste du texte et le recadrage sur 360, 768 et 1280 px. Ne pas supprimer les effets CSS existants si inutiles.
2. **B1c : autres scènes validées.** Réutiliser les règles des autres `home-v87-mode-*`, sans recopier une nouvelle structure de bouton. Le contenu reste un vrai texte HTML.
3. **B1d : premier avatar SVG.** Créer **une seule correspondance centralisée** `emoji → chemin SVG` dans un module UI, et réutiliser le même rendu DOM dans la sélection d’identité, les options et la liste des joueurs ; conserver le repli émoji si un SVG n’existe pas. Puis couvrir le classement quotidien et les deux présentations de fin (source et modale). Ne pas remplacer les valeurs réseau ou de stockage.
4. **B1e : pictogrammes et résultats.** Réutiliser les conteneurs en place et les styles existants, sans modifier la bascule classement/statistiques, la pagination ni le chrono.

## Identifiants métier : choix à confirmer avant B1d

Les **10 fruits réellement présents dans le code** sont : fraise `🍓`, orange `🍊`, citron `🍋`, poire `🍐`, pomme `🍎`, raisin `🍇`, cerise `🍒`, kiwi `🥝`, ananas `🍍`, pastèque `🍉`.

La galerie artistique comporte aussi **pêche, tomate et mangue rose**, mais ces fruits ne figurent pas dans les options actuelles. Nous ne remplaçons donc pas cerise, ananas ou pastèque sans décision explicite. En attendant, les fruits sans SVG restent affichés sous forme d’émoji.

## Vérifications de chaque livraison

* `node tools/audit-b1-assets.mjs --require scenes/salon-public.webp` (en adaptant le chemin au nouveau fichier) ; outil de pré-contrôle, **pas un validateur de sécurité complet**.
* `npm run check` dans l’environnement local où les dépendances Node sont installées.
* Contrôle des contrastes, lisibilité 24–48 px pour les avatars, redimensionnement 360/768/1280 px et non-recouvrement des textes.
* Parcours solo, salons privé/public, quotidien, options, classement, statistiques et modale de fin.
* Diff et SHA256 avant pose ; préserver les fins de ligne exactes des fichiers existants. **Ne jamais réécrire `main.js` intégralement.**
* Livraison minimale et réversible, aucune modification du serveur sans besoin confirmé, aucun commit/push sans validation.

## Préparation des images sources

Les SVG sont réalisés dans Inkscape avec quelques formes simples, majoritairement en aplats ; exporter comme **SVG simple**. Les PNG de référence haute résolution restent hors du dossier `public/` ; ne livrer que les assets optimisés effectivement exploités par le navigateur. Les images décoratives seront affichées par CSS ou avec `alt=""` si des `<img>` sont nécessaires ; les pictos significatifs doivent conserver un libellé accessible dans le contrôle HTML.
