export const HELP_LEVELS = [
  {
    label: "Aucune",
    description: "Aucune indication n’est affichée.",
  },
  {
    label: "Compteurs",
    description: "Affiche le nombre de mots trouvés / possibles sur chaque lettre.",
  },
  {
    label: "Par lettre",
    description: "Permet de cliquer sur une lettre pour afficher les mots qui l’utilisent.",
  },
  {
    label: "Solution",
    description: "Affiche toute la solution de la grille.",
  },
];

export function getNextSimplifiedHelpLevel(currentLevel, maxHelpLevel) {
  if (maxHelpLevel <= 0) {
    return 0;
  }

  if (maxHelpLevel <= 1) {
    return currentLevel >= 1 ? 0 : 1;
  }

  if (currentLevel <= 0) {
    return 1;
  }

  if (currentLevel === 1) {
    return 3;
  }

  return 0;
}

export function normalizeSimplifiedHelpLevel(level, maxHelpLevel) {
  if (maxHelpLevel <= 0) {
    return 0;
  }

  if (maxHelpLevel <= 1) {
    return level >= 1 ? 1 : 0;
  }

  if (level === 2) {
    return 3;
  }

  if (level >= 3) {
    return 3;
  }

  return level >= 1 ? 1 : 0;
}
